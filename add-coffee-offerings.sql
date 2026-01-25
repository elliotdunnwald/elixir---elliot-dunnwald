-- Add Coffee Offerings to Supabase Database
-- Run this in Supabase SQL Editor

-- First, ensure we have the roasters
INSERT INTO roasters (name, city, country) VALUES
  ('Blue Bottle Coffee', 'Oakland', 'USA'),
  ('Onyx Coffee Lab', 'Springdale', 'USA')
ON CONFLICT (name) DO NOTHING;

-- Now add all coffee offerings
INSERT INTO coffee_offerings (roaster_id, name, lot, origin, region, estate, varietals, processing, roast_level, tasting_notes, elevation, price, size, available)
SELECT
  r.id,
  offering.name,
  offering.lot,
  offering.origin,
  offering.region,
  offering.estate,
  offering.varietals,
  offering.processing,
  offering.roast_level,
  offering.tasting_notes,
  offering.elevation,
  offering.price,
  offering.size,
  TRUE
FROM (VALUES
  -- Blue Bottle Coffees
  ('Blue Bottle Coffee', 'Kenya Kiambu Handege', 'Varies', 'Kenya', 'Kiambu', 'Handege Factory', ARRAY['SL28', 'SL34'], 'Washed', 'Light', ARRAY['Lavender', 'Black Cherry', 'Lemongrass'], '1700-1900m', 16.00, '12 oz'),
  ('Blue Bottle Coffee', 'Guatemala Antigua Josué Morales', 'Varies', 'Guatemala', 'Antigua', 'Varies', ARRAY['Bourbon', 'Caturra'], 'Washed', 'Light', ARRAY['Brown Sugar', 'Orange Zest', 'Jasmine'], '1500-1800m', 14.50, '12 oz'),
  ('Blue Bottle Coffee', 'Winter Single Origin', 'Varies', 'Ethiopia', 'Hambela', 'METAD', ARRAY['Indigenous Landraces'], 'Natural', 'Medium', ARRAY['Blueberry Jam', 'Honey', 'Lavender'], '1900-2200m', 27.00, '10 oz'),
  ('Blue Bottle Coffee', 'Panama Finca Deborah Interstellar', 'Limited', 'Panama', 'Volcán', 'Finca Deborah', ARRAY['Geisha'], 'Carbonic Maceration', 'Light', ARRAY['Peach', 'Strawberry Jam', 'Jasmine'], '>1900m', 90.00, '100g'),
  ('Blue Bottle Coffee', 'Winter Blend', 'Varies', 'Ethiopia, Guatemala', 'Varies', 'N/A', ARRAY['Arabica (Blend)'], 'Natural, Washed', 'Medium', ARRAY['Dark Chocolate', 'Molasses', 'Blackberry'], 'Varies', 27.00, '12 oz'),
  ('Blue Bottle Coffee', 'Tokyo Kissa', 'Varies', 'Americas, Indo-Pacific', 'Varies', 'N/A', ARRAY['Arabica (Blend)'], 'Washed, Wet Hulled', 'Dark', ARRAY['Bittersweet Cocoa', 'Nutmeg', 'Molasses'], 'Varies', 25.00, '12 oz'),
  ('Blue Bottle Coffee', 'Bella Donovan', 'Varies', 'Ethiopia, Sumatra', 'Varies', 'N/A', ARRAY['Arabica (Blend)'], 'Natural, Wet Hulled', 'Medium', ARRAY['Raspberry', 'Chocolate', 'Molasses'], 'Varies', 22.00, '12 oz'),
  ('Blue Bottle Coffee', 'Giant Steps', 'Varies', 'Uganda, PNG, Sumatra', 'Varies', 'N/A', ARRAY['Arabica (Blend)'], 'Washed, Wet Hulled', 'Dark', ARRAY['Cocoa', 'Toasted Marshmallow', 'Graham Cracker'], 'Varies', 22.00, '12 oz'),
  ('Blue Bottle Coffee', 'Three Africas', 'Varies', 'Ethiopia, Uganda', 'Varies', 'N/A', ARRAY['Arabica (Blend)'], 'Natural, Washed', 'Medium', ARRAY['Golden Raisin', 'Winey Blueberry', 'Lemon Zest'], 'Varies', 22.00, '12 oz'),
  ('Blue Bottle Coffee', 'Hayes Valley Espresso', 'Varies', 'Americas', 'Varies', 'N/A', ARRAY['Arabica', 'Robusta'], 'Washed, Natural', 'Dark', ARRAY['Baking Chocolate', 'Orange Zest', 'Brown Sugar'], 'Varies', 22.00, '12 oz'),
  ('Blue Bottle Coffee', '17ft Ceiling Espresso', 'Varies', 'Ethiopia, India', 'Varies', 'N/A', ARRAY['Arabica', 'Robusta'], 'Natural, Washed', 'Dark', ARRAY['Caramel', 'Almond', 'Dried Cherry'], 'Varies', 22.00, '12 oz'),
  ('Blue Bottle Coffee', 'Opascope Espresso', 'Varies', 'Rwanda/East Africa', 'Varies', 'N/A', ARRAY['Arabica (Single Origin)'], 'Washed', 'Light', ARRAY['Tropicalia', 'Apricot', 'Jasmine'], 'Varies', 22.00, '12 oz'),
  ('Blue Bottle Coffee', 'Winter Espresso', 'Varies', 'Americas, Ethiopia', 'Varies', 'N/A', ARRAY['Arabica (Blend)'], 'Natural, Washed', 'Dark', ARRAY['Dark Chocolate', 'Dried Raspberry', 'Salted Toffee'], 'Varies', 27.00, '12 oz'),
  ('Blue Bottle Coffee', 'Night Light Decaf', 'Varies', 'Sumatra, Central America', 'Varies', 'N/A', ARRAY['Arabica (Blend)'], 'Swiss Water Process', 'Medium', ARRAY['Crème Brûlée', 'Vanilla', 'Key Lime'], 'Varies', 22.00, '12 oz'),

  -- Onyx Coffee Lab Coffees
  ('Onyx Coffee Lab', 'Southern Weather', 'Varies', 'Colombia, Ethiopia', 'Varies', 'Smallholders', ARRAY['Mixed', 'Rotating Microlots'], 'Washed', 'Light', ARRAY['Milk Chocolate', 'Plum', 'Candied Walnuts', 'Citrus'], '1850m', 21.50, '10 oz'),
  ('Onyx Coffee Lab', 'Geometry', 'Varies', 'Colombia, Ethiopia', 'Varies', 'Smallholders', ARRAY['Mixed', 'Rotating Microlots'], 'Washed', 'Expressive Light', ARRAY['Berries', 'Stone Fruit', 'Earl Grey', 'Honeysuckle'], '1950m', 22.50, '10 oz'),
  ('Onyx Coffee Lab', 'Tropical Weather', 'Varies', 'Ethiopia', 'Varies', 'Varies', ARRAY['Indigenous Landraces'], 'Natural, Washed', 'Expressive Light', ARRAY['Mixed Berries', 'Sweet Tea', 'Raw Honey', 'Plum'], 'Varies', 24.50, '10 oz'),
  ('Onyx Coffee Lab', 'Monarch', 'Varies', 'Ethiopia, Colombia', 'Varies', 'Varies', ARRAY['Mixed'], 'Natural, Washed', 'Expressive Dark', ARRAY['Dark Chocolate', 'Molasses', 'Red Wine', 'Dried Berries'], 'Varies', 21.50, '10 oz'),
  ('Onyx Coffee Lab', 'Power Nap', 'Varies', 'Colombia, Ethiopia', 'Varies', 'Varies', ARRAY['Mixed'], 'Washed, Natural', 'Light', ARRAY['Brown Sugar', 'Cocoa', 'Silky', 'Floral', 'Peach'], 'Varies', 24.50, '10 oz'),
  ('Onyx Coffee Lab', 'Eclipse', 'Varies', 'Ethiopia, Guatemala', 'Varies', 'Varies', ARRAY['Mixed'], 'Washed', 'Dark', ARRAY['Bakers Chocolate', 'Burnt Sugar', 'Smoked Vanilla'], 'Varies', 22.50, '10 oz'),
  ('Onyx Coffee Lab', 'Cold Brew', 'Varies', 'Americas, Africa', 'Varies', 'Varies', ARRAY['Mixed'], 'Washed, Natural', 'Moderate', ARRAY['Cocoa', 'Dates', 'Brown Sugar', 'Creamy'], 'Varies', 21.50, '10 oz'),
  ('Onyx Coffee Lab', 'Framily (Holiday)', 'Varies', 'Ethiopia, Guatemala', 'Varies', 'Varies', ARRAY['Mixed'], 'Washed, Natural', 'Moderate', ARRAY['Grilled Peach', 'Earl Grey', 'Milk Chocolate', 'Berries'], 'Varies', 26.00, '10 oz'),
  ('Onyx Coffee Lab', 'Seasonal East Africa (RED)', 'Varies', 'East Africa', 'Varies', 'Varies', ARRAY['Mixed'], 'Washed', 'Expressive Light', ARRAY['Nectarine', 'Milk Chocolate', 'Sugar Cane', 'Cranberry'], 'Varies', 24.00, '8 oz'),
  ('Onyx Coffee Lab', 'USA Cycling', 'Varies', 'Varies', 'Varies', 'Varies', ARRAY['Mixed'], 'Varies', 'Expressive Dark', ARRAY['Dark Chocolate', 'Molasses', 'Red Wine', 'Syrupy'], 'Varies', 25.00, '10 oz'),
  ('Onyx Coffee Lab', 'Its All Downhill From Here', 'Varies', 'Varies', 'Varies', 'Varies', ARRAY['Mixed'], 'Varies', 'Expressive Dark', ARRAY['Molasses', 'Cranberry', 'Chocolate Ganache'], 'Varies', 27.00, '10 oz'),
  ('Onyx Coffee Lab', 'China Lao Xu Zhai', 'Varies', 'China', 'Yunnan', 'Lao Xu Zhai', ARRAY['Catimor'], 'Anaerobic', 'Expressive Light', ARRAY['Tamarind', 'Dark Chocolate', 'Mango', 'Blackberry'], 'Varies', 28.00, '10 oz'),
  ('Onyx Coffee Lab', 'Honduras Sagastume Family', 'Varies', 'Honduras', 'Santa Barbara', 'Sagastume', ARRAY['Parainema'], 'Natural', 'Expressive Light', ARRAY['Sweet Plantain', 'Blackberry', 'Cacao Nib', 'Molasses'], 'Varies', 26.00, '10 oz'),
  ('Onyx Coffee Lab', 'Kenya Elshadai Estate', 'Varies', 'Kenya', 'Nyeri', 'Elshadai Estate', ARRAY['SL28', 'SL34'], 'Natural', 'Expressive Light', ARRAY['Dark Chocolate', 'Melon', 'Blackberry', 'Raisin'], 'Varies', 27.00, '10 oz'),
  ('Onyx Coffee Lab', 'Ethiopia Keramo', 'Varies', 'Ethiopia', 'Sidama', 'Keramo', ARRAY['Landrace'], 'Anaerobic Natural', 'Expressive Light', ARRAY['Mixed Berries', 'Pink Lemonade', 'Herbal Honey'], 'Varies', 38.00, '10 oz'),
  ('Onyx Coffee Lab', 'Ethiopia Bochesa (Anaerobic)', 'Varies', 'Ethiopia', 'Sidama', 'Bochesa Station', ARRAY['Landrace'], 'Anaerobic Natural', 'Expressive Light', ARRAY['Blueberry', 'Mead', 'Cranberry', 'Mango Nectar'], '2248m', 38.00, '10 oz'),
  ('Onyx Coffee Lab', 'Ethiopia Bochesa (Natural)', 'Varies', 'Ethiopia', 'Sidama', 'Bochesa Station', ARRAY['Landrace'], 'Natural', 'Light', ARRAY['Tangerine', 'Honey Pastry', 'Plum', 'Vanilla'], '2248m', 27.00, '10 oz'),
  ('Onyx Coffee Lab', 'Ethiopia Bochesa (Washed)', 'Varies', 'Ethiopia', 'Sidama', 'Bochesa Station', ARRAY['Landrace'], 'Anaerobic Washed', 'Expressive Light', ARRAY['Peach', 'Jasmine', 'Yellow Pear', 'Caramel'], '2248m', 38.00, '10 oz'),
  ('Onyx Coffee Lab', 'Ethiopia Tamiru Tadesse', 'Varies', 'Ethiopia', 'Sidama', 'Alo Village', ARRAY['Landrace'], 'Honey', 'Light', ARRAY['Strawberry', 'Cream', 'Orange', 'White Honey'], 'Varies', 35.00, '10 oz'),
  ('Onyx Coffee Lab', 'Uganda Long Miles Lunar', 'Varies', 'Uganda', 'Rwenzori', 'Lunar Station', ARRAY['SL14', 'SL28'], 'Natural', 'Expressive Light', ARRAY['Rose', 'Cranberry', 'Milk Chocolate', 'Plum'], 'Varies', 26.00, '10 oz'),
  ('Onyx Coffee Lab', 'Costa Rica Las Lajas', 'Varies', 'Costa Rica', 'Central Valley', 'Las Lajas', ARRAY['Caturra', 'Catuai'], 'Natural', 'Expressive Light', ARRAY['Cherry', 'Milk Chocolate', 'Concord Grape', 'Honey'], 'Varies', 27.00, '10 oz'),
  ('Onyx Coffee Lab', 'Colombia Aponte Village', 'Varies', 'Colombia', 'Nariño', 'Aponte Village', ARRAY['Caturra'], 'Honey', 'Expressive Light', ARRAY['Rainier Cherry', 'Butterscotch', 'Green Apple'], 'Varies', 24.00, '10 oz'),
  ('Onyx Coffee Lab', 'Colombia Juan Jimenez', 'Varies', 'Colombia', 'Quindio', 'El Placer', ARRAY['Pink Bourbon'], 'Washed', 'Expressive Light', ARRAY['Bubble Gum', 'Green Banana', 'Tangerine', 'Panela'], 'Varies', 32.00, '10 oz'),
  ('Onyx Coffee Lab', 'Colombia Sebastian Ramirez', 'Varies', 'Colombia', 'Quindio', 'El Placer', ARRAY['Caturra'], 'Carbonic (IPA)', 'Light', ARRAY['Mango', 'Lemongrass', 'Orange Peel', 'Lemon Candy'], 'Varies', 48.00, '10 oz'),
  ('Onyx Coffee Lab', 'Colombia Brayan Alvear', 'Varies', 'Colombia', 'Huila', 'Varies', ARRAY['Melon Co-Ferment'], 'Experimental', 'Expressive Light', ARRAY['Watermelon', 'Powdery Candy', 'Pineapple'], 'Varies', 40.00, '10 oz'),
  ('Onyx Coffee Lab', 'Colombia La Riviera', 'Varies', 'Colombia', 'Huila', 'La Riviera', ARRAY['Varies'], 'Nitro Watermelon', 'Expressive Light', ARRAY['Watermelon', 'Raspberry', 'Green Apple', 'Rose'], 'Varies', 52.00, '10 oz'),
  ('Onyx Coffee Lab', 'Guatemala Finca Libano', 'Varies', 'Guatemala', 'Chimaltenango', 'Finca Libano', ARRAY['Gesha'], 'Washed', 'Moderate', ARRAY['Raw Sugar', 'Oolong Tea', 'Peach', 'Jasmine'], 'Varies', 52.00, '10 oz'),
  ('Onyx Coffee Lab', 'Panama Savage Coffees', 'Varies', 'Panama', 'Boquete', 'Savage Coffees', ARRAY['Gesha'], 'Natural', 'Expressive Light', ARRAY['Red Grape', 'Jasmine', 'Lavender', 'Almond'], 'Varies', 64.00, '10 oz'),
  ('Onyx Coffee Lab', 'Panama Elida Aguacate', 'Limited', 'Panama', 'Boquete', 'Elida Estate', ARRAY['Gesha'], 'Washed', 'Expressive Light', ARRAY['Jasmine', 'Blood Orange', 'Raw Sugar'], '>1800m', 150.00, '10 oz'),
  ('Onyx Coffee Lab', 'Panama Elida Falda', 'Limited', 'Panama', 'Boquete', 'Elida Estate', ARRAY['Gesha'], 'Anaerobic', 'Expressive Light', ARRAY['Violet', 'Chocolate Bonbon', 'Hibiscus', 'Creamy'], '>1800m', 148.00, '10 oz'),
  ('Onyx Coffee Lab', 'Panama Finca Deborah', 'Limited', 'Panama', 'Volcán', 'Finca Deborah', ARRAY['Gesha'], 'Carbonic Maceration', 'Expressive Light', ARRAY['Grape Soda', 'Lime', 'Violet', 'Jasmine'], '>1900m', 144.00, '10 oz'),
  ('Onyx Coffee Lab', 'Decaf Col. Inzá San Antonio', 'Varies', 'Colombia', 'Cauca', 'Inzá', ARRAY['Caturra', 'Castillo'], 'Washed (Decaf)', 'Moderate', ARRAY['Red Apple', 'Raw Sugar', 'Pear', 'Maple'], 'Varies', 24.50, '10 oz'),
  ('Onyx Coffee Lab', 'Decaf Col. Jhoan Vergara', 'Varies', 'Colombia', 'Huila', 'Las Flores', ARRAY['Pink Bourbon'], 'Washed (Decaf)', 'Expressive Dark', ARRAY['Tangerine', 'Oolong Tea', 'Mulling Spices'], 'Varies', 35.00, '10 oz'),
  ('Onyx Coffee Lab', 'Doyenne', 'Varies', 'Varies', 'Varies', 'Female Producers', ARRAY['Mixed'], 'Varies', 'Varies', ARRAY['Rotating Selection (Women Produced)'], 'Varies', 30.00, '10 oz'),
  ('Onyx Coffee Lab', 'Delta Spirit Espresso', 'Varies', 'Varies', 'Varies', 'Varies', ARRAY['Mixed'], 'Varies', 'Moderate', ARRAY['Milk Chocolate', 'Pomegranate', 'Smoked Vanilla'], 'Varies', 36.00, '27 oz'),
  ('Onyx Coffee Lab', 'Sources', 'Varies', 'Varies', 'Varies', 'Varies', ARRAY['Mixed'], 'Varies', 'Moderate', ARRAY['Chocolate', 'Caramelized Citrus', 'Golden Raisin'], 'Varies', 25.00, '10 oz'),
  ('Onyx Coffee Lab', 'Seb. Ramirez', 'Limited', 'Colombia', 'Quindio', 'El Placer', ARRAY['Gesha'], 'White Honey', 'Expressive Light', ARRAY['Jasmine', 'Pineapple', 'Lime', 'Manuka Honey'], 'Varies', 37.00, '10 oz'),
  ('Onyx Coffee Lab', 'Jhoan Vergara', 'Limited', 'Colombia', 'Huila', 'Las Flores', ARRAY['Java'], 'Natural', 'Moderate', ARRAY['Cherry', 'Mixed Berries', 'Violet', 'Fruit Punch'], 'Varies', 125.00, '10 oz'),
  ('Onyx Coffee Lab', 'Jose Jijon', 'Limited', 'Ecuador', 'Pichincha', 'Finca La Soledad', ARRAY['Sydra'], 'Washed', 'Moderate', ARRAY['Orange Blossom', 'Pear', 'Raw Sugar', 'Papaya'], 'Varies', 74.00, '10 oz')
) AS offering(roaster_name, name, lot, origin, region, estate, varietals, processing, roast_level, tasting_notes, elevation, price, size)
JOIN roasters r ON r.name = offering.roaster_name;

-- Success message
SELECT 'Successfully added ' || COUNT(*) || ' coffee offerings!' as message
FROM coffee_offerings
WHERE roaster_id IN (SELECT id FROM roasters WHERE name IN ('Blue Bottle Coffee', 'Onyx Coffee Lab'));
