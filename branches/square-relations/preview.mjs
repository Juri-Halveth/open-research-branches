import http from 'node:http';
import { readFile } from 'node:fs/promises';

const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.mjs', ['app.mjs', 'text/javascript; charset=utf-8']],
  ['/core.mjs', ['core.mjs', 'text/javascript; charset=utf-8']],
  ['/README.md', ['README.md', 'text/plain; charset=utf-8']],
  ['/README.en.md', ['README.en.md', 'text/plain; charset=utf-8']],
]);

// Only these public module assets are served, on the local loopback interface.
const server = http.createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }
  let pathname;
  try { pathname = new URL(request.url, 'http://127.0.0.1:8793').pathname; }
  catch { response.writeHead(400); response.end(); return; }
  const asset = assets.get(pathname);
  if (!asset) { response.writeHead(404); response.end('Not found'); return; }
  try {
    const body = await readFile(new URL(asset[0], import.meta.url));
    response.writeHead(200, {
      'Content-Type': asset[1],
      'Content-Length': body.length,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(500);
    response.end('Could not read a preview asset');
  }
});
server.on('error', error => {
  console.error(`Preview could not start: ${error.message}`);
  process.exitCode = 1;
});
server.listen(8793, '127.0.0.1', () => {
  console.log('Square Relations: http://127.0.0.1:8793/ (Ctrl+C to stop)');
});