-- Migration: Add passport and CV document columns to students table
-- This allows storing passport and CV files directly in the database

USE visa_marketplace;

-- Add columns for passport document
ALTER TABLE students
ADD COLUMN passport_file LONGBLOB COMMENT 'Passport file stored as binary data',
ADD COLUMN passport_filename VARCHAR(255) COMMENT 'Original passport filename',
ADD COLUMN passport_mimetype VARCHAR(100) COMMENT 'MIME type of passport file',
ADD COLUMN passport_uploaded_at TIMESTAMP NULL COMMENT 'Timestamp when passport was uploaded';

-- Add columns for CV document
ALTER TABLE students
ADD COLUMN cv_file LONGBLOB COMMENT 'CV file stored as binary data',
ADD COLUMN cv_filename VARCHAR(255) COMMENT 'Original CV filename',
ADD COLUMN cv_mimetype VARCHAR(100) COMMENT 'MIME type of CV file',
ADD COLUMN cv_uploaded_at TIMESTAMP NULL COMMENT 'Timestamp when CV was uploaded';

-- Add indexes for quick lookups
ALTER TABLE students
ADD INDEX idx_passport_uploaded (passport_uploaded_at),
ADD INDEX idx_cv_uploaded (cv_uploaded_at);
