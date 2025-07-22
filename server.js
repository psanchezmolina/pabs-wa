import express from 'express';
import fetch from 'node-fetch';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;
const N8N_BASE = process.env.N8N_BASE_URL;           // e.g. https://tumae.miau.ai
const AUTH_HEADER = process.env.N8N_AUTH_HEADER;     // e.g. "Basic abcdef..."

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Proxy genérico
app.all('/api/:action', async (req, res) => {
  const { action } = req.params;
  const locationId = req.method === 'GET'
    ? req.query.locationId
    : req.body.locationId;
  if (!locationId) {
    return res.status(400).json({ error: 'locationId missing' });
  }

  let url = `${N8N_BASE}/webhook/${action}`;
  let opts = { method: req.method, headers: { Authorization: AUTH_HEADER } };

  // GET: pasamos locationId como query; POST/PUT: en body
  if (req.method === 'GET') {
    url += `?locationId=${encodeURIComponent(locationId)}`;
  } else {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify({ locationId, ...req.body });
  }

  try {
    const proxyRes = await fetch(url, opts);
    const contentType = proxyRes.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await proxyRes.json()
      : await proxyRes.buffer();
    res.status(proxyRes.status).type(contentType).send(data);
  } catch (err) {
    console.error('Proxy error', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
