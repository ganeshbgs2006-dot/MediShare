-- ===================================================================
-- MediShare Database Schema
-- Target Database: MySQL 8.0+
-- Features: Strict referential integrity, UTF8MB4 encoding, timestamps
-- ===================================================================

USE medishare;

-- 1. USERS TABLE
-- Supports seekers (patients/caregivers), equipment owners, and administrators
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NULL,
  role ENUM('seeker', 'owner', 'admin') NOT NULL DEFAULT 'seeker',
  organization_name VARCHAR(150) NULL,
  service_area VARCHAR(150) NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. EQUIPMENT TABLE
-- Assistive medical equipment catalog entries
CREATE TABLE IF NOT EXISTS equipment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  condition_grade ENUM('Good', 'Fair', 'Needs Inspection') NOT NULL DEFAULT 'Good',
  condition_details TEXT NULL,
  known_damage TEXT NULL,
  sharing_type ENUM('free', 'rental', 'donation') NOT NULL DEFAULT 'free',
  price_per_day DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  availability_status ENUM('available', 'reserved', 'on_loan', 'maintenance', 'retired') NOT NULL DEFAULT 'available',
  service_area VARCHAR(150) NOT NULL,
  image_url VARCHAR(500) NULL,
  video_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_equipment_category (category),
  INDEX idx_equipment_sharing_type (sharing_type),
  INDEX idx_equipment_availability (availability_status),
  INDEX idx_equipment_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BOOKINGS TABLE
-- Reservation and loan lifecycle between seekers and owners
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_reference VARCHAR(40) NOT NULL UNIQUE,
  equipment_id INT NOT NULL,
  seeker_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('pending', 'approved', 'active_loan', 'returned', 'cancelled', 'rejected') NOT NULL DEFAULT 'pending',
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  handover_notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (seeker_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_bookings_ref (booking_reference),
  INDEX idx_bookings_seeker (seeker_id),
  INDEX idx_bookings_equipment (equipment_id),
  INDEX idx_bookings_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. CONDITION LOGS TABLE
-- Handover & return inspection checklists with timestamped physical verification records
CREATE TABLE IF NOT EXISTS condition_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  equipment_id INT NOT NULL,
  logged_by INT NOT NULL,
  stage ENUM('initial_listing', 'handover', 'return', 'periodic_maintenance') NOT NULL,
  condition_grade ENUM('Good', 'Fair', 'Needs Inspection') NOT NULL,
  notes TEXT NOT NULL,
  checklist_json JSON NULL,
  verified_by_seeker BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by_owner BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (logged_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_condition_booking (booking_id),
  INDEX idx_condition_equipment (equipment_id),
  INDEX idx_condition_stage (stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. EQUIPMENT MEDIA TABLE
-- Multi-angle photos, condition inspection evidence photos, and manuals
CREATE TABLE IF NOT EXISTS equipment_media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipment_id INT NOT NULL,
  booking_id INT NULL,
  media_type ENUM('image', 'document', 'video') NOT NULL DEFAULT 'image',
  file_url VARCHAR(500) NOT NULL,
  caption VARCHAR(255) NULL,
  stage ENUM('gallery', 'handover_evidence', 'return_evidence', 'damage_report') NOT NULL DEFAULT 'gallery',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  INDEX idx_media_equipment (equipment_id),
  INDEX idx_media_stage (stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. REVIEWS TABLE
-- Completed loan participant feedback and ratings (1-5 stars)
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL UNIQUE,
  reviewer_id INT NOT NULL,
  reviewee_id INT NOT NULL,
  equipment_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  INDEX idx_reviews_equipment (equipment_id),
  INDEX idx_reviews_reviewee (reviewee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. WAITLIST TABLE
-- Queue for currently unavailable devices to guarantee fair community allocation
CREATE TABLE IF NOT EXISTS waitlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipment_id INT NOT NULL,
  seeker_id INT NOT NULL,
  status ENUM('active', 'notified', 'fulfilled', 'cancelled') NOT NULL DEFAULT 'active',
  requested_from DATE NULL,
  requested_to DATE NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (seeker_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_waitlist_seeker_equipment_active (equipment_id, seeker_id, status),
  INDEX idx_waitlist_equipment (equipment_id),
  INDEX idx_waitlist_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

