-- ==============================================================================
-- CHECK RLS STATUS ON TABLES
-- Run this in Supabase SQL Editor to see which tables have RLS enabled
-- ==============================================================================

SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('roasters', 'coffee_offerings', 'equipment', 'pending_cafes', 'pending_equipment', 'pending_roasters', 'notifications')
ORDER BY tablename;

-- Also check existing policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
