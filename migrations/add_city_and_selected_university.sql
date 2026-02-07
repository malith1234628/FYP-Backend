-- Migration: add city and selected_university to visa_applications
-- Run once against the visa_marketplace database

ALTER TABLE visa_applications
  ADD COLUMN city                VARCHAR(100)  NOT NULL DEFAULT '' AFTER destination_country,
  ADD COLUMN selected_university VARCHAR(255)  DEFAULT NULL AFTER insurance_usd;
