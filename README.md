# 🌐 Better Networking - Professional Email Automation Platform

A comprehensive email automation and networking platform built with Next.js and Node.js, featuring Gmail integration, contact management, and campaign automation.

## ✨ Features

### 📧 Email Management
- **Gmail Integration** - OAuth2 authentication with Gmail API
- **Real-time Statistics** - Track emails sent by domain and timeframe
- **Inbox Filtering** - Filter emails by goal company domains
- **Email Campaigns** - Mass personalized email sending

### 👥 Contact Management
- **Persistent Storage** - Contacts saved to backend database
- **Status Tracking** - Track contacted/not contacted status
- **Contact History** - Days since last contact tracking
- **Bulk Operations** - Mass email campaigns to selected contacts

### 🎯 Goal Tracking
- **Company Goals** - Set daily/weekly email targets per company
- **Real Progress** - Track actual vs. goal performance
- **Domain Statistics** - Monitor outreach to specific companies
- **Visual Dashboards** - Progress bars and statistics

### 📝 Template System
- **Email Templates** - Create reusable email templates
- **Personalization** - Dynamic variables (name, company, position)
- **Template Management** - Edit, delete, copy templates
- **Campaign Integration** - Use templates in mass campaigns

## 🚀 Quick Start

### Local Development

1. **Clone and Install**
   ```bash
   git clone <your-repo>
   cd better-networking
   npm install
   cd backend && npm install
   ```

2. **Environment Setup**
   ```bash
   # Frontend (.env.local)
   NEXT_PUBLIC_API_URL=http://localhost:3002/api
   
   # Backend (.env)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   FRONTEND_URL=http://localhost:3000
   ```

3. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   npm run dev
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3002

## 🌐 Deployment

### Easy Deployment (Recommended)

1. **Deploy Backend to Railway**
   - Go to [railway.app](https://railway.app)
   - Deploy from GitHub repository
   - Set environment variables

2. **Deploy Frontend to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import GitHub repository
   - Set `NEXT_PUBLIC_API_URL` to Railway URL

3. **Connect Custom Domain**
   - Add domain in Vercel dashboard
   - Update DNS settings in GoDaddy

📖 **See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions**

## 🔧 Configuration

### Gmail API Setup
1. Create Google Cloud project
2. Enable Gmail API
3. Create OAuth2 credentials
4. Add authorized origins

### Environment Variables
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `FRONTEND_URL` - Frontend URL for CORS

## 📊 Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Gmail API
- **Database**: File-based JSON (easily upgradeable)
- **Deployment**: Vercel (frontend) + Railway (backend)
- **Authentication**: Google OAuth2

## 🎯 Use Cases

- **Job Search** - Track applications to target companies
- **Networking** - Manage professional contacts and outreach
- **Sales** - Monitor email campaigns and responses
- **Recruiting** - Track candidate communications

## 📈 Statistics

- Real-time email tracking
- Domain-based analytics
- Goal progress monitoring
- Contact engagement history

## 🆘 Support

- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- Review environment variable setup
- Verify Gmail API configuration
- Check CORS settings for production

---

Built with ❤️ for professional networking and email automation.
