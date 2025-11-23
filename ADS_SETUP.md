# Ad Integration Setup Guide

This guide will help you set up Google AdSense ads on your Chicago Recommendations website.

## Step 1: Get Your Google AdSense Account

1. Go to [Google AdSense](https://www.google.com/adsense/)
2. Sign up or sign in to your account
3. Get approved (this may take a few days)

## Step 2: Get Your Publisher ID

1. In your AdSense dashboard, go to **Account** → **Account Information**
2. Find your **Publisher ID** (starts with `ca-pub-`)
3. Copy this ID

## Step 3: Create Ad Units

1. In AdSense, go to **Ads** → **By ad unit**
2. Click **+ New ad unit**
3. Create two ad units:
   - **Left Sidebar Ad** (160x600 - Skyscraper)
   - **Right Sidebar Ad** (160x600 - Skyscraper)
4. For each ad unit:
   - Choose **Display ads**
   - Select **Skyscraper (160x600)** format
   - Give it a descriptive name
   - Copy the **Ad unit ID** (starts with a number)

## Step 4: Configure Your Website

### Update `index.html`

Replace `YOUR_PUBLISHER_ID` in two places:

1. In the `<head>` section:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_PUBLISHER_ID"
     crossorigin="anonymous"></script>
```

2. In the ad units (two places - left and right):
```html
data-ad-client="ca-pub-YOUR_PUBLISHER_ID"
```

Replace `YOUR_LEFT_AD_SLOT_ID` and `YOUR_RIGHT_AD_SLOT_ID` with your actual ad slot IDs:
```html
data-ad-slot="YOUR_LEFT_AD_SLOT_ID"  <!-- Left ad -->
data-ad-slot="YOUR_RIGHT_AD_SLOT_ID" <!-- Right ad -->
```

### Update `ads-config.js`

Open `ads-config.js` and update:

```javascript
const AD_CONFIG = {
    PUBLISHER_ID: 'ca-pub-YOUR_ACTUAL_PUBLISHER_ID',
    LEFT_AD_SLOT: 'YOUR_ACTUAL_LEFT_SLOT_ID',
    RIGHT_AD_SLOT: 'YOUR_ACTUAL_RIGHT_SLOT_ID',
    ENABLED: true
};
```

## Step 5: Test Your Ads

1. Save all files
2. Refresh your website
3. Check the browser console for any errors
4. Ads should appear in the left and right sidebars

## Troubleshooting

### Ads Not Showing?

1. **Check AdSense Approval**: Make sure your AdSense account is approved
2. **Check Ad Blockers**: Disable ad blockers in your browser
3. **Check Console**: Open browser console (F12) and look for errors
4. **Wait for Approval**: New ad units may take a few hours to start showing

### Placeholder Still Showing?

- This is normal if ads haven't loaded yet
- Placeholders will automatically hide when ads load
- If ads are approved but not showing, check your AdSense dashboard

### Ad Sizes

The current setup uses:
- **Width**: 160px (Skyscraper format)
- **Height**: 600px (flexible, can be shorter)

You can change these in:
- `styles.css` - `.ad-frame` and `.ad-container` classes
- `index.html` - `data-ad-format` attribute

## Alternative Ad Networks

If you want to use a different ad network:

1. Replace the Google AdSense script with your ad network's script
2. Update the ad HTML in `index.html`
3. Modify `ads-config.js` to match your ad network's requirements

## Disabling Ads

To temporarily disable ads without removing the code:

In `ads-config.js`, set:
```javascript
ENABLED: false
```

## Ad Placement

Current ad placement:
- **Left Sidebar**: Fixed position, 160px wide
- **Right Sidebar**: Fixed position, 160px wide
- **Main Content**: Adjusted to fit between ads (margin: 0 160px)

You can adjust these in `styles.css`:
- `.ad-frame` - Ad container styling
- `.main-content` - Main content margins

## Best Practices

1. **Don't click your own ads** - This violates AdSense policies
2. **Test in incognito mode** - To see ads without your personalization
3. **Monitor performance** - Check AdSense dashboard regularly
4. **Follow AdSense policies** - Read and follow Google's policies

## Support

For AdSense-specific issues, visit:
- [AdSense Help Center](https://support.google.com/adsense)
- [AdSense Community](https://support.google.com/adsense/community)

