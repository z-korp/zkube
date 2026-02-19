import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { fal } from "@fal-ai/client";
import {
  IMAGE_MODEL,
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
