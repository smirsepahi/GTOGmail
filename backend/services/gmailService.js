const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

class GmailService {
  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  // Generate OAuth2 authorization URL
  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.compose'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  // Exchange authorization code for tokens
  async getTokensFromCode(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw error;
    }
  }

  // Set credentials from stored tokens
  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  // Get user profile
  async getUserProfile() {
    try {
      const response = await this.gmail.users.getProfile({
        userId: 'me'
      });
      return response.data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Get emails from inbox
  async getEmails(maxResults = 20, query = '') {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults: maxResults,
        q: query || 'in:inbox'
      });

      const messages = response.data.messages || [];
      const detailedMessages = await Promise.all(
        messages.map(async (message) => {
          return await this.getEmailDetails(message.id);
        })
      );

      return detailedMessages;
    } catch (error) {
      console.error('Error getting emails:', error);
      throw error;
    }
  }

  // Get detailed email information
  async getEmailDetails(messageId) {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const message = response.data;
      const headers = message.payload.headers;

      return {
        id: message.id,
        threadId: message.threadId,
        labelIds: message.labelIds,
        snippet: message.snippet,
        internalDate: message.internalDate,
        subject: this.getHeaderValue(headers, 'Subject'),
        from: this.getHeaderValue(headers, 'From'),
        to: this.getHeaderValue(headers, 'To'),
        date: this.getHeaderValue(headers, 'Date'),
        hasAttachments: this.hasAttachments(message.payload)
      };
    } catch (error) {
      console.error('Error getting email details:', error);
      throw error;
    }
  }

  // Send email
  async sendEmail(to, subject, body, isHtml = false) {
    try {
      const message = this.createMessage(to, subject, body, isHtml);

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  // Create email message in base64 format
  createMessage(to, subject, body, isHtml = false) {
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=utf-8`,
      '',
      body
    ].join('\n');

    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  // Get header value from email headers
  getHeaderValue(headers, name) {
    const header = headers.find(h => h.name === name);
    return header ? header.value : '';
  }

  // Check if email has attachments
  hasAttachments(payload) {
    if (payload.parts) {
      return payload.parts.some(part => part.filename && part.filename.length > 0);
    }
    return payload.filename && payload.filename.length > 0;
  }

  // Get email thread
  async getThread(threadId) {
    try {
      const response = await this.gmail.users.threads.get({
        userId: 'me',
        id: threadId
      });

      return response.data;
    } catch (error) {
      console.error('Error getting thread:', error);
      throw error;
    }
  }

  // Search emails
  async searchEmails(query, maxResults = 20) {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults: maxResults,
        q: query
      });

      const messages = response.data.messages || [];
      const detailedMessages = await Promise.all(
        messages.map(async (message) => {
          return await this.getEmailDetails(message.id);
        })
      );

      return detailedMessages;
    } catch (error) {
      console.error('Error searching emails:', error);
      throw error;
    }
  }

  // Get labels
  async getLabels() {
    try {
      const response = await this.gmail.users.labels.list({
        userId: 'me'
      });

      return response.data.labels;
    } catch (error) {
      console.error('Error getting labels:', error);
      throw error;
    }
  }

  // Create label
  async createLabel(name, backgroundColor = '#4285f4') {
    try {
      const response = await this.gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name: name,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
          backgroundColor: backgroundColor
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error creating label:', error);
      throw error;
    }
  }

  // Add label to message
  async addLabelToMessage(messageId, labelId) {
    try {
      const response = await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [labelId]
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error adding label to message:', error);
      throw error;
    }
  }

  // Remove label from message
  async removeLabelFromMessage(messageId, labelId) {
    try {
      const response = await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: [labelId]
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error removing label from message:', error);
      throw error;
    }
  }

  // Get domain statistics
  async getDomainStats(timeframe = 'week') {
    try {
      // Calculate date range based on timeframe
      const now = new Date();
      let afterDate;

      if (timeframe === 'today') {
        afterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (timeframe === 'week') {
        afterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else {
        afterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to month
      }

      const afterDateString = Math.floor(afterDate.getTime() / 1000);

      // Search for emails in the specified timeframe
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: `after:${afterDateString}`,
        maxResults: 500 // Limit to avoid rate limits
      });

      const messages = response.data.messages || [];
      const domainCounts = {};
      let totalEmails = 0;

      // Process each message to extract domain information
      for (const message of messages) {
        try {
          const messageDetails = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'metadata',
            metadataHeaders: ['From', 'To']
          });

          const headers = messageDetails.data.payload.headers;
          const fromHeader = headers.find(h => h.name === 'From');
          const toHeader = headers.find(h => h.name === 'To');

          // Extract domains from From and To headers
          const extractDomain = (email) => {
            const match = email.match(/@([^>\s]+)/);
            return match ? match[1].toLowerCase() : null;
          };

          if (fromHeader) {
            const domain = extractDomain(fromHeader.value);
            if (domain) {
              domainCounts[domain] = (domainCounts[domain] || 0) + 1;
              totalEmails++;
            }
          }

          if (toHeader) {
            const domain = extractDomain(toHeader.value);
            if (domain) {
              domainCounts[domain] = (domainCounts[domain] || 0) + 1;
            }
          }
        } catch (error) {
          console.error('Error processing message:', message.id, error);
          // Continue processing other messages
        }
      }

      // Sort domains by count
      const topDomains = Object.entries(domainCounts)
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        timeframe,
        totalEmails,
        domainCounts,
        topDomains
      };
    } catch (error) {
      console.error('Error getting domain stats:', error);
      throw error;
    }
  }
}

module.exports = GmailService;