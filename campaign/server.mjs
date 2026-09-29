// Static server for the render stage. /web → campaign/web, /three → three.js, /assets → the site's assets
// (fonts, product photos), /screens → captured dashboard screens.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOTS = {
  '/web/': path.join(here, 'web'),
  '/three/': path.join(here, 'node_modules/three'),
  '/assets/': path.join(here, '../assets'),
  '/screens/': path.join(here, 'screens'),
  '/src/': path.join(here, 'src')
};
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };

export function serve(port = 0) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const prefix = Object.keys(ROOTS).find(p => url.startsWith(p));
    if (!prefix) { res.writeHead(404).end(); return; }
    const file = path.join(ROOTS[prefix], url.slice(prefix.length));
    if (!file.startsWith(ROOTS[prefix])) { res.writeHead(403).end(); return; }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(data);
    });
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { port } = await serve(Number(process.argv[2]) || 8900);
  console.log(`stage on http://127.0.0.1:${port}/web/stage.html`);
}
