# Bonjourr Lolicon Wallpaper Worker

Cloudflare Worker that proxies one hourly non-R18 image from a daily gallery generated from the lolicon `/setu/v2` API as an `image/*` response for Bonjourr's `URLs` background source.

The live lolicon API currently returns 403 from Cloudflare Worker egress, so GitHub Actions updates `src/gallery.js` once per day. The Worker selects one of the 24 gallery entries by Asia/Shanghai hour, serves it from the day's GitHub release archive first, and falls back to proxying the upstream `i.pixiv.re` URL.

## GitHub Actions

The workflow in `.github/workflows/update-gallery.yml` runs every day at 00:10 Asia/Shanghai and can also be triggered manually.

Before deploying, the workflow downloads the day's 24 gallery images concurrently and uploads them plus a `manifest.json` to a GitHub release tagged with the `ARCHIVE_TAG` from `src/gallery.js` (`gallery-YYYY-MM-DD`, Asia/Shanghai date). The deployed Worker serves images from that release, so wallpapers keep working and stay archived after the upstream URLs rot. The repository must stay public so the Worker can read release assets anonymously.

Required repository secret:

```text
CLOUDFLARE_API_TOKEN
```

Deploy:

```powershell
$env:CLOUDFLARE_API_TOKEN = "<temporary-token>"
npx wrangler deploy
Remove-Item Env:\CLOUDFLARE_API_TOKEN
```

Bonjourr URL:

```text
https://bonjourr-lolicon-wallpaper.<your-workers-subdomain>.workers.dev/
```

Browse any day's archived images:

```text
https://bonjourr-lolicon-wallpaper.<your-workers-subdomain>.workers.dev/gallery
```

Debug metadata:

```text
https://bonjourr-lolicon-wallpaper.<your-workers-subdomain>.workers.dev/meta
```
