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
