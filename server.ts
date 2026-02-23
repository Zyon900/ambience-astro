import { serve } from "bun";
import { join, normalize } from "node:path";

const distDir = process.env.DIST_DIR ?? "/dist";
const port = Number(process.env.PORT ?? 3000);

function resolveFilePath(urlPath: string) {
  let path = decodeURIComponent(urlPath);
  if (path.endsWith("/")) path += "index.html";

  // Prevent path traversal
  path = normalize(path).replace(/^(\.\.(\\|\/|$))+/, "");
  return join(distDir, path);
}

serve({
  port,
  async fetch(req) {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const filePath = resolveFilePath(new URL(req.url).pathname);
    const asset = Bun.file(filePath);

    if (!(await asset.exists())) {
      return new Response("Not Found", { status: 404 });
    }

    return new Response(asset);
  },
});

console.log(`Serving ${distDir} on :${port}`);
