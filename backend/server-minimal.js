// Minimal bulletproof server for Railway
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Basic middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://gto-gmail.vercel.app'],
  credentials: true
}));
app.use(express.json());

// Health check - bulletproof
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Simple contacts endpoint
app.get('/api/contacts', (req, res) => {
  res.json([]);
});

// Simple Gmail auth status
app.get('/api/gmail/auth/status', (req, res) => {
  res.json({ authenticated: false, userId: null });
});

// Simple Gmail auth URL
app.get('/api/gmail/auth/url', (req, res) => {
  res.status(500).json({ error: 'Gmail service not configured' });
});

// Outlook endpoints
app.get('/api/outlook/auth/status', (req, res) => {
  res.json({ authenticated: false, userId: null });
});

// Companies endpoint
app.get('/api/companies', (req, res) => {
  res.json([]);
});

// Catch all
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Minimal server running on port ${PORT}`);
  console.log('Server ready');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
