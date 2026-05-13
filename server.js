const http    = require('http');
const fs      = require('fs');
const path    = require('path');
const bcrypt  = require('bcryptjs');

const BCRYPT_ROUNDS = 10;

const PORT     = 4000;
const ROOT     = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const IMG_DIR  = path.join(ROOT, 'img');

[DATA_DIR, IMG_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

const USERS_FILE    = path.join(DATA_DIR, 'users.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css',
  '.js': 'application/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.bat': 'text/plain',
};

function readJSON(file, fallback = []) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return fallback; }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
    req.on('error', reject);
  });
}

function send(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function saveBase64Image(base64, id) {
  const m = base64.match(/^data:([^;]+);base64,(.+)$/s);
  if (!m) return null;
  let ext = m[1].split('/')[1];
  if (ext === 'jpeg') ext = 'jpg';
  const filename = `product_${id}.${ext}`;
  fs.writeFileSync(path.join(IMG_DIR, filename), Buffer.from(m[2], 'base64'));
  return `img/${filename}`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const p   = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // ────────────── API ──────────────
  if (p.startsWith('/api/')) {

    // GET /api/products
    if (p === '/api/products' && req.method === 'GET') {
      return send(res, 200, readJSON(PRODUCTS_FILE));
    }

    // POST /api/products
    if (p === '/api/products' && req.method === 'POST') {
      const body = await parseBody(req);
      if (body.image && body.image.startsWith('data:')) {
        body.image = saveBase64Image(body.image, body.id) || '';
      }
      const list = readJSON(PRODUCTS_FILE);
      list.push(body);
      writeJSON(PRODUCTS_FILE, list);
      return send(res, 201, { ok: true, product: body });
    }

    // DELETE /api/products/:id
    const delProd = p.match(/^\/api\/products\/([^/]+)$/);
    if (delProd && req.method === 'DELETE') {
      const id   = delProd[1];
      const list = readJSON(PRODUCTS_FILE);
      const prod = list.find(x => x.id === id);
      if (prod && prod.image) {
        const imgPath = path.join(ROOT, prod.image);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }
      writeJSON(PRODUCTS_FILE, list.filter(x => x.id !== id));
      return send(res, 200, { ok: true });
    }

    // POST /api/users/register
    if (p === '/api/users/register' && req.method === 'POST') {
      const body  = await parseBody(req);
      const users = readJSON(USERS_FILE);
      if (users.some(u => u.email === body.email)) {
        return send(res, 409, { ok: false, error: 'E-mail já cadastrado.' });
      }
      body.password = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
      users.push(body);
      writeJSON(USERS_FILE, users);
      return send(res, 201, { ok: true });
    }

    // POST /api/users/login
    if (p === '/api/users/login' && req.method === 'POST') {
      const body  = await parseBody(req);
      const users = readJSON(USERS_FILE);
      const user  = users.find(u => u.email === body.email);
      if (!user) return send(res, 401, { ok: false, error: 'E-mail não encontrado.' });
      const match = await bcrypt.compare(body.password, user.password);
      if (!match) return send(res, 401, { ok: false, error: 'Senha incorreta.' });
      return send(res, 200, {
        ok: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, storeName: user.storeName || '' }
      });
    }

    // PUT /api/users/:id
    const putUser = p.match(/^\/api\/users\/([^/]+)$/);
    if (putUser && req.method === 'PUT') {
      const id    = putUser[1];
      const body  = await parseBody(req);
      const users = readJSON(USERS_FILE);
      const idx   = users.findIndex(u => u.id === id);
      if (idx === -1) return send(res, 404, { ok: false, error: 'Usuário não encontrado.' });
      users[idx] = { ...users[idx], ...body };
      writeJSON(USERS_FILE, users);
      return send(res, 200, {
        ok: true,
        user: { id: users[idx].id, name: users[idx].name, email: users[idx].email, role: users[idx].role, storeName: users[idx].storeName || '' }
      });
    }

    return send(res, 404, { error: 'Endpoint não encontrado.' });
  }

  // ────────────── Arquivos estáticos ──────────────
  let filePath = p === '/' ? '/atletic-store.html' : p;
  filePath = path.normalize(path.join(ROOT, filePath));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); return res.end('Forbidden');
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404); return res.end('Not found');
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log('\n  Atletic Store rodando em http://localhost:' + PORT + '\n');
});
