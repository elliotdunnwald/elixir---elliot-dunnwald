# 🌟 Crowd-Sourced Database Feature

## Overview

The app now automatically builds a comprehensive coffee database through user contributions. Every time someone logs a brew, the system intelligently captures and tracks roasters, coffees, and cafes for admin review.

## Features Implemented

### 1. **New Roaster Detection & Details Prompt** ✅

When users enter a roaster name that doesn't exist in the database:

**What happens:**
- A button appears: **"⭐ Add [Roaster Name] to database"**
- Clicking opens a modal to collect roaster details:
  - City (required)
  - Country (required)
  - State/Province (optional)
  - Website (optional)
- Submits to `pending_roasters` table
- Admin can approve/reject in Admin → Roasters

**User Experience:**
```
User types: "Blue Bottle"
→ No match found
→ Button appears: "⭐ Add Blue Bottle to database"
→ User clicks → Modal opens
→ User enters: San Francisco, USA, CA, https://bluebottlecoffee.com
→ Submits
→ Alert: "Roaster submitted for approval!"
```

### 2. **Automatic Coffee Offering Tracking** ✅

Every brew log with coffee details automatically submits to `pending_coffee_offerings`:

**What gets tracked:**
- Roaster name
- Coffee name (constructed from estate + lot, or just estate/lot)
- Origin (country)
- Estate (optional)
- Lot (optional)
- Varietal (optional)
- Process (optional)

**How it works:**
- User logs brew with "SEY / Ethiopia / Hambela / Natural"
- System automatically creates pending coffee entry
- Admin reviews in Admin → Coffees
- Once approved, appears in Roasters database

**Success Message:**
After posting brew:
```
Brew log posted! ✓ Roaster tracked
✓ Coffee automatically submitted for database review
```

### 3. **Automatic Cafe Tracking** ✅ (Already existed)

When users log cafe visits:
- Cafe details submitted to `pending_cafes`
- Includes: name, city, country, address
- Auto-geocodes when admin approves
- Appears on map

## Database Tables Involved

### `pending_roasters`
- Tracks user-submitted roasters awaiting approval
- Includes location details and submission frequency
- Multiple users submitting same roaster increases priority

### `pending_coffee_offerings`
- Tracks coffees from brew logs
- Links roaster → coffee → origin → details
- Helps build comprehensive coffee catalog

### `pending_cafes`
- Tracks cafe visits
- Auto-geocodes on approval
- Shows on interactive map

## Admin Workflow

**1. Review Roasters** (`/admin/roasters`)
- See all pending roaster submissions
- View submission count (popularity indicator)
- Approve → adds to roasters database
- Reject → removes from pending

**2. Review Coffees** (`/admin/coffees`)
- See all coffees tracked from brew logs
- Filter by roaster, origin, submission count
- Approve → adds to coffee offerings
- Reject → removes from pending

**3. Review Cafes** (`/admin/cafes`)
- See all submitted cafes
- Auto-geocodes on approval (using Nominatim)
- Approve → adds to cafes database + appears on map
- Reject → removes from pending

## Benefits

### For Users:
- ✅ Help build the database by logging what they drink
- ✅ Discover new roasters and coffees
- ✅ Find cafes near them on the map
- ✅ Simple one-time data entry (prompts only for new items)

### For the Platform:
- ✅ Crowd-sourced database grows automatically
- ✅ Popular items (high submission count) get prioritized
- ✅ Quality control through admin review
- ✅ Rich, curated coffee catalog

### For Admins:
- ✅ Easy review interface
- ✅ Submission count indicates popularity
- ✅ One-click approve/reject
- ✅ Auto-geocoding for cafes

## User Flow Examples

### Example 1: New Roaster
```
1. User logs brew
2. Types roaster: "Onyx Coffee Lab"
3. Not found → "⭐ Add Onyx Coffee Lab to database" button appears
4. Clicks button → Modal opens
5. Fills: Rogers, USA, AR, https://onyxcoffeelab.com
6. Submits → "Roaster submitted for approval!"
7. Admin reviews → Approves
8. Onyx Coffee Lab now in database
9. Next user can select it from dropdown
```

### Example 2: Coffee Auto-Tracking
```
1. User logs brew
2. Roaster: SEY
3. Origin: Ethiopia
4. Estate: Hambela
5. Varietal: 74110
6. Process: Natural
7. Posts brew log
8. System automatically submits coffee to pending
9. Alert: "Brew log posted! ✓ Coffee automatically submitted"
10. Admin approves → Coffee appears in Roasters database
```

### Example 3: Cafe Visit
```
1. User logs cafe visit
2. Cafe: SEY Coffee
3. City: Brooklyn
4. Country: USA
5. Address: 18 Grattan St
6. Posts log
7. System submits to pending_cafes
8. Admin approves → Auto-geocodes using address
9. SEY appears on map with marker
10. Other users can find it
```

## Technical Implementation

### Files Modified:
- `/components/BrewLogModal.tsx` - Added new roaster prompt & modal
- `/lib/database.ts` - Already had tracking functions
- `/views/AdminCafes.tsx` - Already had geocoding

### New UI Components:
- New Roaster button (appears when typing unknown roaster)
- Roaster details modal (collects city, country, state, website)
- Success message (shows what was auto-submitted)

### Database Functions Used:
- `trackRoasterSubmission()` - Tracks roaster (called automatically)
- `trackCoffeeFromBrewLog()` - Tracks coffee (called automatically)
- `trackCafeFromVisit()` - Tracks cafe (called automatically)

## Testing Checklist

- [ ] Type a new roaster name → Button appears
- [ ] Click button → Modal opens
- [ ] Fill details and submit → Success message
- [ ] Check Admin → Roasters → See pending roaster
- [ ] Log brew with coffee details → Auto-tracked
- [ ] Check Admin → Coffees → See pending coffee
- [ ] Log cafe visit → Auto-tracked
- [ ] Check Admin → Cafes → See pending cafe
- [ ] Approve roaster → Appears in database
- [ ] Approve coffee → Appears in roaster's offerings
- [ ] Approve cafe → Appears on map

## Future Enhancements

### Possible additions:
- **User reputation system** - Track contribution quality
- **Duplicate detection** - AI-powered fuzzy matching
- **Batch approval** - Approve multiple at once
- **User feedback** - Notify users when their submission is approved
- **Contribution stats** - Show users how much they've contributed
- **Community moderation** - Let users vote on submissions

## Notes

- All submissions require admin approval (quality control)
- Submission count helps prioritize popular items
- Auto-tracking is silent - doesn't interrupt user flow
- Geocoding is free (uses Nominatim from OpenStreetMap)
- No API keys needed for any of this!
