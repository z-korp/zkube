import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { fal } from "@fal-ai/client";
import {
  IMAGE_MODEL,
  BIREFNET_MODEL,
  MAX_RETRIES,
  RETRY_BACKOFF_MS,
  SFX_MODEL,
  isRetryableError,
  sleep,
  waitForRequestSlot,
} from "./env";
import type { AssetJob, SfxJob } from "./types";

type FluxImageSize =
  | "square_hd"
  | "square"
  | "portrait_4_3"
  | "portrait_16_9"
  | "landscape_4_3"
  | "landscape_16_9"
  | { width: number; height: number };

/**
 * Map pixel dimensions to Flux 2 Pro's preferred image_size parameter.
 * Uses enum strings for standard ratios (better model behavior),
 * falls back to custom {width, height} for non-standard ratios.
 */
export function resolveImageSize(width: number, height: number): FluxImageSize {
  const ratio = width / height;

  // Square
  if (Math.abs(ratio - 1) < 0.01) {
    return width > 512 ? "square_hd" : { width, height };
  }
  // Landscape 4:3  (ratio ≈ 1.333)
  if (Math.abs(ratio - 4 / 3) < 0.02) {
    return "landscape_4_3";
  }
  // Landscape 16:9 (ratio ≈ 1.778)
  if (Math.abs(ratio - 16 / 9) < 0.02) {
    return "landscape_16_9";
  }
  // Portrait 4:3   (ratio ≈ 0.75)
  if (Math.abs(ratio - 3 / 4) < 0.02) {
    return "portrait_4_3";
  }
  // Portrait 16:9  (ratio ≈ 0.5625)
  if (Math.abs(ratio - 9 / 16) < 0.02) {
    return "portrait_16_9";
  }

  // Non-standard ratio → custom dimensions
  return { width, height };
}

export function resolveReferenceUrl(job: AssetJob, includeRefs: boolean): string | undefined {
  if (!includeRefs || !job.refPaths || job.refPaths.length === 0) {
    return undefined;
  }

  for (const filePath of job.refPaths) {
    if (!fs.existsSync(filePath)) {
      continue;
    }
    if (path.extname(filePath).toLowerCase() !== ".png") {
      continue;
    }
    return pathToFileURL(filePath).toString();
  }

  return undefined;
}

export function extractImageUrl(response: unknown): string {
  const candidate = response as {
    data?: {
      images?: Array<{ url?: string }>;
      image?: { url?: string };
    };
  };

  const fromImages = candidate.data?.images?.find((image) => typeof image.url === "string" && image.url.length > 0)?.url;
  if (fromImages) {
    return fromImages;
  }

  const fromImage = candidate.data?.image?.url;
  if (typeof fromImage === "string" && fromImage.length > 0) {
    return fromImage;
  }

  throw new Error("No image URL returned by fal.ai.");
}

export function extractAudioUrl(response: unknown): string {
  const candidate = response as {
    data?: {
      audio_file?: { url?: string };
      audio?: { url?: string };
    };
  };

  const url = candidate.data?.audio?.url ?? candidate.data?.audio_file?.url;
  if (typeof url === "string" && url.length > 0) {
    return url;
  }

  throw new Error("No audio URL returned by fal.ai.");
}

export async function generateImage(job: AssetJob, includeRefs: boolean): Promise<Buffer> {
  const referenceUrl = resolveReferenceUrl(job, includeRefs);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await waitForRequestSlot();

      const input: Record<string, unknown> = {
        prompt: job.prompt,
        image_size: resolveImageSize(job.width, job.height),
        num_images: 1,
        output_format: "png",
        ...(referenceUrl ? { image_url: referenceUrl } : {}),
      };

      const response = await fal.subscribe(IMAGE_MODEL as string, {
        input,
      });

      const imageUrl = extractImageUrl(response);
      const download = await fetch(imageUrl);
      if (!download.ok) {
        throw new Error(`Failed to download generated image (${download.status})`);
      }

      return Buffer.from(await download.arrayBuffer());
    } catch (error) {
      if (isRetryableError(error) && attempt < MAX_RETRIES) {
        const backoffMs = RETRY_BACKOFF_MS[attempt] ?? RETRY_BACKOFF_MS[RETRY_BACKOFF_MS.length - 1];
        console.warn(`   ↻ Retryable error. Retrying in ${Math.round(backoffMs / 1000)}s...`);
        await sleep(backoffMs);
        continue;
      }

      throw error;
    }
  }

  throw new Error("Failed to generate image after retries.");
}

export async function generateSfx(job: SfxJob): Promise<Buffer> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await waitForRequestSlot();

      const response = await fal.subscribe(SFX_MODEL, {
        input: {
          text: job.prompt,
          duration_seconds: job.duration,
          prompt_influence: 0.3,
          output_format: "mp3_44100_192",
        },
      });

      const audioUrl = extractAudioUrl(response);
      const download = await fetch(audioUrl);
      if (!download.ok) {
        throw new Error(`Failed to download audio (${download.status})`);
      }

      return Buffer.from(await download.arrayBuffer());
    } catch (error) {
      if (isRetryableError(error) && attempt < MAX_RETRIES) {
        const backoffMs = RETRY_BACKOFF_MS[attempt] ?? RETRY_BACKOFF_MS[RETRY_BACKOFF_MS.length - 1];
        console.warn(`   ↻ Retryable error. Retrying in ${Math.round(backoffMs / 1000)}s...`);
        await sleep(backoffMs);
        continue;
      }

      throw error;
    }
  }

  throw new Error("Failed to generate SFX after retries.");
}

/* ------------------------------------------------------------------ */
/*  BiRefNet background removal                                       */
/* ------------------------------------------------------------------ */

export async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
  // Upload raw image to fal storage so BiRefNet can access it
  const blob = new Blob([imageBuffer], { type: "image/png" });
  const imageUrl = await fal.storage.upload(blob);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await waitForRequestSlot();

      const response = await fal.subscribe(BIREFNET_MODEL as string, {
        input: {
          image_url: imageUrl,
          model: "General Use (Heavy)",
          operating_resolution: "1024x1024",
          output_format: "png",
          refine_foreground: true,
        },
      });

      const resultUrl = extractImageUrl(response);
      const download = await fetch(resultUrl);
      if (!download.ok) {
        throw new Error(`Failed to download BiRefNet result (${download.status})`);
      }

      return Buffer.from(await download.arrayBuffer());
    } catch (error) {
      if (isRetryableError(error) && attempt < MAX_RETRIES) {
        const backoffMs = RETRY_BACKOFF_MS[attempt] ?? RETRY_BACKOFF_MS[RETRY_BACKOFF_MS.length - 1];
        console.warn(`   ↻ BiRefNet retryable error. Retrying in ${Math.round(backoffMs / 1000)}s...`);
        await sleep(backoffMs);
        continue;
      }

      throw error;
    }
  }

  throw new Error("Failed to remove background after retries.");
}

/* ------------------------------------------------------------------ */
/*  Image tinting + compositing (sharp)                               */
/* ------------------------------------------------------------------ */

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: Number.parseInt(h.substring(0, 2), 16),
    g: Number.parseInt(h.substring(2, 4), 16),
    b: Number.parseInt(h.substring(4, 6), 16),
  };
}

/**
 * Tint a transparent PNG to a target color.
 * Maps luminance → hue: white fill becomes the target color,
 * dark outlines become a dark shade of the target color.
 * Alpha channel is preserved.
 */
export async function tintImage(imageBuffer: Buffer, hexColor: string): Promise<Buffer> {
  const { r, g, b } = hexToRgb(hexColor);
  return sharp(imageBuffer)
    .ensureAlpha()
    .tint({ r, g, b })
    .png()
    .toBuffer();
}

/**
 * Composite a tinted centerpiece onto a block background.
 * The centerpiece is resized to `scale` fraction of the block height
 * and centered horizontally and vertically.
 */
export async function compositeBlock(
  bgBuffer: Buffer,
  centerpieceBuffer: Buffer,
  scale: number,
): Promise<Buffer> {
  const bgMeta = await sharp(bgBuffer).metadata();
  const bgWidth = bgMeta.width!;
  const bgHeight = bgMeta.height!;

  // Resize centerpiece to fit within the block
  const targetHeight = Math.round(bgHeight * scale);
  const resizedCenterpiece = await sharp(centerpieceBuffer)
    .resize({ height: targetHeight, fit: "inside" })
    .toBuffer();

  const cpMeta = await sharp(resizedCenterpiece).metadata();
  const cpWidth = cpMeta.width!;
  const cpHeight = cpMeta.height!;

  // Center the overlay
  const left = Math.round((bgWidth - cpWidth) / 2);
  const top = Math.round((bgHeight - cpHeight) / 2);

  return sharp(bgBuffer)
    .ensureAlpha()
    .composite([{
      input: resizedCenterpiece,
      left,
      top,
    }])
    .png()
    .toBuffer();
}

/* ------------------------------------------------------------------ */
/*  nukeWhite post-processing                                         */
/* ------------------------------------------------------------------ */

async function nukeWhite(imageBuffer: Buffer, threshold = 240): Promise<Buffer> {
  const image = sharp(imageBuffer).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > threshold && data[i + 1] > threshold && data[i + 2] > threshold) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

export async function savePng(outputPath: string, imageBuffer: Buffer, stripWhite = false): Promise<void> {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const finalBuffer = stripWhite ? await nukeWhite(imageBuffer) : imageBuffer;
  fs.writeFileSync(outputPath, finalBuffer);
}

export function saveMp3(mp3Buffer: Buffer, outputPath: string): void {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, mp3Buffer);
}

export { fal };
