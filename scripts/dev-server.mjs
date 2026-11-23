#!/usr/bin/env node
/**
 * A tiny static file server for local previewing.
 * Matches GitHub Pages clean URLs and trailing-slash directory redirects.
 *
 * Run with: npm run serve
 */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT) || 8080;
const host = process.env.HOST || "127.0.0.1";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

function send(response, status, body, type = "text/plain; charset=utf-8") {
  response.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  });
  response.end(body);
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";

    const filePath = normalize(join(root, pathname));
    if (!filePath.startsWith(root + sep) && filePath !== root) {
      send(response, 403, "Forbidden");
      return;
    }

    let target = filePath;
    try {
      const info = await stat(target);
      if (info.isDirectory()) {
        if (!url.pathname.endsWith("/")) {
          response.writeHead(301, { Location: `${url.pathname}/${url.search}`, "Cache-Control": "no-store" });
          response.end();
          return;
        }
        target = join(target, "index.html");
      }
    } catch {
      const candidates = [];
      if (!extname(target)) candidates.push(`${target}.html`);
      candidates.push(join(target, "index.html"));
      let found = false;
      for (const candidate of candidates) {
        try {
          const info = await stat(candidate);
          if (info.isFile()) {
            target = candidate;
            found = true;
            break;
          }
        } catch {
          // Candidate does not exist; try next.
        }
      }
      if (!found) {
        send(response, 404, await readFile(join(root, "404.html"), "utf8"), types[".html"]);
        return;
      }
    }

    const body = await readFile(target);
    send(response, 200, body, types[extname(target).toLowerCase()] || "application/octet-stream");
  } catch (error) {
    send(response, 500, `Server error: ${error.message}`);
  }
}).listen(port, host, () => {
  console.log(`Serving ${root} at http://localhost:${port}`);
});
