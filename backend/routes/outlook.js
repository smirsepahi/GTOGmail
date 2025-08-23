const express = require('express');
const router = express.Router();
const OutlookService = require('../services/outlookService');

// Initialize Outlook service
const outlookService = new OutlookService();

// Store tokens in memory (in production, use a database)
let userTokens = {};

// Get OAuth2 authorization URL
router.get('/auth/url', async (req, res) => {
  try {
    console.log('Outlook auth URL requested');
    const authResponse = await outlookService.getAuthUrl();
    console.log('Outlook service returned:', authResponse);
    res.json(authResponse);
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

    const tokens = await outlookService.getTokensFromCode(code);

    // Store tokens (in production, save to database)
    const userId = 'default'; // You can implement user management
    userTokens[userId] = tokens;

    // Set credentials for future requests
    outlookService.setCredentials(tokens);

    res.json({
      message: 'Authentication successful',
      userId: userId
    });
  } catch (error) {
    console.error('Error in auth callback:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Check authentication status
router.get('/auth/status', (req, res) => {
  try {
    const userId = req.query.userId || 'default';
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
    delete userTokens[userId];

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const tokens = userTokens[userId];

    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    outlookService.setCredentials(tokens);
    const profile = await outlookService.getUserProfile();

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
    const tokens = userTokens[userId];
    const maxResults = parseInt(req.query.maxResults) || 20;
    const query = req.query.query || '';

    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    outlookService.setCredentials(tokens);
    const emails = await outlookService.getEmails(maxResults, query);

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
    const tokens = userTokens[userId];
    const { messageId } = req.params;

    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    outlookService.setCredentials(tokens);
    const email = await outlookService.getEmailDetails(messageId);

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
    const tokens = userTokens[userId];
    const { to, subject, body, isHtml = false } = req.body;

    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'To, subject, and body are required' });
    }

    outlookService.setCredentials(tokens);
    const result = await outlookService.sendEmail(to, subject, body, isHtml);

    res.json({
      message: 'Email sent successfully',
      messageId: result.id
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Search emails
router.get('/search', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const tokens = userTokens[userId];
    const query = req.query.query || '';
    const maxResults = parseInt(req.query.maxResults) || 20;

    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    outlookService.setCredentials(tokens);
    const emails = await outlookService.searchEmails(query, maxResults);

    res.json(emails);
  } catch (error) {
    console.error('Error searching emails:', error);
    res.status(500).json({ error: 'Failed to search emails' });
  }
});

// Get domain statistics
router.get('/stats/domains', async (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const tokens = userTokens[userId];
    const timeframe = req.query.timeframe || 'week';

    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    outlookService.setCredentials(tokens);
    const stats = await outlookService.getDomainStats(timeframe);

    res.json(stats);
  } catch (error) {
    console.error('Error getting domain stats:', error);
    res.status(500).json({ error: 'Failed to get domain statistics' });
  }
});

module.exports = router;
