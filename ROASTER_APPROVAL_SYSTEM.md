# Roaster Approval System

## Overview
ELIXR has a seamless crowd-sourced roaster submission system where users submit complete roaster information upfront, and you approve with a single click.

## User Experience

### Marketplace Submissions
Users can submit roasters directly from the Marketplace page:
- Click "Submit Roaster" button
- Fill in complete information:
  - **Roaster name** (required)
  - **City** (required)
  - **State/Region** (optional)
  - **Country** (required)
  - **Website** (optional)
- Submit for review
- See confirmation message

### Automatic Brew Log Tracking
When users create brew logs, the roaster name is automatically tracked:
- First-time roaster: System tracks it for admin review
- Existing roaster: Adds to submission count
- Users provide location/website details when prompted (if not already in system)

## Admin Review

### Roaster Approval Page
- Access: `/#/admin/roasters`
- Shows all pending roaster submissions sorted by popularity
- Each card displays:
  - **Roaster name** in large text
  - **Location**: City, State, Country
  - **Website**: Clickable link
  - **Stats**: Number of brews logged and unique users
  - **Warning badge** if missing required location info

### Approval Process (1-Click)
1. Review the roaster information displayed on the card
2. Click **APPROVE** button
3. Confirm the approval in the popup
4. Roaster is instantly added to marketplace database

**No extra forms or data entry needed** - users provide all the information upfront!

If a roaster is missing city/country, the approval will fail with a message prompting the user to resubmit with complete info.

### Rejection
- Click **REJECT** to remove a roaster from pending submissions
- Useful for duplicates, typos, or non-specialty roasters

## Database Setup

### Run the Migration
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase_pending_roasters_migration.sql`
4. Run the SQL script
5. This creates the `pending_roasters` table with location fields and tracking function

### Tables Created
- **pending_roasters**: Tracks roaster submissions
  - roaster_name, city, country, state, website
  - submission_count, submitted_by_users
  - Status: pending/approved/rejected
  - Timestamps for tracking

- **roasters**: Approved roasters visible in marketplace
  - name, city, country, state, website, founded_year
  - Searchable and filterable

## Benefits

1. **Seamless**: No admin data entry - users provide everything
2. **Fast**: Single-click approval workflow
3. **Complete**: All roaster info collected upfront
4. **Community-Driven**: Users naturally populate the database
5. **Popularity-Based**: See which roasters are most requested

## Access
- Admin panel: Navigate to `/#/admin/roasters` in your browser
- Or add a navigation link in your app UI pointing to `/admin/roasters`

## Notes
- No authentication check on admin page yet - consider adding profile-based admin access
- The tracking happens automatically when users create brew logs
- Approved roasters immediately appear in Marketplace
- Duplicate submissions increment the count (shows popularity)
