const express = require('express');
const { google } = require('googleapis');
const router = express.Router();

// Initialize Google Calendar API
let calendarService = null;

try {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    calendarService = {
      oauth2Client,
      calendar: google.calendar({ version: 'v3', auth: oauth2Client })
    };

    console.log('✅ Calendar service initialized');
  } else {
    console.log('⚠️ Calendar service not configured - missing Google credentials');
  }
} catch (error) {
  console.error('❌ Failed to initialize calendar service:', error);
}

// Get OAuth2 authorization URL for calendar access
router.get('/auth/url', (req, res) => {
  console.log('📅 GET /calendar/auth/url - Generating calendar auth URL...');

  try {
    if (!calendarService) {
      return res.status(500).json({
        error: 'Calendar service not configured',
        details: 'Google OAuth credentials not set'
      });
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    const authUrl = calendarService.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    console.log('✅ Calendar auth URL generated successfully');
    res.json({ authUrl });
  } catch (error) {
    console.error('❌ Error generating calendar auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL', details: error.message });
  }
});

// Handle OAuth2 callback
router.get('/auth/callback', async (req, res) => {
  console.log('📅 GET /calendar/auth/callback - Processing calendar auth callback...');

  try {
    if (!calendarService) {
      return res.status(500).json({ error: 'Calendar service not configured' });
    }

    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    // Exchange code for tokens
    const { tokens } = await calendarService.oauth2Client.getToken(code);
    calendarService.oauth2Client.setCredentials(tokens);

    // Store tokens (in production, save to database)
    global.calendarTokens = tokens;

    console.log('✅ Calendar authentication successful');

    // Redirect to frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}?calendar_connected=true`);
  } catch (error) {
    console.error('❌ Calendar auth callback error:', error);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

// Check calendar authentication status
router.get('/auth/status', async (req, res) => {
  console.log('📅 GET /calendar/auth/status - Checking calendar auth status...');

  try {
    if (!calendarService || !global.calendarTokens) {
      return res.json({ connected: false });
    }

    // Set credentials and test connection
    calendarService.oauth2Client.setCredentials(global.calendarTokens);

    // Try to get user info to verify connection
    const oauth2 = google.oauth2({ version: 'v2', auth: calendarService.oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Store user email for filtering
    global.userEmail = userInfo.data.email;

    res.json({
      connected: true,
      email: userInfo.data.email
    });
  } catch (error) {
    console.error('❌ Calendar auth status check failed:', error);
    res.json({ connected: false });
  }
});

// Get calendar events
router.get('/events', async (req, res) => {
  console.log('📅 GET /calendar/events - Fetching calendar events...');

  try {
    if (!calendarService || !global.calendarTokens) {
      return res.status(401).json({ error: 'Calendar not connected' });
    }

    calendarService.oauth2Client.setCredentials(global.calendarTokens);

    const { start, end } = req.query;

    const response = await calendarService.calendar.events.list({
      calendarId: 'primary',
      timeMin: start,
      timeMax: end,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250, // Get more events
      showDeleted: false,
    });

    const events = response.data.items || [];

    // Filter out declined events and add more details
    const filteredEvents = events.filter(event => {
      // Skip declined events
      if (event.attendees) {
        const userAttendee = event.attendees.find(attendee =>
          attendee.email === global.userEmail || attendee.self
        );
        if (userAttendee && userAttendee.responseStatus === 'declined') {
          return false;
        }
      }
      return true;
    });

    console.log(`✅ Retrieved ${filteredEvents.length} calendar events (${events.length} total, filtered declined)`);

    res.json(filteredEvents);
  } catch (error) {
    console.error('❌ Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch events', details: error.message });
  }
});

// Get availability for a specific date
router.post('/availability', async (req, res) => {
  console.log('📅 POST /calendar/availability - Calculating availability...');

  try {
    if (!calendarService || !global.calendarTokens) {
      return res.status(401).json({ error: 'Calendar not connected' });
    }

    calendarService.oauth2Client.setCredentials(global.calendarTokens);

    const { date, preferences } = req.body;

    // Get events for the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const response = await calendarService.calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    // Calculate available slots
    const availableSlots = calculateAvailableSlots(date, events, preferences);

    console.log(`✅ Found ${availableSlots.length} available slots`);
    res.json(availableSlots);
  } catch (error) {
    console.error('❌ Error calculating availability:', error);
    res.status(500).json({ error: 'Failed to calculate availability', details: error.message });
  }
});

// Create calendar event
router.post('/events', async (req, res) => {
  console.log('📅 POST /calendar/events - Creating calendar event...');

  try {
    if (!calendarService || !global.calendarTokens) {
      return res.status(401).json({ error: 'Calendar not connected' });
    }

    calendarService.oauth2Client.setCredentials(global.calendarTokens);

    const { summary, description, start, end, attendeeEmails, location } = req.body;

    const event = {
      summary,
      description,
      location,
      start: {
        dateTime: start,
        timeZone: 'America/New_York', // TODO: Make this configurable
      },
      end: {
        dateTime: end,
        timeZone: 'America/New_York',
      },
      attendees: attendeeEmails.map(email => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
    };

    const response = await calendarService.calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all',
    });

    console.log('✅ Calendar event created successfully');
    res.json(response.data);
  } catch (error) {
    console.error('❌ Error creating calendar event:', error);
    res.status(500).json({ error: 'Failed to create event', details: error.message });
  }
});

// Helper function to calculate available slots
function calculateAvailableSlots(date, events, preferences) {
  const slots = [];
  const targetDate = new Date(date);

  // Check if it's a working day
  if (!preferences.workingDays.includes(targetDate.getDay())) {
    return slots;
  }

  // Create working hours for the day
  const [startHour, startMinute] = preferences.workingHours.start.split(':').map(Number);
  const [endHour, endMinute] = preferences.workingHours.end.split(':').map(Number);

  const workStart = new Date(targetDate);
  workStart.setHours(startHour, startMinute, 0, 0);

  const workEnd = new Date(targetDate);
  workEnd.setHours(endHour, endMinute, 0, 0);

  // Get busy times from events
  const busyTimes = events
    .filter(event => event.start && event.end)
    .map(event => ({
      start: new Date(event.start.dateTime || event.start.date),
      end: new Date(event.end.dateTime || event.end.date)
    }))
    .sort((a, b) => a.start - b.start);

  // Find available slots
  let currentTime = new Date(workStart);

  for (const busyTime of busyTimes) {
    // If there's a gap before this busy time
    if (currentTime < busyTime.start) {
      const slotEnd = new Date(Math.min(busyTime.start, workEnd));
      const duration = (slotEnd - currentTime) / (1000 * 60); // minutes

      if (duration >= preferences.meetingDuration) {
        slots.push({
          start: currentTime.toISOString(),
          end: slotEnd.toISOString(),
          duration: Math.floor(duration)
        });
      }
    }

    // Move current time to end of busy period + buffer
    currentTime = new Date(busyTime.end.getTime() + preferences.bufferTime * 60 * 1000);
  }

  // Check for availability after last event
  if (currentTime < workEnd) {
    const duration = (workEnd - currentTime) / (1000 * 60);
    if (duration >= preferences.meetingDuration) {
      slots.push({
        start: currentTime.toISOString(),
        end: workEnd.toISOString(),
        duration: Math.floor(duration)
      });
    }
  }

  return slots;
}

module.exports = router;
