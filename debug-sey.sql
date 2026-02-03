-- Check how SEY is stored in cafes table
SELECT id, name, city, country, visit_count, average_rating
FROM cafes
WHERE name ILIKE '%SEY%';

-- Check how your SEY visit is stored in brew_activities
SELECT id, cafe_name, cafe_city, cafe_country, rating, is_cafe_log
FROM brew_activities
WHERE cafe_name ILIKE '%SEY%'
AND is_cafe_log = true;

-- This will show if there's a mismatch between the two
