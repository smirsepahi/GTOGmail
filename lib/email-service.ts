import { gmailService } from './gmail-service';
import { outlookService } from './outlook-service';

export type EmailProvider = 'gmail' | 'outlook';

export interface UnifiedProfile {
  emailAddress: string;
  displayName?: string;
  provider: EmailProvider;
}

export interface UnifiedMessage {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  hasAttachments: boolean;
  provider: EmailProvider;
}

export interface UnifiedSendRequest {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

export interface UnifiedAuthResponse {
  authUrl: string;
  provider: EmailProvider;
}

export interface UnifiedDomainStats {
  timeframe: string;
  totalEmails: number;
  domainCounts: Record<string, number>;
  topDomains: Array<{ domain: string; count: number }>;
  provider: EmailProvider;
}

class EmailService {
  private currentProvider: EmailProvider | null = null;

  // Set the current email provider
  setProvider(provider: EmailProvider) {
    this.currentProvider = provider;
  }

  // Get the current provider
  getCurrentProvider(): EmailProvider | null {
    return this.currentProvider;
  }

  // Get the service instance for the current provider
  private getService() {
    if (!this.currentProvider) {
      throw new Error('No email provider selected');
    }
    
    switch (this.currentProvider) {
      case 'gmail':
        return gmailService;
      case 'outlook':
        return outlookService;
      default:
        throw new Error(`Unsupported provider: ${this.currentProvider}`);
    }
  }

  // Get OAuth2 authorization URL
  async getAuthUrl(provider: EmailProvider): Promise<UnifiedAuthResponse> {
    const service = provider === 'gmail' ? gmailService : outlookService;
    const response = await service.getAuthUrl();
    return {
      authUrl: response.authUrl,
      provider
    };
  }

  // Check authentication status for a specific provider
  async checkAuthStatus(provider: EmailProvider): Promise<{ authenticated: boolean; userId: string; provider: EmailProvider }> {
    const service = provider === 'gmail' ? gmailService : outlookService;
    const response = await service.checkAuthStatus();
    return {
      ...response,
      provider
    };
  }

  // Check authentication status for current provider
  async checkCurrentAuthStatus(): Promise<{ authenticated: boolean; userId: string; provider: EmailProvider }> {
    if (!this.currentProvider) {
      throw new Error('No provider selected');
    }
    return this.checkAuthStatus(this.currentProvider);
  }

  // Get user profile
  async getProfile(): Promise<UnifiedProfile> {
    const service = this.getService();
    const profile = await service.getProfile();
    
    return {
      emailAddress: profile.emailAddress,
      displayName: 'displayName' in profile ? profile.displayName : undefined,
      provider: this.currentProvider!
    };
  }

  // Get emails from inbox
  async getEmails(maxResults: number = 20, query: string = ''): Promise<UnifiedMessage[]> {
    const service = this.getService();
    const emails = await service.getEmails(maxResults, query);
    
    return emails.map(email => ({
      ...email,
      provider: this.currentProvider!
    }));
  }

  // Get email details
  async getEmailDetails(messageId: string): Promise<UnifiedMessage> {
    const service = this.getService();
    const email = await service.getEmailDetails(messageId);
    
    return {
      ...email,
      provider: this.currentProvider!
    };
  }

  // Send email
  async sendEmail(request: UnifiedSendRequest): Promise<{ message: string; messageId: string; provider: EmailProvider }> {
    const service = this.getService();
    const response = await service.sendEmail(request);
    
    return {
      ...response,
      provider: this.currentProvider!
    };
  }

  // Search emails
  async searchEmails(query: string, maxResults: number = 20): Promise<UnifiedMessage[]> {
    const service = this.getService();
    const emails = await service.searchEmails(query, maxResults);
    
    return emails.map(email => ({
      ...email,
      provider: this.currentProvider!
    }));
  }

  // Logout from current provider
  async logout(): Promise<{ message: string; provider: EmailProvider }> {
    const service = this.getService();
    const response = await service.logout();
    
    const provider = this.currentProvider!;
    this.currentProvider = null;
    
    return {
      ...response,
      provider
    };
  }

  // Get domain statistics
  async getDomainStats(timeframe: 'today' | 'week' = 'week'): Promise<UnifiedDomainStats> {
    const service = this.getService();
    const stats = await service.getDomainStats(timeframe);
    
    return {
      ...stats,
      provider: this.currentProvider!
    };
  }

  // Get available providers
  getAvailableProviders(): EmailProvider[] {
    return ['gmail', 'outlook'];
  }

  // Check if a provider is connected
  async isProviderConnected(provider: EmailProvider): Promise<boolean> {
    try {
      const status = await this.checkAuthStatus(provider);
      return status.authenticated;
    } catch (error) {
      return false;
    }
  }

  // Get all connected providers
  async getConnectedProviders(): Promise<EmailProvider[]> {
    const providers = this.getAvailableProviders();
    const connected: EmailProvider[] = [];
    
    for (const provider of providers) {
      if (await this.isProviderConnected(provider)) {
        connected.push(provider);
      }
    }
    
    return connected;
  }
}

export const emailService = new EmailService();
