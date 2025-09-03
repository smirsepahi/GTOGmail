// Temporary hardcode for debugging - REMOVE AFTER FIXING
const BACKEND_URL = 'https://gtogmail-production.up.railway.app/api';
// const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

// Debug logging
console.log('🔧 Outlook Service Configuration:');
console.log('- BACKEND_URL:', BACKEND_URL);
console.log('- Environment:', process.env.NODE_ENV);
console.log('- NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);

export interface OutlookAuthResponse {
  authUrl: string;
}

export interface OutlookProfile {
  emailAddress: string;
  displayName: string;
  id: string;
}

export interface OutlookMessage {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
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

class OutlookService {
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Outlook API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get OAuth2 authorization URL
  async getAuthUrl(): Promise<OutlookAuthResponse> {
    return this.makeRequest<OutlookAuthResponse>('/outlook/auth/url');
  }

  // Check authentication status
  async checkAuthStatus(): Promise<{ authenticated: boolean; userId: string }> {
    return this.makeRequest<{ authenticated: boolean; userId: string }>('/outlook/auth/status');
  }

  // Get user profile
  async getProfile(): Promise<OutlookProfile> {
    return this.makeRequest<OutlookProfile>('/outlook/profile');
  }

  // Get emails from inbox
  async getEmails(maxResults: number = 20, query: string = ''): Promise<OutlookMessage[]> {
    const params = new URLSearchParams();
    if (maxResults) params.append('maxResults', maxResults.toString());
    if (query) params.append('query', query);

    return this.makeRequest<OutlookMessage[]>(`/outlook/emails?${params.toString()}`);
  }

  // Get email details
  async getEmailDetails(messageId: string): Promise<OutlookMessage> {
    return this.makeRequest<OutlookMessage>(`/outlook/emails/${messageId}`);
  }

  // Send email
  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    return this.makeRequest<SendEmailResponse>('/outlook/send', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Search emails
  async searchEmails(query: string, maxResults: number = 20): Promise<OutlookMessage[]> {
    const params = new URLSearchParams();
    params.append('query', query);
    if (maxResults) params.append('maxResults', maxResults.toString());

    return this.makeRequest<OutlookMessage[]>(`/outlook/search?${params.toString()}`);
  }

  // Logout
  async logout(): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>('/outlook/auth/logout', {
      method: 'POST',
    });
  }

  // Get email statistics by domain
  async getDomainStats(timeframe: 'today' | 'week' = 'week'): Promise<DomainStats> {
    const params = new URLSearchParams();
    params.append('timeframe', timeframe);

    return this.makeRequest<DomainStats>(`/outlook/stats/domains?${params.toString()}`);
  }
}

export const outlookService = new OutlookService();
