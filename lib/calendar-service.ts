// Google Calendar service for availability and scheduling
const BACKEND_URL = 'https://gtogmail-production.up.railway.app/api';

export interface CalendarEvent {
  id: string
  summary: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
  }>
}

export interface AvailabilitySlot {
  start: string
  end: string
  duration: number // in minutes
}

export interface SchedulingPreferences {
  timezone: string
  workingHours: {
    start: string // "09:00"
    end: string   // "17:00"
  }
  workingDays: number[] // [1,2,3,4,5] for Mon-Fri
  meetingDuration: number // 30 minutes default
  bufferTime: number // 15 minutes between meetings
}

class CalendarService {
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const fullUrl = `${BACKEND_URL}${endpoint}`;
    
    console.log(`📅 Calendar API Request: ${options?.method || 'GET'} ${fullUrl}`);
    
    try {
      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        mode: 'cors',
        ...options,
      });

      console.log(`📅 Calendar API Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Calendar API Error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Calendar API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Calendar API Success:', data);
      return data;
    } catch (error) {
      console.error('❌ Calendar API Request Failed:', error);
      throw error;
    }
  }

  // Connect Google Calendar
  async connectCalendar(): Promise<{ authUrl: string }> {
    return this.makeRequest('/calendar/auth/url');
  }

  // Check calendar connection status
  async checkCalendarStatus(): Promise<{ connected: boolean; email?: string }> {
    return this.makeRequest('/calendar/auth/status');
  }

  // Get user's calendar events for a date range
  async getEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    return this.makeRequest(`/calendar/events?start=${startDate}&end=${endDate}`);
  }

  // Get available time slots for scheduling
  async getAvailability(
    date: string, 
    preferences: SchedulingPreferences
  ): Promise<AvailabilitySlot[]> {
    return this.makeRequest('/calendar/availability', {
      method: 'POST',
      body: JSON.stringify({ date, preferences })
    });
  }

  // Create a calendar event
  async createEvent(event: {
    summary: string
    description?: string
    start: string
    end: string
    attendeeEmails: string[]
    location?: string
  }): Promise<CalendarEvent> {
    return this.makeRequest('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(event)
    });
  }

  // Generate availability for next N days
  async getAvailabilityForDays(
    days: number, 
    preferences: SchedulingPreferences
  ): Promise<{ [date: string]: AvailabilitySlot[] }> {
    return this.makeRequest('/calendar/availability/range', {
      method: 'POST',
      body: JSON.stringify({ days, preferences })
    });
  }

  // Create a scheduling link
  async createSchedulingLink(preferences: SchedulingPreferences): Promise<{
    linkId: string
    url: string
    expiresAt: string
  }> {
    return this.makeRequest('/calendar/scheduling-link', {
      method: 'POST',
      body: JSON.stringify(preferences)
    });
  }

  // Helper: Check if user is free at a specific time
  async isAvailable(startTime: string, endTime: string): Promise<boolean> {
    try {
      const events = await this.getEvents(startTime, endTime);
      return events.length === 0;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  }

  // Helper: Suggest meeting times
  async suggestMeetingTimes(
    contactEmail: string,
    preferences: SchedulingPreferences,
    daysAhead: number = 7
  ): Promise<{
    suggestions: AvailabilitySlot[]
    message: string
  }> {
    try {
      const availability = await this.getAvailabilityForDays(daysAhead, preferences);
      
      // Get first 3 available slots
      const allSlots = Object.values(availability).flat();
      const suggestions = allSlots.slice(0, 3);

      const message = this.generateAvailabilityMessage(suggestions, contactEmail);

      return { suggestions, message };
    } catch (error) {
      console.error('Error suggesting meeting times:', error);
      throw error;
    }
  }

  private generateAvailabilityMessage(slots: AvailabilitySlot[], contactEmail: string): string {
    if (slots.length === 0) {
      return `Hi! I'd love to schedule a coffee chat with you. Unfortunately, I don't have any available slots in the next week. Could you let me know what works for you?`;
    }

    const formattedSlots = slots.map(slot => {
      const start = new Date(slot.start);
      const day = start.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      const time = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${day} at ${time}`;
    }).join(', ');

    return `Hi! I'd love to schedule a coffee chat with you. I have availability on: ${formattedSlots}. Let me know what works best for you!`;
  }
}

export const calendarService = new CalendarService();
