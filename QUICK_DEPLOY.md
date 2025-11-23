# Quick Deploy Steps

## 🚀 Fastest Way to Deploy (Render - 10 minutes)

### 1. Push to GitHub (5 min)

```bash
# If you haven't initialized git yet:
git init
git add .
git commit -m "Initial commit"

# Create a new repo on GitHub.com, then:
git remote add origin https://github.com/YOUR_USERNAME/chicago-recommendations.git
git branch -M main
git push -u origin main
```

### 2. Deploy on Render (5 min)

1. Go to [render.com](https://render.com) → Sign up (free)
2. Click "New +" → "Web Service"
3. Connect GitHub → Select your repo
4. Configure:
   - **Name**: `chicago-recommendations`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Click "Create Web Service"
6. Wait 5-10 minutes for deployment
7. **Copy your URL** (e.g., `https://chicago-recommendations.onrender.com`)

### 3. Update API URL (if needed)

The code automatically detects production, but if your backend is on a different URL, update `script.js`:

```javascript
// In script.js, line ~11:
API_BASE_URL: 'https://your-app.onrender.com/api',
```

### 4. Test Your Site

Visit your Render URL and make sure:
- ✅ Map loads
- ✅ Recommendations show up
- ✅ You can add recommendations
- ✅ Filters work

### 5. Connect to AdSense

1. Go to [Google AdSense](https://www.google.com/adsense/)
2. Add your website: `https://your-app.onrender.com`
3. Wait for approval (usually 1-3 days)
4. Once approved, get your Publisher ID and Slot IDs
5. Update `ads-config.js` with your AdSense credentials

---

## 🎯 That's It!

Your website is now live and ready for AdSense!

**Your deployed URL**: `https://your-app.onrender.com`

---

## Troubleshooting

**"Cannot connect to API"**
- Check that your backend deployed successfully
- Look at Render logs for errors
- Make sure API_BASE_URL in script.js matches your Render URL

**"Database not working"**
- SQLite resets on Render restarts (this is normal on free tier)
- Use the seed endpoint to repopulate: Visit `https://your-app.onrender.com/api/seed?clear=true`
- Or upgrade to use PostgreSQL (keeps data permanently)

**"Ads not showing"**
- Make sure you've updated `ads-config.js` with real AdSense IDs
- Check browser console for ad errors
- Verify AdSense account is approved

---

## Next Steps

1. ✅ Website deployed
2. ⏳ Waiting for AdSense approval
3. ⏳ Once approved, update ads-config.js
4. 🎉 Start earning!

