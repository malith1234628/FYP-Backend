-- Visa Agency Marketplace Database Schema
-- This file contains the SQL schema for the authentication system

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS visa_marketplace;
USE visa_marketplace;

-- =====================================================
-- USERS TABLE
-- Stores basic user information and credentials
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL COMMENT 'bcrypt hashed password',
  user_type ENUM('student', 'agency', 'agent', 'admin') NOT NULL,
  is_email_verified TINYINT(1) DEFAULT 0,
  last_login_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_email (email),
  INDEX idx_user_type (user_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- STUDENT PROFILES TABLE
-- Stores student-specific information
-- =====================================================
CREATE TABLE IF NOT EXISTS student_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  date_of_birth DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_country (country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- AGENCY PROFILES TABLE
-- Stores agency-specific information
-- =====================================================
CREATE TABLE IF NOT EXISTS agency_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  agency_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  license_number VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_agency_name (agency_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- AGENCY SERVICES TABLE
-- Stores countries and universities that agencies support
-- =====================================================
CREATE TABLE IF NOT EXISTS agency_services (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id CHAR(36) NOT NULL,
  country VARCHAR(100) NOT NULL,
  processing_time VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_country (country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS agency_universities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  service_id INT NOT NULL,
  university_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (service_id) REFERENCES agency_services(id) ON DELETE CASCADE,
  INDEX idx_service_id (service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- Uncomment the lines below to insert test data
-- =====================================================

-- Note: Passwords are hashed using bcrypt
-- The plain text password for both test users is: password123

-- Test Student User
-- INSERT INTO users (email, password, role)
-- VALUES ('student@test.com', '$2b$10$XQlZ8YYZ8YYZ8YYZ8YYZ8O8YYZ8YYZ8YYZ8YYZ8YYZ8YYZ8YYZ8YY', 'STUDENT');

-- INSERT INTO student_profiles (user_id, full_name, phone, country, date_of_birth)
-- VALUES (LAST_INSERT_ID(), 'Test Student', '+1234567890', 'United States', '2000-01-15');

-- Test Agency User
-- INSERT INTO users (email, password, role)
-- VALUES ('agency@test.com', '$2b$10$XQlZ8YYZ8YYZ8YYZ8YYZ8O8YYZ8YYZ8YYZ8YYZ8YYZ8YYZ8YYZ8YY', 'AGENCY');

-- INSERT INTO agency_profiles (user_id, agency_name, phone, address, license_number)
-- VALUES (LAST_INSERT_ID(), 'Test Agency', '+1234567890', '123 Main St, New York, NY', 'LIC-12345');

-- =====================================================
-- VERIFICATION QUERIES
-- Run these to verify the tables were created correctly
-- =====================================================

-- Show all tables
SHOW TABLES;

-- Describe users table
DESCRIBE users;

-- Describe student_profiles table
DESCRIBE student_profiles;

-- Describe agency_profiles table
DESCRIBE agency_profiles;

-- Count records in each table
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'student_profiles', COUNT(*) FROM student_profiles
UNION ALL
SELECT 'agency_profiles', COUNT(*) FROM agency_profiles;
