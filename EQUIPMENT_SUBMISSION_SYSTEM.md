# Equipment Submission System

## Overview
ELIXR now has a crowd-sourced marketplace submission system where users can submit roasters and equipment for your approval. This creates a community-driven marketplace that grows organically.

## User Experience

### Marketplace Submissions
Users can access two submission forms from the Marketplace page:

1. **Submit Roaster** - Submit coffee roasters
   - Fields: Roaster name (required)
   - One-click submission
   - Tracked for popularity

2. **Submit Equipment** - Submit brewing equipment
   - Fields: Type, Brand, Model, Description
   - Types: Brewer, Grinder, Filter, Water Equipment, Accessory
   - Examples: Hario V60, Baratza Encore, Third Wave Water, etc.

After submission, users see a confirmation that their submission is under review.

## Admin Review

### Roaster Approval
- Access: `/#/admin/roasters`
- Shows all pending roaster submissions
- Sorted by popularity (most-used roasters first)
- Approve/Reject buttons
- On approval: Fill in location details, website, founded year
- Roaster appears in Marketplace immediately

### Equipment Approval
- Access: `/#/admin/equipment`
- Shows all pending equipment submissions
- Categorized by type (Brewer, Grinder, Filter, Water, Accessory)
- Sorted by submission count
- Shows: Equipment name, brand, type, description
- On approval: Add optional details (image URL, price, website)
- Equipment appears in Marketplace immediately

## Equipment Types

### Brewers
- Pour-over brewers (V60, Chemex, Kalita Wave)
- Automatic brewers (Moccamaster, Ratio, etc.)
- Espresso machines
- French press, AeroPress, etc.

### Grinders
- Manual grinders (Comandante, 1Zpresso)
- Electric grinders (Baratza, Fellow Ode)
- Espresso grinders (Niche Zero, etc.)

### Filters
- Paper filters (V60, Chemex, Kalita)
- Metal filters
- Cloth filters

### Water Equipment
- Water mineralization (Third Wave Water, Perfect Coffee Water)
- Water filters
- Kettles (Fellow Stagg, Bonavita)

### Accessories
- Scales
- Thermometers
- Tampers
- Distribution tools
- Cleaning products

## Database Setup

### Run the Migration
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase_pending_equipment_migration.sql`
4. Run the SQL script
5. This creates:
   - `pending_equipment` table (tracks submissions)
   - `equipment` table (approved equipment)
   - Tracking functions
   - RLS policies

### Tables Created

**pending_equipment:**
- equipment_name, equipment_type, brand, description
- submission_count, submitted_by_users
- status (pending/approved/rejected)
- Unique constraint on name + type

**equipment:**
- name, brand, type, description
- image_url, price, website_url
- Searchable and filterable

## Benefits

1. **Community-Driven**: Users submit what they actually use
2. **No Manual Entry**: Submissions happen organically
3. **Popularity-Based**: See which equipment is most requested
4. **Quality Control**: You approve everything before it goes live
5. **Comprehensive Database**: Covers all aspects of coffee brewing

## Marketplace Growth

As the marketplace grows, you can:
- Display equipment on dedicated marketplace pages
- Link equipment to user profiles (show what gear they use)
- Enable equipment reviews and ratings
- Add affiliate links for monetization
- Create equipment comparison tools

## Access URLs

- **User Submissions**: Marketplace page → "Submit Roaster" / "Submit Equipment" buttons
- **Admin Roaster Review**: `/#/admin/roasters`
- **Admin Equipment Review**: `/#/admin/equipment`

## Notes
- All submissions are tracked even if duplicate (helps with popularity)
- Users don't need to be logged in to see submissions
- Only you can approve/reject submissions
- Approved items appear immediately in the marketplace
- Consider adding admin authentication to the admin pages
