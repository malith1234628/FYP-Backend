-- Migration: Create university_forms table
-- Description: Stores custom application forms created by agencies for each university
-- Created: 2026-02-03

USE visa_marketplace;

-- Create university_forms table
CREATE TABLE IF NOT EXISTS university_forms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id CHAR(36) NOT NULL COMMENT 'Agency user ID (foreign key to users table)',
  university_name VARCHAR(255) NOT NULL COMMENT 'Name of the university this form is for',
  form_title VARCHAR(500) NOT NULL COMMENT 'Title of the application form',
  form_description TEXT COMMENT 'Description of the form',
  questions JSON NOT NULL COMMENT 'JSON array of form questions with their configuration',
  is_active TINYINT(1) DEFAULT 1 COMMENT 'Whether this form is currently active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign key to users table
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  -- Indexes for better query performance
  INDEX idx_user_id (user_id),
  INDEX idx_university_name (university_name),
  INDEX idx_user_university (user_id, university_name),

  -- Ensure one form per agency per university
  UNIQUE KEY unique_user_university (user_id, university_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify the table was created
DESCRIBE university_forms;

-- Sample query to test
SELECT 'Migration completed successfully! university_forms table created.' AS status;

/*
Expected JSON structure for questions field:
[
  {
    "id": "q-1234567890",
    "type": "short-answer",
    "title": "What is your name?",
    "description": "Please provide your full legal name",
    "placeholder": "John Doe",
    "required": true
  },
  {
    "id": "q-1234567891",
    "type": "multiple-choice",
    "title": "What is your nationality?",
    "description": "",
    "required": true,
    "options": ["USA", "UK", "Canada", "Other"]
  },
  ...
]

Supported question types:
- short-answer: Brief text input
- paragraph: Long text input
- multiple-choice: Single selection from options
- checkboxes: Multiple selections from options
- dropdown: Select from dropdown list
- date: Date picker
- file-upload: File upload field
*/
