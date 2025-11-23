# Map ID Setup for Advanced Markers

To eliminate the deprecation warning and use the modern Advanced Markers, you need to create a Map ID in Google Cloud Console.

## Steps to Get a Map ID

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/google/maps-apis

2. **Navigate to Map Styles**
   - In the left sidebar, click on **"Map Styles"** or **"Map Management"**
   - Or go directly to: https://console.cloud.google.com/google/maps-apis/maps

3. **Create a New Map Style** (or use existing)
   - Click **"+ Create Map Style"** or select an existing style
   - You can:
     - Start with a template
     - Import a JSON style
     - Create a custom style

4. **Copy Your Map ID**
   - Once created, you'll see your Map ID (looks like: `abc123def456`)
   - Copy this ID

5. **Add to Your Code**
   - Open `script.js`
   - Find the `CONFIG` object at the top
   - Set `MAP_ID` to your Map ID:
     ```javascript
     MAP_ID: 'your-map-id-here'
     ```

## Quick Setup (Using Default Style)

If you want to use a default style quickly:

1. Go to: https://console.cloud.google.com/google/maps-apis/maps
2. Click **"+ Create Map Style"**
3. Choose **"Standard"** or any template
4. Give it a name (e.g., "Chicago Recommendations")
5. Click **"Create"**
6. Copy the Map ID
7. Add it to `script.js` in the `CONFIG.MAP_ID` field

## Benefits of Using Advanced Markers

- ✅ No deprecation warnings
- ✅ Better performance
- ✅ More customization options
- ✅ Future-proof (classic markers will be discontinued)

## Note

- Map IDs are free to create
- You can create multiple Map IDs for different styles
- Map IDs are tied to your Google Cloud project
- Classic markers still work without a Map ID, but will show deprecation warnings

