const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));
app.use(cors());

// Initialize SQLite database
const dbPath = path.join(__dirname, "urls.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Database error:", err);
  else console.log("Connected to SQLite database");
});

// Create table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shortCode TEXT UNIQUE NOT NULL,
    originalUrl TEXT NOT NULL,
    clicks INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

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

  db.run(insertUrl, [shortCode, url], function (err) {
    if (err) {
      // If code exists, generate a new one
      shortCode = generateShortCode();
      db.run(insertUrl, [shortCode, url], function (err) {
        if (err) {
          return res.status(500).json({ error: "Failed to shorten URL" });
        }
        res.json({ shortUrl: `http://localhost:${PORT}/${shortCode}`, shortCode });
      });
    } else {
      res.json({ shortUrl: `http://localhost:${PORT}/${shortCode}`, shortCode });
    }
  });
});

// GET: Redirect to original URL
app.get("/:code", (req, res) => {
  const { code } = req.params;
  const selectUrl = "SELECT originalUrl, clicks FROM urls WHERE shortCode = ?";

  db.get(selectUrl, [code], (err, row) => {
    if (err) {
      return res.status(500).send("Server error");
    }

    if (row) {
      // Increment click count
      db.run("UPDATE urls SET clicks = clicks + 1 WHERE shortCode = ?", [code]);
      res.redirect(row.originalUrl);
    } else {
      res.status(404).send("Short URL not found");
    }
  });
});

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

app.listen(PORT, () => {
  console.log(`\n✓ Server running on http://localhost:${PORT}`);
  console.log("✓ Database: urls.db");
});
