// Temporary hardcode for debugging - REMOVE AFTER FIXING
const BACKEND_URL = 'https://gtogmail-production.up.railway.app/api';
// const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

// Debug logging
console.log('🔧 Gmail Service Configuration:');
console.log('- BACKEND_URL:', BACKEND_URL);
console.log('- Environment:', process.env.NODE_ENV);
console.log('- NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);

export interface GmailAuthResponse {
  authUrl: string;
}

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  hasAttachments: boolean;
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

export interface SendEmailResponse {
  message: string;
  messageId: string;
}

export interface DomainStats {
  timeframe: string;
  totalEmails: number;
  domainCounts: Record<string, number>;
  topDomains: Array<{ domain: string; count: number }>;
}

class GmailService {
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get OAuth2 authorization URL
  async getAuthUrl(): Promise<GmailAuthResponse> {
    return this.makeRequest<GmailAuthResponse>('/gmail/auth/url');
  }

  // Check authentication status
  async checkAuthStatus(): Promise<{ authenticated: boolean; userId: string }> {
    return this.makeRequest<{ authenticated: boolean; userId: string }>('/gmail/auth/status');
  }

  // Get user profile
  async getProfile(): Promise<GmailProfile> {
    return this.makeRequest<GmailProfile>('/gmail/profile');
  }

  // Get emails from inbox
  async getEmails(maxResults: number = 20, query: string = ''): Promise<GmailMessage[]> {
    const params = new URLSearchParams();
    if (maxResults) params.append('maxResults', maxResults.toString());
    if (query) params.append('query', query);

    return this.makeRequest<GmailMessage[]>(`/gmail/emails?${params.toString()}`);
  }

  // Get email details
  async getEmailDetails(messageId: string): Promise<GmailMessage> {
    return this.makeRequest<GmailMessage>(`/gmail/emails/${messageId}`);
  }

  // Send email
  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    return this.makeRequest<SendEmailResponse>('/gmail/send', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Search emails
  async searchEmails(query: string, maxResults: number = 20): Promise<GmailMessage[]> {
    const params = new URLSearchParams();
    params.append('query', query);
    if (maxResults) params.append('maxResults', maxResults.toString());

    return this.makeRequest<GmailMessage[]>(`/gmail/search?${params.toString()}`);
  }

  // Get labels
  async getLabels(): Promise<any[]> {
    return this.makeRequest<any[]>('/gmail/labels');
  }

  // Logout
  async logout(): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>('/gmail/auth/logout', {
      method: 'POST',
    });
  }

  // Get email statistics by domain
  async getDomainStats(timeframe: 'today' | 'week' = 'week'): Promise<DomainStats> {
    const params = new URLSearchParams();
    params.append('timeframe', timeframe);

    return this.makeRequest<DomainStats>(`/gmail/stats/domains?${params.toString()}`);
  }
}

export const gmailService = new GmailService();
