# 🚀 Deployment Guide

## Quick Deployment Steps

### 1. Deploy Backend to Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy Backend**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Choose the `backend` folder
   - Railway will auto-detect Node.js and deploy

3. **Set Environment Variables**
   - In Railway dashboard, go to your project
   - Click "Variables" tab
   - Add these variables:
     ```
     GOOGLE_CLIENT_ID=your_google_client_id
     GOOGLE_CLIENT_SECRET=your_google_client_secret
     FRONTEND_URL=https://your-domain.com
     ```

4. **Get Backend URL**
   - Copy the Railway app URL (e.g., `https://your-app.railway.app`)

### 2. Deploy Frontend to Vercel

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Deploy Frontend**
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Set Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend.railway.app
     ```

4. **Deploy**
   - Click "Deploy"
   - Get your Vercel URL

### 3. Connect Your GoDaddy Domain

1. **In Vercel Dashboard**
   - Go to your project → Settings → Domains
   - Add your domain (e.g., `yoursite.com`)

2. **In GoDaddy DNS Settings**
   - Add CNAME record: `www` → `your-app.vercel.app`
   - Add A record: `@` → `76.76.19.61` (Vercel IP)

3. **Update Environment Variables**
   - Update `FRONTEND_URL` in Railway to your custom domain

## 🔧 Google API Setup

1. **Google Cloud Console**
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Create new project or select existing
   - Enable Gmail API

2. **Create OAuth Credentials**
   - Go to APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Add authorized origins:
     - `https://your-domain.com`
     - `https://your-backend.railway.app`

3. **Add to Environment Variables**
   - Copy Client ID and Secret to Railway and Vercel

## ✅ Verification

- Backend health: `https://your-backend.railway.app/health`
- Frontend: `https://your-domain.com`
- Gmail connection should work after OAuth setup

## 🆘 Troubleshooting

- **CORS errors**: Check FRONTEND_URL in Railway matches your domain
- **Gmail not working**: Verify OAuth credentials and authorized origins
- **API errors**: Check Railway logs for backend issues
