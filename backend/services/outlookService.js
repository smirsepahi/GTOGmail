const { ConfidentialClientApplication } = require('@azure/msal-node');
const { Client } = require('@microsoft/microsoft-graph-client');

class OutlookService {
  constructor() {
    this.clientConfig = {
      auth: {
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        authority: 'https://login.microsoftonline.com/common'
      }
    };

    this.redirectUri = process.env.MICROSOFT_REDIRECT_URI;
    this.scopes = [
      'https://graph.microsoft.com/Mail.Read',
      'https://graph.microsoft.com/Mail.Send',
      'https://graph.microsoft.com/Mail.ReadWrite',
      'https://graph.microsoft.com/User.Read'
    ];

    // Only initialize MSAL client if credentials are provided
    if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
      this.msalClient = new ConfidentialClientApplication(this.clientConfig);
    } else {
      console.warn('Microsoft credentials not provided. Outlook service will not be available.');
      this.msalClient = null;
    }

    this.graphClient = null; // Initialize as null, will be set when credentials are provided
  }

  // Generate OAuth2 authorization URL
  async getAuthUrl() {
    try {
      if (!this.msalClient) {
        throw new Error('Microsoft credentials not configured');
      }

      const authCodeUrlParameters = {
        scopes: this.scopes,
        redirectUri: this.redirectUri,
      };

      const authUrl = await this.msalClient.getAuthCodeUrl(authCodeUrlParameters);
      return { authUrl };
    } catch (error) {
      console.error('Error generating auth URL:', error);
      throw error;
    }
  }

  // Exchange authorization code for tokens
  async getTokensFromCode(code) {
    try {
      if (!this.msalClient) {
        throw new Error('Microsoft credentials not configured');
      }

      const tokenRequest = {
        code: code,
        scopes: this.scopes,
        redirectUri: this.redirectUri,
      };

      const response = await this.msalClient.acquireTokenByCode(tokenRequest);
      return response;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  }

  // Set credentials for API calls
  setCredentials(tokens) {
    this.accessToken = tokens.accessToken;

    // Create custom authentication provider
    const authProvider = {
      getAccessToken: async () => {
        return this.accessToken;
      }
    };

    try {
      this.graphClient = Client.init({
        authProvider: authProvider
      });
    } catch (error) {
      console.error('Error initializing Graph client:', error);
      throw error;
    }
  }

  // Get user profile
  async getUserProfile() {
    try {
      const user = await this.graphClient.me.get();
      const mailboxSettings = await this.graphClient.me.mailboxSettings.get();

      return {
        emailAddress: user.mail || user.userPrincipalName,
        displayName: user.displayName,
        id: user.id
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Get emails from inbox
  async getEmails(maxResults = 20, query = '') {
    try {
      let requestUrl = this.graphClient.me.messages;

      if (query) {
        requestUrl = requestUrl.filter(query);
      }

      const messages = await requestUrl
        .top(maxResults)
        .orderby('receivedDateTime desc')
        .select(['id', 'subject', 'from', 'toRecipients', 'receivedDateTime', 'bodyPreview', 'hasAttachments'])
        .get();

      return messages.value.map(message => ({
        id: message.id,
        subject: message.subject || '(No Subject)',
        from: message.from?.emailAddress?.address || 'Unknown',
        to: message.toRecipients?.map(r => r.emailAddress.address).join(', ') || '',
        date: message.receivedDateTime,
        snippet: message.bodyPreview || '',
        hasAttachments: message.hasAttachments || false
      }));
    } catch (error) {
      console.error('Error getting emails:', error);
      throw error;
    }
  }

  // Get email details
  async getEmailDetails(messageId) {
    try {
      const message = await this.graphClient.me.messages(messageId)
        .select(['id', 'subject', 'from', 'toRecipients', 'receivedDateTime', 'body', 'hasAttachments'])
        .get();

      return {
        id: message.id,
        subject: message.subject || '(No Subject)',
        from: message.from?.emailAddress?.address || 'Unknown',
        to: message.toRecipients?.map(r => r.emailAddress.address).join(', ') || '',
        date: message.receivedDateTime,
        body: message.body?.content || '',
        hasAttachments: message.hasAttachments || false
      };
    } catch (error) {
      console.error('Error getting email details:', error);
      throw error;
    }
  }

  // Send email
  async sendEmail(to, subject, body, isHtml = false) {
    try {
      const message = {
        subject: subject,
        body: {
          contentType: isHtml ? 'html' : 'text',
          content: body
        },
        toRecipients: [
          {
            emailAddress: {
              address: to
            }
          }
        ]
      };

      const result = await this.graphClient.me.sendMail({
        message: message
      }).post();

      return { id: 'sent' }; // Microsoft Graph doesn't return message ID for sent emails
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  // Search emails
  async searchEmails(query, maxResults = 20) {
    try {
      const messages = await this.graphClient.me.messages
        .search(query)
        .top(maxResults)
        .select(['id', 'subject', 'from', 'toRecipients', 'receivedDateTime', 'bodyPreview', 'hasAttachments'])
        .get();

      return messages.value.map(message => ({
        id: message.id,
        subject: message.subject || '(No Subject)',
        from: message.from?.emailAddress?.address || 'Unknown',
        to: message.toRecipients?.map(r => r.emailAddress.address).join(', ') || '',
        date: message.receivedDateTime,
        snippet: message.bodyPreview || '',
        hasAttachments: message.hasAttachments || false
      }));
    } catch (error) {
      console.error('Error searching emails:', error);
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
        afterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const afterDateString = afterDate.toISOString();

      // Get emails from the specified timeframe
      const messages = await this.graphClient.me.messages
        .filter(`receivedDateTime ge ${afterDateString}`)
        .top(500)
        .select(['from', 'toRecipients'])
        .get();

      const domainCounts = {};
      let totalEmails = 0;

      // Process each message to extract domain information
      messages.value.forEach(message => {
        const extractDomain = (email) => {
          const match = email.match(/@([^>\s]+)/);
          return match ? match[1].toLowerCase() : null;
        };

        if (message.from?.emailAddress?.address) {
          const domain = extractDomain(message.from.emailAddress.address);
          if (domain) {
            domainCounts[domain] = (domainCounts[domain] || 0) + 1;
            totalEmails++;
          }
        }

        if (message.toRecipients) {
          message.toRecipients.forEach(recipient => {
            if (recipient.emailAddress?.address) {
              const domain = extractDomain(recipient.emailAddress.address);
              if (domain) {
                domainCounts[domain] = (domainCounts[domain] || 0) + 1;
              }
            }
          });
        }
      });

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

module.exports = OutlookService;
