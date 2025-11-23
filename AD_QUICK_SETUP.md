# Quick Ad Setup Guide

## To Enable Real Google AdSense Ads

1. **Get your AdSense Publisher ID:**
   - Go to [Google AdSense](https://www.google.com/adsense/)
   - Sign in with your Google account
   - Go to **Account** → **Account Information**
   - Copy your Publisher ID (starts with `ca-pub-`)

2. **Create Ad Units:**
   - In AdSense, go to **Ads** → **By ad unit** → **Create new ad unit**
   - Create two ad units:
     - One for the left sidebar (160x600 vertical)
     - One for the right sidebar (160x600 vertical)
   - Copy the Ad Slot IDs for each unit

3. **Update `ads-config.js`:**
   ```javascript
   const AD_CONFIG = {
       PUBLISHER_ID: 'ca-pub-YOUR_ACTUAL_PUBLISHER_ID',  // Replace with your ID
       LEFT_AD_SLOT: 'YOUR_LEFT_SLOT_ID',                 // Replace with left slot ID
       RIGHT_AD_SLOT: 'YOUR_RIGHT_SLOT_ID',               // Replace with right slot ID
       ENABLED: true
   };
   ```

4. **Save and refresh:**
   - Save `ads-config.js`
   - Refresh your website
   - Real AdSense ads should appear!

## Current Status

- ✅ Ad system is set up and ready
- ✅ Demo ads are showing (nice gradient placeholders)
- ⏳ Waiting for your AdSense credentials to enable real ads

## Testing

- **Without AdSense:** You'll see beautiful demo ad placeholders
- **With AdSense:** Real ads will automatically replace the placeholders once configured

## Need Help?

- Check the browser console for ad initialization messages
- Make sure your AdSense account is approved
- Verify your ad units are active in AdSense dashboard

