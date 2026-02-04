-- Migration: add single expense fields to visa_applications
-- Run once against the visa_marketplace database
-- This adds single value columns for rent, visa fee, and insurance instead of ranges

ALTER TABLE visa_applications
  ADD COLUMN rent_usd      DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER living_cost_usd,
  ADD COLUMN visa_fee_usd  DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER rent_usd,
  ADD COLUMN insurance_usd DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER visa_fee_usd;
