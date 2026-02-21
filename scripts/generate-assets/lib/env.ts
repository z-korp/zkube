import fs from "node:fs";
import path from "node:path";
import type { LimitRunner, PLimitFactory } from "./types";

export const IMAGE_MODEL = "fal-ai/flux-2-pro";
export const BIREFNET_MODEL = "fal-ai/birefnet/v2";
export const SFX_MODEL = "fal-ai/elevenlabs/sound-effects/v2";
export const CONCURRENCY = 2;
export const REQUEST_DELAY_MS = 3_000;
export const RETRY_BACKOFF_MS = [15_000, 30_000, 60_000, 120_000] as const;
export const MAX_RETRIES = RETRY_BACKOFF_MS.length;

export const ROOT_DIR = path.resolve(process.cwd());
export const ASSETS_ROOT = path.join(ROOT_DIR, "client-budokan", "public", "assets");
export const COMMON_ROOT = path.join(ASSETS_ROOT, "common");

export function loadEnvFromRoot(): void {
  const envPath = path.join(ROOT_DIR, ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const rawLine of envContent.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) {
      continue;
    }

    const value = rawValue.replace(/^['"]|['"]$/g, "");
    process.env[key] = value;
  }
}

loadEnvFromRoot();

let requestSlotChain: Promise<void> = Promise.resolve();
let nextRequestAt = 0;

export function relativePath(filePath: string): string {
  return path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForRequestSlot(): Promise<void> {
  let release: ((value?: void | PromiseLike<void>) => void) | undefined;
  const previous = requestSlotChain;
  requestSlotChain = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;
  try {
    const now = Date.now();
    const waitMs = Math.max(0, nextRequestAt - now);
    if (waitMs > 0) {
      await sleep(waitMs);
    }
    nextRequestAt = Date.now() + REQUEST_DELAY_MS;
  } finally {
    if (release) {
      release();
    }
  }
}

export function createLimitFallback(concurrency: number): LimitRunner {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error(`Invalid concurrency: ${concurrency}`);
  }

  let activeCount = 0;
  const queue: Array<() => void> = [];

  const runNext = () => {
    if (activeCount >= concurrency) {
      return;
    }
    const next = queue.shift();
    if (!next) {
      return;
    }
    activeCount += 1;
    next();
  };

  return async <T>(task: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const execute = () => {
        Promise.resolve()
          .then(task)
          .then(resolve, reject)
          .finally(() => {
            activeCount -= 1;
            runNext();
          });
      };

      queue.push(execute);
      runNext();
    });
}

export async function loadPLimitFactory(): Promise<PLimitFactory> {
  try {
    const importer = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<unknown>;
    const moduleValue = (await importer("p-limit")) as { default?: unknown };
    if (typeof moduleValue.default === "function") {
      return moduleValue.default as PLimitFactory;
    }
  } catch {}

  console.warn("⚠️  p-limit package not found; using built-in limiter fallback.");
  return createLimitFallback;
}

export function isRetryableError(error: unknown): boolean {
  const candidate = error as {
    status?: number;
    statusCode?: number;
    code?: number;
    response?: { status?: number };
    body?: { status?: number };
    message?: string;
  };
  const status = candidate.status ?? candidate.statusCode ?? candidate.code ?? candidate.response?.status ?? candidate.body?.status;
  if (status === 408 || status === 409 || status === 425 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(candidate.message ?? error);
  return /(^|\D)(408|409|425|429|500|502|503|504)(\D|$)|rate\s*limit|quota|unavailable|high demand|timed?\s*out|overloaded|try again/i.test(
    message,
  );
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
