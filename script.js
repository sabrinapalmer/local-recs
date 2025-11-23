/**
 * Chicago Recommendations Map Application
 * Main application controller with proper separation of concerns
 */

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const CONFIG = {
    // API URL - automatically detects production vs development
    // For production, set this to your deployed backend URL
    // Example: API_BASE_URL: 'https://your-app.onrender.com/api'
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : `${window.location.protocol}//${window.location.host}/api`, // Assumes backend is on same domain
    MAP_DEFAULT_CENTER: { lat: 41.8781, lng: -87.6298 },
    MAP_DEFAULT_ZOOM: 11,
    MAP_NEIGHBORHOOD_ZOOM: 14,
    CHICAGO_BOUNDS: {
        southwest: { lat: 41.6445, lng: -87.9401 },
        northeast: { lat: 42.0231, lng: -87.5240 }
    },
    HEATMAP_RADIUS: 40,
    HEATMAP_OPACITY: 0.7,
    MARKER_SCALE: 6,
    DEBOUNCE_DELAY: 100, // Reduced delay for more responsive updates
    // Map ID for Advanced Markers (get from https://console.cloud.google.com/google/maps-apis)
    // Leave empty to use classic markers (deprecated but still works)
    MAP_ID: null // Set to your Map ID string, e.g., 'YOUR_MAP_ID'
};

const PLACE_TYPE_COLORS = {
    'restaurant': '#e74c3c',
    'bar': '#3498db',
    'museum': '#9b59b6',
    'cafe': '#f39c12',
    'park': '#27ae60',
    'theater': '#e67e22',
    'shopping': '#1abc9c',
    'nightclub': '#c0392b',
    'hotel': '#34495e',
    'attraction': '#16a085'
};

const PLACE_TYPE_LABELS = {
    'restaurant': 'Restaurants',
    'bar': 'Bars',
    'museum': 'Museums & Galleries',
    'cafe': 'Cafes',
    'park': 'Parks',
    'theater': 'Theaters',
    'shopping': 'Shopping Centers',
    'nightclub': 'Nightclubs',
    'hotel': 'Hotels',
    'attraction': 'Tourist Attractions'
};

const MAP_STYLES = [
    { featureType: "all", elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
    { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
    { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#eaeaea" }] },
    { featureType: "road.local", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#c5e3b6" }] },
    // Show neighborhood names (administrative labels)
    { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#333333" }, { visibility: "on" }] },
    { featureType: "administrative", elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { visibility: "on" }] },
    { featureType: "administrative.neighborhood", elementType: "labels.text.fill", stylers: [{ color: "#333333" }, { visibility: "on" }] },
    { featureType: "administrative.neighborhood", elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { visibility: "on" }] },
    // Hide all POIs (points of interest)
    { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
    { featureType: "poi.business", elementType: "all", stylers: [{ visibility: "off" }] },
    { featureType: "poi.attraction", elementType: "all", stylers: [{ visibility: "off" }] },
    { featureType: "poi.government", elementType: "all", stylers: [{ visibility: "off" }] },
    { featureType: "poi.medical", elementType: "all", stylers: [{ visibility: "off" }] },
    { featureType: "poi.park", elementType: "all", stylers: [{ visibility: "off" }] },
    { featureType: "poi.place_of_worship", elementType: "all", stylers: [{ visibility: "off" }] },
    { featureType: "poi.school", elementType: "all", stylers: [{ visibility: "off" }] },
    { featureType: "poi.sports_complex", elementType: "all", stylers: [{ visibility: "off" }] },
    // Road labels
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#5b5b5b" }] },
    { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
    // Hide transit
    { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
    { featureType: "transit.station", elementType: "all", stylers: [{ visibility: "off" }] }
];

// ============================================================================
// APPLICATION STATE
// ============================================================================

class AppState {
    constructor() {
        this.map = null;
        this.autocomplete = null;
        this.neighborhoodAutocomplete = null;
        this.placesService = null;
        this.geocoder = null;
        this.streetViewService = null;
        this.streetViewPanorama = null;
        this.markers = [];
        this.heatmapCircles = []; // Store heatmap circles
        this.heatmapLayers = {};
        this.allRecommendations = [];
        this.filteredRecommendations = [];
        this.activeFilters = new Set(Object.keys(PLACE_TYPE_COLORS));
        this.mapInitialized = false;
        this.userLocation = null;
    }

    resetMarkers() {
        this.markers.forEach(marker => {
            // Handle both Advanced Markers and classic Markers
            try {
                if (marker.setMap) {
                    marker.setMap(null);
                } else if (marker.map) {
                    marker.map = null;
                }
                // For Advanced Markers
                if (marker.content && marker.content.parentNode) {
                    marker.content.parentNode.removeChild(marker.content);
                }
            } catch (err) {
                console.warn('Error removing marker:', err);
            }
        });
        this.markers = [];
    }

    resetHeatmaps() {
        // We're no longer using actual heatmap layers, just storing metadata
        // So we just clear the object
        this.heatmapLayers = {};
    }
}

const appState = new AppState();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert hex color to RGB object
 * @param {string} hex - Hex color string
 * @returns {{r: number, g: number, b: number}}
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 102, g: 126, b: 234 };
}

/**
 * Get human-readable label for place type
 * @param {string} placeType - Place type key
 * @returns {string} Human-readable label
 */
function getPlaceTypeLabel(placeType) {
    return PLACE_TYPE_LABELS[placeType] || placeType;
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show user-friendly error message
 * @param {string} message - Error message
 * @param {HTMLElement} element - Element to show message in
 */
function showError(message, element) {
    if (!element) return;
    element.innerHTML = `<strong style="color: #e74c3c;">⚠ ${message}</strong>`;
    element.style.display = 'block';
}

/**
 * Show success message
 * @param {string} message - Success message
 * @param {HTMLElement} element - Element to show message in
 * @param {number} duration - Duration in milliseconds
 */
function showSuccess(message, element, duration = 3000) {
    if (!element) return;
    const originalText = element.innerHTML;
    element.innerHTML = `<strong style="color: #27ae60;">✓ ${message}</strong>`;
    setTimeout(() => {
        element.innerHTML = originalText;
    }, duration);
}

/**
 * Show loading state
 * @param {HTMLElement} element - Element to show loading in
 */
function showLoading(element) {
    if (!element) return;
    element.innerHTML = '<span class="loading"></span> Loading...';
}

// ============================================================================
// MAP INITIALIZATION
// ============================================================================

/**
 * Initialize Google Maps
 */
function initializeMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Map element not found');
        return;
    }

    // Check if Google Maps API is loaded
    if (typeof google === 'undefined' || !google.maps) {
        console.error('Google Maps API not loaded');
        return;
    }

    try {
        // Map configuration
        const mapConfig = {
            center: CONFIG.MAP_DEFAULT_CENTER,
            zoom: CONFIG.MAP_DEFAULT_ZOOM,
            styles: MAP_STYLES,
            mapTypeControl: false,
            fullscreenControl: true,
            streetViewControl: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM,
                options: {
                    visible: true
                }
            },
            zoomControl: true,
            scrollwheel: true, // Enable scroll to zoom
            gestureHandling: 'greedy', // Allow scroll zoom without requiring modifier key
            disableDefaultUI: false,
            // Enable 3D features
            tilt: 0, // Start with no tilt, can be changed dynamically
            heading: 0, // Start with north up
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        
        // Add Map ID if configured (required for Advanced Markers)
        // Get your Map ID from: https://console.cloud.google.com/google/maps-apis
        // Go to "Map Styles" → Create new style or use existing → Copy Map ID
        if (CONFIG.MAP_ID) {
            mapConfig.mapId = CONFIG.MAP_ID;
            console.log('Using Map ID for Advanced Markers:', CONFIG.MAP_ID);
        } else {
            console.warn('No Map ID configured. Using classic markers (deprecated). To use Advanced Markers, set CONFIG.MAP_ID in script.js');
        }
        
        appState.map = new google.maps.Map(mapElement, mapConfig);

        appState.placesService = new google.maps.places.PlacesService(appState.map);
        appState.geocoder = new google.maps.Geocoder();
        
        // Enable 3D buildings when zoomed in (requires Map ID with 3D enabled)
        appState.map.addListener('zoom_changed', () => {
            const zoom = appState.map.getZoom();
            if (zoom >= 15 && CONFIG.MAP_ID) {
                // Enable 3D tilt when zoomed in close (45 degrees for 3D effect)
                appState.map.setTilt(45);
            } else if (zoom >= 12) {
                // Slight tilt at medium zoom
                appState.map.setTilt(30);
            } else {
                // Reset tilt when zoomed out
                appState.map.setTilt(0);
            }
        });
        
        // Enable rotation with right-click drag (for 3D exploration)
        appState.map.addListener('dragend', () => {
            // Reset heading to north after dragging
            // Users can use right-click + drag to rotate the map
        });
        
        // Initialize Street View service
        appState.streetViewService = new google.maps.StreetViewService();
        appState.streetViewPanorama = appState.map.getStreetView();
        
        // Configure Street View panorama
        appState.streetViewPanorama.setOptions({
            visible: false,
            position: CONFIG.MAP_DEFAULT_CENTER,
            pov: {
                heading: 0,
                pitch: 0
            }
        });

        // Ensure map has proper dimensions
        const ensureMapSize = () => {
            if (appState.map) {
                google.maps.event.trigger(appState.map, 'resize');
                appState.map.setCenter(CONFIG.MAP_DEFAULT_CENTER);
            }
        };

        // Trigger resize after initialization and on window resize
        setTimeout(ensureMapSize, 100);
        window.addEventListener('resize', ensureMapSize);

        appState.mapInitialized = true;
        console.log('Map initialized successfully');
        
        // Hide loading indicator
        const loadingElement = document.getElementById('mapLoading');
        if (loadingElement) {
            loadingElement.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error initializing map:', error);
        
        // Hide loading indicator on error
        const loadingElement = document.getElementById('mapLoading');
        if (loadingElement) {
            loadingElement.classList.add('hidden');
        }
    }
}

/**
 * Initialize neighborhood search autocomplete in top bar
 */
function initializeNeighborhoodSearch() {
    const neighborhoodInput = document.getElementById('neighborhoodSearch');
    if (!neighborhoodInput) {
        console.warn('neighborhoodSearch input not found');
        return;
    }

    // Wait for Google Maps API to be ready
    if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
        console.warn('Google Maps Places API not ready, retrying...');
        setTimeout(initializeNeighborhoodSearch, 500);
        return;
    }

    try {
        const bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(CONFIG.CHICAGO_BOUNDS.southwest.lat, CONFIG.CHICAGO_BOUNDS.southwest.lng),
            new google.maps.LatLng(CONFIG.CHICAGO_BOUNDS.northeast.lat, CONFIG.CHICAGO_BOUNDS.northeast.lng)
        );

        appState.neighborhoodAutocomplete = new google.maps.places.Autocomplete(neighborhoodInput, {
            componentRestrictions: { country: 'us' },
            fields: ['geometry', 'formatted_address', 'name', 'place_id', 'types'],
            bounds: bounds,
            types: ['geocode', 'establishment'] // Allow both addresses and places
        });

        appState.neighborhoodAutocomplete.addListener('place_changed', () => {
            const place = appState.neighborhoodAutocomplete.getPlace();
            if (place.geometry && appState.map) {
                appState.map.setCenter(place.geometry.location);
                appState.map.setZoom(CONFIG.MAP_NEIGHBORHOOD_ZOOM);
            }
        });
        
        console.log('Autocomplete initialized for neighborhood search');
    } catch (error) {
        console.error('Error initializing neighborhood autocomplete:', error);
    }
}

/**
 * Initialize autocomplete for location input in add modal
 */
function initializeAutocomplete() {
    const locationInput = document.getElementById('location');
    if (!locationInput) {
        console.warn('location input not found');
        return;
    }

    // Wait for Google Maps API to be ready
    if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
        console.warn('Google Maps Places API not ready, retrying...');
        setTimeout(initializeAutocomplete, 500);
        return;
    }

    // Don't reinitialize if already initialized
    if (appState.autocomplete) {
        return;
    }

    try {
        const bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(CONFIG.CHICAGO_BOUNDS.southwest.lat, CONFIG.CHICAGO_BOUNDS.southwest.lng),
            new google.maps.LatLng(CONFIG.CHICAGO_BOUNDS.northeast.lat, CONFIG.CHICAGO_BOUNDS.northeast.lng)
        );

        appState.autocomplete = new google.maps.places.Autocomplete(locationInput, {
            componentRestrictions: { country: 'us' },
            fields: ['geometry', 'formatted_address', 'name', 'place_id', 'types'],
            bounds: bounds,
            types: ['geocode', 'establishment'] // Allow both addresses and places
        });

        appState.autocomplete.addListener('place_changed', () => {
            const place = appState.autocomplete.getPlace();
            if (place.geometry) {
                appState.userLocation = place.geometry.location;
            }
        });
        
        console.log('Autocomplete initialized for location input');
    } catch (error) {
        console.error('Error initializing location autocomplete:', error);
    }
}

// ============================================================================
// MAP DISPLAY FUNCTIONS
// ============================================================================

/**
 * Create a colored marker for a recommendation using AdvancedMarkerElement
 * @param {Object} recommendation - Recommendation object
 * @param {string} color - Marker color
 */
async function createMarker(recommendation, color) {
    if (!recommendation || !recommendation.latitude || !recommendation.longitude) {
        console.warn('Invalid recommendation data:', recommendation);
        return;
    }
    
    // Prefer AdvancedMarkerElement if available (requires Map ID)
    const hasMapId = appState.map && (appState.map.mapId || CONFIG.MAP_ID);
    const hasAdvancedMarkers = google.maps.marker && google.maps.marker.AdvancedMarkerElement;
    
    // Only use Advanced Markers if we have a Map ID (required)
    if (hasAdvancedMarkers && hasMapId) {
        try {
        const pinElement = document.createElement('div');
        pinElement.style.width = '12px';
        pinElement.style.height = '12px';
        pinElement.style.borderRadius = '50%';
        pinElement.style.backgroundColor = color;
        pinElement.style.border = '2px solid #ffffff';
        pinElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        pinElement.style.cursor = 'pointer';
        
        const marker = new google.maps.marker.AdvancedMarkerElement({
            map: appState.map,
            position: { lat: recommendation.latitude, lng: recommendation.longitude },
            title: recommendation.place_name || recommendation.location_name,
            content: pinElement
        });

        // Create info window content with Street View button
        const infoContent = document.createElement('div');
        infoContent.style.padding = '10px';
        infoContent.style.maxWidth = '250px';
        infoContent.innerHTML = `
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px; font-weight: 600;">
                ${escapeHtml(recommendation.place_name || recommendation.location_name)}
            </h3>
            <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">
                <span style="display: inline-block; width: 12px; height: 12px; background: ${color}; border-radius: 50%; margin-right: 5px; vertical-align: middle;"></span>
                ${escapeHtml(getPlaceTypeLabel(recommendation.place_type))}
            </p>
            <p style="margin: 0 0 8px 0; color: #888; font-size: 12px;">
                ${escapeHtml(recommendation.location_name)}
            </p>
            <button class="street-view-btn" style="padding: 6px 12px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; margin-top: 5px;">
                View Street View
            </button>
        `;
        
        // Add Street View button handler
        const streetViewBtn = infoContent.querySelector('.street-view-btn');
        streetViewBtn.addEventListener('click', () => {
            showStreetView(recommendation.latitude, recommendation.longitude);
            infoWindow.close();
        });

        const infoWindow = new google.maps.InfoWindow({
            content: infoContent
        });

        marker.addListener('click', () => {
            infoWindow.open(marker);
        });

            appState.markers.push(marker);
            return; // Successfully created Advanced Marker
        } catch (error) {
            // If Advanced Marker fails, fall back to classic
            console.warn('Advanced Marker creation failed, using classic marker:', error.message);
        }
    }
    
    // Fallback to classic Marker if Advanced Markers not available, no Map ID, or failed
    // Note: Classic markers are deprecated but still functional
    try {
        // Fallback to classic Marker (deprecated but still works)
        const marker = new google.maps.Marker({
            position: { lat: recommendation.latitude, lng: recommendation.longitude },
            map: appState.map,
            title: recommendation.place_name || recommendation.location_name,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: CONFIG.MARKER_SCALE,
                fillColor: color,
                fillOpacity: 0.8,
                strokeColor: '#ffffff',
                strokeWeight: 2
            },
            animation: google.maps.Animation.DROP
        });

        // Create info window content with Street View button
        const infoContent = document.createElement('div');
        infoContent.style.padding = '10px';
        infoContent.style.maxWidth = '250px';
        infoContent.innerHTML = `
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px; font-weight: 600;">
                ${escapeHtml(recommendation.place_name || recommendation.location_name)}
            </h3>
            <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">
                <span style="display: inline-block; width: 12px; height: 12px; background: ${color}; border-radius: 50%; margin-right: 5px; vertical-align: middle;"></span>
                ${escapeHtml(getPlaceTypeLabel(recommendation.place_type))}
            </p>
            <p style="margin: 0 0 8px 0; color: #888; font-size: 12px;">
                ${escapeHtml(recommendation.location_name)}
            </p>
            <button class="street-view-btn" style="padding: 6px 12px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; margin-top: 5px;">
                View Street View
            </button>
        `;
        
        // Add Street View button handler
        const streetViewBtn = infoContent.querySelector('.street-view-btn');
        streetViewBtn.addEventListener('click', () => {
            showStreetView(recommendation.latitude, recommendation.longitude);
            infoWindow.close();
        });

        const infoWindow = new google.maps.InfoWindow({
            content: infoContent
        });

        marker.addListener('click', () => {
            infoWindow.open(appState.map, marker);
        });

        appState.markers.push(marker);
    } catch (error) {
        console.error('Error creating marker:', error);
    }
}

/**
 * Show Street View for a given location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
function showStreetView(lat, lng) {
    if (!appState.streetViewService || !appState.map) return;
    
    const position = { lat: lat, lng: lng };
    
    appState.streetViewService.getPanorama({ location: position, radius: 50 }, (data, status) => {
        if (status === 'OK') {
            appState.streetViewPanorama.setPosition(position);
            appState.streetViewPanorama.setPov({ heading: 270, pitch: 0 });
            appState.streetViewPanorama.setVisible(true);
            appState.map.setStreetView(appState.streetViewPanorama);
        } else {
            alert('Street View is not available for this location.');
        }
    });
}


/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Calculate density clusters for heatmap visualization
 * Groups nearby recommendations and creates heat circles
 */
function calculateDensityClusters(recommendations, radiusMeters = 500) {
    const clusters = [];
    const processed = new Set();
    
    recommendations.forEach((rec, index) => {
        if (processed.has(index)) return;
        
        const cluster = {
            center: { lat: rec.latitude, lng: rec.longitude },
            count: 1,
            recommendations: [rec]
        };
        
        // Find nearby recommendations
        recommendations.forEach((otherRec, otherIndex) => {
            if (index === otherIndex || processed.has(otherIndex)) return;
            
            const distance = google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(rec.latitude, rec.longitude),
                new google.maps.LatLng(otherRec.latitude, otherRec.longitude)
            );
            
            if (distance <= radiusMeters) {
                cluster.count++;
                cluster.recommendations.push(otherRec);
                processed.add(otherIndex);
                
                // Update center to average position
                cluster.center.lat = (cluster.center.lat * (cluster.count - 1) + otherRec.latitude) / cluster.count;
                cluster.center.lng = (cluster.center.lng * (cluster.count - 1) + otherRec.longitude) / cluster.count;
            }
        });
        
        processed.add(index);
        clusters.push(cluster);
    });
    
    return clusters;
}

/**
 * Create visual heatmap effect using colored circles and markers
 * @param {string} placeType - Place type
 * @param {Array} recommendations - Array of recommendations
 */
async function createHeatmapLayer(placeType, recommendations) {
    if (!recommendations || recommendations.length === 0) return;
    
    const color = PLACE_TYPE_COLORS[placeType] || '#667eea';
    
    // Calculate density clusters for heatmap circles
    const clusters = calculateDensityClusters(recommendations, 300); // 300 meter radius
    
    // Create heatmap circles for clusters
    clusters.forEach(cluster => {
        // Circle size based on density (more recommendations = larger circle)
        const radius = Math.min(300 + (cluster.count * 50), 800); // 300-800 meters
        const opacity = Math.min(0.3 + (cluster.count * 0.1), 0.6); // 0.3-0.6 opacity
        
        const circle = new google.maps.Circle({
            strokeColor: color,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: color,
            fillOpacity: opacity,
            map: appState.map,
            center: cluster.center,
            radius: radius,
            zIndex: 1 // Behind markers
        });
        
        appState.heatmapCircles.push(circle);
    });
    
    // Create individual markers for all recommendations
    for (const rec of recommendations) {
        await createMarker(rec, color);
    }
    
    // Store info for reference
    appState.heatmapLayers[placeType] = { 
        count: recommendations.length,
        clusters: clusters.length 
    };
}

/**
 * Update map display based on active filters
 */
async function updateMapDisplayInternal() {
    if (!appState.map) return;

    console.log('updateMapDisplay called');
    console.log('Active filters:', Array.from(appState.activeFilters));
    console.log('Total recommendations:', appState.allRecommendations.length);

    // Clear all existing markers first
    appState.resetMarkers();
    appState.resetHeatmaps();

    // Filter recommendations based on active filters
    appState.filteredRecommendations = appState.allRecommendations.filter(rec =>
        appState.activeFilters.has(rec.place_type)
    );

    console.log(`Filtering: ${appState.filteredRecommendations.length} of ${appState.allRecommendations.length} recommendations match filters`);

    if (appState.filteredRecommendations.length === 0) {
        updateMapInfo();
        return;
    }

    // Group by type
    const byType = {};
    appState.filteredRecommendations.forEach(rec => {
        if (!byType[rec.place_type]) {
            byType[rec.place_type] = [];
        }
        byType[rec.place_type].push(rec);
    });

    console.log('Grouped by type:', Object.keys(byType).map(type => `${type}: ${byType[type].length}`));

    // Create visual heatmap effect and markers
    // Process each type sequentially to ensure markers are created
    try {
        for (const placeType of Object.keys(byType)) {
            await createHeatmapLayer(placeType, byType[placeType]);
        }
        console.log(`Created ${appState.markers.length} markers`);
    } catch (err) {
        console.error('Error creating markers:', err);
    }

    // Fit bounds after markers are created
    setTimeout(() => {
        if (appState.filteredRecommendations.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            appState.filteredRecommendations.forEach(rec => {
                bounds.extend(new google.maps.LatLng(rec.latitude, rec.longitude));
            });
            appState.map.fitBounds(bounds);
            
            if (appState.filteredRecommendations.length === 1) {
                setTimeout(() => {
                    appState.map.setZoom(CONFIG.MAP_NEIGHBORHOOD_ZOOM);
                }, 100);
            }
        } else {
            appState.map.setCenter(CONFIG.MAP_DEFAULT_CENTER);
            appState.map.setZoom(CONFIG.MAP_DEFAULT_ZOOM);
        }
        
        updateMapInfo();
    }, 100);
}

const updateMapDisplay = debounce(updateMapDisplayInternal, CONFIG.DEBOUNCE_DELAY);

/**
 * Update map info display (now in panel header)
 */
function updateMapInfo() {
    const infoElement = document.getElementById('panelInfo');
    if (!infoElement) return;

    const totalCount = appState.filteredRecommendations.length;
    const activeCount = appState.activeFilters.size;
    const totalAvailable = appState.allRecommendations.length;

    if (totalCount === 0) {
        if (totalAvailable === 0) {
            infoElement.innerHTML = '<span class="info-text">No recommendations yet</span>';
        } else {
            infoElement.innerHTML = '<span class="info-text">No recommendations match selected filters</span>';
        }
        return;
    }

    const typeCounts = {};
    appState.filteredRecommendations.forEach(rec => {
        typeCounts[rec.place_type] = (typeCounts[rec.place_type] || 0) + 1;
    });

    const typeList = Object.keys(typeCounts)
        .map(type => `${getPlaceTypeLabel(type)}: ${typeCounts[type]}`)
        .join(', ');

    if (totalCount === 0) {
        if (totalAvailable === 0) {
            infoElement.innerHTML = '<span class="info-text">No recommendations yet</span>';
        } else {
            infoElement.innerHTML = '<span class="info-text">No recommendations match selected filters</span>';
        }
        return;
    }

    const displayText = `Showing <strong>${totalCount}</strong> of ${totalAvailable} recommendation${totalAvailable !== 1 ? 's' : ''}`;
    
    infoElement.innerHTML = `
        <span class="info-text">${displayText}</span>
        <span class="info-details">${typeList}</span>
    `;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Load all recommendations from API
 */
async function loadAllRecommendations() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/recommendations`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        // Handle both array response and object with recommendations property
        appState.allRecommendations = Array.isArray(data) ? data : (data.recommendations || []);
        
        console.log(`Loaded ${appState.allRecommendations.length} recommendations`);
        
        // Always use sample data - clear existing and seed fresh
        if (appState.allRecommendations.length === 0 || appState.allRecommendations.length < 10) {
            console.log('Seeding sample data (clearing existing)...');
            try {
                const seedResponse = await fetch(`${CONFIG.API_BASE_URL}/seed?clear=true`, { method: 'POST' });
                if (seedResponse.ok) {
                    const seedData = await seedResponse.json();
                    console.log('Sample data seeded:', seedData);
                    // Reload recommendations after seeding
                    setTimeout(() => loadAllRecommendations(), 500);
                    return;
                }
            } catch (seedError) {
                console.error('Error seeding data:', seedError);
            }
        }
        
        // Ensure we have data before updating
        if (appState.allRecommendations.length > 0) {
            updateMapDisplay();
            updateMapInfo();
        } else {
            updateMapInfo(); // Still update info to show "No recommendations"
        }
    } catch (error) {
        console.error('Error loading recommendations:', error);
    }
}

/**
 * Submit a new recommendation
 */
async function handleRecommendationSubmit(event) {
    event.preventDefault();
    
    const placeTypeSelect = document.getElementById('placeType');
    const locationInput = document.getElementById('location');
    
    if (!placeTypeSelect || !locationInput) return;
    
    const placeType = placeTypeSelect.value.trim();
    const locationName = locationInput.value.trim();
    
    if (!placeType || !locationName) {
        console.warn('Please fill in all fields');
        return;
    }

    try {
        const geocodeResult = await new Promise((resolve, reject) => {
            appState.geocoder.geocode(
                { address: `${locationName}, Chicago, IL` },
                (results, status) => {
                    if (status === 'OK' && results[0]) {
                        resolve(results[0]);
                    } else {
                        reject(new Error('Could not find that location'));
                    }
                }
            );
        });

        const location = geocodeResult.geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        
        // Get place name from autocomplete if available
        let placeName = locationName;
        if (appState.autocomplete) {
            // Handle both new PlaceAutocompleteElement and classic Autocomplete
            if (typeof appState.autocomplete.getPlace === 'function') {
                const place = appState.autocomplete.getPlace();
                placeName = place?.name || locationName;
            } else if (appState.autocomplete.value) {
                placeName = appState.autocomplete.value;
            }
        }
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/recommendations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                placeType,
                locationName,
                latitude: lat,
                longitude: lng,
                placeName
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save recommendation');
        }

        // Clear form
        placeTypeSelect.value = '';
        locationInput.value = '';
        
        // Close modal
        const addModal = document.getElementById('addModal');
        if (addModal) {
            addModal.classList.remove('show');
        }
        
        // Reload recommendations
        await loadAllRecommendations();
        
    } catch (error) {
        console.error('Error submitting recommendation:', error);
        alert(error.message || 'Error connecting to server. Please make sure the backend is running.');
    }
}

// ============================================================================
// UI EVENT HANDLERS
// ============================================================================

/**
 * Setup filter controls
 */
function setupFilterControls() {
    const checkboxes = document.querySelectorAll('.filter-checkbox input[type="checkbox"]');
    const filterLabels = document.querySelectorAll('.filter-checkbox');
    
    // Initialize checkboxes based on activeFilters
    checkboxes.forEach(checkbox => {
        checkbox.checked = appState.activeFilters.has(checkbox.value);
    });
    
    checkboxes.forEach(checkbox => {
        // Stop checkbox clicks from bubbling to the label
        checkbox.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        
        // Handle checkbox changes - only toggle this specific checkbox
        checkbox.addEventListener('change', function(e) {
            e.stopPropagation();
            const placeType = this.value;
            if (this.checked) {
                appState.activeFilters.add(placeType);
            } else {
                appState.activeFilters.delete(placeType);
            }
            console.log('Filter changed:', placeType, 'checked:', this.checked, 'activeFilters:', Array.from(appState.activeFilters));
            // Call update immediately (debounce will handle rapid changes)
            updateMapDisplayInternal();
        });
    });
    
    // Handle row clicks - isolate to show only that type
    filterLabels.forEach(label => {
        label.addEventListener('click', function(e) {
            const checkbox = this.querySelector('input[type="checkbox"]');
            
            // If the click target is the checkbox itself, don't handle it here
            // (the checkbox handler will take care of it)
            if (e.target === checkbox) {
                return;
            }
            
            // Otherwise, prevent default label behavior and isolate to this type
            e.preventDefault();
            e.stopPropagation();
            
            const placeType = checkbox.value;
            
            // Isolate: deselect all others, select only this one
            checkboxes.forEach(cb => {
                if (cb !== checkbox) {
                    cb.checked = false;
                    appState.activeFilters.delete(cb.value);
                }
            });
            
            checkbox.checked = true;
            appState.activeFilters.clear();
            appState.activeFilters.add(placeType);
            console.log('Row clicked - isolated to:', placeType, 'activeFilters:', Array.from(appState.activeFilters));
            // Call update immediately
            updateMapDisplayInternal();
        });
    });
    
    // Select All button
    const selectAllBtn = document.getElementById('selectAllBtn');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
            checkboxes.forEach(cb => {
                cb.checked = true;
                appState.activeFilters.add(cb.value);
            });
            console.log('Select All clicked - activeFilters:', Array.from(appState.activeFilters));
            // Call update immediately
            updateMapDisplayInternal();
        });
    }
    
    console.log('Filter controls setup complete. Found', checkboxes.length, 'checkboxes');
}

/**
 * Setup floating controls handlers
 */
function setupTopControls() {
    // Go button - search and navigate
    const goBtn = document.getElementById('goBtn');
    const searchInput = document.getElementById('neighborhoodSearch');
    
    if (goBtn && searchInput) {
        const handleGo = () => {
            const query = searchInput.value.trim();
            if (query && appState.neighborhoodAutocomplete) {
                // Trigger search if autocomplete is available
                if (typeof appState.neighborhoodAutocomplete.getPlace === 'function') {
                    // Classic autocomplete - trigger place_changed
                    const place = appState.neighborhoodAutocomplete.getPlace();
                    if (place && place.geometry && appState.map) {
                        appState.map.setCenter(place.geometry.location);
                        appState.map.setZoom(CONFIG.MAP_NEIGHBORHOOD_ZOOM);
                    }
                }
            } else if (query && appState.geocoder) {
                // Fallback: geocode the search term
                appState.geocoder.geocode({ address: query + ', Chicago, IL' }, (results, status) => {
                    if (status === 'OK' && results[0] && appState.map) {
                        appState.map.setCenter(results[0].geometry.location);
                        appState.map.setZoom(CONFIG.MAP_NEIGHBORHOOD_ZOOM);
                    }
                });
            }
        };
        
        goBtn.addEventListener('click', handleGo);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleGo();
            }
        });
    }
    
    // Panel header and toggle button - collapse/expand recommendations panel
    const panelHeader = document.getElementById('panelHeader');
    const panelToggle = document.getElementById('panelToggle');
    if (panelHeader && recommendationsPanel) {
        // Make entire header clickable
        panelHeader.addEventListener('click', (e) => {
            // Only toggle if not clicking the toggle button itself (to avoid double toggle)
            if (e.target === panelToggle || panelToggle.contains(e.target)) {
                return; // Let the toggle button handle it
            }
            const isExpanded = recommendationsPanel.classList.contains('expanded');
            if (isExpanded) {
                recommendationsPanel.classList.remove('expanded');
                if (panelToggle) panelToggle.setAttribute('aria-expanded', 'false');
            } else {
                recommendationsPanel.classList.add('expanded');
                if (panelToggle) panelToggle.setAttribute('aria-expanded', 'true');
            }
        });
        
        // Also handle toggle button click
        if (panelToggle) {
            panelToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const isExpanded = recommendationsPanel.classList.contains('expanded');
                if (isExpanded) {
                    recommendationsPanel.classList.remove('expanded');
                    panelToggle.setAttribute('aria-expanded', 'false');
                } else {
                    recommendationsPanel.classList.add('expanded');
                    panelToggle.setAttribute('aria-expanded', 'true');
                }
            });
        }
    }
    
    // Add button - open modal
    const addBtn = document.getElementById('addBtn');
    const addModal = document.getElementById('addModal');
    
    if (addBtn && addModal) {
        addBtn.addEventListener('click', () => {
            addModal.classList.add('show');
            // Initialize autocomplete when modal opens (lazy initialization)
            if (!appState.autocomplete) {
                initializeAutocomplete();
            }
        });
    }
    
    // Close modal button
    const closeModal = document.getElementById('closeModal');
    if (closeModal && addModal) {
        closeModal.addEventListener('click', () => {
            addModal.classList.remove('show');
        });
        
        // Close modal when clicking outside
        addModal.addEventListener('click', (e) => {
            if (e.target === addModal) {
                addModal.classList.remove('show');
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && addModal.classList.contains('show')) {
                addModal.classList.remove('show');
            }
        });
    }
}

/**
 * Download map as image
 */
async function downloadMap() {
    try {
        if (typeof html2canvas === 'undefined') {
            throw new Error('html2canvas library not loaded');
        }
        
        const mapDiv = document.getElementById('map');
        if (!mapDiv) return;
        
        const canvas = await html2canvas(mapDiv, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true
        });
        
        canvas.toBlob((blob) => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `chicago-hotspots-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }, 'image/png');
    } catch (error) {
        console.error('Error downloading map:', error);
        alert('Error downloading map. Please try again.');
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize all app components
 */
function initializeApp() {
    console.log('Initializing app...');
    
    try {
        initializeMap();
        
        // Only initialize if map is ready
        if (appState.mapInitialized) {
            // Initialize search in top bar
            // Wait a bit for Places API to be fully loaded
            setTimeout(() => {
                initializeNeighborhoodSearch();
            }, 300);
            
            // Setup UI controls
            setupFilterControls();
            setupTopControls();
            
            // Setup submit button
            const submitBtn = document.getElementById('submitRecommendationBtn');
            if (submitBtn) {
                submitBtn.addEventListener('click', handleRecommendationSubmit);
            }
            
            // Load recommendations after a short delay to ensure map is rendered
            setTimeout(() => {
                loadAllRecommendations();
                // Initialize panel info
                updateMapInfo();
            }, 200);
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        console.error('Failed to initialize application. Please refresh the page.');
    }
}

/**
 * Initialize the application - called by Google Maps API callback
 * Must be defined globally before the API script loads
 */
window.initMap = function() {
    console.log('initMap called by Google Maps API');
    
    // Ensure DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeApp();
        });
    } else {
        // DOM is already ready
        initializeApp();
    }
};

// Ensure initMap is available immediately
if (typeof window.initMap === 'undefined') {
    window.initMap = function() {
        console.log('initMap fallback called');
        initializeApp();
    };
}

