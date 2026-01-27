# Roaster Approval System

## Overview
ELIXR now uses a crowd-sourced roaster database system where roasters are automatically tracked from user brew logs and you can review/approve them for the official database.

## How It Works

### 1. Automatic Tracking
- When users create brew logs, they type in a roaster name (free text field)
- The system automatically tracks these roaster submissions in the background
- Roasters are tracked by:
  - **Name**: The roaster name users enter
  - **Submission Count**: How many times users have brewed with this roaster
  - **User Count**: How many unique users have used this roaster
  - **First/Last Submitted**: Timestamps for tracking popularity

### 2. Admin Review Page
- Access the admin panel at: `/admin/roasters` (or navigate to `/#/admin/roasters`)
- You'll see all pending roaster submissions sorted by popularity (most brewed = top of list)
- Each roaster card shows:
  - Roaster name
  - Number of brews logged
  - Number of users who've used it
  - Approve/Reject buttons

### 3. Approval Workflow
When you click "APPROVE" on a roaster:
1. A modal appears asking for roaster details:
   - **City** (required)
   - **Country** (required)
   - **State** (optional)
   - **Website** (optional)
   - **Founded Year** (optional)

2. After filling in details and clicking "ADD ROASTER":
   - Roaster is marked as approved in the database
   - Roaster is added to the official roasters table
   - It appears in both the Marketplace and Roaster Database views
   - Users can now see it in search results

### 4. Rejection
- Click "REJECT" to remove a roaster from pending submissions
- This is useful for duplicates, typos, or non-specialty roasters

## Database Setup

### Run the Migration
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase_pending_roasters_migration.sql`
4. Run the SQL script
5. This creates the `pending_roasters` table and tracking function

### Tables Created
- **pending_roasters**: Tracks roaster submissions
  - Stores roaster name, submission count, user IDs
  - Status: pending/approved/rejected
  - Timestamps for tracking

## Benefits

1. **Time-Saving**: Only add roasters your community actually uses
2. **Data Quality**: Focus on roasters with real usage data
3. **Community-Driven**: Users naturally populate the database
4. **No Manual Entry**: Roasters are automatically captured from brew logs
5. **Popularity Sorting**: See which roasters are most popular first

## Starting Fresh
The roaster database has been cleared to just 2 examples (Blue Bottle, Onyx). As users log brews:
- Their roaster names accumulate in the pending list
- You review and approve the ones worth adding
- The database grows organically based on actual usage

## Access
- Admin panel: Navigate to `/#/admin/roasters` in your browser
- Or add a navigation link in your app UI pointing to `/admin/roasters`

## Notes
- No authentication check on admin page yet - consider adding profile-based admin access
- The tracking happens silently in the background (users don't see it)
- Approved roasters immediately appear in Marketplace and Roaster Database
- All roaster names are tracked (even if they're typos), so you can clean them up during review
