-- Migration: add expense range fields to visa_applications
-- NOTE: THIS MIGRATION IS DEPRECATED - DO NOT USE
-- Use add_single_expense_fields_to_visa_applications.sql instead
-- The application now uses single values instead of ranges for rent, visa fee, and insurance

-- Run once against the visa_marketplace database
-- NOTE: If you already ran the previous version of this migration (single rent_usd /
-- visa_fee_usd / insurance_usd columns), drop them first:
--   ALTER TABLE visa_applications
--     DROP COLUMN rent_usd, DROP COLUMN visa_fee_usd, DROP COLUMN insurance_usd;

-- DEPRECATED: Range-based approach (no longer used)
-- ALTER TABLE visa_applications
--   ADD COLUMN rent_usd_min      DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER living_cost_usd,
--   ADD COLUMN rent_usd_max      DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER rent_usd_min,
--   ADD COLUMN visa_fee_usd_min  DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER rent_usd_max,
--   ADD COLUMN visa_fee_usd_max  DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER visa_fee_usd_min,
--   ADD COLUMN insurance_usd_min DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER visa_fee_usd_max,
--   ADD COLUMN insurance_usd_max DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER insurance_usd_min;
