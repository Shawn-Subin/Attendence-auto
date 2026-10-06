/**
 * MITS Campus Hub - Backend Scraper Microservice
 * Stateless API service for live ETLAB attendance synchronization
 */

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

// Health check endpoint
app.get(['/', '/api/health'], (req, res) => {
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

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 MITS Campus Hub Scraper API running on port ${PORT}`);
  console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
  console.log(`Sync endpoint:   http://localhost:${PORT}/api/scrape-attendance`);
  console.log(`=================================================`);
});
