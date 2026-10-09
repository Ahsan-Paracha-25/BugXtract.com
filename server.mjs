import http from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import process from "node:process";

const root = join(process.cwd(), "dist", "client");
const port = Number(process.env.PORT || 3000);
const pages = { "/": "landing.html", "/contact": "contact.html", "/contact/": "contact.html" };
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`).pathname;
  const relative = pages[pathname] || pathname.replace(/^\/+/, "") || "landing.html";
  const file = normalize(join(root, relative));
  if (!file.startsWith(root)) { res.writeHead(403); res.end("Forbidden"); return; }
  try {
    const stat = statSync(file);
    if (!stat.isFile()) throw new Error("not a file");
    res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    createReadStream(join(root, "landing.html")).pipe(res);
  }
});

server.listen(port, "0.0.0.0", () => console.log(`BugXtract listening on port ${port}`));
