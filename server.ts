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

    const urlPath = new URL(req.url).pathname;
    const filePath = resolveFilePath(urlPath);
    const asset = Bun.file(filePath);

    if (await asset.exists()) {
      return new Response(asset);
    }

    // Try common static site fallbacks for extensionless routes
    const hasExtension = /\\.[^/]+$/.test(urlPath);
    if (!hasExtension) {
      const indexPath = resolveFilePath(urlPath.endsWith("/") ? urlPath : `${urlPath}/`);
      const indexAsset = Bun.file(indexPath);
      if (await indexAsset.exists()) {
        return new Response(indexAsset);
      }

      const htmlPath = resolveFilePath(`${urlPath}.html`);
      const htmlAsset = Bun.file(htmlPath);
      if (await htmlAsset.exists()) {
        return new Response(htmlAsset);
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Serving ${distDir} on :${port}`);
