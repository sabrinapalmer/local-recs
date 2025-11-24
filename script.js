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
        this.halftoneOverlays = []; // Store halftone overlays for cleanup
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
        // Clear halftone overlays
        if (this.halftoneOverlays && this.halftoneOverlays.length > 0) {
            this.halftoneOverlays.forEach(overlay => {
                try {
                    if (overlay && typeof overlay.setMap === 'function') {
                        overlay.setMap(null);
                    }
                } catch (err) {
                    console.warn('Error removing halftone overlay:', err);
                }
            });
        }
        this.heatmapCircles = [];
        this.halftoneOverlays = [];
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

        // Initialize Places Service
        if (google.maps.places && google.maps.places.PlacesService) {
            appState.placesService = new google.maps.places.PlacesService(appState.map);
            console.log('Places Service initialized successfully');
        } else {
            console.error('Places API not available. Please ensure Places API is enabled in Google Cloud Console.');
        }
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
        
        // Initialize HalftoneCircleOverlay class now that Google Maps is loaded
        if (!HalftoneCircleOverlay && typeof google !== 'undefined' && google.maps && google.maps.OverlayView) {
            HalftoneCircleOverlay = createHalftoneCircleOverlayClass();
        }
        
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

        // Note: Autocomplete is deprecated but still functional for existing customers
        // Suppressing deprecation warning by using it conditionally
        if (google.maps.places && google.maps.places.Autocomplete) {
            appState.autocomplete = new google.maps.places.Autocomplete(locationInput, {
                componentRestrictions: { country: 'us' },
                fields: ['geometry', 'formatted_address', 'name', 'place_id', 'types'],
                bounds: bounds,
                types: ['geocode', 'establishment'] // Allow both addresses and places
            });
        } else {
            console.warn('Google Maps Places Autocomplete not available');
        }

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
    
    // Get neighborhood name from first recommendation
    const firstNeighborhood = Object.values(overlappingHotspots)[0]?.neighborhoods[0];
    const neighborhoodName = firstNeighborhood?.name || 'Unknown Neighborhood';
    
    // Set title with neighborhood
    if (modalTitle) {
        modalTitle.innerHTML = `<div class="hotspot-modal-neighborhood">${escapeHtml(neighborhoodName)}</div><div class="hotspot-modal-subtitle">${totalRecommendations} Recommendation${totalRecommendations !== 1 ? 's' : ''} at This Location</div>`;
    }
    
    // Generate content with collapsible sections for each type
    let content = '<div class="hotspot-summary">';
    
    // Collapsible sections by type
    content += '<div class="hotspot-type-sections">';
    Object.keys(overlappingHotspots).sort().forEach(placeType => {
        const typeData = overlappingHotspots[placeType];
        const color = PLACE_TYPE_COLORS[placeType] || '#667eea';
        const typeLabel = getPlaceTypeLabel(placeType);
        const typeId = `hotspot-type-${placeType}`;
        const count = typeCounts[placeType];
        
        // Collect all recommendations for this type
        const typeRecommendations = [];
        typeData.neighborhoods.forEach(neighborhood => {
            neighborhood.recommendations.forEach(rec => {
                typeRecommendations.push(rec);
            });
        });
        
        content += `
            <div class="hotspot-type-section">
                <button class="hotspot-type-header" data-type-id="${typeId}">
                    <span class="hotspot-type-dot" style="background: ${color};"></span>
                    <span class="hotspot-type-name">${escapeHtml(typeLabel)}</span>
                    <span class="hotspot-type-count-badge">${count}</span>
                    <span class="hotspot-type-arrow" id="${typeId}-arrow">▼</span>
                </button>
                <div class="hotspot-type-content" id="${typeId}-content" style="display: none;">
                    <ul class="hotspot-recommendations-list">
        `;
        
        // Group by place name
        const byPlace = {};
        typeRecommendations.forEach(rec => {
            const key = rec.place_name || rec.location_name || 'Unknown';
            if (!byPlace[key]) {
                byPlace[key] = [];
            }
            byPlace[key].push(rec);
        });
        
        // Display recommendations for this type
        Object.keys(byPlace).sort().forEach(placeName => {
            const recs = byPlace[placeName];
            const firstRec = recs[0];
            const location = firstRec.location_name || 'Unknown location';
            const recCount = recs.length > 1 ? ` <span class="rec-count">(${recs.length})</span>` : '';
            const placeId = firstRec.place_id || null;
            const recId = `rec-${firstRec.id || Math.random().toString(36).substr(2, 9)}`;
            
            // Show button for all recommendations, but only enable if place_id exists
            // If no place_id, try to find it using PlacesService nearby search
            content += `
                <li class="hotspot-recommendation-item" data-place-id="${placeId || ''}" data-rec-id="${recId}" data-lat="${firstRec.latitude}" data-lng="${firstRec.longitude}" data-place-name="${escapeHtml(placeName)}">
                    <div class="rec-summary" id="${recId}-summary">
                        <div class="rec-header">
                            <strong class="rec-name">${escapeHtml(placeName)}</strong>${recCount}
                        </div>
                        <div class="rec-summary-info" id="${recId}-summary-info">
                            <div class="rec-loading">Loading...</div>
                        </div>
                        <div class="rec-expanded-details" id="${recId}-expanded-details" style="display: none;">
                            <!-- Expanded details will be inserted here -->
                        </div>
                    </div>
                </li>
            `;
        });
        
        content += `
                    </ul>
                </div>
            </div>
        `;
    });
    content += '</div></div>';
    
    modalBody.innerHTML = content;
    modal.style.display = 'flex';
    
    // Add click handlers for collapsible sections (accordion behavior)
    const typeHeaders = modalBody.querySelectorAll('.hotspot-type-header');
    typeHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const typeId = this.getAttribute('data-type-id');
            const content = document.getElementById(`${typeId}-content`);
            const arrow = document.getElementById(`${typeId}-arrow`);
            
            if (content && arrow) {
                const isExpanded = content.style.display !== 'none';
                
                // Close all other type sections first (accordion behavior)
                typeHeaders.forEach(otherHeader => {
                    if (otherHeader !== this) {
                        const otherTypeId = otherHeader.getAttribute('data-type-id');
                        const otherContent = document.getElementById(`${otherTypeId}-content`);
                        const otherArrow = document.getElementById(`${otherTypeId}-arrow`);
                        if (otherContent && otherArrow) {
                            otherContent.style.display = 'none';
                            otherArrow.textContent = '▼';
                            otherHeader.classList.remove('expanded');
                        }
                    }
                });
                
                // Toggle this one
                if (isExpanded) {
                    content.style.display = 'none';
                    arrow.textContent = '▼';
                    this.classList.remove('expanded');
                } else {
                    content.style.display = 'block';
                    arrow.textContent = '▲';
                    this.classList.add('expanded');
                }
            }
        });
    });
    
    // Load all place details in bulk
    loadAllPlaceDetails(modalBody);
    
    // Add click handlers for recommendation rows (accordion behavior)
    setTimeout(() => {
        const recommendationItems = modalBody.querySelectorAll('.hotspot-recommendation-item');
        recommendationItems.forEach(item => {
            item.style.cursor = 'pointer';
            item.addEventListener('click', function(e) {
                // Don't trigger if clicking on links or buttons inside
                if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a') || e.target.closest('button')) {
                    return;
                }
                
                const recId = this.getAttribute('data-rec-id');
                const expandedDetailsDiv = document.getElementById(`${recId}-expanded-details`);
                const summaryDiv = document.getElementById(`${recId}-summary`);
                
                if (!expandedDetailsDiv || !summaryDiv) return;
                
                const isExpanded = expandedDetailsDiv.style.display !== 'none';
                
                // Close all other recommendations first (accordion behavior)
                recommendationItems.forEach(otherItem => {
                    if (otherItem !== this) {
                        const otherRecId = otherItem.getAttribute('data-rec-id');
                        const otherExpandedDiv = document.getElementById(`${otherRecId}-expanded-details`);
                        const otherSummaryDiv = document.getElementById(`${otherRecId}-summary`);
                        if (otherExpandedDiv && otherSummaryDiv) {
                            otherExpandedDiv.style.display = 'none';
                            otherSummaryDiv.classList.remove('expanded');
                        }
                    }
                });
                
                // Toggle this one
                if (isExpanded) {
                    expandedDetailsDiv.style.display = 'none';
                    summaryDiv.classList.remove('expanded');
                } else {
                    expandedDetailsDiv.style.display = 'block';
                    summaryDiv.classList.add('expanded');
                }
            });
        });
    }, 100);
}

/**
 * Initialize photo carousel for a recommendation
 * @param {string} recId - Recommendation ID
 * @param {Object} place - Place details object
 */
function initializePhotoCarousel(recId, place) {
    if (!place.photos || place.photos.length <= 1) return;
    
    const carousel = document.getElementById(`${recId}-carousel`);
    if (!carousel) return;
    
    const photos = JSON.parse(carousel.getAttribute('data-photos'));
    const prevBtn = document.getElementById(`${recId}-carousel-prev`);
    const nextBtn = document.getElementById(`${recId}-carousel-next`);
    const img = document.getElementById(`${recId}-carousel-img`);
    const indicator = carousel.querySelector('.carousel-indicator');
    let currentIndex = 0;
    
    const updateCarousel = (index) => {
        if (index < 0) index = photos.length - 1;
        if (index >= photos.length) index = 0;
        currentIndex = index;
        
        if (img) {
            // Smooth fade transition
            img.style.transition = 'opacity 0.3s ease-in-out';
            img.style.opacity = '0';
            setTimeout(() => {
                img.src = photos[index].url;
                img.style.opacity = '1';
            }, 150);
        }
        
        if (indicator) {
            indicator.textContent = `${index + 1} / ${photos.length}`;
        }
        
        carousel.setAttribute('data-current', index);
    };
    
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            updateCarousel(currentIndex - 1);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            updateCarousel(currentIndex + 1);
        });
    }
    
    // Make photo clickable to advance
    if (img) {
        img.style.cursor = 'pointer';
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            updateCarousel(currentIndex + 1);
        });
    }
    
    // Keyboard navigation
    carousel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            e.stopPropagation();
            updateCarousel(currentIndex - 1);
        } else if (e.key === 'ArrowRight') {
            e.stopPropagation();
            updateCarousel(currentIndex + 1);
        }
    });
    
    // Make carousel focusable for keyboard
    carousel.setAttribute('tabindex', '0');
}

/**
 * Update place summary with key information
 * @param {string} recId - Recommendation ID
 * @param {Object} place - Place details object
 */
function updatePlaceSummary(recId, place) {
    const summaryInfo = document.getElementById(`${recId}-summary-info`);
    if (!summaryInfo) return;
    
    // Horizontal layout for collapsed state: thumbnail on LEFT, info on RIGHT
    let summaryHtml = '<div class="rec-summary-content rec-summary-collapsed">';
    
    // Thumbnail photo on LEFT (only when collapsed) - 80x80px square
    if (place.photos && place.photos.length > 0) {
        const photo = place.photos[0];
        const thumbnailUrl = photo.getUrl({ maxWidth: 150, maxHeight: 150 });
        summaryHtml += `
            <div class="rec-summary-photo rec-thumbnail-container">
                <img src="${thumbnailUrl}" alt="${escapeHtml(place.name)}" class="rec-thumbnail">
            </div>
        `;
    }
    
    summaryHtml += '<div class="rec-summary-info-text">';
    
    // Name (bold) - shown first
    summaryHtml += `<div class="rec-summary-name"><strong>${escapeHtml(place.name)}</strong></div>`;
    
    // Address (shortened)
    if (place.formatted_address) {
        const shortAddress = place.formatted_address.split(',')[0]; // Just street address
        summaryHtml += `<div class="rec-summary-address">${escapeHtml(shortAddress)}</div>`;
    }
    
    // Rating
    if (place.rating !== undefined) {
        const stars = '⭐'.repeat(Math.round(place.rating));
        const ratingText = place.user_ratings_total 
            ? `${place.rating.toFixed(1)} ${stars} (${place.user_ratings_total.toLocaleString()} reviews)`
            : `${place.rating.toFixed(1)} ${stars}`;
        summaryHtml += `<div class="rec-summary-rating">${ratingText}</div>`;
    }
    
    // Opening status with next time
    if (place.opening_hours) {
        const isOpen = place.opening_hours.isOpen ? place.opening_hours.isOpen() : null;
        if (isOpen !== null) {
            let statusText = isOpen ? 'Open now' : 'Closed now';
            const statusColor = isOpen ? '#27ae60' : '#e74c3c';
            
            // Get next open/close time if available
            if (place.opening_hours.weekday_text && place.opening_hours.weekday_text.length > 0) {
                const now = new Date();
                const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
                const currentTime = now.getHours() * 100 + now.getMinutes();
                
                // Try to find next time from weekday_text
                if (!isOpen) {
                    // Closed - find when it opens next
                    for (let i = 0; i < 7; i++) {
                        const checkDay = (currentDay + i) % 7;
                        const dayText = place.opening_hours.weekday_text[checkDay];
                        if (dayText && dayText.includes(':')) {
                            const match = dayText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/);
                            if (match) {
                                let hours = parseInt(match[1]);
                                const minutes = parseInt(match[2]);
                                const ampm = match[3];
                                if (ampm === 'PM' && hours !== 12) hours += 12;
                                if (ampm === 'AM' && hours === 12) hours = 0;
                                const openTime = hours * 100 + minutes;
                                
                                if (i === 0 && openTime > currentTime) {
                                    statusText += ` • Opens at ${match[1]}:${match[2]} ${ampm}`;
                                    break;
                                } else if (i > 0) {
                                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                    statusText += ` • Opens ${dayNames[checkDay]} at ${match[1]}:${match[2]} ${ampm}`;
                                    break;
                                }
                            }
                        }
                    }
                } else {
                    // Open - find when it closes
                    const dayText = place.opening_hours.weekday_text[currentDay];
                    if (dayText && dayText.includes('–')) {
                        const parts = dayText.split('–');
                        if (parts.length > 1) {
                            const closeMatch = parts[1].match(/(\d{1,2}):(\d{2})\s*(AM|PM)/);
                            if (closeMatch) {
                                let hours = parseInt(closeMatch[1]);
                                const minutes = parseInt(closeMatch[2]);
                                const ampm = closeMatch[3];
                                if (ampm === 'PM' && hours !== 12) hours += 12;
                                if (ampm === 'AM' && hours === 12) hours = 0;
                                statusText += ` • Closes at ${closeMatch[1]}:${closeMatch[2]} ${ampm}`;
                            }
                        }
                    }
                }
            }
            
            summaryHtml += `<div class="rec-summary-status" style="color: ${statusColor};">${statusText}</div>`;
        }
    }
    
    summaryHtml += '</div></div>';
    summaryInfo.innerHTML = summaryHtml;
}

/**
 * Load place details for all recommendations in bulk
 * @param {HTMLElement} modalBody - The modal body element
 */
async function loadAllPlaceDetails(modalBody) {
    const recommendationItems = modalBody.querySelectorAll('.hotspot-recommendation-item');
    const detailsPromises = [];
    
    // Collect all items that need details
    recommendationItems.forEach(item => {
        const recId = item.getAttribute('data-rec-id');
        let placeId = item.getAttribute('data-place-id');
        const needsLookup = item.querySelector('.rec-load-details-btn')?.getAttribute('data-needs-lookup') === 'true';
        const lat = parseFloat(item.getAttribute('data-lat'));
        const lng = parseFloat(item.getAttribute('data-lng'));
        const placeName = item.getAttribute('data-place-name');
        const expandedDetailsDiv = document.getElementById(`${recId}-expanded-details`);
        
        if (!expandedDetailsDiv) return;
        
        // Keep details hidden by default (will show when clicked)
        expandedDetailsDiv.style.display = 'none';
        expandedDetailsDiv.innerHTML = '<div class="rec-loading">Loading details...</div>';
        
        // Create promise for this item
        const detailPromise = (async () => {
            try {
                // If no place_id, try to find it
                if ((!placeId || placeId === '') && needsLookup && lat && lng) {
                    try {
                        console.log(`Attempting to find place_id for: ${placeName} at (${lat}, ${lng})`);
                        placeId = await findPlaceIdByLocation(lat, lng, placeName);
                        if (placeId) {
                            console.log(`Found place_id: ${placeId} for ${placeName}`);
                            item.setAttribute('data-place-id', placeId);
                            const button = item.querySelector('.rec-load-details-btn');
                            if (button) {
                                button.setAttribute('data-place-id', placeId);
                                button.removeAttribute('data-needs-lookup');
                            }
                        } else {
                            console.warn(`No place_id found for ${placeName}`);
                        }
                    } catch (error) {
                        console.warn(`Could not find place_id for ${placeName}:`, error);
                    }
                }
                
                // Fetch details if we have a place_id
                if (placeId && placeId !== '') {
                    try {
                        console.log(`Fetching place details for place_id: ${placeId}`);
                        const placeDetails = await fetchPlaceDetails(placeId);
                        console.log(`Successfully fetched details for ${placeName}:`, placeDetails);
                        
                        // Update summary with key info
                        updatePlaceSummary(recId, placeDetails);
                        
                        // Store expanded details (without photo since it's already in summary)
                        expandedDetailsDiv.innerHTML = formatExpandedDetails(placeDetails, recId);
                        
                        // Initialize photo carousel if it exists
                        initializePhotoCarousel(recId, placeDetails);
                    } catch (error) {
                        console.error(`Error fetching place details for ${placeName} (place_id: ${placeId}):`, error);
                        const summaryInfo = document.getElementById(`${recId}-summary-info`);
                        if (summaryInfo) {
                            summaryInfo.innerHTML = `<div class="rec-error-small">Details unavailable</div>`;
                        }
                        expandedDetailsDiv.innerHTML = `<div class="rec-error">Unable to load details: ${error.message}</div>`;
                    }
                } else {
                    // No place_id available - try text search as fallback
                    console.warn(`No place_id for ${placeName}, attempting text search fallback`);
                    try {
                        const textSearchPlaceId = await findPlaceByTextSearch(placeName, lat, lng);
                        if (textSearchPlaceId) {
                            console.log(`Found place via text search: ${textSearchPlaceId}`);
                            const placeDetails = await fetchPlaceDetails(textSearchPlaceId);
                            
                            // Update summary
                            updatePlaceSummary(recId, placeDetails);
                            
                            // Store expanded details (without photo since it's already in summary)
                            expandedDetailsDiv.innerHTML = formatExpandedDetails(placeDetails, recId);
                            
                            // Initialize photo carousel if it exists
                            initializePhotoCarousel(recId, placeDetails);
                        } else {
                            throw new Error('Text search also failed');
                        }
                    } catch (error) {
                        console.error(`All methods failed for ${placeName}:`, error);
                        const summaryInfo = document.getElementById(`${recId}-summary-info`);
                        if (summaryInfo) {
                            summaryInfo.innerHTML = `<div class="rec-error-small">Details unavailable</div>`;
                        }
                        expandedDetailsDiv.innerHTML = `<div class="rec-error">Place details not available. This location may not be in Google Places database.</div>`;
                    }
                }
            } catch (error) {
                console.error(`Error loading details for ${recId}:`, error);
                const expandedDetailsDiv = document.getElementById(`${recId}-expanded-details`);
                if (expandedDetailsDiv) {
                    expandedDetailsDiv.innerHTML = `<div class="rec-error">Unable to load details: ${error.message}</div>`;
                }
                const button = item.querySelector('.rec-load-details-btn');
                if (button) {
                    button.style.display = 'none';
                }
            }
        })();
        
        detailsPromises.push(detailPromise);
    });
    
    // Wait for all details to load (with timeout to prevent hanging)
    try {
        await Promise.allSettled(detailsPromises);
    } catch (error) {
        console.error('Error loading place details in bulk:', error);
    }
}

/**
 * Handle showing place details
 * @param {HTMLElement} button - The button element that triggered the action
 */
async function handleShowDetails(button) {
    let placeId = button.getAttribute('data-place-id');
    const recId = button.getAttribute('data-rec-id');
    const detailsDiv = document.getElementById(`${recId}-details`);
    const needsLookup = button.getAttribute('data-needs-lookup') === 'true';
    
    if (!detailsDiv) {
        console.warn('Missing detailsDiv', { recId });
        return;
    }
    
    // If no place_id but we have coordinates, try to find it
    if ((!placeId || placeId === '') && needsLookup) {
        const lat = parseFloat(button.getAttribute('data-lat'));
        const lng = parseFloat(button.getAttribute('data-lng'));
        const placeName = button.getAttribute('data-place-name');
        
        if (lat && lng) {
            try {
                placeId = await findPlaceIdByLocation(lat, lng, placeName);
                if (placeId) {
                    button.setAttribute('data-place-id', placeId);
                    button.removeAttribute('data-needs-lookup');
                }
            } catch (error) {
                console.warn('Could not find place_id:', error);
            }
        }
    }
    
    if (!placeId || placeId === '') {
        detailsDiv.style.display = 'block';
        detailsDiv.innerHTML = '<div class="rec-error">Place details not available. This location may not be in Google Places database.</div>';
        return;
    }
    
    // Toggle details visibility
    const isVisible = detailsDiv.style.display !== 'none';
    if (isVisible) {
        detailsDiv.style.display = 'none';
        button.textContent = placeId ? 'Show Details' : 'Find Details';
    } else {
        // Show loading state
        detailsDiv.style.display = 'block';
        button.textContent = 'Loading...';
        button.disabled = true;
        
        try {
            // Fetch place details
            const placeDetails = await fetchPlaceDetails(placeId);
            detailsDiv.innerHTML = formatPlaceDetails(placeDetails);
            button.textContent = 'Hide Details';
        } catch (error) {
            console.error('Error fetching place details:', error);
            detailsDiv.innerHTML = `<div class="rec-error">Unable to load details: ${error.message}. Please try again later.</div>`;
            button.textContent = placeId ? 'Show Details' : 'Find Details';
        } finally {
            button.disabled = false;
        }
    }
}

/**
 * Find place_id by location using PlacesService nearby search
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} placeName - Name of the place to search for
 * @returns {Promise<string|null>} Place ID or null if not found
 */
function findPlaceIdByLocation(lat, lng, placeName) {
    return new Promise((resolve, reject) => {
        if (!appState.placesService) {
            reject(new Error('Places service not initialized'));
            return;
        }
        
        if (!google.maps.places || !google.maps.places.PlacesServiceStatus) {
            reject(new Error('Places API not loaded. Please enable Places API in Google Cloud Console.'));
            return;
        }
        
        const request = {
            location: new google.maps.LatLng(lat, lng),
            radius: 100, // Increased to 100 meters for better results
            keyword: placeName,
            fields: ['place_id', 'name']
        };
        
        appState.placesService.nearbySearch(request, (results, status) => {
            console.log(`Nearby search status: ${status}`, results);
            
            if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                // Find the best match by name similarity
                const bestMatch = results.find(r => 
                    r.name && placeName && 
                    r.name.toLowerCase().includes(placeName.toLowerCase())
                ) || results[0];
                resolve(bestMatch.place_id);
            } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                reject(new Error('No places found nearby'));
            } else if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
                reject(new Error('Places API request denied. Please check that Places API is enabled and your API key has access.'));
            } else if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
                reject(new Error('Places API quota exceeded'));
            } else {
                reject(new Error(`Place search failed: ${status}`));
            }
        });
    });
}

/**
 * Find place by text search as fallback method
 * @param {string} query - Place name to search for
 * @param {number} lat - Latitude for location bias
 * @param {number} lng - Longitude for location bias
 * @returns {Promise<string|null>} Place ID or null if not found
 */
function findPlaceByTextSearch(query, lat, lng) {
    return new Promise((resolve, reject) => {
        if (!appState.placesService) {
            reject(new Error('Places service not initialized'));
            return;
        }
        
        if (!google.maps.places || !google.maps.places.PlacesServiceStatus) {
            reject(new Error('Places API not loaded'));
            return;
        }
        
        const request = {
            query: `${query}, Chicago, IL`,
            location: new google.maps.LatLng(lat, lng),
            fields: ['place_id', 'name', 'geometry']
        };
        
        // Use textSearch if available, otherwise fall back to nearbySearch with broader radius
        if (appState.placesService.textSearch) {
            appState.placesService.textSearch(request, (results, status) => {
                console.log(`Text search status: ${status}`, results);
                
                if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                    // Find closest match by distance
                    const location = new google.maps.LatLng(lat, lng);
                    const sorted = results.map(r => ({
                        place: r,
                        distance: google.maps.geometry.spherical.computeDistanceBetween(
                            location,
                            r.geometry.location
                        )
                    })).sort((a, b) => a.distance - b.distance);
                    
                    resolve(sorted[0].place.place_id);
                } else {
                    reject(new Error(`Text search failed: ${status}`));
                }
            });
        } else {
            // Fallback: use nearbySearch with broader radius
            const nearbyRequest = {
                location: new google.maps.LatLng(lat, lng),
                radius: 500, // 500 meters
                keyword: query
            };
            
            appState.placesService.nearbySearch(nearbyRequest, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                    resolve(results[0].place_id);
                } else {
                    reject(new Error(`Fallback search failed: ${status}`));
                }
            });
        }
    });
}

/**
 * Fetch place details from Google Places API
 * @param {string} placeId - Google Place ID
 * @returns {Promise<Object>} Place details object
 */
function fetchPlaceDetails(placeId) {
    return new Promise((resolve, reject) => {
        if (!appState.placesService) {
            reject(new Error('Places service not initialized'));
            return;
        }
        
        const request = {
            placeId: placeId,
            fields: [
                'name',
                'formatted_address',
                'formatted_phone_number',
                'rating',
                'user_ratings_total',
                'opening_hours',
                'photos',
                'website',
                'url',
                'price_level',
                'types'
            ]
        };
        
        appState.placesService.getDetails(request, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                resolve(place);
            } else {
                reject(new Error(`Places service error: ${status}`));
            }
        });
    });
}

/**
 * Format expanded details for display - large photo carousel at top, then details
 * @param {Object} place - Google Places API place object
 * @param {string} recId - Recommendation ID for carousel
 * @returns {string} HTML string
 */
function formatExpandedDetails(place, recId) {
    let html = '<div class="place-expanded-content">';
    
    // 1. Large photo carousel at top (replaces thumbnail when expanded)
    if (place.photos && place.photos.length > 0) {
        const photos = place.photos.slice(0, 5); // Limit to 5 photos
        const photoUrls = photos.map((photo, index) => ({
            url: photo.getUrl({ maxWidth: 800, maxHeight: 600 }),
            index: index
        }));
        
        html += `
            <div class="place-photo-carousel" id="${recId}-carousel" data-photos='${JSON.stringify(photoUrls)}' data-current="0">
                <div class="carousel-container">
                    <img src="${photoUrls[0].url}" alt="${escapeHtml(place.name)}" class="carousel-photo" id="${recId}-carousel-img">
                    ${photos.length > 1 ? `
                        <button class="carousel-prev" id="${recId}-carousel-prev">‹</button>
                        <button class="carousel-next" id="${recId}-carousel-next">›</button>
                        <div class="carousel-indicator">1 / ${photos.length}</div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    // 2. Summary info (same info that was in collapsed view) - slides down below photo
    html += '<div class="place-summary-expanded">';
    
    // Name (bold)
    html += `<div class="place-summary-expanded-name"><strong>${escapeHtml(place.name)}</strong></div>`;
    
    // Address (shortened)
    if (place.formatted_address) {
        const shortAddress = place.formatted_address.split(',')[0];
        html += `<div class="place-summary-item">${escapeHtml(shortAddress)}</div>`;
    }
    
    // Rating
    if (place.rating !== undefined) {
        const stars = '⭐'.repeat(Math.round(place.rating));
        const ratingText = place.user_ratings_total 
            ? `${place.rating.toFixed(1)} ${stars} (${place.user_ratings_total.toLocaleString()} reviews)`
            : `${place.rating.toFixed(1)} ${stars}`;
        html += `<div class="place-summary-item">${ratingText}</div>`;
    }
    
    // Opening status with next time (same logic as collapsed view)
    if (place.opening_hours) {
        const isOpen = place.opening_hours.isOpen ? place.opening_hours.isOpen() : null;
        if (isOpen !== null) {
            let statusText = isOpen ? 'Open now' : 'Closed now';
            const statusColor = isOpen ? '#27ae60' : '#e74c3c';
            
            // Get next open/close time
            if (place.opening_hours.weekday_text && place.opening_hours.weekday_text.length > 0) {
                const now = new Date();
                const currentDay = now.getDay();
                const currentTime = now.getHours() * 100 + now.getMinutes();
                
                if (!isOpen) {
                    for (let i = 0; i < 7; i++) {
                        const checkDay = (currentDay + i) % 7;
                        const dayText = place.opening_hours.weekday_text[checkDay];
                        if (dayText && dayText.includes(':')) {
                            const match = dayText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/);
                            if (match) {
                                let hours = parseInt(match[1]);
                                const minutes = parseInt(match[2]);
                                const ampm = match[3];
                                if (ampm === 'PM' && hours !== 12) hours += 12;
                                if (ampm === 'AM' && hours === 12) hours = 0;
                                const openTime = hours * 100 + minutes;
                                
                                if (i === 0 && openTime > currentTime) {
                                    statusText += ` • Opens at ${match[1]}:${match[2]} ${ampm}`;
                                    break;
                                } else if (i > 0) {
                                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                    statusText += ` • Opens ${dayNames[checkDay]} at ${match[1]}:${match[2]} ${ampm}`;
                                    break;
                                }
                            }
                        }
                    }
                } else {
                    const dayText = place.opening_hours.weekday_text[currentDay];
                    if (dayText && dayText.includes('–')) {
                        const parts = dayText.split('–');
                        if (parts.length > 1) {
                            const closeMatch = parts[1].match(/(\d{1,2}):(\d{2})\s*(AM|PM)/);
                            if (closeMatch) {
                                statusText += ` • Closes at ${closeMatch[1]}:${closeMatch[2]} ${closeMatch[3]}`;
                            }
                        }
                    }
                }
            }
            
            html += `<div class="place-summary-item" style="color: ${statusColor};">${statusText}</div>`;
        }
    }
    
    html += '</div>';
    
    // 3. Additional details: Hours and action links
    html += '<div class="place-additional-details">';
    
    // Opening Hours (full schedule)
    if (place.opening_hours && place.opening_hours.weekday_text) {
        html += `
            <div class="place-info-row">
                <strong>🕐 Hours:</strong>
                <div class="place-hours">
                    ${place.opening_hours.weekday_text.map(day => `<div>${escapeHtml(day)}</div>`).join('')}
                </div>
            </div>
        `;
    }
    
    // Action links: Directions, Website, Phone
    html += '<div class="place-action-links">';
    
    // Directions link
    if (place.geometry && place.geometry.location) {
        const lat = typeof place.geometry.location.lat === 'function' ? place.geometry.location.lat() : place.geometry.location.lat;
        const lng = typeof place.geometry.location.lng === 'function' ? place.geometry.location.lng() : place.geometry.location.lng;
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        html += `<a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="place-action-link">📍 Get Directions</a>`;
    }
    
    // Website link
    if (place.website) {
        html += `<a href="${place.website}" target="_blank" rel="noopener noreferrer" class="place-action-link">🌐 Visit Website</a>`;
    }
    
    // Phone link
    if (place.formatted_phone_number) {
        html += `<a href="tel:${place.formatted_phone_number}" class="place-action-link">📞 ${escapeHtml(place.formatted_phone_number)}</a>`;
    }
    
    html += '</div>'; // Close place-action-links
    
    html += '</div></div>';
    return html;
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
 * Halftone Circle Overlay for Google Maps
 * Creates a halftone pattern circle overlay
 * This class is defined as a function that creates the class after Google Maps loads
 */
function createHalftoneCircleOverlayClass() {
    if (typeof google === 'undefined' || !google.maps || !google.maps.OverlayView) {
        return null;
    }
    
    class HalftoneCircleOverlay extends google.maps.OverlayView {
    constructor(center, radius, color, opacity) {
        super();
        this.center = center;
        this.radius = radius;
        this.color = color;
        this.opacity = opacity;
        this.div = null;
    }

    onAdd() {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.width = (this.radius * 2) + 'px';
        div.style.height = (this.radius * 2) + 'px';
        div.style.borderRadius = '50%';
        div.style.overflow = 'hidden';
        div.style.pointerEvents = 'none';
        
        // Create canvas for halftone pattern
        const canvas = document.createElement('canvas');
        const size = Math.max(this.radius * 2, 200); // Minimum size for quality
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Convert hex color to RGB
        const hex = this.color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Create halftone pattern with grid distribution
        const centerX = size / 2;
        const centerY = size / 2;
        const maxRadius = size / 2;
        const dotSpacing = 6;
        const baseDotSize = 3;
        
        // Draw halftone dots in a grid pattern with radial fade
        for (let x = 0; x < size; x += dotSpacing) {
            for (let y = 0; y < size; y += dotSpacing) {
                const distanceFromCenter = Math.sqrt(
                    Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
                );
                
                // Only draw dots within the circle
                if (distanceFromCenter < maxRadius) {
                    // Calculate fade factor (stronger at center, fade at edges)
                    const fadeFactor = 1 - (distanceFromCenter / maxRadius);
                    const dotOpacity = this.opacity * fadeFactor * 0.7;
                    const dotSize = baseDotSize * fadeFactor;
                    
                    if (dotOpacity > 0.05) { // Only draw visible dots
                        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${dotOpacity})`;
                        ctx.beginPath();
                        ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
                        ctx.fill();
                    }
                }
            }
        }
        
        // Add smooth radial gradient overlay for better blending
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.opacity * 0.2})`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${this.opacity * 0.15})`);
        gradient.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, ${this.opacity * 0.1})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Scale canvas to match actual radius
        canvas.style.width = (this.radius * 2) + 'px';
        canvas.style.height = (this.radius * 2) + 'px';
        
        div.appendChild(canvas);
        this.div = div;
        
        const panes = this.getPanes();
        panes.overlayLayer.appendChild(div); // Use overlayLayer for better rendering
    }

    draw() {
        const overlayProjection = this.getProjection();
        const position = overlayProjection.fromLatLngToDivPixel(this.center);
        
        if (this.div) {
            this.div.style.left = (position.x - this.radius) + 'px';
            this.div.style.top = (position.y - this.radius) + 'px';
        }
    }

    onRemove() {
        if (this.div && this.div.parentNode) {
            this.div.parentNode.removeChild(this.div);
        }
        this.div = null;
    }
    }
    
    return HalftoneCircleOverlay;
}

// Initialize HalftoneCircleOverlay class after Google Maps loads
let HalftoneCircleOverlay = null;

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
            
            // Create halftone overlay for visual effect (all layers)
            // Ensure HalftoneCircleOverlay class is available
            if (!HalftoneCircleOverlay && typeof google !== 'undefined' && google.maps && google.maps.OverlayView) {
                HalftoneCircleOverlay = createHalftoneCircleOverlayClass();
            }
            
            if (HalftoneCircleOverlay) {
                const halftoneOverlay = new HalftoneCircleOverlay(
                    center,
                    layerRadius,
                    color,
                    layerOpacity * 0.4 * (1 - i * 0.15) // Lower opacity for prettier blending, fade for outer layers
                );
                halftoneOverlay.setMap(appState.map);
                
                // Store overlay for cleanup
                if (!appState.halftoneOverlays) {
                    appState.halftoneOverlays = [];
                }
                appState.halftoneOverlays.push(halftoneOverlay);
            }
            
            // Store overlay for cleanup
            if (!appState.halftoneOverlays) {
                appState.halftoneOverlays = [];
            }
            appState.halftoneOverlays.push(halftoneOverlay);
            
            // Create clickable circle (transparent, just for click detection) - only for innermost
            let circle = null;
            if (i === 0) {
                circle = new google.maps.Circle({
                    strokeColor: 'transparent',
                    strokeOpacity: 0,
                    strokeWeight: 0,
                    fillColor: color,
                    fillOpacity: 0.01, // Nearly transparent, just for click detection
                    map: appState.map,
                    center: center,
                    radius: layerRadius,
                    zIndex: 1000 + i, // Higher z-index for click detection
                    clickable: true
                });
            }
            
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
                    } else if (circle.center) {
                        // Fallback to circle center - handle LatLng object
                        if (typeof circle.center.lat === 'function') {
                            clickedLat = circle.center.lat();
                            clickedLng = circle.center.lng();
                        } else {
                            clickedLat = circle.center.lat;
                            clickedLng = circle.center.lng;
                        }
                    } else {
                        return; // Can't determine position
                    }
                    
                    // Zoom to the hotspot area
                    const bounds = new google.maps.LatLngBounds();
                    // Add a buffer around the circle center
                    const buffer = circle.baseRadius * 1.5; // 1.5x the radius for better view
                    const latOffset = buffer / 111000; // meters to degrees (approximate)
                    const lngOffset = buffer / (111000 * Math.cos(clickedLat * Math.PI / 180));
                    
                    bounds.extend(new google.maps.LatLng(clickedLat - latOffset, clickedLng - lngOffset));
                    bounds.extend(new google.maps.LatLng(clickedLat + latOffset, clickedLng + lngOffset));
                    
                    appState.map.fitBounds(bounds);
                    
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
        
        // Get place name and place_id from autocomplete if available
        let placeName = locationName;
        let placeId = null;
        if (appState.autocomplete) {
            // Handle both new PlaceAutocompleteElement and classic Autocomplete
            if (typeof appState.autocomplete.getPlace === 'function') {
                const place = appState.autocomplete.getPlace();
                placeName = place?.name || locationName;
                placeId = place?.place_id || null;
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
                placeName,
                placeId
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

