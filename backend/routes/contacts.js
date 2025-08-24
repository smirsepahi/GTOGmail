const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

console.log('👥 Initializing Contacts routes module...');

// File path for storing contacts
const CONTACTS_FILE = path.join(__dirname, '../data/contacts.json');

// Ensure data directory exists
const dataDir = path.dirname(CONTACTS_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Helper function to read contacts from file
function readContacts() {
  try {
    if (fs.existsSync(CONTACTS_FILE)) {
      const data = fs.readFileSync(CONTACTS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading contacts file:', error);
    return [];
  }
}

// Helper function to write contacts to file
function writeContacts(contacts) {
  try {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing contacts file:', error);
    return false;
  }
}

// Helper function to check if contact has been contacted via Gmail
async function checkContactStatus(email, gmailService, userTokens) {
  try {
    const userId = 'default'; // You can implement user management
    const tokens = userTokens[userId];

    if (!tokens || !gmailService) {
      return { contacted: false, lastContactDate: null, daysSinceContact: null };
    }

    gmailService.setCredentials(tokens);

    // Search for emails sent to this contact
    const query = `to:${email}`;
    const emails = await gmailService.searchEmails(query, 10);

    if (emails.length === 0) {
      return { contacted: false, lastContactDate: null, daysSinceContact: null };
    }

    // Find the most recent email
    const mostRecentEmail = emails[0]; // Assuming emails are sorted by date
    const lastContactDate = new Date(mostRecentEmail.date);
    const now = new Date();
    const daysSinceContact = Math.floor((now - lastContactDate) / (1000 * 60 * 60 * 24));

    return {
      contacted: true,
      lastContactDate: lastContactDate.toISOString(),
      daysSinceContact
    };
  } catch (error) {
    console.error('Error checking contact status:', error);
    return { contacted: false, lastContactDate: null, daysSinceContact: null };
  }
}

// GET /api/contacts - Get all contacts
router.get('/', async (req, res) => {
  console.log('👥 GET / - Fetching all contacts...');
  try {
    const contacts = readContacts();
    console.log(`👥 Found ${contacts.length} contacts in storage`);

    // If Gmail service is available, check contact status for each contact
    const gmailService = req.app.locals.gmailService;
    const userTokens = req.app.locals.userTokens;

    console.log(`👥 Gmail service available: ${!!gmailService}, User tokens available: ${!!userTokens}`);

    if (gmailService && userTokens) {
      console.log('👥 Checking contact status with Gmail integration...');
      const contactsWithStatus = await Promise.all(
        contacts.map(async (contact) => {
          const status = await checkContactStatus(contact.email, gmailService, userTokens);
          return {
            ...contact,
            ...status
          };
        })
      );

      console.log('✅ Contacts with status loaded successfully');
      res.json(contactsWithStatus);
    } else {
      // Return contacts without status if Gmail service is not available
      console.log('👥 Returning contacts without Gmail status');
      const contactsWithDefaultStatus = contacts.map(contact => ({
        ...contact,
        contacted: false,
        lastContactDate: null,
        daysSinceContact: null
      }));

      console.log('✅ Contacts loaded successfully (without Gmail status)');
      res.json(contactsWithDefaultStatus);
    }
  } catch (error) {
    console.error('❌ Error getting contacts:', error);
    res.status(500).json({ error: 'Failed to get contacts', details: error.message });
  }
});

// POST /api/contacts - Create a new contact
router.post('/', (req, res) => {
  try {
    const { name, email, company, position, notes } = req.body;

    if (!name || !email || !company) {
      return res.status(400).json({ error: 'Name, email, and company are required' });
    }

    const contacts = readContacts();

    // Check if contact with this email already exists
    const existingContact = contacts.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (existingContact) {
      return res.status(400).json({ error: 'Contact with this email already exists' });
    }

    const newContact = {
      id: uuidv4(),
      name,
      email: email.toLowerCase(),
      company,
      position: position || '',
      notes: notes || '',
      addedAt: new Date().toISOString(),
      contacted: false,
      lastContactDate: null,
      daysSinceContact: null
    };

    contacts.push(newContact);

    if (writeContacts(contacts)) {
      res.status(201).json(newContact);
    } else {
      res.status(500).json({ error: 'Failed to save contact' });
    }
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// PUT /api/contacts/:id - Update a contact
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, company, position, notes, contacted, lastContactDate } = req.body;

    const contacts = readContacts();
    const contactIndex = contacts.findIndex(c => c.id === id);

    if (contactIndex === -1) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Check if email is being changed and if new email already exists
    if (email && email.toLowerCase() !== contacts[contactIndex].email) {
      const existingContact = contacts.find(c => c.email.toLowerCase() === email.toLowerCase() && c.id !== id);
      if (existingContact) {
        return res.status(400).json({ error: 'Contact with this email already exists' });
      }
    }

    // Update contact
    const updatedContact = {
      ...contacts[contactIndex],
      ...(name && { name }),
      ...(email && { email: email.toLowerCase() }),
      ...(company && { company }),
      ...(position !== undefined && { position }),
      ...(notes !== undefined && { notes }),
      ...(contacted !== undefined && { contacted }),
      ...(lastContactDate !== undefined && { lastContactDate }),
      updatedAt: new Date().toISOString()
    };

    contacts[contactIndex] = updatedContact;

    if (writeContacts(contacts)) {
      res.json(updatedContact);
    } else {
      res.status(500).json({ error: 'Failed to update contact' });
    }
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// DELETE /api/contacts/:id - Delete a contact
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const contacts = readContacts();
    const contactIndex = contacts.findIndex(c => c.id === id);

    if (contactIndex === -1) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    contacts.splice(contactIndex, 1);

    if (writeContacts(contacts)) {
      res.json({ message: 'Contact deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete contact' });
    }
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// GET /api/contacts/:id - Get a specific contact
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contacts = readContacts();
    const contact = contacts.find(c => c.id === id);

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Check contact status if Gmail service is available
    const gmailService = req.app.locals.gmailService;
    const userTokens = req.app.locals.userTokens;

    if (gmailService && userTokens) {
      const status = await checkContactStatus(contact.email, gmailService, userTokens);
      res.json({ ...contact, ...status });
    } else {
      res.json({
        ...contact,
        contacted: false,
        lastContactDate: null,
        daysSinceContact: null
      });
    }
  } catch (error) {
    console.error('Error getting contact:', error);
    res.status(500).json({ error: 'Failed to get contact' });
  }
});

module.exports = router;
