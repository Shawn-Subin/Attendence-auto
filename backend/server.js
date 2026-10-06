/**
 * MITS Campus Hub - Backend Scraper Microservice
 * Stateless API service for live ETLAB attendance synchronization
 */

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { scrapeAttendance } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for frontend clients (Vercel, GitHub Pages, Localhost, Mobile)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve static frontend assets from public/ or parent directory
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}
const parentDir = path.join(__dirname, '..');
if (fs.existsSync(path.join(parentDir, 'index.html'))) {
  app.use(express.static(parentDir));
}

// Rate Limiting: Max 20 requests per 5-minute window per IP to avoid overloading ETLAB
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many sync attempts from this IP. Please wait a few minutes before trying again.'
  }
});

// Health check endpoint (moved from '/' so root can serve the web app)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'MITS Campus Hub ETLAB Scraper API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Primary Attendance Scrape Endpoint
app.post('/api/scrape-attendance', limiter, async (req, res) => {
  const { username, password, targetUrl, studentId } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide both username and password.'
    });
  }

  // Safe logging: Never log the student's password
  console.log(`[${new Date().toISOString()}] Sync requested for user: ${username.trim()}`);

  try {
    const data = await scrapeAttendance(username, password, targetUrl || studentId);
    console.log(`[${new Date().toISOString()}] Sync success for user: ${username.trim()} (${data.student?.name || 'Unknown'})`);
    return res.status(200).json(data);
  } catch (err) {
    const status = err.status || 500;
    console.error(`[${new Date().toISOString()}] Sync failed for user: ${username.trim()} - Error: ${err.message}`);
    return res.status(status).json({
      success: false,
      error: err.message || 'Internal server error while syncing attendance.',
      details: err.details || undefined
    });
  }
});

// Catch-all: serve index.html for frontend navigation
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const publicIndex = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(publicIndex)) {
    return res.sendFile(publicIndex);
  }
  const parentIndex = path.join(__dirname, '..', 'index.html');
  if (fs.existsSync(parentIndex)) {
    return res.sendFile(parentIndex);
  }
  next();
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 MITS Campus Hub Scraper API running on port ${PORT}`);
  console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
  console.log(`Sync endpoint:   http://localhost:${PORT}/api/scrape-attendance`);
  console.log(`=================================================`);
});
