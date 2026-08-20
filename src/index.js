import { ARCHIVE_TAG, GALLERY } from "./gallery.js";

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

    if (new URL(request.url).pathname === "/meta") {
      return metaResponse();
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

function archiveUrl(galleryIndex) {
  const fileName = new URL(GALLERY[galleryIndex]).pathname.split("/").pop();
  return `${ARCHIVE_BASE}/${ARCHIVE_TAG}/${String(galleryIndex).padStart(2, "0")}-${fileName}`;
}

function contentTypeFor(url) {
  const pathname = new URL(url).pathname.toLowerCase();

  if (pathname.endsWith(".png")) {
    return "image/png";
  }

  if (pathname.endsWith(".gif")) {
    return "image/gif";
  }

  if (pathname.endsWith(".webp")) {
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
