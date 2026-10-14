import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const port = Number(process.env.PORT || 8768);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

const server = http.createServer((req, res) => {
  try {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let rel = url === '/' ? 'index.html' : url.replace(/^\//, '');
    const fp = path.normalize(path.join(root, rel));
    if (!fp.startsWith(root)) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }
    fs.stat(fp, (err, st) => {
      if (err || !st.isFile()) {
        res.writeHead(404);
        res.end('missing');
        return;
      }
      fs.readFile(fp, (readErr, data) => {
        if (readErr) {
          res.writeHead(500);
          res.end('error');
          return;
        }
        res.writeHead(200, {
          'Content-Type': types[path.extname(fp)] || 'application/octet-stream',
          'Cache-Control': 'no-store',
        });
        res.end(data);
      });
    });
  } catch (e) {
    res.writeHead(500);
    res.end('error');
  }
});

server.requestTimeout = 0;
server.headersTimeout = 0;
server.keepAliveTimeout = 5000;
server.listen(port, '127.0.0.1', () => {
  console.log('qa-serve', port, root);
});

process.on('uncaughtException', (e) => {
  console.error('qa-serve uncaught', e);
});
