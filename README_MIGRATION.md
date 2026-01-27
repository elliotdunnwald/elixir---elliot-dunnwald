# Database Migration Required

## Rating Constraint Update

The rating system has been updated to use a 0-10 scale instead of 0-5.

### Steps to apply:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the SQL commands in `supabase_migration.sql`:

```sql
-- Drop the old constraint
ALTER TABLE brew_activities 
DROP CONSTRAINT IF EXISTS brew_activities_rating_check;

-- Add new constraint with 0-10 range
ALTER TABLE brew_activities 
ADD CONSTRAINT brew_activities_rating_check 
CHECK (rating >= 0 AND rating <= 10);
```

4. After running the migration, the app will work with 0-10 ratings.

### Why this is needed:

The database currently has a CHECK constraint limiting ratings to 0-5, but the UI has been updated to use 0-10. This migration updates the database to match the UI.
