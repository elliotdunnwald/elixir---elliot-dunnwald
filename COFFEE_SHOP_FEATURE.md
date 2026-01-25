# Coffee Shop Feature

## Overview
Added a new Coffee Shop view that allows users to browse and search through 56 coffee offerings from Blue Bottle Coffee and Onyx Coffee Lab.

## What Was Added

### 1. Database Functions (`lib/database.ts`)
- **`getRoasters()`** - Fetches all roasters from the database
- **`getCoffeeOfferings(filters)`** - Fetches coffee offerings with optional filters:
  - Filter by roaster
  - Filter by origin
  - Search by name, origin, or region
  - Filter by price range
- **`getCoffeeOfferingById(id)`** - Fetches a single coffee offering

### 2. New View Component (`views/CoffeeShop.tsx`)
A full-featured coffee browsing interface with:
- **Search bar** - Search by name, origin, or region
- **Roaster filter** - Filter by Blue Bottle or Onyx
- **Coffee cards** displaying:
  - Coffee name and roaster
  - Price and bag size
  - Origin, region, and estate
  - Varietals (as chips)
  - Processing method
  - Roast level (with color coding)
  - Tasting notes (as chips)
  - Lot number
- **Responsive grid** - 2 columns on desktop, 1 on mobile
- **Empty state** - Shows message when no results found

### 3. Navigation Updates
- **Desktop nav** - Added "COFFEE SHOP" link
- **Mobile nav** - Added "SHOP" tab with shopping bag icon
- **Route** - Added `/coffee-shop` route

## Coffee Offerings Data

### Blue Bottle Coffee (14 offerings)
- Single origins from Kenya, Guatemala, Ethiopia, Panama
- Blends: Winter Blend, Tokyo Kissa, Bella Donovan, Giant Steps, Three Africas
- Espresso blends: Hayes Valley, 17ft Ceiling, Opascope, Winter Espresso
- Decaf: Night Light Decaf

### Onyx Coffee Lab (39 offerings)
- House blends: Southern Weather, Geometry, Tropical Weather, Monarch
- Single origins from:
  - Ethiopia (Keramo, Bochesa variations, Tamiru Tadesse)
  - Colombia (multiple producers with experimental processes)
  - Honduras, Kenya, Uganda, Costa Rica, Guatemala
  - Panama (ultra-premium Geisha lots)
- Decaf options
- Limited editions and specialty micro-lots

## Features

### Search & Filter
- **Text search** - Instant search across name, origin, and region
- **Roaster filter** - View offerings from specific roasters
- **Clear filters** - Reset button to clear all filters

### Visual Design
- **Roast level color coding**:
  - Light roasts: Amber background
  - Medium roasts: Orange background
  - Dark roasts: Stone/brown background
- **Bordered cards** - Consistent with app's black/white aesthetic
- **Hover effects** - Cards highlight on hover
- **Icon indicators** - Coffee bean, map pin, sparkles, flame icons

### Data Display
- **Price** - Displayed prominently in white box
- **Varietals** - Shown as individual chips
- **Tasting notes** - Displayed as bordered chips
- **Processing** - Natural, Washed, Anaerobic, etc.
- **Elevation** - When available
- **Lot info** - Varies or Limited

## Usage

1. **Browse all coffees** - Navigate to Coffee Shop from main nav
2. **Search** - Type in search bar to find specific coffees
3. **Filter by roaster** - Click "FILTERS" and select a roaster
4. **View details** - Each card shows comprehensive coffee information

## Database Setup Required

Before the Coffee Shop will work, you need to run the SQL script:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy contents from `add-coffee-offerings.sql`
3. Run the query
4. Verify: Should add 2 roasters and 56 coffee offerings

## Technical Details

### TypeScript Interfaces
```typescript
interface Roaster {
  id: string;
  name: string;
  city: string;
  country: string;
  // ... other fields
}

interface CoffeeOffering {
  id: string;
  roaster_id: string;
  name: string;
  lot: string;
  origin: string;
  varietals: string[];
  processing: string;
  tasting_notes: string[];
  price: number;
  // ... other fields
  roaster?: Roaster; // Joined data
}
```

### Database Schema
Tables used:
- `roasters` - Roaster information
- `coffee_offerings` - Coffee product details with foreign key to roasters

### Performance
- Efficient queries with Supabase joins
- Instant client-side search filtering
- Lazy loading of roaster data
- Responsive design for mobile

## Future Enhancements (Optional)

Potential features to add:
- [ ] Price range slider filter
- [ ] Varietal filter (SL28, Geisha, etc.)
- [ ] Processing method filter
- [ ] Roast level filter
- [ ] Sort options (price, name, roast level)
- [ ] "Add to favorites" feature
- [ ] Coffee detail modal with expanded information
- [ ] Link to roaster profiles
- [ ] Filter by tasting notes
- [ ] "Similar coffees" recommendations

## Files Modified/Created

### Created:
- `views/CoffeeShop.tsx` - Main coffee browsing view
- `add-coffee-offerings.sql` - SQL script to populate database
- `COFFEE_SHOP_FEATURE.md` - This documentation

### Modified:
- `lib/database.ts` - Added coffee offering functions
- `App.tsx` - Added navigation and route
- Navigation (desktop + mobile) - Added Coffee Shop links

## Next Steps

1. Run the SQL script in Supabase
2. Navigate to `/coffee-shop` or click "COFFEE SHOP" in nav
3. Browse, search, and filter the 56 coffee offerings!

The feature is fully integrated and ready to use once the database is populated.
