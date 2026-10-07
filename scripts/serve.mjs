import { createServer } from "node:http";
import { stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { resolve, extname, sep } from "node:path";
const root = resolve("out");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".pdf": "application/pdf", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg", ".m4a": "audio/mp4" };
createServer(async (req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname); }
  catch { res.writeHead(400); return res.end(); }
  const path = resolve(root, `.${pathname.endsWith("/") ? pathname + "index.html" : pathname}`);
  if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403); return res.end(); }
  try {
    const file = await stat(path);
    if (!file.isFile()) { res.writeHead(404); return res.end("Not found"); }
    const headers = { "Content-Type": types[extname(path)] || "application/octet-stream", "Accept-Ranges": "bytes" };
    let start = 0, end = file.size - 1, status = 200;
    if (req.headers.range) {
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (!range || (!range[1] && !range[2])) { res.writeHead(416, { "Content-Range": `bytes */${file.size}` }); return res.end(); }
      start = range[1] ? Number(range[1]) : Math.max(0, file.size - Number(range[2]));
      end = range[1] && range[2] ? Math.min(Number(range[2]), end) : end;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= file.size) { res.writeHead(416, { "Content-Range": `bytes */${file.size}` }); return res.end(); }
      status = 206; headers["Content-Range"] = `bytes ${start}-${end}/${file.size}`;
    }
    headers["Content-Length"] = Math.max(0, end - start + 1);
    res.writeHead(status, headers);
    if (req.method === "HEAD" || !file.size) return res.end();
    const stream = createReadStream(path, { start, end });
    stream.on("error", () => res.destroy());
    res.on("close", () => stream.destroy()); stream.pipe(res);
  }
  catch { res.writeHead(404); res.end("Not found"); }
}).listen(3000, "127.0.0.1", () => console.log("Portfolio ready at http://127.0.0.1:3000"));
