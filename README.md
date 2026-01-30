# URL Shortener - Full Stack Application

A modern, full-stack URL shortening application built with Express.js and SQLite.

## Features

✨ **Core Features:**
- 🔗 Shorten long URLs to short, shareable codes
- 📊 Track click statistics for each shortened URL
- 🗑️ Delete shortened URLs
- 📋 Copy-to-clipboard functionality
- 💾 Persistent storage with SQLite database
- 🎨 Beautiful, responsive UI
- 🚀 Fast and lightweight

## Project Structure

```
url-shortener/
├── server.js          # Express server with API endpoints
├── index.html         # Frontend UI
├── package.json       # Dependencies
├── urls.db           # SQLite database (created on first run)
└── README.md         # This file
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Steps

1. **Navigate to project directory:**
```bash
cd url-shortener
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the server:**
```bash
npm start
```

4. **Open in browser:**
Navigate to `http://localhost:5000`

## API Endpoints

### POST `/shorten`
Shorten a URL

**Request:**
```json
{
  "url": "https://example.com/very/long/url"
}
```

**Response:**
```json
{
  "shortUrl": "http://localhost:5000/abc123",
  "shortCode": "abc123"
}
```

### GET `/:code`
Redirect to original URL

### GET `/api/stats`
Get all shortened URLs and statistics

**Response:**
```json
[
  {
    "id": 1,
    "shortCode": "abc123",
    "originalUrl": "https://example.com",
    "clicks": 5,
    "createdAt": "2026-01-30T10:30:00.000Z"
  }
]
```

### GET `/api/stats/:code`
Get statistics for a specific shortened URL

### DELETE `/api/delete/:code`
Delete a shortened URL

## Usage

1. **Shorten a URL:**
   - Enter a long URL in the input field
   - Click "Shorten URL"
   - The short URL will appear below
   - Click the copy button to copy to clipboard

2. **View Statistics:**
   - Dashboard shows total URLs and total clicks
   - See all URLs in the list with click counts

3. **Manage URLs:**
   - Copy any shortened URL link
   - Delete URLs you no longer need

## Technologies Used

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **Database:** SQLite3
- **Architecture:** RESTful API

## Future Enhancements

- User authentication and accounts
- Custom short codes
- QR codes
- Link expiration
- Analytics dashboard
- Rate limiting
- Database migration system
- Admin panel

## License

ISC
