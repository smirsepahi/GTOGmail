const express = require('express');
const router = express.Router();

// Debug endpoint to check environment variables
router.get('/env', (req, res) => {
  console.log('🔍 Debug: Environment variables check');
  
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    PORT: process.env.PORT || 'not set',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET (length: ' + process.env.GOOGLE_CLIENT_ID.length + ')' : 'NOT SET',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET (length: ' + process.env.GOOGLE_CLIENT_SECRET.length + ')' : 'NOT SET',
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'NOT SET',
    FRONTEND_URL: process.env.FRONTEND_URL || 'NOT SET',
    MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID ? 'SET' : 'NOT SET',
    MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET ? 'SET' : 'NOT SET',
    MICROSOFT_REDIRECT_URI: process.env.MICROSOFT_REDIRECT_URI || 'NOT SET'
  };
  
  console.log('Environment check result:', envCheck);
  
  res.json({
    message: 'Environment variables check',
    environment: envCheck,
    timestamp: new Date().toISOString(),
    platform: process.platform,
    nodeVersion: process.version
  });
});

module.exports = router;
