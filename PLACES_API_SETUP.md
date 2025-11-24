# Google Places API Setup Guide

The application uses the **Google Places API** to fetch detailed information about locations (photos, ratings, hours, address, phone, website, etc.).

## Required APIs

You need to enable the following APIs in your Google Cloud Console:

1. **Places API** (required for place details)
2. **Maps JavaScript API** (already enabled - for the map)
3. **Geocoding API** (already enabled - for address lookup)

## How to Enable Places API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one if you haven't)
3. Navigate to **APIs & Services** > **Library**
4. Search for **"Places API"**
5. Click on **"Places API"** (not "Places API (New)" - use the classic one)
6. Click **"Enable"**

## Verify Your API Key Has Access

1. Go to **APIs & Services** > **Credentials**
2. Find your API key (the one in your `index.html`: `AIzaSyDUQ03JcuuC_cokDLE5szlFXfiW9qsyzaA`)
3. Click on the key to edit it
4. Under **API restrictions**, make sure:
   - Either **"Don't restrict key"** is selected, OR
   - **"Restrict key"** is selected and includes:
     - Places API
     - Maps JavaScript API
     - Geocoding API

## Check API Status

After enabling, you can verify it's working by:

1. Opening your browser's Developer Console (F12)
2. Looking for any errors related to Places API
3. The error message "Place details not available" should change to either:
   - Showing actual place details, OR
   - A more specific error message if there's still an issue

## Common Issues

### "Place details not available"
- **Cause**: Places API not enabled or API key doesn't have access
- **Fix**: Enable Places API and ensure your API key has access to it

### "Places service error: REQUEST_DENIED"
- **Cause**: API key restrictions or Places API not enabled
- **Fix**: Check API restrictions and ensure Places API is enabled

### "Places service error: OVER_QUERY_LIMIT"
- **Cause**: You've exceeded your quota
- **Fix**: Check your billing/quota in Google Cloud Console

## Testing

Once enabled, when you:
1. Click on a hotspot
2. Expand a category (e.g., "Restaurants")
3. You should see place details loading automatically with:
   - Photos
   - Ratings
   - Hours
   - Address
   - Phone
   - Website
   - etc.

## Cost Information

The Places API has usage-based pricing. Check [Google's pricing page](https://developers.google.com/maps/documentation/places/web-service/pricing) for current rates.

**Note**: Google provides $200/month in free credits, which should cover most small to medium usage.

