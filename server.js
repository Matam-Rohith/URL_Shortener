const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static(__dirname));
app.use(cors());

// DB file path - use /tmp in production (Render)
const dbFile = process.env.NODE_ENV === 'production'
  ? path.join('/tmp', 'urls.json')
  : path.join(__dirname, 'urls.json');

let db = { urls: [] };

function loadDb() {
  try {
    if (fs.existsSync(dbFile)) {
      const raw = fs.readFileSync(dbFile, 'utf8');
      db = JSON.parse(raw || '{"urls":[]}');
    } else {
      db = { urls: [] };
      saveDb();
    }
  } catch (err) {
    console.error('Failed to load DB:', err);
    db = { urls: [] };
  }
}

function saveDb() {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save DB:', err);
  }
}

function isValidUrl(u) {
  try {
    new URL(u);
    return true;
  } catch (e) {
    return false;
  }
}

function generateShortCode() {
  return Math.random().toString(36).substring(2, 8);
}

function findByCode(code) {
  return db.urls.find(r => r.shortCode === code);
}

// Initialize DB
loadDb();

// POST /shorten
app.post('/shorten', (req, res) => {
  const { url } = req.body;
  if (!url || !isValidUrl(url)) return res.status(400).json({ error: 'Invalid URL provided' });

  // ensure unique shortCode
  let shortCode = generateShortCode();
  let attempts = 5;
  while (findByCode(shortCode) && attempts-- > 0) {
    shortCode = generateShortCode();
  }

  const record = {
    id: Date.now(),
    shortCode,
    originalUrl: url,
    clicks: 0,
    createdAt: new Date().toISOString()
  };

  db.urls.unshift(record);
  saveDb();

  const base = req.protocol + '://' + req.get('host');
  res.json({ shortUrl: `${base}/${shortCode}`, shortCode });
});

// GET stats
app.get('/api/stats', (req, res) => {
  res.json(db.urls);
});

app.get('/api/stats/:code', (req, res) => {
  const row = findByCode(req.params.code);
  if (!row) return res.status(404).json({ error: 'Short URL not found' });
  res.json(row);
});

app.delete('/api/delete/:code', (req, res) => {
  const { code } = req.params;
  const idx = db.urls.findIndex(r => r.shortCode === code);
  if (idx === -1) return res.status(404).json({ error: 'Short URL not found' });
  db.urls.splice(idx, 1);
  saveDb();
  res.json({ message: 'URL deleted successfully' });
});

// Redirect route (catch short codes)
app.get('/:code', (req, res) => {
  const { code } = req.params;
  
  // Skip if it's an API path or static file
  if (code.startsWith('api') || code.startsWith('_') || code.includes('.')) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  const row = findByCode(code);
  if (!row) return res.status(404).send('Short URL not found');
  row.clicks = (row.clicks || 0) + 1;
  saveDb();
  res.redirect(row.originalUrl);
});

// health check
app.get('/_health', (req, res) => res.json({ ok: true }));

// error handlers
process.on('uncaughtException', (err) => console.error('Uncaught:', err));
process.on('unhandledRejection', (r) => console.error('UnhandledRejection:', r));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`DB file: ${dbFile}`);
});
