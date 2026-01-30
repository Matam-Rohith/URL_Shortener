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

// Redirect route (only 6-char alnum codes)
app.get('/:code([A-Za-z0-9]{6})', (req, res) => {
  const { code } = req.params;
  const row = findByCode(code);
  if (!row) return res.status(404).send('Short URL not found');
  row.clicks = (row.clicks || 0) + 1;
  saveDb();
  res.redirect(row.originalUrl);
});

// health
app.get('/_health', (req, res) => res.json({ ok: true }));

// error handlers
process.on('uncaughtException', (err) => console.error('Uncaught:', err));
process.on('unhandledRejection', (r) => console.error('UnhandledRejection:', r));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`DB file: ${dbFile}`);
});
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

// Redirect route (only 6-char alnum codes)
app.get('/:code([A-Za-z0-9]{6})', (req, res) => {
  const { code } = req.params;
  const row = findByCode(code);
  if (!row) return res.status(404).send('Short URL not found');
  row.clicks = (row.clicks || 0) + 1;
  saveDb();
  res.redirect(row.originalUrl);
});

// health
app.get('/_health', (req, res) => res.json({ ok: true }));

// error handlers
process.on('uncaughtException', (err) => console.error('Uncaught:', err));
process.on('unhandledRejection', (r) => console.error('UnhandledRejection:', r));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`DB file: ${dbFile}`);
});
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));
app.use(cors());

// Initialize SQLite database (use /tmp for Render, or local for development)
const dbPath = process.env.NODE_ENV === 'production' 
  ? path.join('/tmp', 'urls.db')
  : path.join(__dirname, 'urls.db');
let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database error:", err);
    console.log("Falling back to in-memory database");
    db = new sqlite3.Database(':memory:', (err2) => {
      if (err2) {
        console.error('In-memory DB error:', err2);
      } else {
        console.log('Using in-memory SQLite database');
        ensureSchema();
      }
    });
  } else {
    console.log("Connected to SQLite database");
    ensureSchema();
  }
});

// Ensure DB schema exists
function ensureSchema() {
  const create = `
    CREATE TABLE IF NOT EXISTS urls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shortCode TEXT UNIQUE NOT NULL,
      originalUrl TEXT NOT NULL,
      clicks INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`;

  db.run(create, (err) => {
    if (err) console.error('Failed to create schema:', err);
    else console.log('DB schema ensured');
  });
}

// Validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Generate short code
function generateShortCode() {
  return Math.random().toString(36).substring(2, 8);
}

// POST: Shorten URL
app.post("/shorten", (req, res) => {
  const { url } = req.body;

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: "Invalid URL provided" });
  }

  let shortCode = generateShortCode();
  const insertUrl = "INSERT INTO urls (shortCode, originalUrl) VALUES (?, ?)";

  // Try inserting; if shortCode collides, retry a few times
  const tryInsert = (attemptsLeft) => {
    db.run(insertUrl, [shortCode, url], function (err) {
      if (err) {
        if (attemptsLeft > 0) {
          shortCode = generateShortCode();
          return tryInsert(attemptsLeft - 1);
        }
        return res.status(500).json({ error: "Failed to shorten URL" });
      }

      const base = req.protocol + "://" + req.get("host");
      res.json({ shortUrl: `${base}/${shortCode}`, shortCode });
    });
  };

  tryInsert(3);
});

// NOTE: redirect route is registered after API routes to avoid catching API paths

// GET: Get all URLs and stats
app.get("/api/stats", (req, res) => {
  const selectAll = "SELECT * FROM urls ORDER BY createdAt DESC";

  db.all(selectAll, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch stats" });
    }
    res.json(rows);
  });
});

// GET: Get stats for a specific short code
app.get("/api/stats/:code", (req, res) => {
  const { code } = req.params;
  const selectUrl = "SELECT * FROM urls WHERE shortCode = ?";

  db.get(selectUrl, [code], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Server error" });
    }
    if (row) {
      res.json(row);
    } else {
      res.status(404).json({ error: "Short URL not found" });
    }
  });
});

// DELETE: Remove a shortened URL
app.delete("/api/delete/:code", (req, res) => {
  const { code } = req.params;
  const deleteUrl = "DELETE FROM urls WHERE shortCode = ?";

  db.run(deleteUrl, [code], (err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to delete URL" });
    }
    res.json({ message: "URL deleted successfully" });
  });
});

// GET: Redirect to original URL (only match short-code patterns)
app.get('/:code([A-Za-z0-9]{6})', (req, res) => {
  const { code } = req.params;
  const selectUrl = 'SELECT originalUrl, clicks FROM urls WHERE shortCode = ?';

  db.get(selectUrl, [code], (err, row) => {
    if (err) {
      console.error('DB error on redirect:', err);
      return res.status(500).send('Server error');
    }

    if (row) {
      db.run('UPDATE urls SET clicks = clicks + 1 WHERE shortCode = ?', [code], (uerr) => {
        if (uerr) console.error('Failed to increment clicks:', uerr);
      });
      return res.redirect(row.originalUrl);
    }

    return res.status(404).send('Short URL not found');
  });
});

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

app.listen(PORT, () => {
  console.log(`\n✓ Server running on port ${PORT}`);
  console.log(`✓ Database: ${dbPath}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});
