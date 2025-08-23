const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

export interface Company {
  id: string;
  name: string;
  domain: string;
  color: string;
  dailyGoal: number;
  weeklyGoal: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CompanyStats {
  companyId: string;
  companyName: string;
  domain: string;
  timeframe: string;
  dailyGoal: number;
  weeklyGoal: number;
  todayCount: number;
  weekCount: number;
  progress: {
    daily: number;
    weekly: number;
  };
}

export interface CompanyWithStats extends Company {
  stats: {
    todayCount: number;
    weekCount: number;
    progress: {
      daily: number;
      weekly: number;
    };
  };
}

export interface CreateCompanyRequest {
  name: string;
  domain: string;
  color?: string;
  dailyGoal?: number;
  weeklyGoal?: number;
}

export interface UpdateCompanyRequest {
  name?: string;
  domain?: string;
  color?: string;
  dailyGoal?: number;
  weeklyGoal?: number;
}

class CompaniesService {
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Companies API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get all companies
  async getCompanies(): Promise<Company[]> {
    return this.makeRequest<Company[]>('/companies');
  }

  // Get company by ID
  async getCompany(id: string): Promise<Company> {
    return this.makeRequest<Company>(`/companies/${id}`);
  }

  // Create new company
  async createCompany(company: CreateCompanyRequest): Promise<Company> {
    return this.makeRequest<Company>('/companies', {
      method: 'POST',
      body: JSON.stringify(company),
    });
  }

  // Update company
  async updateCompany(id: string, updates: UpdateCompanyRequest): Promise<Company> {
    return this.makeRequest<Company>(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Delete company
  async deleteCompany(id: string): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(`/companies/${id}`, {
      method: 'DELETE',
    });
  }

  // Get company statistics
  async getCompanyStats(id: string, timeframe: 'today' | 'week' = 'week'): Promise<CompanyStats> {
    const params = new URLSearchParams();
    params.append('timeframe', timeframe);

    return this.makeRequest<CompanyStats>(`/companies/${id}/stats?${params.toString()}`);
  }

  // Get all companies with their statistics
  async getCompaniesWithStats(timeframe: 'today' | 'week' = 'week'): Promise<CompanyWithStats[]> {
    const params = new URLSearchParams();
    params.append('timeframe', timeframe);

    return this.makeRequest<CompanyWithStats[]>(`/companies/stats/summary?${params.toString()}`);
  }

  // Get available color options for companies
  getColorOptions(): Array<{ value: string; label: string; preview: string }> {
    return [
      { value: 'bg-blue-100 text-blue-800', label: 'Blue', preview: 'bg-blue-100' },
      { value: 'bg-green-100 text-green-800', label: 'Green', preview: 'bg-green-100' },
      { value: 'bg-purple-100 text-purple-800', label: 'Purple', preview: 'bg-purple-100' },
      { value: 'bg-red-100 text-red-800', label: 'Red', preview: 'bg-red-100' },
      { value: 'bg-yellow-100 text-yellow-800', label: 'Yellow', preview: 'bg-yellow-100' },
      { value: 'bg-indigo-100 text-indigo-800', label: 'Indigo', preview: 'bg-indigo-100' },
      { value: 'bg-pink-100 text-pink-800', label: 'Pink', preview: 'bg-pink-100' },
      { value: 'bg-orange-100 text-orange-800', label: 'Orange', preview: 'bg-orange-100' },
      { value: 'bg-teal-100 text-teal-800', label: 'Teal', preview: 'bg-teal-100' },
      { value: 'bg-gray-100 text-gray-800', label: 'Gray', preview: 'bg-gray-100' },
    ];
  }

  // Validate domain format
  validateDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  }

  // Extract domain from email address
  extractDomainFromEmail(email: string): string | null {
    const match = email.match(/@([^>\s]+)/);
    return match ? match[1].toLowerCase() : null;
  }

  // Check if email belongs to any tracked company
  getCompanyByEmail(email: string, companies: Company[]): Company | null {
    const domain = this.extractDomainFromEmail(email);
    if (!domain) return null;

    return companies.find(company => company.domain.toLowerCase() === domain) || null;
  }

  // Calculate progress percentage
  calculateProgress(current: number, goal: number): number {
    if (goal === 0) return 0;
    return Math.min(Math.round((current / goal) * 100), 100);
  }

  // Get progress status
  getProgressStatus(current: number, goal: number): 'low' | 'medium' | 'high' | 'complete' {
    const percentage = this.calculateProgress(current, goal);

    if (percentage >= 100) return 'complete';
    if (percentage >= 75) return 'high';
    if (percentage >= 50) return 'medium';
    return 'low';
  }

  // Get progress color based on status
  getProgressColor(status: 'low' | 'medium' | 'high' | 'complete'): string {
    switch (status) {
      case 'complete': return 'bg-green-500';
      case 'high': return 'bg-blue-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }
}

export const companiesService = new CompaniesService();
