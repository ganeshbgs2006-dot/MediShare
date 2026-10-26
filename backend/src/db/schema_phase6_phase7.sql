-- ===================================================================
-- MediShare Database Migration: Phase 6 & Phase 7
-- Target Database: MySQL 8.0+
-- Incremental, safe, non-destructive schema additions
-- ===================================================================

USE medishare;

-- 1. CONDITION LOGS ENHANCEMENTS (Dispute Recording & Resolution)
ALTER TABLE condition_logs
  ADD COLUMN IF NOT EXISTS is_disputed BOOLEAN NOT NULL DEFAULT 0 AFTER verified_by_owner,
  ADD COLUMN IF NOT EXISTS dispute_reason TEXT NULL AFTER is_disputed,
  ADD COLUMN IF NOT EXISTS dispute_resolved BOOLEAN NOT NULL DEFAULT 0 AFTER dispute_reason,
  ADD COLUMN IF NOT EXISTS dispute_resolution TEXT NULL AFTER dispute_resolved;

-- 2. EXPAND AUDIT LOGS ENTITY_TYPE to support reviews and waitlist
ALTER TABLE audit_logs
  MODIFY COLUMN entity_type ENUM('user', 'equipment', 'booking', 'system', 'review', 'waitlist') NOT NULL;

-- 3. ENSURE REVIEWS MODERATION COLUMNS EXIST
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS moderation_status ENUM('approved', 'flagged', 'hidden') NOT NULL DEFAULT 'approved' AFTER comment,
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT NULL AFTER moderation_status;

