import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve("out");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".pdf": "application/pdf" };
createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const path = resolve(root, `.${pathname.endsWith("/") ? pathname + "index.html" : pathname}`);
  if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403); return res.end(); }
  try { const data = await readFile(path); res.writeHead(200, { "Content-Type": types[extname(path)] || "application/octet-stream" }); res.end(data); }
  catch { res.writeHead(404); res.end("Not found"); }
}).listen(3000, "127.0.0.1", () => console.log("Portfolio ready at http://127.0.0.1:3000"));
