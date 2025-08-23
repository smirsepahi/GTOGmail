const express = require('express');
const router = express.Router();
const GmailService = require('../services/gmailService');

// Initialize Gmail service
const gmailService = new GmailService();

// Store tokens in memory (in production, use a database)
// Note: userTokens will be shared via app.locals

// Get OAuth2 authorization URL
router.get('/auth/url', (req, res) => {
  try {
    const authUrl = gmailService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

// Handle OAuth2 callback
router.get('/auth/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const tokens = await gmailService.getTokensFromCode(code);

    // Store tokens (in production, save to database)
    const userId = 'default'; // You can implement user management
    if (!req.app.locals.userTokens) {
      req.app.locals.userTokens = {};
    }
    req.app.locals.userTokens[userId] = tokens;

    // Set credentials for future requests
    gmailService.setCredentials(tokens);

    res.json({
      message: 'Authentication successful',
      userId: userId
    });
  } catch (error) {
    console.error('Error in auth callback:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const userTokens = req.app.locals.userTokens || {};
    const tokens = userTokens[userId];

    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    gmailService.setCredentials(tokens);
    const profile = await gmailService.getUserProfile();

    res.json(profile);
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Get emails from inbox
router.get('/emails', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const userTokens = req.app.locals.userTokens || {};
    const tokens = userTokens[userId];
    const maxResults = parseInt(req.query.maxResults) || 20;
    const query = req.query.query || '';

    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    gmailService.setCredentials(tokens);
    const emails = await gmailService.getEmails(maxResults, query);

    res.json(emails);
  } catch (error) {
    console.error('Error getting emails:', error);
    res.status(500).json({ error: 'Failed to get emails' });
  }
});

// Get email details
router.get('/emails/:messageId', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const userTokens = req.app.locals.userTokens || {};
    const tokens = userTokens[userId];
    const { messageId } = req.params;

    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    gmailService.setCredentials(tokens);
    const email = await gmailService.getEmailDetails(messageId);

    res.json(email);
  } catch (error) {
    console.error('Error getting email details:', error);
    res.status(500).json({ error: 'Failed to get email details' });
  }
});

// Send email
router.post('/send', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const userTokens = req.app.locals.userTokens || {};
    const tokens = userTokens[userId];
    const { to, subject, body, isHtml = false } = req.body;

    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'To, subject, and body are required' });
    }

    gmailService.setCredentials(tokens);
    const result = await gmailService.sendEmail(to, subject, body, isHtml);

    res.json({
      message: 'Email sent successfully',
      messageId: result.id
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Check authentication status
router.get('/auth/status', (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const userTokens = req.app.locals.userTokens || {};
    const tokens = userTokens[userId];

    res.json({
      authenticated: !!tokens,
      userId: tokens ? userId : null
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    res.status(500).json({ error: 'Failed to check authentication status' });
  }
});

// Logout and clear tokens
router.post('/auth/logout', (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const userTokens = req.app.locals.userTokens || {};
    delete userTokens[userId];

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Get domain statistics
router.get('/stats/domains', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const userTokens = req.app.locals.userTokens || {};
    const tokens = userTokens[userId];
    const timeframe = req.query.timeframe || 'week';

    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    gmailService.setCredentials(tokens);
    const stats = await gmailService.getDomainStats(timeframe);

    res.json(stats);
  } catch (error) {
    console.error('Error getting domain stats:', error);
    res.status(500).json({ error: 'Failed to get domain statistics' });
  }
});

// Search emails
router.get('/search', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const userTokens = req.app.locals.userTokens || {};
    const tokens = userTokens[userId];
    const { query, maxResults = 20 } = req.query;

    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    gmailService.setCredentials(tokens);
    const emails = await gmailService.searchEmails(query, parseInt(maxResults));

    res.json(emails);
  } catch (error) {
    console.error('Error searching emails:', error);
    res.status(500).json({ error: 'Failed to search emails' });
  }
});

// Get email thread
router.get('/threads/:threadId', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const userTokens = req.app.locals.userTokens || {};
    const tokens = userTokens[userId];
    const { threadId } = req.params;

    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    gmailService.setCredentials(tokens);
    const thread = await gmailService.getThread(threadId);

    res.json(thread);
  } catch (error) {
    console.error('Error getting thread:', error);
    res.status(500).json({ error: 'Failed to get thread' });
  }
});

// Get labels
router.get('/labels', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const userTokens = req.app.locals.userTokens || {};
    const tokens = userTokens[userId];

    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    gmailService.setCredentials(tokens);
    const labels = await gmailService.getLabels();

    res.json(labels);
  } catch (error) {
    console.error('Error getting labels:', error);
    res.status(500).json({ error: 'Failed to get labels' });
  }
});

// Create label
router.post('/labels', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const userTokens = req.app.locals.userTokens || {};
    const tokens = userTokens[userId];
    const { name, backgroundColor } = req.body;

    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Label name is required' });
    }

    gmailService.setCredentials(tokens);
    const label = await gmailService.createLabel(name, backgroundColor);

    res.json(label);
  } catch (error) {
    console.error('Error creating label:', error);
    res.status(500).json({ error: 'Failed to create label' });
  }
});

// Add label to message
router.post('/messages/:messageId/labels', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const userTokens = req.app.locals.userTokens || {};
    const tokens = userTokens[userId];
    const { messageId } = req.params;
    const { labelId } = req.body;

    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!labelId) {
      return res.status(400).json({ error: 'Label ID is required' });
    }

    gmailService.setCredentials(tokens);
    const result = await gmailService.addLabelToMessage(messageId, labelId);

    res.json(result);
  } catch (error) {
    console.error('Error adding label to message:', error);
    res.status(500).json({ error: 'Failed to add label to message' });
  }
});

// Remove label from message
router.delete('/messages/:messageId/labels/:labelId', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const userTokens = req.app.locals.userTokens || {};
    const tokens = userTokens[userId];
    const { messageId, labelId } = req.params;

    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    gmailService.setCredentials(tokens);
    const result = await gmailService.removeLabelFromMessage(messageId, labelId);

    res.json(result);
  } catch (error) {
    console.error('Error removing label from message:', error);
    res.status(500).json({ error: 'Failed to remove label from message' });
  }
});

// Duplicate routes removed - already defined above

module.exports = router;
