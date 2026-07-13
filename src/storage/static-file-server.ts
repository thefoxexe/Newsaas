import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";

// The worker has nowhere else to serve its rendered videos from once it
// runs on its own host (Railway, Fly, a VPS) separate from the Next.js app
// on Netlify — there is no shared disk between the two anymore. Real object
// storage (Cloudflare R2 / S3, per spec §4) is the intended long-term fix,
// but it needs credentials only the account owner can create. Until then,
// the worker serves its own render directory over HTTP so `outputUrl` is
// actually reachable in production instead of pointing at a file that only
// exists on a machine nobody can query.
export function startStaticFileServer(dir: string, urlPrefix: string, port: number): void {
  const prefix = urlPrefix.startsWith("/") ? urlPrefix : `/${urlPrefix}`;

  const server = createServer((request, response) => {
    void (async () => {
      const url = new URL(request.url ?? "/", "http://localhost");

      // Free hosts that spin a worker down after idle HTTP traffic (Render's
      // free tier does this after 15 minutes) need something to ping to stay
      // awake — a plain 200 here lets an external cron hit that instead of
      // depending on a real render existing.
      if (request.method === "GET" && url.pathname === "/healthz") {
        response.writeHead(200, { "Content-Type": "text/plain" }).end("ok");
        return;
      }

      if (request.method !== "GET" || !url.pathname.startsWith(`${prefix}/`)) {
        response.writeHead(404).end();
        return;
      }

      const key = url.pathname.slice(prefix.length + 1);
      const filePath = path.join(dir, key);
      if (!filePath.startsWith(path.resolve(dir))) {
        response.writeHead(400).end();
        return;
      }

      try {
        const info = await stat(filePath);
        const range = request.headers.range;
        const baseHeaders = {
          "Content-Type": "video/mp4",
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000, immutable",
        };

        const match = range?.match(/^bytes=(\d+)-(\d*)$/);
        if (match) {
          const start = Number(match[1]);
          const end = match[2] ? Number(match[2]) : info.size - 1;
          response.writeHead(206, {
            ...baseHeaders,
            "Content-Range": `bytes ${start}-${end}/${info.size}`,
            "Content-Length": end - start + 1,
          });
          createReadStream(filePath, { start, end }).pipe(response);
          return;
        }

        response.writeHead(200, { ...baseHeaders, "Content-Length": info.size });
        createReadStream(filePath).pipe(response);
      } catch {
        response.writeHead(404).end();
      }
    })();
  });

  server.listen(port);
}
