import { ARCHIVE_TAG, GALLERY } from "./gallery.js";
import { galleryPage } from "./page.js";

const ARCHIVE_BASE = "https://github.com/InkeyP/bonjourr-lolicon-wallpaper/releases/download";

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders(),
      });
    }

    const { pathname } = new URL(request.url);

    if (pathname === "/meta") {
      return metaResponse();
    }

    if (pathname === "/gallery") {
      return galleryResponse(request.method);
    }

    const archiveMatch = pathname.match(/^\/archive\/(gallery-\d{4}-\d{2}-\d{2})\/([\w.-]+)$/);

    if (archiveMatch) {
      return archiveResponse(archiveMatch[1], archiveMatch[2], request.method);
    }

    try {
      const { image, contentType, galleryIndex, source } = await fetchHourlyImage();

      return new Response(request.method === "HEAD" ? null : image.body, {
        status: image.status,
        headers: {
          ...corsHeaders(),
          "Content-Type": contentType,
          "Cache-Control": "no-store, max-age=0",
          "X-Gallery-Index": String(galleryIndex),
          "X-Image-Source": source,
        },
      });
    } catch (error) {
      return new Response(error instanceof Error ? error.message : "Unknown error", {
        status: 502,
        headers: corsHeaders(),
      });
    }
  },
};

async function fetchHourlyImage() {
  const start = getBeijingHour();

  for (let offset = 0; offset < GALLERY.length; offset++) {
    const galleryIndex = (start + offset) % GALLERY.length;

    const archived = await fetchImage(archiveUrl(galleryIndex));

    if (archived) {
      return {
        image: archived,
        contentType: contentTypeFor(GALLERY[galleryIndex]),
        galleryIndex,
        source: "archive",
      };
    }

    const upstream = await fetchImage(GALLERY[galleryIndex]);

    if (upstream) {
      const contentType = upstream.headers.get("Content-Type") || "image/jpeg";

      if (contentType.startsWith("image/")) {
        return { image: upstream, contentType, galleryIndex, source: "upstream" };
      }
    }
  }

  throw new Error("No archived or upstream image is currently available");
}

async function fetchImage(url) {
  const response = await fetch(url, {
    headers: imageRequestHeaders(),
    cf: {
      cacheTtl: 0,
      cacheEverything: false,
    },
  });

  return response.ok ? response : null;
}

async function archiveResponse(tag, fileName, method) {
  const upstream = await fetch(`${ARCHIVE_BASE}/${tag}/${fileName}`, {
    headers: imageRequestHeaders(),
    cf: {
      cacheEverything: true,
      cacheTtl: fileName === "manifest.json" ? 300 : 86_400,
    },
  });

  if (!upstream.ok) {
    return new Response("Not Found", { status: 404, headers: corsHeaders() });
  }

  const isManifest = fileName === "manifest.json";

  return new Response(method === "HEAD" ? null : upstream.body, {
    headers: {
      ...corsHeaders(),
      "Content-Type": isManifest ? "application/json; charset=utf-8" : contentTypeFor(fileName),
      "Cache-Control": isManifest ? "no-store, max-age=0" : "public, max-age=86400, immutable",
    },
  });
}

function galleryResponse(method) {
  return new Response(method === "HEAD" ? null : galleryPage(ARCHIVE_TAG.slice("gallery-".length)), {
    headers: {
      ...corsHeaders(),
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function archiveUrl(galleryIndex) {
  const fileName = new URL(GALLERY[galleryIndex]).pathname.split("/").pop();
  return `${ARCHIVE_BASE}/${ARCHIVE_TAG}/${String(galleryIndex).padStart(2, "0")}-${fileName}`;
}

function contentTypeFor(path) {
  const lower = path.toLowerCase();

  if (lower.endsWith(".png")) {
    return "image/png";
  }

  if (lower.endsWith(".gif")) {
    return "image/gif";
  }

  if (lower.endsWith(".webp")) {
    return "image/webp";
  }

  return "image/jpeg";
}

function metaResponse() {
  const hour = getBeijingHour();
  const selectedIndex = hour % GALLERY.length;

  return Response.json(
    {
      timezone: "Asia/Shanghai",
      hour,
      gallerySize: GALLERY.length,
      archiveTag: ARCHIVE_TAG,
      selectedIndex,
      selectedArchiveUrl: archiveUrl(selectedIndex),
      selectedUpstreamUrl: GALLERY[selectedIndex],
    },
    {
      headers: {
        ...corsHeaders(),
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}

function getBeijingHour(date = new Date()) {
  const beijing = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return beijing.getUTCHours();
}

function imageRequestHeaders() {
  return {
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "User-Agent": browserUserAgent(),
  };
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  };
}

function browserUserAgent() {
  return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
}
