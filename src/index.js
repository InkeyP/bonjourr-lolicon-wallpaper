import { GALLERY } from "./gallery.js";

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
      const { image, contentType, galleryIndex } = await fetchHourlyImage();

      return new Response(request.method === "HEAD" ? null : image.body, {
        status: image.status,
        headers: {
          ...corsHeaders(),
          "Content-Type": contentType,
          "Cache-Control": "no-store, max-age=0",
          "X-Gallery-Index": String(galleryIndex),
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
    const imageUrl = GALLERY[galleryIndex];
    const image = await fetch(imageUrl, {
      headers: imageRequestHeaders(),
      cf: {
        cacheTtl: 0,
        cacheEverything: false,
      },
    });
    const contentType = image.headers.get("Content-Type") || "image/jpeg";

    if (image.ok && contentType.startsWith("image/")) {
      return { image, contentType, galleryIndex };
    }
  }

  throw new Error("No upstream image is currently available");
}

function metaResponse() {
  const hour = getBeijingHour();

  return Response.json(
    {
      timezone: "Asia/Shanghai",
      hour,
      gallerySize: GALLERY.length,
      selectedIndex: hour % GALLERY.length,
      selectedUrl: GALLERY[hour % GALLERY.length],
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
