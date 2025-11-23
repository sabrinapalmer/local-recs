# Deployment Guide - Chicago Recommendations Website

This guide will walk you through deploying your website so you can connect it to Google AdSense.

## Prerequisites

- Your website code (you have this!)
- A GitHub account (free)
- A deployment platform account (we'll set this up)

## Quick Overview

Your website has two parts:
1. **Frontend**: HTML, CSS, JavaScript files (static files)
2. **Backend**: Node.js server with SQLite database (API server)

We'll deploy both parts together.

---

## Option 1: Render (Recommended - Easiest)

Render is the easiest option with a good free tier.

### Step 1: Prepare Your Code

1. **Create a `.gitignore` file** (if you don't have one):
   ```bash
   echo "node_modules/
   .env
   *.log
   .DS_Store" > .gitignore
   ```

2. **Create a `render.yaml` file** for easy deployment:
   ```yaml
   services:
     - type: web
       name: chicago-recommendations
       env: node
       buildCommand: npm install
       startCommand: npm start
       envVars:
         - key: NODE_ENV
           value: production
         - key: PORT
           value: 3000
   ```

### Step 2: Push to GitHub

1. **Initialize git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a GitHub repository**:
   - Go to [GitHub](https://github.com/new)
   - Create a new repository (name it `chicago-recommendations` or similar)
   - Don't initialize with README

3. **Push your code**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/chicago-recommendations.git
   git branch -M main
   git push -u origin main
   ```

### Step 3: Deploy on Render

1. **Sign up**: Go to [render.com](https://render.com) and sign up (free)

2. **Create a new Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select your repository

3. **Configure the service**:
   - **Name**: `chicago-recommendations`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid if you want)

4. **Add Environment Variables** (if needed):
   - `NODE_ENV=production`
   - `PORT=3000`

5. **Deploy**: Click "Create Web Service"

6. **Wait for deployment** (5-10 minutes)

7. **Get your URL**: Render will give you a URL like `https://chicago-recommendations.onrender.com`

### Step 4: Update Your Frontend

Your frontend needs to know where the backend API is. Update `script.js`:

```javascript
// In script.js, find CONFIG section and update:
const CONFIG = {
    API_BASE_URL: 'https://YOUR_RENDER_URL.onrender.com/api',  // Update this!
    // ... rest of config
};
```

**Important**: You'll need to update the API URL in your frontend code to point to your deployed backend.

---

## Option 2: Railway (Also Easy)

Railway is another great option with a simple setup.

### Steps:

1. **Sign up**: Go to [railway.app](https://railway.app) and sign up

2. **Install Railway CLI** (optional, or use web interface):
   ```bash
   npm i -g @railway/cli
   railway login
   ```

3. **Deploy**:
   ```bash
   railway init
   railway up
   ```

4. **Get your URL**: Railway will provide a URL automatically

---

## Option 3: Vercel (Frontend) + Railway/Render (Backend)

This splits frontend and backend, which is more complex but gives you more control.

### Frontend on Vercel:

1. **Sign up**: [vercel.com](https://vercel.com)

2. **Deploy**:
   - Connect GitHub repo
   - Vercel auto-detects and deploys

### Backend on Render/Railway:

- Follow Option 1 or 2 above for backend

---

## Important: Update API URL

After deploying, you MUST update the API URL in your frontend:

1. **Find in `script.js`**:
   ```javascript
   const CONFIG = {
       API_BASE_URL: 'http://localhost:3000/api',  // Change this!
   };
   ```

2. **Update to your deployed URL**:
   ```javascript
   const CONFIG = {
       API_BASE_URL: 'https://your-deployed-url.onrender.com/api',
   };
   ```

3. **Commit and push**:
   ```bash
   git add script.js
   git commit -m "Update API URL for production"
   git push
   ```

---

## Database Considerations

**SQLite on Render/Railway**: 
- SQLite works, but the database file is ephemeral (resets on restart)
- For production, consider:
  - **Render**: Use their PostgreSQL (free tier available)
  - **Railway**: Use their PostgreSQL
  - Or keep SQLite and accept that data resets (fine for demo/testing)

**To keep data persistent**, you can:
1. Use the seed endpoint to repopulate data
2. Migrate to PostgreSQL (more complex, but permanent)

---

## After Deployment: Connect to AdSense

1. **Get your deployed URL** (e.g., `https://chicago-recommendations.onrender.com`)

2. **Go to Google AdSense**:
   - Visit [adsense.google.com](https://www.google.com/adsense/)
   - Add your website URL
   - Wait for approval (can take a few days)

3. **Once approved**:
   - Get your Publisher ID
   - Create ad units
   - Update `ads-config.js` with your IDs

---

## Troubleshooting

### Backend not working?
- Check Render/Railway logs
- Make sure `PORT` environment variable is set
- Verify `npm start` command works locally

### Frontend can't connect to backend?
- Check CORS settings in `server.js`
- Verify API URL in `script.js` matches your backend URL
- Check browser console for errors

### Database issues?
- SQLite file might reset on deployment
- Use the seed endpoint to repopulate: `POST /api/seed`

---

## Quick Deploy Checklist

- [ ] Code pushed to GitHub
- [ ] Render/Railway account created
- [ ] Service deployed
- [ ] Backend URL obtained
- [ ] Frontend API URL updated
- [ ] Website tested on deployed URL
- [ ] AdSense account created
- [ ] Website URL added to AdSense
- [ ] Waiting for AdSense approval

---

## Need Help?

- **Render Docs**: https://render.com/docs
- **Railway Docs**: https://docs.railway.app
- **GitHub Help**: https://docs.github.com

Good luck! 🚀

