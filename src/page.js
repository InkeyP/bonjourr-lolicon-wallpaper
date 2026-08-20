export function galleryPage(latestDate) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>每日壁纸存档</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; background: #101014; color: #e8e8ee; font: 15px/1.6 system-ui, "Microsoft YaHei", sans-serif; }
  header { position: sticky; top: 0; z-index: 1; display: flex; gap: 10px; align-items: center; justify-content: center; padding: 12px 16px; background: rgba(22, 22, 28, .92); backdrop-filter: blur(6px); border-bottom: 1px solid #2a2a33; }
  h1 { font-size: 16px; font-weight: 600; margin: 0 10px 0 0; }
  button, input[type="date"] { background: #22222b; color: inherit; border: 1px solid #33333f; border-radius: 8px; padding: 6px 12px; font: inherit; }
  button:hover:enabled { background: #2c2c37; cursor: pointer; }
  button:disabled { opacity: .35; }
  #status { text-align: center; padding: 48px 16px; color: #9a9aa8; }
  #grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; padding: 12px; }
  #grid a { position: relative; display: block; aspect-ratio: 3 / 2; overflow: hidden; border-radius: 10px; background: #1b1b22; }
  #grid img { width: 100%; height: 100%; object-fit: cover; display: block; }
  #grid .hour { position: absolute; left: 8px; top: 8px; padding: 2px 8px; border-radius: 6px; background: rgba(0, 0, 0, .65); font-size: 12px; }
</style>
</head>
<body>
<header>
  <h1>每日壁纸存档</h1>
  <button id="prev">‹</button>
  <input type="date" id="day">
  <button id="next">›</button>
</header>
<div id="status"></div>
<div id="grid"></div>
<script>
var FIRST = "2026-08-20";
var LATEST = ${JSON.stringify(latestDate)};
var day = document.getElementById("day");
var grid = document.getElementById("grid");
var statusEl = document.getElementById("status");
var prev = document.getElementById("prev");
var next = document.getElementById("next");

day.min = FIRST;
day.max = LATEST;
day.value = LATEST;

prev.onclick = function () { shift(-1); };
next.onclick = function () { shift(1); };
day.onchange = load;

load();

function shift(days) {
  var date = new Date(day.value + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + days);
  var value = date.toISOString().slice(0, 10);

  if (value < FIRST || value > LATEST) {
    return;
  }

  day.value = value;
  load();
}

async function load() {
  var date = day.value;

  prev.disabled = date <= FIRST;
  next.disabled = date >= LATEST;
  grid.innerHTML = "";
  statusEl.textContent = "加载中…";

  try {
    var response = await fetch("/archive/gallery-" + date + "/manifest.json");

    if (!response.ok) {
      throw new Error();
    }

    var manifest = await response.json();

    if (date !== day.value) {
      return;
    }

    statusEl.textContent = "";
    manifest.files.forEach(function (name) {
      var url = "/archive/gallery-" + date + "/" + name;
      var link = document.createElement("a");
      link.href = url;
      link.target = "_blank";

      var image = document.createElement("img");
      image.src = url;
      image.loading = "lazy";

      var hour = document.createElement("span");
      hour.className = "hour";
      hour.textContent = name.slice(0, 2) + ":00";

      link.append(image, hour);
      grid.append(link);
    });
  } catch {
    if (date === day.value) {
      statusEl.textContent = "这一天没有存档";
    }
  }
}
</script>
</body>
</html>
`;
}
