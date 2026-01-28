-- Backfill pending coffees from existing brew activities
-- This will add all unique coffees from brew logs to the pending_coffee_offerings table

DO $$
DECLARE
  activity_record RECORD;
  processed_count INTEGER := 0;
BEGIN
  -- Loop through all brew activities
  FOR activity_record IN
    SELECT DISTINCT
      roaster,
      title as coffee_name,
      bean_origin as origin,
      estate,
      varietal,
      process,
      profile_id
    FROM brew_activities
    WHERE roaster IS NOT NULL
      AND title IS NOT NULL
      AND bean_origin IS NOT NULL
    ORDER BY created_at DESC
  LOOP
    -- Call the track_coffee_submission function for each unique coffee
    PERFORM track_coffee_submission(
      activity_record.roaster,
      activity_record.coffee_name,
      activity_record.origin,
      activity_record.profile_id,
      activity_record.estate,
      activity_record.varietal,
      activity_record.process
    );

    processed_count := processed_count + 1;
  END LOOP;

  RAISE NOTICE 'Processed % brew activities', processed_count;
  RAISE NOTICE 'Pending coffees count: %', (SELECT COUNT(*) FROM pending_coffee_offerings WHERE status = 'pending');
END $$;

-- Show summary of pending coffees
SELECT
  roaster_name,
  coffee_name,
  origin,
  submission_count,
  array_length(submitted_by_users, 1) as user_count
FROM pending_coffee_offerings
WHERE status = 'pending'
ORDER BY submission_count DESC, roaster_name, coffee_name;
