# Gmail API Setup Guide

## Prerequisites
1. Google Cloud Console account
2. Gmail API enabled
3. OAuth2 credentials created

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Google Cloud OAuth2 Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/gmail/auth/callback

# Server Configuration
PORT=3001
```

## Google Cloud Setup Steps

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for the project

### 2. Enable Gmail API
1. Go to "APIs & Services" > "Library"
2. Search for "Gmail API"
3. Click on it and press "Enable"

### 3. Create OAuth2 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application" as the application type
4. Add authorized redirect URIs:
   - `http://localhost:3001/api/gmail/auth/callback`
   - `http://localhost:3000/api/gmail/auth/callback` (for frontend)
5. Copy the Client ID and Client Secret

### 4. Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "GTOGmail"
   - User support email: your email
   - Developer contact information: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/gmail.compose`
5. Add test users (your Gmail address)

## API Endpoints

### Authentication
- `GET /api/gmail/auth/url` - Get OAuth2 authorization URL
- `GET /api/gmail/auth/callback` - Handle OAuth2 callback
- `GET /api/gmail/auth/status` - Check authentication status
- `POST /api/gmail/auth/logout` - Logout and clear tokens

### Email Operations
- `GET /api/gmail/profile` - Get user profile
- `GET /api/gmail/emails` - Get emails from inbox
- `GET /api/gmail/emails/:messageId` - Get email details
- `POST /api/gmail/send` - Send email
- `GET /api/gmail/search` - Search emails
- `GET /api/gmail/threads/:threadId` - Get email thread

### Labels
- `GET /api/gmail/labels` - Get all labels
- `POST /api/gmail/labels` - Create new label
- `POST /api/gmail/messages/:messageId/labels` - Add label to message
- `DELETE /api/gmail/messages/:messageId/labels/:labelId` - Remove label from message

## Usage Example

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Get authorization URL:
   ```bash
   curl http://localhost:3001/api/gmail/auth/url
   ```

3. Open the returned URL in your browser and authorize the application

4. The callback will handle the token exchange automatically

5. Now you can use the other endpoints to interact with Gmail

## Frontend Integration

The frontend can call these endpoints to:
- Authenticate users with Gmail
- Display emails in the Inbox tab
- Send emails through the Composer tab
- Search and filter emails
- Manage labels and categories

## Security Notes

- In production, store tokens in a secure database, not in memory
- Implement proper user management and session handling
- Use HTTPS in production
- Regularly rotate OAuth2 credentials
- Implement rate limiting for API calls 