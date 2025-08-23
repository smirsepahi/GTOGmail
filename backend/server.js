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
const PORT = process.env.PORT || 3001;

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

// Routes

// Get all contacts
app.get('/api/contacts', (req, res) => {
  res.json(contacts);
});

// Add new contact
app.post('/api/contacts', (req, res) => {
  const newContact = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  contacts.push(newContact);
  res.status(201).json(newContact);
});

// Update contact
app.put('/api/contacts/:id', (req, res) => {
  const { id } = req.params;
  const contactIndex = contacts.findIndex(c => c.id === id);

  if (contactIndex === -1) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  contacts[contactIndex] = { ...contacts[contactIndex], ...req.body };
  res.json(contacts[contactIndex]);
});

// Delete contact
app.delete('/api/contacts/:id', (req, res) => {
  const { id } = req.params;
  contacts = contacts.filter(c => c.id !== id);
  res.status(204).send();
});

// Get all reminders
app.get('/api/reminders', (req, res) => {
  res.json(reminders);
});

// Add new reminder
app.post('/api/reminders', (req, res) => {
  const newReminder = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  reminders.push(newReminder);
  res.status(201).json(newReminder);
});

// Update reminder
app.put('/api/reminders/:id', (req, res) => {
  const { id } = req.params;
  const reminderIndex = reminders.findIndex(r => r.id === id);

  if (reminderIndex === -1) {
    return res.status(404).json({ error: 'Reminder not found' });
  }

  reminders[reminderIndex] = { ...reminders[reminderIndex], ...req.body };
  res.json(reminders[reminderIndex]);
});

// Delete reminder
app.delete('/api/reminders/:id', (req, res) => {
  const { id } = req.params;
  reminders = reminders.filter(r => r.id !== id);
  res.status(204).send();
});

// CSV import endpoint
app.post('/api/import/csv', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const results = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      // Map CSV columns to contact fields
      const contact = {
        id: uuidv4(),
        name: data.name || data.Name || data.NAME || '',
        email: data.email || data.Email || data.EMAIL || '',
        phone: data.phone || data.Phone || data.PHONE || '',
        company: data.company || data.Company || data.COMPANY || '',
        position: data.position || data.Position || data.POSITION || '',
        notes: data.notes || data.Notes || data.NOTES || '',
        createdAt: new Date().toISOString()
      };
      results.push(contact);
    })
    .on('end', () => {
      // Add imported contacts to our storage
      contacts.push(...results);

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        message: `Successfully imported ${results.length} contacts`,
        contacts: results
      });
    })
    .on('error', (error) => {
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Error processing CSV file' });
    });
});

// Analytics endpoint
app.get('/api/analytics', (req, res) => {
  const totalContacts = contacts.length;
  const totalReminders = reminders.length;
  const upcomingReminders = reminders.filter(r => {
    const reminderDate = new Date(r.date);
    const now = new Date();
    return reminderDate > now;
  }).length;

  res.json({
    totalContacts,
    totalReminders,
    upcomingReminders,
    recentContacts: contacts.slice(-5).reverse()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Gmail API routes
app.use('/api/gmail', gmailRoutes);

// Outlook API routes (only if configured)
if (outlookRoutes) {
  app.use('/api/outlook', outlookRoutes);
  console.log('Outlook API routes enabled');
} else {
  console.log('Outlook API routes disabled - missing Microsoft credentials');
}

// Companies API routes
app.use('/api/companies', companiesRoutes);

// Contacts API routes
app.use('/api/contacts', contactsRoutes);

// Make Gmail service and user tokens available to other routes
const GmailService = require('./services/gmailService');
const gmailService = new GmailService();
let userTokens = {}; // This should be shared with gmail routes

app.locals.gmailService = gmailService;
app.locals.userTokens = userTokens;

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});