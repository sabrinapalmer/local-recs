// Expanded sample data for Chicago recommendations
// This will be inserted into server.js

const EXPANDED_SAMPLE_DATA = [
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

// Total: ~250+ recommendations

