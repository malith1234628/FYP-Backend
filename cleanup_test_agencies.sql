-- Cleanup Script for Test Agencies
-- Run this to remove test agencies before testing the fix

USE visa_marketplace;

-- Show current agencies before cleanup
SELECT '=== BEFORE CLEANUP ===' AS status;
SELECT user_id, agency_name, contact_phone,
       total_students_handled, total_visas_approved, approval_rate,
       created_at
FROM agencies
ORDER BY created_at DESC;

-- Step 1: Remove university associations
DELETE FROM agency_universities
WHERE service_id IN (
  SELECT id FROM agency_services
  WHERE user_id IN (
    SELECT user_id FROM agencies
    WHERE agency_name IN ('agencytest3', 'malith', 'NewAgency2026')
  )
);

-- Step 2: Remove services
DELETE FROM agency_services
WHERE user_id IN (
  SELECT user_id FROM agencies
  WHERE agency_name IN ('agencytest3', 'malith', 'NewAgency2026')
);

-- Step 3: Get user_ids before deleting agencies
SELECT '=== User IDs to be deleted ===' AS status;
SELECT id, email, user_type
FROM users
WHERE id IN (
  SELECT user_id FROM agencies
  WHERE agency_name IN ('agencytest3', 'malith', 'NewAgency2026')
);

-- Step 4: Store user_ids for deletion
SET @user_ids = (
  SELECT GROUP_CONCAT(CONCAT("'", user_id, "'"))
  FROM agencies
  WHERE agency_name IN ('agencytest3', 'malith', 'NewAgency2026')
);

-- Step 5: Remove agencies
DELETE FROM agencies
WHERE agency_name IN ('agencytest3', 'malith', 'NewAgency2026');

-- Step 6: Remove users (this will cascade if foreign keys are set up correctly)
DELETE FROM users
WHERE id IN (
  'cd1e84de-4e46-431f-8bdc-c2843a10dd7e',  -- agencytest3
  '6eb41c6d-d73a-4472-8b27-85d633cdc1ff'   -- malith
);

-- Show agencies after cleanup
SELECT '=== AFTER CLEANUP ===' AS status;
SELECT user_id, agency_name, contact_phone,
       total_students_handled, total_visas_approved, approval_rate,
       created_at
FROM agencies
ORDER BY created_at DESC;

SELECT '✅ Cleanup completed successfully!' AS status;
