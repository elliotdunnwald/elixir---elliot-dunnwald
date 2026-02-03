// Run this in browser console to debug SEY cafe issue
// This will show exactly how SEY is stored in both tables

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

async function debugSEYCafe() {
  console.log('=== DEBUGGING SEY CAFE ===\n');

  // Check cafes table
  console.log('1. Checking cafes table for SEY:');
  const { data: cafes } = await supabase
    .from('cafes')
    .select('id, name, city, country, visit_count, average_rating')
    .ilike('name', '%SEY%');

  console.log('Cafes found:', cafes);
  if (cafes && cafes.length > 0) {
    cafes.forEach(cafe => {
      console.log(`  - Name: "${cafe.name}" (length: ${cafe.name.length})`);
      console.log(`    City: "${cafe.city}" (length: ${cafe.city.length})`);
      console.log(`    Country: "${cafe.country}" (length: ${cafe.country.length})`);
      console.log(`    Uppercase: "${cafe.name.toUpperCase()}" "${cafe.city.toUpperCase()}" "${cafe.country.toUpperCase()}"`);
      console.log(`    Visit count: ${cafe.visit_count}, Rating: ${cafe.average_rating}\n`);
    });
  }

  // Check brew_activities table
  console.log('\n2. Checking brew_activities for SEY cafe visits:');
  const { data: visits } = await supabase
    .from('brew_activities')
    .select('id, cafe_name, cafe_city, cafe_country, rating, is_cafe_log')
    .ilike('cafe_name', '%SEY%')
    .eq('is_cafe_log', true);

  console.log('Visits found:', visits);
  if (visits && visits.length > 0) {
    visits.forEach(visit => {
      console.log(`  - Cafe: "${visit.cafe_name}" (length: ${visit.cafe_name?.length || 0})`);
      console.log(`    City: "${visit.cafe_city}" (length: ${visit.cafe_city?.length || 0})`);
      console.log(`    Country: "${visit.cafe_country}" (length: ${visit.cafe_country?.length || 0})`);
      console.log(`    Uppercase: "${visit.cafe_name?.toUpperCase()}" "${visit.cafe_city?.toUpperCase()}" "${visit.cafe_country?.toUpperCase()}"`);
      console.log(`    Rating: ${visit.rating}\n`);
    });
  }

  // Check for exact matches
  console.log('\n3. Testing exact match:');
  if (cafes && cafes.length > 0 && visits && visits.length > 0) {
    const cafe = cafes[0];
    const visit = visits[0];

    console.log(`Cafe in table: "${cafe.name.toUpperCase()}" / "${cafe.city.toUpperCase()}" / "${cafe.country.toUpperCase()}"`);
    console.log(`Visit logged: "${visit.cafe_name?.toUpperCase()}" / "${visit.cafe_city?.toUpperCase()}" / "${visit.cafe_country?.toUpperCase()}"`);

    console.log(`\nDo they match?`);
    console.log(`  Name: ${cafe.name.toUpperCase() === visit.cafe_name?.toUpperCase()}`);
    console.log(`  City: ${cafe.city.toUpperCase() === visit.cafe_city?.toUpperCase()}`);
    console.log(`  Country: ${cafe.country.toUpperCase() === visit.cafe_country?.toUpperCase()}`);

    // Check character by character for hidden whitespace
    console.log(`\nCharacter codes for cafe name in cafes table:`);
    console.log(Array.from(cafe.name).map(c => `${c}(${c.charCodeAt(0)})`).join(' '));

    console.log(`\nCharacter codes for cafe_name in brew_activities:`);
    console.log(Array.from(visit.cafe_name || '').map(c => `${c}(${c.charCodeAt(0)})`).join(' '));
  }

  console.log('\n=== DEBUG COMPLETE ===');
}

// Run it
debugSEYCafe().catch(console.error);
