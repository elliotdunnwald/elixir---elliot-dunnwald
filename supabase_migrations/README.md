# Database Migrations

## How to Run Migrations

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the SQL from the migration file
4. Click "Run" to execute

## Migration Files

### `add_cafes_tables.sql`
Adds support for cafe rating system:
- Creates `cafes` table for storing cafe information
- Creates `pending_cafes` table for user-submitted cafes awaiting approval
- Adds RLS policies for security
- Creates trigger to auto-update cafe ratings when visits are logged

**Run this migration to enable cafe features in the app.**
