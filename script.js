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
        this.clickableCircles = []; // Cache clickable circles for faster click detection
        this.heatmapLayers = {};
        this.currentInfoWindow = null; // Track open info window
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
        // Clear heatmap circles from map - ensure all are removed
        if (this.heatmapCircles && this.heatmapCircles.length > 0) {
            this.heatmapCircles.forEach(circle => {
                try {
                    if (circle && typeof circle.setMap === 'function') {
                        circle.setMap(null);
                    }
                } catch (err) {
                    console.warn('Error removing circle:', err);
                }
            });
        }
        this.heatmapCircles = [];
        this.clickableCircles = []; // Clear clickable circles cache
        // Clear metadata
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
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Group recommendations by neighborhood and calculate average coordinates
 * @param {Array} recommendations - Array of recommendations
 * @returns {Object} Object with neighborhood names as keys and cluster data as values
 */
function groupByNeighborhood(recommendations) {
    const neighborhoods = {};
    
    recommendations.forEach(rec => {
        const neighborhood = rec.location_name || 'Unknown';
        
        if (!neighborhoods[neighborhood]) {
            neighborhoods[neighborhood] = {
                name: neighborhood,
                recommendations: [],
                totalLat: 0,
                totalLng: 0,
                count: 0
            };
        }
        
        neighborhoods[neighborhood].recommendations.push(rec);
        neighborhoods[neighborhood].totalLat += rec.latitude;
        neighborhoods[neighborhood].totalLng += rec.longitude;
        neighborhoods[neighborhood].count++;
    });
    
    // Calculate average coordinates for each neighborhood
    Object.values(neighborhoods).forEach(neighborhood => {
        neighborhood.center = {
            lat: neighborhood.totalLat / neighborhood.count,
            lng: neighborhood.totalLng / neighborhood.count
        };
        // Clean up temporary properties
        delete neighborhood.totalLat;
        delete neighborhood.totalLng;
    });
    
    return neighborhoods;
}

/**
 * Find all overlapping hotspots at a given location
 * @param {number} lat - Latitude of clicked point
 * @param {number} lng - Longitude of clicked point
 * @returns {Object} Object with place types as keys, containing overlapping hotspot data
 */
// Cache for clickable circles to speed up overlap detection
let clickableCirclesCache = null;

/**
 * Build cache of clickable circles for faster lookup
 */
function buildClickableCirclesCache() {
    clickableCirclesCache = appState.clickableCircles.filter(
        circle => circle.clickable && circle.neighborhoodData && circle.center && circle.baseRadius
    );
}

/**
 * Find all overlapping hotspots at a given location (optimized with caching)
 * @param {number} lat - Latitude of clicked point
 * @param {number} lng - Longitude of clicked point
 * @returns {Object} Object with place types as keys, containing overlapping hotspot data
 */
function findOverlappingHotspots(lat, lng) {
    const overlapping = {};
    
    // Use cached clickable circles for faster lookup
    const circlesToCheck = clickableCirclesCache || appState.clickableCircles;
    const tolerance = 1.1; // Pre-compute tolerance multiplier
    
    // Optimized: Use for loop instead of forEach for better performance
    for (let i = 0; i < circlesToCheck.length; i++) {
        const circle = circlesToCheck[i];
        
        // Get center coordinates - handle both LatLng object and plain object
        let centerLat, centerLng;
        if (circle.center) {
            if (typeof circle.center.lat === 'function') {
                centerLat = circle.center.lat();
                centerLng = circle.center.lng();
            } else {
                centerLat = circle.center.lat;
                centerLng = circle.center.lng;
            }
        } else {
            continue; // Skip if no center
        }
        
        // Quick bounds check first (approximate, faster than full distance calculation)
        const latDiff = Math.abs(lat - centerLat);
        const lngDiff = Math.abs(lng - centerLng);
        const maxRadius = circle.baseRadius * tolerance;
        
        // Skip if clearly outside bounds (quick rejection)
        if (latDiff * 111000 > maxRadius || lngDiff * 111000 * Math.cos(lat * Math.PI / 180) > maxRadius) {
            continue;
        }
        
        // Calculate exact distance only if within approximate bounds
        const distance = calculateDistance(lat, lng, centerLat, centerLng);
        
        if (distance <= maxRadius) {
            const placeType = circle.placeType;
            
            if (!overlapping[placeType]) {
                overlapping[placeType] = {
                    placeType: placeType,
                    neighborhoods: []
                };
            }
            
            // Check if we already have this neighborhood (avoid duplicates)
            const neighborhoodName = circle.neighborhoodData.name;
            let alreadyAdded = false;
            for (let j = 0; j < overlapping[placeType].neighborhoods.length; j++) {
                if (overlapping[placeType].neighborhoods[j].name === neighborhoodName) {
                    alreadyAdded = true;
                    break;
                }
            }
            
            if (!alreadyAdded) {
                overlapping[placeType].neighborhoods.push(circle.neighborhoodData);
            }
        }
    }
    
    return overlapping;
}

/**
 * Show hotspot modal with all overlapping hotspots in one unified view
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Object} overlappingHotspots - Object with place types as keys
 */
function showHotspotModal(lat, lng, overlappingHotspots) {
    const modal = document.getElementById('hotspotModal');
    const modalBody = document.getElementById('hotspotModalBody');
    const modalTitle = document.getElementById('hotspotModalTitle');
    
    if (!modal || !modalBody) {
        console.error('Hotspot modal elements not found');
        return;
    }
    
    // Debug logging
    console.log('Showing hotspot modal with', Object.keys(overlappingHotspots).length, 'types');
    
    // Collect all recommendations from all overlapping hotspots
    const allRecommendations = [];
    const typeCounts = {};
    
    Object.keys(overlappingHotspots).forEach(placeType => {
        const typeData = overlappingHotspots[placeType];
        let typeCount = 0;
        
        typeData.neighborhoods.forEach(neighborhood => {
            neighborhood.recommendations.forEach(rec => {
                // Add place type to each recommendation for display
                const recWithType = {
                    ...rec,
                    place_type: placeType
                };
                allRecommendations.push(recWithType);
                typeCount++;
            });
        });
        
        typeCounts[placeType] = typeCount;
    });
    
    const totalRecommendations = allRecommendations.length;
    
    // Set title
    if (modalTitle) {
        modalTitle.textContent = `${totalRecommendations} Recommendation${totalRecommendations !== 1 ? 's' : ''} at This Location`;
    }
    
    // Generate content - simple unified list
    let content = '<div class="hotspot-summary">';
    
    // Summary by type at top
    if (Object.keys(typeCounts).length > 1) {
        content += '<div class="hotspot-type-summary">';
        Object.keys(typeCounts).sort().forEach(placeType => {
            const color = PLACE_TYPE_COLORS[placeType] || '#667eea';
            const typeLabel = getPlaceTypeLabel(placeType);
            const count = typeCounts[placeType];
            content += `
                <div class="hotspot-type-item">
                    <span class="hotspot-type-dot" style="background: ${color};"></span>
                    <span class="hotspot-type-label">${escapeHtml(typeLabel)}</span>
                    <span class="hotspot-type-count">${count}</span>
                </div>
            `;
        });
        content += '</div>';
    }
    
    // All recommendations in one list, grouped by place name
    content += '<div class="hotspot-recommendations">';
    content += '<h3 class="hotspot-recommendations-title">Recommendations</h3>';
    content += '<ul class="hotspot-recommendations-list">';
    
    // Group by place name
    const byPlace = {};
    allRecommendations.forEach(rec => {
        const key = rec.place_name || rec.location_name || 'Unknown';
        if (!byPlace[key]) {
            byPlace[key] = [];
        }
        byPlace[key].push(rec);
    });
    
    // Sort by place name and display
    Object.keys(byPlace).sort().forEach(placeName => {
        const recs = byPlace[placeName];
        const firstRec = recs[0];
        const location = firstRec.location_name || 'Unknown location';
        const placeType = firstRec.place_type;
        const color = PLACE_TYPE_COLORS[placeType] || '#667eea';
        const typeLabel = getPlaceTypeLabel(placeType);
        const count = recs.length > 1 ? ` <span class="rec-count">(${recs.length})</span>` : '';
        
        content += `
            <li class="hotspot-recommendation-item">
                <div class="rec-header">
                    <span class="rec-type-dot" style="background: ${color};"></span>
                    <strong class="rec-name">${escapeHtml(placeName)}</strong>${count}
                </div>
                <div class="rec-details">
                    <span class="rec-type">${escapeHtml(typeLabel)}</span>
                    <span class="rec-separator">•</span>
                    <span class="rec-location">${escapeHtml(location)}</span>
                </div>
            </li>
        `;
    });
    
    content += '</ul></div></div>';
    
    modalBody.innerHTML = content;
    modal.style.display = 'flex';
}


/**
 * Create info window content for neighborhood hotspot
 * @param {Object} neighborhood - Neighborhood cluster data
 * @param {string} placeType - Place type
 * @returns {string} HTML content for info window
 */
function createNeighborhoodInfoContent(neighborhood, placeType) {
    const color = PLACE_TYPE_COLORS[placeType] || '#667eea';
    const typeLabel = getPlaceTypeLabel(placeType);
    
    // Group recommendations by place name for display
    const byPlace = {};
    neighborhood.recommendations.forEach(rec => {
        const key = rec.place_name || rec.location_name;
        if (!byPlace[key]) {
            byPlace[key] = [];
        }
        byPlace[key].push(rec);
    });
    
    let content = `
        <div style="padding: 10px; max-width: 300px; max-height: 400px; overflow-y: auto;">
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 18px; font-weight: 600;">
                ${escapeHtml(neighborhood.name)}
            </h3>
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                <span style="display: inline-block; width: 14px; height: 14px; background: ${color}; border-radius: 50%; margin-right: 5px; vertical-align: middle;"></span>
                ${escapeHtml(typeLabel)}: ${neighborhood.count} recommendations
            </p>
            <div style="border-top: 1px solid #eee; padding-top: 10px;">
                <h4 style="margin: 0 0 8px 0; color: #333; font-size: 14px; font-weight: 600;">Recommendations:</h4>
                <ul style="margin: 0; padding-left: 20px; list-style: none;">
    `;
    
    Object.keys(byPlace).sort().forEach(placeName => {
        const recs = byPlace[placeName];
        const count = recs.length > 1 ? ` (${recs.length})` : '';
        content += `
            <li style="margin: 4px 0; color: #555; font-size: 13px;">
                • ${escapeHtml(placeName)}${count}
            </li>
        `;
    });
    
    content += `
                </ul>
            </div>
        </div>
    `;
    
    return content;
}

/**
 * Create visual heatmap effect using neighborhood-based circles with blur effect
 * Each hotspot is positioned based ONLY on recommendations of this specific type in that neighborhood
 * Optimized for faster rendering with batched circle creation
 * @param {string} placeType - Place type
 * @param {Array} recommendations - Array of recommendations (already filtered by this type)
 */
async function createHeatmapLayer(placeType, recommendations) {
    if (!recommendations || recommendations.length === 0) return;
    
    const color = PLACE_TYPE_COLORS[placeType] || '#667eea';
    
    // Group by neighborhood - this ensures each hotspot is based ONLY on this type's recommendations
    const neighborhoods = groupByNeighborhood(recommendations);
    
    // Calculate min and max counts for linear scaling
    const neighborhoodArray = Object.values(neighborhoods);
    if (neighborhoodArray.length === 0) return;
    
    const counts = neighborhoodArray.map(n => n.count);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);
    const countRange = maxCount - minCount;
    
    // Batch circle creation for better performance
    const circlesToAdd = [];
    
    // Create heatmap circles for each neighborhood
    neighborhoodArray.forEach(neighborhood => {
        // Base radius calculation: uses LINEAR scaling for proportional size variation
        // Range: 50m minimum (for min count) up to 500m maximum (for max count)
        // Linear scaling: directly proportional to recommendation count
        let linearScale = 0;
        if (countRange > 0) {
            // Normalize count to 0-1 range: (count - min) / (max - min)
            linearScale = (neighborhood.count - minCount) / countRange;
        } else {
            // If all neighborhoods have the same count, use middle size
            linearScale = 0.5;
        }
        // Map to radius range: 120m (min) to 500m (max) - increased min for better visibility
        const baseRadius = 120 + (linearScale * 380); // Linear: 120m to 500m range
        
        // Create multiple overlapping circles with smooth gradient fade for blur effect
        // Optimized: Reduced to 10 layers for faster rendering while maintaining smooth gradient
        const blurLayers = 10; // Reduced from 15 for better performance
        const blurStep = baseRadius * 0.08; // Larger step for fewer layers
        
        // Create blur layers (outer to inner) with Gaussian-like smooth opacity gradient
        for (let i = blurLayers - 1; i >= 0; i--) {
            const layerRadius = baseRadius + (blurStep * i);
            // Gaussian-like opacity distribution for smoother fade
            // Distance from center (normalized): 0 = center, 1 = edge
            const distanceFromCenter = i / blurLayers; // 0 (center) to 1 (outermost)
            // Gaussian curve: e^(-x²/2σ²) where σ controls the spread
            const sigma = 0.4; // Controls how quickly opacity drops (lower = sharper, higher = smoother)
            const gaussian = Math.exp(-Math.pow(distanceFromCenter, 2) / (2 * Math.pow(sigma, 2)));
            // Apply smooth gradient with max opacity of 0.6 for better visibility
            const layerOpacity = gaussian * 0.6;
            
            // Ensure center is a proper LatLng object
            const center = new google.maps.LatLng(
                neighborhood.center.lat,
                neighborhood.center.lng
            );
            
            const circle = new google.maps.Circle({
                strokeColor: 'transparent', // Explicitly transparent to avoid any dark edges
                strokeOpacity: 0, // No stroke/edges
                strokeWeight: 0,
                fillColor: color,
                fillOpacity: layerOpacity,
                map: appState.map,
                center: center, // Use proper LatLng object
                radius: layerRadius,
                zIndex: 1 + i, // Outer layers behind inner layers
                clickable: i === 0 // Only innermost circle is clickable
            });
            
            // Only add click listener to the innermost circle
            if (i === 0) {
                // Create info window for this neighborhood
                const infoContent = createNeighborhoodInfoContent(neighborhood, placeType);
                const infoWindow = new google.maps.InfoWindow({
                    content: infoContent
                });
                
                // Store neighborhood data with the main circle BEFORE adding listener
                circle.neighborhoodData = neighborhood;
                circle.placeType = placeType; // Store place type for finding overlaps
                circle.baseRadius = baseRadius; // Store base radius for overlap detection
                circle.center = center; // Store center (LatLng object) for overlap detection
                
                // Add to clickable circles cache for faster lookup
                appState.clickableCircles.push(circle);
                
                // Add optimized click listener with throttling
                let clickTimeout = null;
                circle.addListener('click', (event) => {
                    // Throttle rapid clicks
                    if (clickTimeout) return;
                    clickTimeout = setTimeout(() => { clickTimeout = null; }, 100);
                    
                    // Get the clicked position from the event, or use circle center as fallback
                    let clickedLat, clickedLng;
                    if (event && event.latLng) {
                        clickedLat = event.latLng.lat();
                        clickedLng = event.latLng.lng();
                    } else {
                        // Fallback to circle center (faster)
                        clickedLat = circle.center.lat;
                        clickedLng = circle.center.lng;
                    }
                    
                    // Find all overlapping hotspots at this location (optimized)
                    const overlappingHotspots = findOverlappingHotspots(clickedLat, clickedLng);
                    
                    // Only show modal if we found overlapping hotspots
                    if (Object.keys(overlappingHotspots).length > 0) {
                        showHotspotModal(clickedLat, clickedLng, overlappingHotspots);
                    }
                });
            }
            
            circlesToAdd.push(circle);
        }
    });
    
    // Batch add all circles to the map at once for better performance
    circlesToAdd.forEach(circle => {
        appState.heatmapCircles.push(circle);
    });
    
    // Rebuild clickable circles cache after adding new circles
    buildClickableCirclesCache();
    
    // Store info for reference
    appState.heatmapLayers[placeType] = { 
        count: recommendations.length,
        neighborhoods: Object.keys(neighborhoods).length 
    };
}

/**
 * Update map display based on active filters
 */
async function updateMapDisplayInternal() {
    if (!appState.map) return;

    // Clear all existing markers first
    appState.resetMarkers();
    appState.resetHeatmaps();

    // Filter recommendations based on active filters
    appState.filteredRecommendations = appState.allRecommendations.filter(rec =>
        appState.activeFilters.has(rec.place_type)
    );

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

    // Create visual heatmap effect - batch creation for better performance
    // Process in chunks to avoid blocking the UI
    try {
        const placeTypes = Object.keys(byType);
        const chunkSize = 3; // Process 3 types at a time
        
        for (let i = 0; i < placeTypes.length; i += chunkSize) {
            const chunk = placeTypes.slice(i, i + chunkSize);
            const createPromises = chunk.map(placeType => 
                createHeatmapLayer(placeType, byType[placeType])
            );
            await Promise.all(createPromises);
            
            // Yield to browser between chunks for smoother rendering
            if (i + chunkSize < placeTypes.length) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        // Final cache rebuild after all layers are created
        buildClickableCirclesCache();
    } catch (err) {
        console.error('Error creating heatmap layers:', err);
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
            // Also close hotspot modal with Escape
            const hotspotModal = document.getElementById('hotspotModal');
            if (e.key === 'Escape' && hotspotModal && hotspotModal.style.display !== 'none') {
                hotspotModal.style.display = 'none';
            }
        });
        
        // Setup hotspot modal close button
        const hotspotModalClose = document.getElementById('hotspotModalClose');
        const hotspotModal = document.getElementById('hotspotModal');
        if (hotspotModalClose && hotspotModal) {
            hotspotModalClose.addEventListener('click', () => {
                hotspotModal.style.display = 'none';
            });
            
            // Close modal when clicking outside (on the overlay, but this is a sidebar so maybe not needed)
            // For sidebar, we'll just use the close button
        }
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

