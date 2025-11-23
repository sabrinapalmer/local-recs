/**
 * Chicago Recommendations API Server
 * Express server with SQLite database for storing recommendations
 */

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = process.env.PORT || 3000;
const DB_PATH = './recommendations.db';

// Valid place types
const VALID_PLACE_TYPES = [
    'restaurant', 'bar', 'museum', 'cafe', 'park',
    'theater', 'shopping', 'nightclub', 'hotel', 'attraction'
];

// ============================================================================
// DATABASE SETUP
// ============================================================================

/**
 * Initialize database connection
 * @returns {Promise<sqlite3.Database>}
 */
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                reject(err);
                return;
            }
            
            console.log('Connected to SQLite database');
            
            // Create table if it doesn't exist
            // Note: SQLite doesn't allow parameters in CHECK constraints, so we hardcode the values
            const placeTypesList = VALID_PLACE_TYPES.map(t => `'${t}'`).join(', ');
            db.run(`CREATE TABLE IF NOT EXISTS recommendations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                place_type TEXT NOT NULL CHECK(place_type IN (${placeTypesList})),
                location_name TEXT NOT NULL,
                latitude REAL NOT NULL CHECK(latitude >= -90 AND latitude <= 90),
                longitude REAL NOT NULL CHECK(longitude >= -180 AND longitude <= 180),
                place_name TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) {
                    console.error('Error creating table:', err.message);
                    reject(err);
                } else {
                    console.log('Database table ready');
                    resolve(db);
                }
            });
        });
    });
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate recommendation data
 * @param {Object} data - Recommendation data
 * @returns {{valid: boolean, error?: string}}
 */
function validateRecommendation(data) {
    const { placeType, locationName, latitude, longitude, placeName } = data;
    
    // Check required fields
    if (!placeType || !locationName || latitude === undefined || longitude === undefined) {
        return { valid: false, error: 'Missing required fields' };
    }
    
    // Validate place type
    if (!VALID_PLACE_TYPES.includes(placeType)) {
        return { valid: false, error: `Invalid place type. Must be one of: ${VALID_PLACE_TYPES.join(', ')}` };
    }
    
    // Validate location name
    if (typeof locationName !== 'string' || locationName.trim().length === 0) {
        return { valid: false, error: 'Location name must be a non-empty string' };
    }
    
    // Validate coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
        return { valid: false, error: 'Latitude must be a number between -90 and 90' };
    }
    
    if (isNaN(lng) || lng < -180 || lng > 180) {
        return { valid: false, error: 'Longitude must be a number between -180 and 180' };
    }
    
    // Validate place name if provided
    if (placeName !== undefined && placeName !== null) {
        if (typeof placeName !== 'string') {
            return { valid: false, error: 'Place name must be a string' };
        }
    }
    
    return { valid: true };
}

/**
 * Sanitize string input
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().substring(0, 255); // Limit length
}

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================

const app = express();

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || '*',
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============================================================================
// DATABASE INSTANCE
// ============================================================================

let db;

// Initialize database
initializeDatabase()
    .then(database => {
        db = database;
    })
    .catch(err => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });

// ============================================================================
// API ROUTES
// ============================================================================

/**
 * POST /api/recommendations
 * Store a new recommendation
 */
app.post('/api/recommendations', (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not available' });
    }
    
    // Validate input
    const validation = validateRecommendation(req.body);
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }
    
    // Sanitize inputs
    const { placeType, locationName, latitude, longitude, placeName } = req.body;
    const sanitizedData = {
        placeType: placeType.trim().toLowerCase(),
        locationName: sanitizeString(locationName),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        placeName: placeName ? sanitizeString(placeName) : null
    };
    
    const sql = `INSERT INTO recommendations (place_type, location_name, latitude, longitude, place_name)
                 VALUES (?, ?, ?, ?, ?)`;
    
    db.run(sql, [
        sanitizedData.placeType,
        sanitizedData.locationName,
        sanitizedData.latitude,
        sanitizedData.longitude,
        sanitizedData.placeName
    ], function(err) {
        if (err) {
            console.error('Error inserting recommendation:', err.message);
            return res.status(500).json({ 
                error: 'Failed to save recommendation',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
        
        res.status(201).json({
            success: true,
            id: this.lastID,
            message: 'Recommendation saved successfully'
        });
    });
});

/**
 * GET /api/recommendations
 * Get all recommendations (optionally filtered by type)
 */
app.get('/api/recommendations', (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not available' });
    }
    
    const { placeType } = req.query;
    
    let sql = 'SELECT * FROM recommendations';
    const params = [];
    
    if (placeType) {
        if (!VALID_PLACE_TYPES.includes(placeType)) {
            return res.status(400).json({ 
                error: `Invalid place type. Must be one of: ${VALID_PLACE_TYPES.join(', ')}` 
            });
        }
        sql += ' WHERE place_type = ?';
        params.push(placeType);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Error fetching recommendations:', err.message);
            return res.status(500).json({ 
                error: 'Failed to fetch recommendations',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
        
        res.json(rows);
    });
});

/**
 * GET /api/hotspots
 * Get hotspot data (calculated density)
 */
app.get('/api/hotspots', (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not available' });
    }
    
    const { placeType } = req.query;
    
    let sql = `SELECT 
        latitude,
        longitude,
        COUNT(*) as count,
        GROUP_CONCAT(place_name, ', ') as place_names
    FROM recommendations`;
    
    const params = [];
    
    if (placeType) {
        if (!VALID_PLACE_TYPES.includes(placeType)) {
            return res.status(400).json({ 
                error: `Invalid place type. Must be one of: ${VALID_PLACE_TYPES.join(', ')}` 
            });
        }
        sql += ' WHERE place_type = ?';
        params.push(placeType);
    }
    
    sql += ` GROUP BY 
        ROUND(latitude, 3),
        ROUND(longitude, 3)
    HAVING count >= 1
    ORDER BY count DESC`;
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Error calculating hotspots:', err.message);
            return res.status(500).json({ 
                error: 'Failed to calculate hotspots',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
        
        res.json({
            heatmapData: rows.map(row => ({
                lat: row.latitude,
                lng: row.longitude,
                weight: row.count,
                placeNames: row.place_names ? row.place_names.split(', ') : []
            })),
            totalRecommendations: rows.reduce((sum, row) => sum + row.count, 0)
        });
    });
});

/**
 * GET /api/stats
 * Get statistics by place type
 */
app.get('/api/stats', (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not available' });
    }
    
    const sql = `SELECT 
        place_type,
        COUNT(*) as count
    FROM recommendations
    GROUP BY place_type
    ORDER BY count DESC`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error fetching stats:', err.message);
            return res.status(500).json({ 
                error: 'Failed to fetch statistics',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
        
        res.json(rows);
    });
});

/**
 * POST /api/seed
 * Seed database with sample data
 * Optionally clears existing data if ?clear=true
 */
app.post('/api/seed', (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not available' });
    }
    
    const clearExisting = req.query.clear === 'true' || req.query.clear === true;
    
    // Clear existing data if requested
    if (clearExisting) {
        db.run('DELETE FROM recommendations', (err) => {
            if (err) {
                console.error('Error clearing data:', err.message);
                return res.status(500).json({ error: 'Failed to clear existing data' });
            }
            console.log('Cleared existing recommendations');
            insertSampleData();
        });
    } else {
        insertSampleData();
    }
    
    function insertSampleData() {
        // Expanded sample data - popular Chicago locations with accurate coordinates
        // Grouped by neighborhood for better heatmap visualization
        const sampleData = [
    // The Loop - Restaurants (15)
    { place_type: 'restaurant', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Alinea' },
    { place_type: 'restaurant', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'The Gage' },
    { place_type: 'restaurant', location_name: 'The Loop', latitude: 41.8847, longitude: -87.6278, place_name: 'Petterino\'s' },
    { place_type: 'restaurant', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Wildfire' },
    { place_type: 'restaurant', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Catch 35' },
    { place_type: 'restaurant', location_name: 'The Loop', latitude: 41.8789, longitude: -87.6358, place_name: 'Lou Malnati\'s' },
    { place_type: 'restaurant', location_name: 'The Loop', latitude: 41.8847, longitude: -87.6278, place_name: 'Giordano\'s' },
    { place_type: 'restaurant', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'The Berghoff' },
    { place_type: 'restaurant', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Russian Tea Time' },
    { place_type: 'restaurant', location_name: 'The Loop', latitude: 41.8847, longitude: -87.6278, place_name: 'Atwood Cafe' },
    { place_type: 'restaurant', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'The Dearborn' },
    { place_type: 'restaurant', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Cafecito' },
    { place_type: 'restaurant', location_name: 'The Loop', latitude: 41.8847, longitude: -87.6278, place_name: 'Native Foods' },
    { place_type: 'restaurant', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Pret A Manger' },
    { place_type: 'restaurant', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Sweetgreen' },
    
    // River North - Restaurants (12)
    { place_type: 'restaurant', location_name: 'River North', latitude: 41.8917, longitude: -87.6244, place_name: 'Girl & The Goat' },
    { place_type: 'restaurant', location_name: 'River North', latitude: 41.8942, longitude: -87.6278, place_name: 'Gibsons Bar & Steakhouse' },
    { place_type: 'restaurant', location_name: 'River North', latitude: 41.8917, longitude: -87.6244, place_name: 'Joe\'s Seafood' },
    { place_type: 'restaurant', location_name: 'River North', latitude: 41.8942, longitude: -87.6278, place_name: 'RPM Italian' },
    { place_type: 'restaurant', location_name: 'River North', latitude: 41.8917, longitude: -87.6244, place_name: 'Eataly' },
    { place_type: 'restaurant', location_name: 'River North', latitude: 41.8942, longitude: -87.6278, place_name: 'Hugo\'s Frog Bar' },
    { place_type: 'restaurant', location_name: 'River North', latitude: 41.8917, longitude: -87.6244, place_name: 'Siena Tavern' },
    { place_type: 'restaurant', location_name: 'River North', latitude: 41.8942, longitude: -87.6278, place_name: 'Frontera Grill' },
    { place_type: 'restaurant', location_name: 'River North', latitude: 41.8917, longitude: -87.6244, place_name: 'Topolobampo' },
    { place_type: 'restaurant', location_name: 'River North', latitude: 41.8942, longitude: -87.6278, place_name: 'Bavette\'s Bar & Boeuf' },
    { place_type: 'restaurant', location_name: 'River North', latitude: 41.8917, longitude: -87.6244, place_name: 'Maple & Ash' },
    { place_type: 'restaurant', location_name: 'River North', latitude: 41.8942, longitude: -87.6278, place_name: 'Tao Chicago' },
    
    // West Loop - Restaurants (10)
    { place_type: 'restaurant', location_name: 'West Loop', latitude: 41.8781, longitude: -87.6478, place_name: 'Au Cheval' },
    { place_type: 'restaurant', location_name: 'West Loop', latitude: 41.8815, longitude: -87.6445, place_name: 'Monteverde' },
    { place_type: 'restaurant', location_name: 'West Loop', latitude: 41.8781, longitude: -87.6478, place_name: 'The Publican' },
    { place_type: 'restaurant', location_name: 'West Loop', latitude: 41.8815, longitude: -87.6445, place_name: 'Momotaro' },
    { place_type: 'restaurant', location_name: 'West Loop', latitude: 41.8781, longitude: -87.6478, place_name: 'Roister' },
    { place_type: 'restaurant', location_name: 'West Loop', latitude: 41.8815, longitude: -87.6445, place_name: 'Duck Duck Goat' },
    { place_type: 'restaurant', location_name: 'West Loop', latitude: 41.8781, longitude: -87.6478, place_name: 'Little Goat' },
    { place_type: 'restaurant', location_name: 'West Loop', latitude: 41.8815, longitude: -87.6445, place_name: 'Avec' },
    { place_type: 'restaurant', location_name: 'West Loop', latitude: 41.8781, longitude: -87.6478, place_name: 'Blackbird' },
    { place_type: 'restaurant', location_name: 'West Loop', latitude: 41.8815, longitude: -87.6445, place_name: 'Sepia' },
    
    // Wicker Park - Restaurants (8)
    { place_type: 'restaurant', location_name: 'Wicker Park', latitude: 41.9076, longitude: -87.6774, place_name: 'Big Star' },
    { place_type: 'restaurant', location_name: 'Wicker Park', latitude: 41.9100, longitude: -87.6750, place_name: 'Dove\'s Luncheonette' },
    { place_type: 'restaurant', location_name: 'Wicker Park', latitude: 41.9076, longitude: -87.6774, place_name: 'Small Cheval' },
    { place_type: 'restaurant', location_name: 'Wicker Park', latitude: 41.9100, longitude: -87.6750, place_name: 'Piece Pizza' },
    { place_type: 'restaurant', location_name: 'Wicker Park', latitude: 41.9076, longitude: -87.6774, place_name: 'Handlebar' },
    { place_type: 'restaurant', location_name: 'Wicker Park', latitude: 41.9100, longitude: -87.6750, place_name: 'Bangers & Lace' },
    { place_type: 'restaurant', location_name: 'Wicker Park', latitude: 41.9076, longitude: -87.6774, place_name: 'The Violet Hour' },
    { place_type: 'restaurant', location_name: 'Wicker Park', latitude: 41.9100, longitude: -87.6750, place_name: 'Mindy\'s Hot Chocolate' },
    
    // Lincoln Park - Restaurants (10)
    { place_type: 'restaurant', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Cafe Ba-Ba-Reeba!' },
    { place_type: 'restaurant', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Tango Sur' },
    { place_type: 'restaurant', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Crisp' },
    { place_type: 'restaurant', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'The J. Parker' },
    { place_type: 'restaurant', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Summer House Santa Monica' },
    { place_type: 'restaurant', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Geja\'s Cafe' },
    { place_type: 'restaurant', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Boka' },
    { place_type: 'restaurant', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'North Pond' },
    { place_type: 'restaurant', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Al\'s Beef' },
    { place_type: 'restaurant', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'The Purple Pig' },
    
    // Logan Square - Restaurants (8)
    { place_type: 'restaurant', location_name: 'Logan Square', latitude: 41.9280, longitude: -87.7014, place_name: 'Lula Cafe' },
    { place_type: 'restaurant', location_name: 'Logan Square', latitude: 41.9280, longitude: -87.7014, place_name: 'Longman & Eagle' },
    { place_type: 'restaurant', location_name: 'Logan Square', latitude: 41.9280, longitude: -87.7014, place_name: 'Fat Rice' },
    { place_type: 'restaurant', location_name: 'Logan Square', latitude: 41.9280, longitude: -87.7014, place_name: 'Giant' },
    { place_type: 'restaurant', location_name: 'Logan Square', latitude: 41.9280, longitude: -87.7014, place_name: 'Owen & Engine' },
    { place_type: 'restaurant', location_name: 'Logan Square', latitude: 41.9280, longitude: -87.7014, place_name: 'Revolution Brewing' },
    { place_type: 'restaurant', location_name: 'Logan Square', latitude: 41.9280, longitude: -87.7014, place_name: 'Scofflaw' },
    { place_type: 'restaurant', location_name: 'Logan Square', latitude: 41.9280, longitude: -87.7014, place_name: 'The Whistler' },
    
    // Lakeview - Restaurants (8)
    { place_type: 'restaurant', location_name: 'Lakeview', latitude: 41.9400, longitude: -87.6534, place_name: 'Tango Sur' },
    { place_type: 'restaurant', location_name: 'Lakeview', latitude: 41.9400, longitude: -87.6534, place_name: 'Crisp' },
    { place_type: 'restaurant', location_name: 'Lakeview', latitude: 41.9400, longitude: -87.6534, place_name: 'DMK Burger Bar' },
    { place_type: 'restaurant', location_name: 'Lakeview', latitude: 41.9400, longitude: -87.6534, place_name: 'The Gage' },
    { place_type: 'restaurant', location_name: 'Lakeview', latitude: 41.9400, longitude: -87.6534, place_name: 'Cafe Ba-Ba-Reeba!' },
    { place_type: 'restaurant', location_name: 'Lakeview', latitude: 41.9400, longitude: -87.6534, place_name: 'The Aviary' },
    { place_type: 'restaurant', location_name: 'Lakeview', latitude: 41.9400, longitude: -87.6534, place_name: 'The Publican' },
    { place_type: 'restaurant', location_name: 'Lakeview', latitude: 41.9400, longitude: -87.6534, place_name: 'Summer House' },
    
    // Bars - River North (10)
    { place_type: 'bar', location_name: 'River North', latitude: 41.8917, longitude: -87.6244, place_name: 'Three Dots and a Dash' },
    { place_type: 'bar', location_name: 'River North', latitude: 41.8942, longitude: -87.6278, place_name: 'Cindy\'s Rooftop' },
    { place_type: 'bar', location_name: 'River North', latitude: 41.8917, longitude: -87.6244, place_name: 'The Aviary' },
    { place_type: 'bar', location_name: 'River North', latitude: 41.8942, longitude: -87.6278, place_name: 'The Berkshire Room' },
    { place_type: 'bar', location_name: 'River North', latitude: 41.8917, longitude: -87.6244, place_name: 'Bar Siena' },
    { place_type: 'bar', location_name: 'River North', latitude: 41.8942, longitude: -87.6278, place_name: 'The Office' },
    { place_type: 'bar', location_name: 'River North', latitude: 41.8917, longitude: -87.6244, place_name: 'The Drifter' },
    { place_type: 'bar', location_name: 'River North', latitude: 41.8942, longitude: -87.6278, place_name: 'River Roast' },
    { place_type: 'bar', location_name: 'River North', latitude: 41.8917, longitude: -87.6244, place_name: 'Pops for Champagne' },
    { place_type: 'bar', location_name: 'River North', latitude: 41.8942, longitude: -87.6278, place_name: 'The Violet Hour' },
    
    // Bars - Wicker Park (8)
    { place_type: 'bar', location_name: 'Wicker Park', latitude: 41.9076, longitude: -87.6774, place_name: 'The Violet Hour' },
    { place_type: 'bar', location_name: 'Wicker Park', latitude: 41.9100, longitude: -87.6750, place_name: 'Dusek\'s' },
    { place_type: 'bar', location_name: 'Wicker Park', latitude: 41.9076, longitude: -87.6774, place_name: 'Big Star' },
    { place_type: 'bar', location_name: 'Wicker Park', latitude: 41.9100, longitude: -87.6750, place_name: 'The Empty Bottle' },
    { place_type: 'bar', location_name: 'Wicker Park', latitude: 41.9076, longitude: -87.6774, place_name: 'The Map Room' },
    { place_type: 'bar', location_name: 'Wicker Park', latitude: 41.9100, longitude: -87.6750, place_name: 'Bangers & Lace' },
    { place_type: 'bar', location_name: 'Wicker Park', latitude: 41.9076, longitude: -87.6774, place_name: 'The Violet Hour' },
    { place_type: 'bar', location_name: 'Wicker Park', latitude: 41.9100, longitude: -87.6750, place_name: 'The Whistler' },
    
    // Bars - West Loop (8)
    { place_type: 'bar', location_name: 'West Loop', latitude: 41.8815, longitude: -87.6445, place_name: 'The Press Room' },
    { place_type: 'bar', location_name: 'West Loop', latitude: 41.8781, longitude: -87.6478, place_name: 'The Aviary' },
    { place_type: 'bar', location_name: 'West Loop', latitude: 41.8815, longitude: -87.6445, place_name: 'The Publican' },
    { place_type: 'bar', location_name: 'West Loop', latitude: 41.8781, longitude: -87.6478, place_name: 'Haymarket Pub' },
    { place_type: 'bar', location_name: 'West Loop', latitude: 41.8815, longitude: -87.6445, place_name: 'The Broken Shaker' },
    { place_type: 'bar', location_name: 'West Loop', latitude: 41.8781, longitude: -87.6478, place_name: 'The Underground' },
    { place_type: 'bar', location_name: 'West Loop', latitude: 41.8815, longitude: -87.6445, place_name: 'RM Champagne' },
    { place_type: 'bar', location_name: 'West Loop', latitude: 41.8781, longitude: -87.6478, place_name: 'The Office' },
    
    // Bars - Lincoln Park (8)
    { place_type: 'bar', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Delilah\'s' },
    { place_type: 'bar', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'The J. Parker' },
    { place_type: 'bar', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'The Aviary' },
    { place_type: 'bar', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'The Violet Hour' },
    { place_type: 'bar', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'The Berkshire Room' },
    { place_type: 'bar', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'The Map Room' },
    { place_type: 'bar', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'The Empty Bottle' },
    { place_type: 'bar', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'The Whistler' },
    
    // Bars - The Loop (8)
    { place_type: 'bar', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'The Berkshire Room' },
    { place_type: 'bar', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'The Aviary' },
    { place_type: 'bar', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Cindy\'s Rooftop' },
    { place_type: 'bar', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'The Violet Hour' },
    { place_type: 'bar', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'The Office' },
    { place_type: 'bar', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'The Drifter' },
    { place_type: 'bar', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'River Roast' },
    { place_type: 'bar', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Pops for Champagne' },
    
    // Museums - The Loop (8)
    { place_type: 'museum', location_name: 'The Loop', latitude: 41.8796, longitude: -87.6237, place_name: 'Art Institute of Chicago' },
    { place_type: 'museum', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Chicago Cultural Center' },
    { place_type: 'museum', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Chicago Architecture Center' },
    { place_type: 'museum', location_name: 'The Loop', latitude: 41.8847, longitude: -87.6278, place_name: 'Chicago History Museum' },
    { place_type: 'museum', location_name: 'The Loop', latitude: 41.8789, longitude: -87.6358, place_name: 'Chicago Sports Museum' },
    { place_type: 'museum', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Museum of Contemporary Photography' },
    { place_type: 'museum', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Chicago Design Museum' },
    { place_type: 'museum', location_name: 'The Loop', latitude: 41.8847, longitude: -87.6278, place_name: 'Chicago Children\'s Museum' },
    
    // Museums - Museum Campus (6)
    { place_type: 'museum', location_name: 'Museum Campus', latitude: 41.8661, longitude: -87.6167, place_name: 'Field Museum' },
    { place_type: 'museum', location_name: 'Museum Campus', latitude: 41.8677, longitude: -87.6089, place_name: 'Shedd Aquarium' },
    { place_type: 'museum', location_name: 'Museum Campus', latitude: 41.8656, longitude: -87.6117, place_name: 'Adler Planetarium' },
    { place_type: 'museum', location_name: 'Museum Campus', latitude: 41.8661, longitude: -87.6167, place_name: 'Museum Campus' },
    { place_type: 'museum', location_name: 'Museum Campus', latitude: 41.8677, longitude: -87.6089, place_name: 'Soldier Field' },
    { place_type: 'museum', location_name: 'Museum Campus', latitude: 41.8656, longitude: -87.6117, place_name: 'Northerly Island' },
    
    // Cafes - Wicker Park (10)
    { place_type: 'cafe', location_name: 'Wicker Park', latitude: 41.9076, longitude: -87.6774, place_name: 'Intelligentsia Coffee' },
    { place_type: 'cafe', location_name: 'Wicker Park', latitude: 41.9100, longitude: -87.6750, place_name: 'Wormhole Coffee' },
    { place_type: 'cafe', location_name: 'Wicker Park', latitude: 41.9076, longitude: -87.6774, place_name: 'Gaslight Coffee Roasters' },
    { place_type: 'cafe', location_name: 'Wicker Park', latitude: 41.9100, longitude: -87.6750, place_name: 'La Colombe Coffee' },
    { place_type: 'cafe', location_name: 'Wicker Park', latitude: 41.9076, longitude: -87.6774, place_name: 'Sawada Coffee' },
    { place_type: 'cafe', location_name: 'Wicker Park', latitude: 41.9100, longitude: -87.6750, place_name: 'Hero Coffee Bar' },
    { place_type: 'cafe', location_name: 'Wicker Park', latitude: 41.9076, longitude: -87.6774, place_name: 'Caffe Umbria' },
    { place_type: 'cafe', location_name: 'Wicker Park', latitude: 41.9100, longitude: -87.6750, place_name: 'Starbucks Reserve' },
    { place_type: 'cafe', location_name: 'Wicker Park', latitude: 41.9076, longitude: -87.6774, place_name: 'Dark Matter Coffee' },
    { place_type: 'cafe', location_name: 'Wicker Park', latitude: 41.9100, longitude: -87.6750, place_name: 'Metric Coffee' },
    
    // Cafes - The Loop (10)
    { place_type: 'cafe', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Caffe Umbria' },
    { place_type: 'cafe', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Intelligentsia Coffee' },
    { place_type: 'cafe', location_name: 'The Loop', latitude: 41.8847, longitude: -87.6278, place_name: 'La Colombe Coffee' },
    { place_type: 'cafe', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Sawada Coffee' },
    { place_type: 'cafe', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Hero Coffee Bar' },
    { place_type: 'cafe', location_name: 'The Loop', latitude: 41.8847, longitude: -87.6278, place_name: 'Starbucks Reserve' },
    { place_type: 'cafe', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Dark Matter Coffee' },
    { place_type: 'cafe', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Metric Coffee' },
    { place_type: 'cafe', location_name: 'The Loop', latitude: 41.8847, longitude: -87.6278, place_name: 'Gaslight Coffee Roasters' },
    { place_type: 'cafe', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Wormhole Coffee' },
    
    // Parks - Lincoln Park (8)
    { place_type: 'park', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Lincoln Park' },
    { place_type: 'park', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'North Avenue Beach' },
    { place_type: 'park', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Lincoln Park Zoo' },
    { place_type: 'park', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Peggy Notebaert Nature Museum' },
    { place_type: 'park', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Alfred Caldwell Lily Pool' },
    { place_type: 'park', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Lincoln Park Conservatory' },
    { place_type: 'park', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Oz Park' },
    { place_type: 'park', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Wrigley Field' },
    
    // Parks - The Loop (8)
    { place_type: 'park', location_name: 'Grant Park', latitude: 41.8781, longitude: -87.6298, place_name: 'Grant Park' },
    { place_type: 'park', location_name: 'Millennium Park', latitude: 41.8825, longitude: -87.6244, place_name: 'Millennium Park' },
    { place_type: 'park', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Maggie Daley Park' },
    { place_type: 'park', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Chicago Riverwalk' },
    { place_type: 'park', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Buckingham Fountain' },
    { place_type: 'park', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Navy Pier' },
    { place_type: 'park', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Cloud Gate' },
    { place_type: 'park', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Crown Fountain' },
    
    // Theaters - The Loop (10)
    { place_type: 'theater', location_name: 'The Loop', latitude: 41.8847, longitude: -87.6278, place_name: 'Chicago Theatre' },
    { place_type: 'theater', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Goodman Theatre' },
    { place_type: 'theater', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Cadillac Palace Theatre' },
    { place_type: 'theater', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'CIBC Theatre' },
    { place_type: 'theater', location_name: 'The Loop', latitude: 41.8847, longitude: -87.6278, place_name: 'Oriental Theatre' },
    { place_type: 'theater', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Auditorium Theatre' },
    { place_type: 'theater', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Bank of America Theatre' },
    { place_type: 'theater', location_name: 'The Loop', latitude: 41.8847, longitude: -87.6278, place_name: 'Chicago Shakespeare Theater' },
    { place_type: 'theater', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Mercury Theater' },
    { place_type: 'theater', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Lookingglass Theatre' },
    
    // Shopping - Magnificent Mile (10)
    { place_type: 'shopping', location_name: 'Magnificent Mile', latitude: 41.8976, longitude: -87.6244, place_name: 'Water Tower Place' },
    { place_type: 'shopping', location_name: 'Magnificent Mile', latitude: 41.8976, longitude: -87.6244, place_name: '900 North Michigan Shops' },
    { place_type: 'shopping', location_name: 'Magnificent Mile', latitude: 41.8976, longitude: -87.6244, place_name: 'Nike Chicago' },
    { place_type: 'shopping', location_name: 'Magnificent Mile', latitude: 41.8976, longitude: -87.6244, place_name: 'Apple Michigan Avenue' },
    { place_type: 'shopping', location_name: 'Magnificent Mile', latitude: 41.8976, longitude: -87.6244, place_name: 'Nordstrom' },
    { place_type: 'shopping', location_name: 'Magnificent Mile', latitude: 41.8976, longitude: -87.6244, place_name: 'Macy\'s' },
    { place_type: 'shopping', location_name: 'Magnificent Mile', latitude: 41.8976, longitude: -87.6244, place_name: 'Saks Fifth Avenue' },
    { place_type: 'shopping', location_name: 'Magnificent Mile', latitude: 41.8976, longitude: -87.6244, place_name: 'Bloomingdale\'s' },
    { place_type: 'shopping', location_name: 'Magnificent Mile', latitude: 41.8976, longitude: -87.6244, place_name: 'Tiffany & Co.' },
    { place_type: 'shopping', location_name: 'Magnificent Mile', latitude: 41.8976, longitude: -87.6244, place_name: 'Cartier' },
    
    // Shopping - The Loop (8)
    { place_type: 'shopping', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Macy\'s State Street' },
    { place_type: 'shopping', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Block 37' },
    { place_type: 'shopping', location_name: 'The Loop', latitude: 41.8847, longitude: -87.6278, place_name: 'Marshall Field\'s' },
    { place_type: 'shopping', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Target' },
    { place_type: 'shopping', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Walgreens' },
    { place_type: 'shopping', location_name: 'The Loop', latitude: 41.8847, longitude: -87.6278, place_name: 'CVS' },
    { place_type: 'shopping', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: '7-Eleven' },
    { place_type: 'shopping', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Whole Foods' },
    
    // Hotels - Magnificent Mile (8)
    { place_type: 'hotel', location_name: 'Magnificent Mile', latitude: 41.8976, longitude: -87.6244, place_name: 'The Langham Chicago' },
    { place_type: 'hotel', location_name: 'Magnificent Mile', latitude: 41.8976, longitude: -87.6244, place_name: 'Four Seasons Chicago' },
    { place_type: 'hotel', location_name: 'Magnificent Mile', latitude: 41.8976, longitude: -87.6244, place_name: 'The Ritz-Carlton' },
    { place_type: 'hotel', location_name: 'Magnificent Mile', latitude: 41.8976, longitude: -87.6244, place_name: 'Waldorf Astoria' },
    { place_type: 'hotel', location_name: 'Magnificent Mile', latitude: 41.8976, longitude: -87.6244, place_name: 'The Drake' },
    { place_type: 'hotel', location_name: 'Magnificent Mile', latitude: 41.8976, longitude: -87.6244, place_name: 'InterContinental' },
    { place_type: 'hotel', location_name: 'Magnificent Mile', latitude: 41.8976, longitude: -87.6244, place_name: 'Omni Chicago' },
    { place_type: 'hotel', location_name: 'Magnificent Mile', latitude: 41.8976, longitude: -87.6244, place_name: 'The Talbott Hotel' },
    
    // Hotels - The Loop (8)
    { place_type: 'hotel', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Chicago Athletic Association' },
    { place_type: 'hotel', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Palmer House Hilton' },
    { place_type: 'hotel', location_name: 'The Loop', latitude: 41.8847, longitude: -87.6278, place_name: 'The Blackstone' },
    { place_type: 'hotel', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Hilton Chicago' },
    { place_type: 'hotel', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Hyatt Regency' },
    { place_type: 'hotel', location_name: 'The Loop', latitude: 41.8847, longitude: -87.6278, place_name: 'Marriott' },
    { place_type: 'hotel', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Sheraton' },
    { place_type: 'hotel', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Swissotel' },
    
    // Attractions - The Loop (10)
    { place_type: 'attraction', location_name: 'Millennium Park', latitude: 41.8825, longitude: -87.6244, place_name: 'Cloud Gate (The Bean)' },
    { place_type: 'attraction', location_name: 'The Loop', latitude: 41.8789, longitude: -87.6358, place_name: 'Willis Tower Skydeck' },
    { place_type: 'attraction', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Chicago Riverwalk' },
    { place_type: 'attraction', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Crown Fountain' },
    { place_type: 'attraction', location_name: 'The Loop', latitude: 41.8847, longitude: -87.6278, place_name: 'Chicago Architecture River Cruise' },
    { place_type: 'attraction', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Chicago River' },
    { place_type: 'attraction', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Lurie Garden' },
    { place_type: 'attraction', location_name: 'The Loop', latitude: 41.8847, longitude: -87.6278, place_name: 'Jay Pritzker Pavilion' },
    { place_type: 'attraction', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'BP Bridge' },
    { place_type: 'attraction', location_name: 'The Loop', latitude: 41.8825, longitude: -87.6244, place_name: 'Chicago Cultural Center' },
    
    // Attractions - Near North Side (8)
    { place_type: 'attraction', location_name: 'Near North Side', latitude: 41.8917, longitude: -87.6089, place_name: 'Navy Pier' },
    { place_type: 'attraction', location_name: 'Near North Side', latitude: 41.8976, longitude: -87.6215, place_name: 'John Hancock Center' },
    { place_type: 'attraction', location_name: 'Near North Side', latitude: 41.8917, longitude: -87.6089, place_name: '360 Chicago' },
    { place_type: 'attraction', location_name: 'Near North Side', latitude: 41.8976, longitude: -87.6215, place_name: 'Chicago Water Tower' },
    { place_type: 'attraction', location_name: 'Near North Side', latitude: 41.8917, longitude: -87.6089, place_name: 'Oak Street Beach' },
    { place_type: 'attraction', location_name: 'Near North Side', latitude: 41.8976, longitude: -87.6215, place_name: 'Chicago History Museum' },
    { place_type: 'attraction', location_name: 'Near North Side', latitude: 41.8917, longitude: -87.6089, place_name: 'Museum of Contemporary Art' },
    { place_type: 'attraction', location_name: 'Near North Side', latitude: 41.8976, longitude: -87.6215, place_name: 'Chicago Sports Museum' },
    
    // Attractions - Lincoln Park (8)
    { place_type: 'attraction', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Lincoln Park Zoo' },
    { place_type: 'attraction', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Peggy Notebaert Nature Museum' },
    { place_type: 'attraction', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Chicago History Museum' },
    { place_type: 'attraction', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Alfred Caldwell Lily Pool' },
    { place_type: 'attraction', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Lincoln Park Conservatory' },
    { place_type: 'attraction', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Oz Park' },
    { place_type: 'attraction', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Wrigley Field' },
    { place_type: 'attraction', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'North Avenue Beach' },
    
    // Nightclubs - River North (8)
    { place_type: 'nightclub', location_name: 'River North', latitude: 41.8917, longitude: -87.6244, place_name: 'Sound-Bar' },
    { place_type: 'nightclub', location_name: 'River North', latitude: 41.8942, longitude: -87.6278, place_name: 'Studio Paris' },
    { place_type: 'nightclub', location_name: 'River North', latitude: 41.8917, longitude: -87.6244, place_name: 'The Underground' },
    { place_type: 'nightclub', location_name: 'River North', latitude: 41.8942, longitude: -87.6278, place_name: 'The Mid' },
    { place_type: 'nightclub', location_name: 'River North', latitude: 41.8917, longitude: -87.6244, place_name: 'Spybar' },
    { place_type: 'nightclub', location_name: 'River North', latitude: 41.8942, longitude: -87.6278, place_name: 'Primary' },
    { place_type: 'nightclub', location_name: 'River North', latitude: 41.8917, longitude: -87.6244, place_name: 'Castle' },
    { place_type: 'nightclub', location_name: 'River North', latitude: 41.8942, longitude: -87.6278, place_name: 'The Underground' },
    
    // Nightclubs - West Loop (6)
    { place_type: 'nightclub', location_name: 'West Loop', latitude: 41.8781, longitude: -87.6478, place_name: 'The Underground' },
    { place_type: 'nightclub', location_name: 'West Loop', latitude: 41.8815, longitude: -87.6445, place_name: 'The Mid' },
    { place_type: 'nightclub', location_name: 'West Loop', latitude: 41.8781, longitude: -87.6478, place_name: 'Spybar' },
    { place_type: 'nightclub', location_name: 'West Loop', latitude: 41.8815, longitude: -87.6445, place_name: 'Primary' },
    { place_type: 'nightclub', location_name: 'West Loop', latitude: 41.8781, longitude: -87.6478, place_name: 'Castle' },
    { place_type: 'nightclub', location_name: 'West Loop', latitude: 41.8815, longitude: -87.6445, place_name: 'The Underground' }
    ];
    
    const sql = `INSERT INTO recommendations (place_type, location_name, latitude, longitude, place_name)
                 VALUES (?, ?, ?, ?, ?)`;
    
    let inserted = 0;
    let errors = 0;
    
    sampleData.forEach((item, index) => {
        db.run(sql, [item.place_type, item.location_name, item.latitude, item.longitude, item.place_name], function(err) {
            if (err) {
                console.error(`Error inserting sample data ${index}:`, err.message);
                errors++;
            } else {
                inserted++;
            }
            
            // Respond when all items are processed
            if (inserted + errors === sampleData.length) {
                res.json({
                    success: true,
                    inserted: inserted,
                    errors: errors,
                    message: `Sample data seeded: ${inserted} recommendations added`
                });
            }
        });
    });
    }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        database: db ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// ============================================================================
// STATIC ROUTES
// ============================================================================

/**
 * GET /
 * Serve the main page
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

function gracefulShutdown(signal) {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    
    server.close(() => {
        console.log('HTTP server closed');
        
        if (db) {
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('Database connection closed');
                }
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});
