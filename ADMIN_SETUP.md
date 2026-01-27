# Admin Setup Guide

## Overview
ELIXR has an admin system that allows designated users to approve roaster and equipment submissions. Only admins can see and access the admin pages.

## Setting Up Admins

### Step 1: Run the Migration
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase_admin_field_migration.sql`
4. Run the SQL script
5. This adds the `is_admin` field to profiles

### Step 2: Make Yourself an Admin

**Option A: Using SQL Editor (Easiest)**
1. Go to Supabase SQL Editor
2. Run this query with your profile ID:
```sql
SELECT set_admin_status('your-profile-id-here', true);
```

**Option B: Using Table Editor**
1. Go to Supabase → Table Editor
2. Open the `profiles` table
3. Find your profile row
4. Edit the `is_admin` column to `true`
5. Save

### Step 3: Finding Your Profile ID

**Method 1: From the app**
1. Log into ELIXR
2. Open browser console (F12)
3. Run: `localStorage.getItem('supabase.auth.token')`
4. Copy the user ID from the token

**Method 2: From Supabase**
1. Go to Supabase → Table Editor
2. Open `profiles` table
3. Find your row by email or name
4. Copy the `id` column value

## Admin Features

Once you're an admin, you'll see:

### Navigation
- **ADMIN: ROASTERS** link in the top navigation
- **ADMIN: EQUIPMENT** link in the top navigation

### Admin Pages

**Roaster Approvals** (`/#/admin/roasters`)
- View all pending roaster submissions
- See roaster name, location, website
- See submission count and user count
- One-click approve/reject

**Equipment Approvals** (`/#/admin/equipment`)
- View all pending equipment submissions
- See equipment name, brand, type, description
- See submission count and user count
- Approve with optional details (image, price, website)

## Making Other Users Admins

To give admin access to other users:

1. Get their profile ID from the `profiles` table in Supabase
2. Run this SQL query:
```sql
SELECT set_admin_status('their-profile-id-here', true);
```

To remove admin access:
```sql
SELECT set_admin_status('their-profile-id-here', false);
```

## Security Notes

- Non-admins cannot see admin navigation links
- Non-admins get "ACCESS DENIED" if they try to access admin URLs directly
- Admin status is stored in the database, not localStorage
- RLS policies ensure only admins can approve submissions

## Recommended Setup

1. Make yourself an admin first
2. Test the admin approval workflow
3. Only add other admins as needed
4. Consider creating a dedicated "admin" user account for your team
