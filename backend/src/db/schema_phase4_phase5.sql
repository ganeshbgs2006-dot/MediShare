-- ===================================================================
-- MediShare Database Migration: Phase 4 & Phase 5
-- Target Database: MySQL 8.0+
-- Safe, repeatable, and non-destructive
-- ===================================================================

USE medishare;

-- 1. USERS TABLE ENHANCEMENTS (Account Suspension & Deactivation)
-- Adds is_active flag to support disabling/reactivating accounts without deleting records
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT 1 AFTER is_verified;

-- 2. EQUIPMENT TABLE ENHANCEMENTS (Listing Moderation Workflow)
-- Adds moderation_status and reason fields for admin review and safety oversight
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS status_reason VARCHAR(255) NULL AFTER is_active;

ALTER TABLE equipment
  ADD COLUMN IF NOT EXISTS moderation_status ENUM('pending', 'approved', 'rejected', 'flagged') NOT NULL DEFAULT 'approved' AFTER availability_status,
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT NULL AFTER moderation_status;

-- 3. BOOKINGS TABLE ENHANCEMENTS (Intended Use & Rejection/Cancellation Reasons)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS seeker_message TEXT NULL AFTER handover_notes,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL AFTER seeker_message,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT NULL AFTER rejection_reason;

-- 4. AUDIT LOGS TABLE (Phase 5 Accountability & Administrative Tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type ENUM('user', 'equipment', 'booking', 'system') NOT NULL,
  entity_id INT NOT NULL,
  old_value JSON NULL,
  new_value JSON NULL,
  reason TEXT NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_audit_admin (admin_id),
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
