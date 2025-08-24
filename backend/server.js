// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Import Gmail, Outlook, Companies, and Contacts routes
console.log('Loading route modules...');

let gmailRoutes = null;
let companiesRoutes = null;
let contactsRoutes = null;
let outlookRoutes = null;

try {
  console.log('Loading gmail routes...');
  gmailRoutes = require('./routes/gmail');
  console.log('Gmail routes loaded successfully');
} catch (error) {
  console.error('Failed to load gmail routes:', error.message);
}

try {
  console.log('Loading companies routes...');
  companiesRoutes = require('./routes/companies');
  console.log('Companies routes loaded successfully');
} catch (error) {
  console.error('Failed to load companies routes:', error.message);
}

try {
  console.log('Loading contacts routes...');
  contactsRoutes = require('./routes/contacts');
  console.log('Contacts routes loaded successfully');
} catch (error) {
  console.error('Failed to load contacts routes:', error.message);
}

// Conditionally import Outlook routes only if credentials are provided
try {
  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    console.log('Loading outlook routes...');
    outlookRoutes = require('./routes/outlook');
    console.log('Outlook routes loaded successfully');
  } else {
    console.log('Outlook routes skipped - missing Microsoft credentials');
  }
} catch (error) {
  console.warn('Outlook routes disabled due to missing dependencies or configuration:', error.message);
}

const app = express();
const PORT = process.env.PORT || 8080;

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://gto-gmail.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

console.log('Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// In-memory storage (replace with database in production)
let contacts = [];
let reminders = [];

// Multer configuration for file uploads
const upload = multer({ dest: 'uploads/' });

// Routes - removed duplicate contact routes, using separate route files instead

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    routes: ['gmail', 'contacts', 'companies', 'outlook']
  });
});

// Keep-alive endpoint for Railway
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Register routes with error handling
console.log('Registering API routes...');

// Gmail API routes
if (gmailRoutes) {
  app.use('/api/gmail', gmailRoutes);
  console.log('✅ Gmail API routes registered at /api/gmail');
} else {
  console.error('❌ Gmail routes not available - creating fallback');
  app.use('/api/gmail', (req, res) => {
    res.status(500).json({ error: 'Gmail service not available' });
  });
}

// Contacts API routes
if (contactsRoutes) {
  app.use('/api/contacts', contactsRoutes);
  console.log('✅ Contacts API routes registered at /api/contacts');
} else {
  console.error('❌ Contacts routes not available - creating fallback');
  app.use('/api/contacts', (req, res) => {
    res.status(500).json({ error: 'Contacts service not available' });
  });
}

// Companies API routes
if (companiesRoutes) {
  app.use('/api/companies', companiesRoutes);
  console.log('✅ Companies API routes registered at /api/companies');
} else {
  console.error('❌ Companies routes not available - creating fallback');
  app.use('/api/companies', (req, res) => {
    res.status(500).json({ error: 'Companies service not available' });
  });
}

// Outlook API routes (only if configured)
if (outlookRoutes) {
  app.use('/api/outlook', outlookRoutes);
  console.log('✅ Outlook API routes enabled');
} else {
  console.log('⚠️ Outlook API routes disabled - missing Microsoft credentials');
  app.use('/api/outlook', (req, res) => {
    res.status(503).json({ error: 'Outlook service not configured' });
  });
}

// Debug: List all registered routes
console.log('\n📋 Registered routes:');
app._router.stack.forEach(function(r, index){
  if (r.route && r.route.path){
    console.log(`${index + 1}. Route: ${r.route.path} [${Object.keys(r.route.methods).join(', ').toUpperCase()}]`);
  } else if (r.name === 'router') {
    console.log(`${index + 1}. Router middleware: ${r.regexp}`);
  } else {
    console.log(`${index + 1}. Middleware: ${r.name || 'anonymous'}`);
  }
});

// Add catch-all route for debugging
app.use('/api/*', (req, res) => {
  console.log(`❌ Unhandled API route: ${req.method} ${req.path}`);
  console.log('Available routes should be: /api/gmail, /api/contacts, /api/companies, /api/outlook');
  res.status(404).json({
    error: 'API route not found',
    path: req.path,
    method: req.method,
    availableRoutes: ['/api/gmail', '/api/contacts', '/api/companies', '/api/outlook', '/api/health']
  });
});

// Catch-all for non-API routes
app.use('*', (req, res) => {
  console.log(`❌ Unhandled route: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Make Gmail service and user tokens available to other routes
const GmailService = require('./services/gmailService');
const gmailService = new GmailService();
let userTokens = {}; // This should be shared with gmail routes

app.locals.gmailService = gmailService;
app.locals.userTokens = userTokens;

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process in production
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in production
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log('Server is ready to accept connections');

  // Keep-alive mechanism for Railway
  setInterval(() => {
    console.log(`💓 Server heartbeat - Uptime: ${Math.floor(process.uptime())}s`);
  }, 60000); // Log every minute
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});