/* Serveur statique local pour prévisualiser dist/ (dev uniquement). */
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, 'dist');
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json',
  '.xml': 'application/xml', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain',
};
const PORT = 8099;
http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') url = '/index.html';
  let file = path.join(root, url);
  if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file = file + '.html';
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(root, '404.html');
    res.statusCode = 404;
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.statusCode = 500; res.end('Server error'); return; }
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
}).listen(PORT, () => console.log('Preview Finition Royale → http://localhost:' + PORT));
