# Bonjourr Lolicon Wallpaper Worker

Cloudflare Worker that proxies one hourly non-R18 image from a daily gallery generated from the lolicon `/setu/v2` API as an `image/*` response for Bonjourr's `URLs` background source.

The live lolicon API currently returns 403 from Cloudflare Worker egress, so GitHub Actions updates `src/gallery.js` once per day. The Worker selects one of the 24 gallery entries by Asia/Shanghai hour.

## GitHub Actions

The workflow in `.github/workflows/update-gallery.yml` runs every day at 00:10 Asia/Shanghai and can also be triggered manually.

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

Debug metadata:

```text
https://bonjourr-lolicon-wallpaper.<your-workers-subdomain>.workers.dev/meta
```
