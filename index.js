const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

module.exports = function handler(request, response) {
  const url = new URL(request.url, `https://${request.headers.host || "localhost"}`);
  const pathname = decodeURIComponent(url.pathname);
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const safePath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, safePath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const ext = path.extname(filePath);
    const contentType = types[ext] || "text/plain; charset=utf-8";
    const range = request.headers.range;
    const isVideo = ext === ".mp4" || ext === ".webm";

    if (isVideo && range) {
      const [startText, endText] = range.replace(/bytes=/, "").split("-");
      const start = Number.parseInt(startText, 10);
      const end = endText ? Number.parseInt(endText, 10) : stats.size - 1;

      if (Number.isNaN(start) || Number.isNaN(end) || start >= stats.size) {
        response.writeHead(416, {
          "Content-Range": `bytes */${stats.size}`,
        });
        response.end();
        return;
      }

      response.writeHead(206, {
        "Content-Type": contentType,
        "Content-Length": end - start + 1,
        "Content-Range": `bytes ${start}-${end}/${stats.size}`,
        "Accept-Ranges": "bytes",
      });
      fs.createReadStream(filePath, { start, end }).pipe(response);
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": stats.size,
      "Accept-Ranges": isVideo ? "bytes" : "none",
    });
    fs.createReadStream(filePath).pipe(response);
  });
};
