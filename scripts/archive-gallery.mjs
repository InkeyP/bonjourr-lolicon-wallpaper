import { mkdir, rm, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ARCHIVE_TAG, GALLERY } from "../src/gallery.js";

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5_000;

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const archiveDir = resolve(rootDir, "archive");

await rm(archiveDir, { recursive: true, force: true });
await mkdir(archiveDir, { recursive: true });
await writeFile(resolve(archiveDir, ".tag"), `${ARCHIVE_TAG}\n`);

let saved = 0;

for (const [index, url] of GALLERY.entries()) {
  const fileName = `${String(index).padStart(2, "0")}-${basename(new URL(url).pathname)}`;

  try {
    const image = await download(url);
    await writeFile(resolve(archiveDir, fileName), image);
    saved++;
    console.log(`Saved ${fileName}`);
  } catch (error) {
    console.error(`Failed ${url}: ${error instanceof Error ? error.message : error}`);
  }
}

if (saved === 0) {
  throw new Error("Failed to download every gallery image.");
}

console.log(`Archived ${saved}/${GALLERY.length} images.`);

async function download(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "User-Agent": browserUserAgent(),
        },
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get("Content-Type") || "";

      if (!contentType.startsWith("image/")) {
        throw new Error(`Unexpected Content-Type: ${contentType}`);
      }

      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS) {
        throw error;
      }

      await delay(RETRY_DELAY_MS);
    }
  }
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

function browserUserAgent() {
  return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
}
