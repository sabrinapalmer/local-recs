# Chicago Recommendations Website

A beautiful, interactive website for discovering hotspots around Chicago. Features ad frames on the sides, a centered recommendation form, and an interactive map showing popular places based on your preferences. Now with backend support for storing user recommendations and displaying them as a beautiful heatmap overlay!

## Features

- **Ad Frames**: Fixed ad spaces on left and right sides of the page
- **Recommendation Form**: 
  - Dropdown to select place type (restaurant, bar, museum, etc.)
  - Google Maps autocomplete for location selection
  - Submit your own recommendations to the database
- **Interactive Map**: 
  - Beautiful custom-styled map
  - Shows up to 20 hotspots based on selected category (Google Places)
  - Click markers to see details (name, rating, address)
  - Automatically fits to show all results
  - **NEW**: Toggle to view user-submitted recommendations as a beautiful heatmap overlay
- **Backend API**: 
  - Stores user recommendations in SQLite database
  - Calculates hotspots based on recommendation density
  - RESTful API endpoints for recommendations and statistics
- **Map Download**: Download the map as a high-quality PNG image

## Setup Instructions

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Static Maps API (for download feature)
4. Create credentials (API Key)
5. Restrict the API key to your domain (recommended for production)

### 2. Configure the API Key

Open `index.html` and replace `YOUR_API_KEY` with your actual Google Maps API key:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places,geometry&callback=initMap" async defer></script>
```

Also update `script.js` if you want to use the Static Maps API for downloads (line with `&key=YOUR_API_KEY`).

### 3. Install Backend Dependencies

Install Node.js dependencies for the backend server:

```bash
npm install
```

### 4. Run the Backend Server

Start the Express server:

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000` and automatically create a SQLite database file (`recommendations.db`) to store user recommendations.

### 5. Access the Website

Open your browser and visit:

```
http://localhost:3000
```

The website will be served by the Express server, which also provides the API endpoints for storing and retrieving recommendations.

## File Structure

```
passiveWebsite/
├── index.html          # Main HTML file
├── styles.css           # All styling
├── script.js            # JavaScript functionality (frontend)
├── server.js            # Express backend server
├── package.json         # Node.js dependencies
├── recommendations.db   # SQLite database (created automatically)
└── README.md            # This file
```

## API Endpoints

The backend provides the following REST API endpoints:

- `POST /api/recommendations` - Store a new recommendation
  ```json
  {
    "placeType": "restaurant",
    "locationName": "Millennium Park",
    "latitude": 41.8825,
    "longitude": -87.6240,
    "placeName": "The Art Institute"
  }
  ```

- `GET /api/recommendations` - Get all recommendations (optional query: `?placeType=restaurant`)

- `GET /api/hotspots` - Get hotspot data for heatmap (optional query: `?placeType=restaurant`)

- `GET /api/stats` - Get statistics by place type

## Customization

### Ad Frames
Edit the `.ad-frame` and `.ad-content` classes in `styles.css` to customize ad sizes and styling.

### Place Types
Add or modify place types in the `<select>` dropdown in `index.html` and update the `placeTypeMap` in `script.js`.

### Map Styling
Modify the `styles` array in the `initMap()` function in `script.js` to customize map appearance.

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Usage

1. **Search for Places**: Use the form to search for places around Chicago. Select a category and enter a location.

2. **Submit Recommendations**: After searching, click "Submit as Recommendation" to save that location to the database.

3. **View User Hotspots**: Click "Show User Recommendations" to see a beautiful heatmap overlay showing where users have recommended places. The intensity indicates the density of recommendations.

4. **Toggle Views**: Switch between Google Places results (markers) and user recommendations (heatmap) using the toggle button.

## Notes

- The website requires an active internet connection for Google Maps API
- API usage may incur costs depending on your Google Cloud billing plan
- The map download feature uses html2canvas library for high-quality image generation
- The backend uses SQLite for simplicity - no separate database server required
- The heatmap uses Google Maps Visualization library for beautiful gradient overlays

## License

Free to use and modify for your needs.

