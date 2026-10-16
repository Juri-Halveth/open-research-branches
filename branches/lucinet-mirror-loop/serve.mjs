import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const files = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/model.mjs", ["model.mjs", "text/javascript; charset=utf-8"]],
  ["/scene.html", ["scene.html", "text/html; charset=utf-8"]],
  ["/scene.mjs", ["scene.mjs", "text/javascript; charset=utf-8"]]
]);
const root = new URL("./", import.meta.url);
const server = createServer(async (request, response) => {
  const requested = request.url?.split("?")[0];
  const target = files.get(requested);
  if (request.method !== "GET" || !target) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  try {
    const bytes = await readFile(fileURLToPath(new URL(target[0], root)));
    response.writeHead(200, {
      "Content-Type": target[1],
      "Content-Security-Policy": "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self'; connect-src 'none'"
    });
    response.end(bytes);
  } catch {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Local demo file unavailable");
  }
});
server.listen(0, "127.0.0.1", () => {
  const address = server.address();
  process.stdout.write(`LUCINET local demo: http://127.0.0.1:${address.port}/\n`);
});
