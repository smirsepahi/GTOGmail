# 🚀 Fresh Gmail API Setup Guide

## Step 1: Google Cloud Console Setup (COMPLETED ABOVE)

## Step 2: Update Backend Environment Variables

### Local Environment (.env file):
```bash
# Replace with your NEW credentials from Google Cloud Console
GOOGLE_CLIENT_ID=your_new_client_id_here
GOOGLE_CLIENT_SECRET=your_new_client_secret_here
GOOGLE_REDIRECT_URI=https://gtogmail-production.up.railway.app/api/gmail/auth/callback

# Other settings
FRONTEND_URL=https://gto-gmail.vercel.app
PORT=3002
```

### Railway Environment Variables:
Go to Railway dashboard → Your project → Variables tab → Add:
```
GOOGLE_CLIENT_ID=your_new_client_id_here
GOOGLE_CLIENT_SECRET=your_new_client_secret_here
GOOGLE_REDIRECT_URI=https://gtogmail-production.up.railway.app/api/gmail/auth/callback
FRONTEND_URL=https://gto-gmail.vercel.app
PORT=8080
```

## Step 3: Test the Setup

### Test Backend Locally:
```bash
cd backend
npm start
```

Then test: http://localhost:3002/api/gmail/auth/url

### Test Production:
After setting Railway variables, test: https://gtogmail-production.up.railway.app/api/gmail/auth/url

## Step 4: Verify OAuth Flow

1. Click "Connect to Gmail" on your website
2. Should redirect to Google OAuth
3. After authorization, should redirect back to your app
4. Should show "Connected" status

## Common Issues & Solutions:

### "Gmail service not configured"
- Check Railway environment variables are set correctly
- Restart Railway deployment

### "redirect_uri_mismatch"
- Verify redirect URIs in Google Cloud Console match exactly
- Check for trailing slashes or http vs https

### "invalid_client"
- Double-check Client ID and Secret are correct
- Make sure you're using the NEW credentials

## Testing Commands:

```bash
# Test health endpoint
curl https://gtogmail-production.up.railway.app/health

# Test Gmail auth URL (should return JSON with authUrl)
curl https://gtogmail-production.up.railway.app/api/gmail/auth/url

# Test Gmail auth status (should return authenticated: false initially)
curl https://gtogmail-production.up.railway.app/api/gmail/auth/status
```

## Success Indicators:

✅ Gmail auth URL returns proper Google OAuth URL
✅ No "service not configured" errors
✅ OAuth flow completes successfully
✅ Can send/receive emails through the app
