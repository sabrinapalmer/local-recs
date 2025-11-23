/**
 * Seed sample data into the database
 * Run with: node seed-data.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = './recommendations.db';

// Sample data - popular Chicago locations
const sampleData = [
    // Restaurants
    { place_type: 'restaurant', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Alinea' },
    { place_type: 'restaurant', location_name: 'River North', latitude: 41.8917, longitude: -87.6244, place_name: 'Girl & The Goat' },
    { place_type: 'restaurant', location_name: 'Wicker Park', latitude: 41.9076, longitude: -87.6774, place_name: 'Big Star' },
    { place_type: 'restaurant', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Cafe Ba-Ba-Reeba!' },
    { place_type: 'restaurant', location_name: 'West Loop', latitude: 41.8781, longitude: -87.6478, place_name: 'Au Cheval' },
    { place_type: 'restaurant', location_name: 'Logan Square', latitude: 41.9280, longitude: -87.7014, place_name: 'Longman & Eagle' },
    { place_type: 'restaurant', location_name: 'Fulton Market', latitude: 41.8858, longitude: -87.6481, place_name: 'The Publican' },
    
    // Bars
    { place_type: 'bar', location_name: 'River North', latitude: 41.8917, longitude: -87.6244, place_name: 'Three Dots and a Dash' },
    { place_type: 'bar', location_name: 'Wicker Park', latitude: 41.9076, longitude: -87.6774, place_name: 'The Violet Hour' },
    { place_type: 'bar', location_name: 'Logan Square', latitude: 41.9280, longitude: -87.7014, place_name: 'Revolution Brewing' },
    { place_type: 'bar', location_name: 'Lakeview', latitude: 41.9400, longitude: -87.6534, place_name: 'The Aviary' },
    { place_type: 'bar', location_name: 'Fulton Market', latitude: 41.8858, longitude: -87.6481, place_name: 'The Broken Shaker' },
    { place_type: 'bar', location_name: 'West Loop', latitude: 41.8781, longitude: -87.6478, place_name: 'The Office' },
    
    // Museums
    { place_type: 'museum', location_name: 'Museum Campus', latitude: 41.8661, longitude: -87.6070, place_name: 'Art Institute of Chicago' },
    { place_type: 'museum', location_name: 'Museum Campus', latitude: 41.8661, longitude: -87.6070, place_name: 'Field Museum' },
    { place_type: 'museum', location_name: 'Museum Campus', latitude: 41.8661, longitude: -87.6070, place_name: 'Shedd Aquarium' },
    { place_type: 'museum', location_name: 'Near North Side', latitude: 41.8976, longitude: -87.6215, place_name: 'Museum of Contemporary Art' },
    { place_type: 'museum', location_name: 'Hyde Park', latitude: 41.7886, longitude: -87.5981, place_name: 'Museum of Science and Industry' },
    
    // Cafes
    { place_type: 'cafe', location_name: 'Wicker Park', latitude: 41.9076, longitude: -87.6774, place_name: 'Intelligentsia Coffee' },
    { place_type: 'cafe', location_name: 'Logan Square', latitude: 41.9280, longitude: -87.7014, place_name: 'Gaslight Coffee Roasters' },
    { place_type: 'cafe', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'La Colombe Coffee' },
    { place_type: 'cafe', location_name: 'West Loop', latitude: 41.8781, longitude: -87.6478, place_name: 'Sawada Coffee' },
    { place_type: 'cafe', location_name: 'River North', latitude: 41.8917, longitude: -87.6244, place_name: 'Hero Coffee Bar' },
    { place_type: 'cafe', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Starbucks Reserve' },
    
    // Parks
    { place_type: 'park', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Lincoln Park' },
    { place_type: 'park', location_name: 'Grant Park', latitude: 41.8781, longitude: -87.6298, place_name: 'Grant Park' },
    { place_type: 'park', location_name: 'Millennium Park', latitude: 41.8825, longitude: -87.6244, place_name: 'Millennium Park' },
    { place_type: 'park', location_name: 'Hyde Park', latitude: 41.7886, longitude: -87.5981, place_name: 'Washington Park' },
    { place_type: 'park', location_name: 'Near North Side', latitude: 41.8917, longitude: -87.6089, place_name: 'Navy Pier' },
    
    // Theaters
    { place_type: 'theater', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Chicago Theatre' },
    { place_type: 'theater', location_name: 'River North', latitude: 41.8917, longitude: -87.6244, place_name: 'Steppenwolf Theatre' },
    { place_type: 'theater', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Steppenwolf Theatre Company' },
    { place_type: 'theater', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Goodman Theatre' },
    
    // Shopping
    { place_type: 'shopping', location_name: 'Magnificent Mile', latitude: 41.8976, longitude: -87.6244, place_name: 'Water Tower Place' },
    { place_type: 'shopping', location_name: 'Magnificent Mile', latitude: 41.8976, longitude: -87.6244, place_name: '900 North Michigan Shops' },
    { place_type: 'shopping', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Macy\'s State Street' },
    { place_type: 'shopping', location_name: 'River North', latitude: 41.8917, longitude: -87.6244, place_name: 'Nordstrom' },
    
    // Hotels
    { place_type: 'hotel', location_name: 'Magnificent Mile', latitude: 41.8976, longitude: -87.6244, place_name: 'The Langham Chicago' },
    { place_type: 'hotel', location_name: 'River North', latitude: 41.8917, longitude: -87.6244, place_name: 'The Peninsula Chicago' },
    { place_type: 'hotel', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Chicago Athletic Association' },
    
    // Attractions
    { place_type: 'attraction', location_name: 'Millennium Park', latitude: 41.8825, longitude: -87.6244, place_name: 'Cloud Gate (The Bean)' },
    { place_type: 'attraction', location_name: 'Navy Pier', latitude: 41.8917, longitude: -87.6089, place_name: 'Navy Pier' },
    { place_type: 'attraction', location_name: 'The Loop', latitude: 41.8781, longitude: -87.6298, place_name: 'Willis Tower Skydeck' },
    { place_type: 'attraction', location_name: 'Lincoln Park', latitude: 41.9256, longitude: -87.6388, place_name: 'Lincoln Park Zoo' }
];

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to database');
});

// Clear existing data (optional - comment out if you want to keep existing data)
db.run('DELETE FROM recommendations', (err) => {
    if (err) {
        console.error('Error clearing data:', err.message);
    } else {
        console.log('Cleared existing recommendations');
    }
    
    // Insert sample data
    const sql = `INSERT INTO recommendations (place_type, location_name, latitude, longitude, place_name)
                 VALUES (?, ?, ?, ?, ?)`;
    
    let inserted = 0;
    let errors = 0;
    
    sampleData.forEach((item, index) => {
        db.run(sql, [item.place_type, item.location_name, item.latitude, item.longitude, item.place_name], function(err) {
            if (err) {
                console.error(`Error inserting item ${index + 1}:`, err.message);
                errors++;
            } else {
                inserted++;
            }
            
            // Close database when done
            if (inserted + errors === sampleData.length) {
                console.log(`\nSeeding complete!`);
                console.log(`Inserted: ${inserted} recommendations`);
                if (errors > 0) {
                    console.log(`Errors: ${errors}`);
                }
                db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err.message);
                    } else {
                        console.log('Database closed');
                    }
                    process.exit(0);
                });
            }
        });
    });
});

