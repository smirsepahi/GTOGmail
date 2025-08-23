// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Import Gmail, Outlook, Companies, and Contacts routes
const gmailRoutes = require('./routes/gmail');
const companiesRoutes = require('./routes/companies');
const contactsRoutes = require('./routes/contacts');

// Conditionally import Outlook routes only if credentials are provided
let outlookRoutes = null;
try {
  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    outlookRoutes = require('./routes/outlook');
  }
} catch (error) {
  console.warn('Outlook routes disabled due to missing dependencies or configuration');
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
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Gmail API routes
app.use('/api/gmail', gmailRoutes);
console.log('Gmail API routes registered at /api/gmail');

// Outlook API routes (only if configured)
if (outlookRoutes) {
  app.use('/api/outlook', outlookRoutes);
  console.log('Outlook API routes enabled');
} else {
  console.log('Outlook API routes disabled - missing Microsoft credentials');
}

// Companies API routes
app.use('/api/companies', companiesRoutes);
console.log('Companies API routes registered at /api/companies');

// Contacts API routes
app.use('/api/contacts', contactsRoutes);
console.log('Contacts API routes registered at /api/contacts');

// Debug: List all registered routes
app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log('Route:', r.route.path)
  } else if (r.name === 'router') {
    console.log('Router middleware:', r.regexp)
  }
});

// Make Gmail service and user tokens available to other routes
const GmailService = require('./services/gmailService');
const gmailService = new GmailService();
let userTokens = {}; // This should be shared with gmail routes

app.locals.gmailService = gmailService;
app.locals.userTokens = userTokens;

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});