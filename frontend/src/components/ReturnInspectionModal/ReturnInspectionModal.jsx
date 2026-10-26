import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileVideo,
  Info,
  Clock,
  X
} from 'lucide-react';
import Modal from '../common/Modal/Modal';
import Button from '../common/Button/Button';
import Badge from '../common/Badge/Badge';
import CameraRecorder from '../common/CameraRecorder/CameraRecorder';
import { bookingService } from '../../services/bookingService';
import styles from './ReturnInspectionModal.module.css';

export default function ReturnInspectionModal({
  isOpen,
  onClose,
  booking,
  userRole = 'seeker',
  onSubmitted
}) {
  if (!isOpen || !booking) return null;

  const isSeeker = userRole === 'seeker';
  const roleLabel = isSeeker ? 'Care Seeker / Borrower' : 'Equipment Owner / Partner';

  const [videoUrl, setVideoUrl] = useState(
    isSeeker ? booking.seeker_return_video_url : booking.owner_return_video_url
  );
  const [conditionGrade, setConditionGrade] = useState('Good');
  const [notes, setNotes] = useState('');
  const [isDisputed, setIsDisputed] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const seekerSubmitted = Boolean(booking.seeker_return_video_url);
  const ownerSubmitted = Boolean(booking.owner_return_video_url);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!videoUrl) {
      setError('Please record or upload a return condition video first.');
      return;
    }

    if (isDisputed && !disputeReason.trim()) {
      setError('Please provide a specific explanation of the damage or issue flagged.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await bookingService.submitReturnInspection(booking.id, {
        videoUrl,
        notes,
        conditionGrade,
        isDisputed,
        disputeReason: isDisputed ? disputeReason : null
      });

      if (onSubmitted) {
        onSubmitted(res.booking || res);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit return inspection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Mandatory Return Condition Verification (${roleLabel})`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className={styles.modalBody}>
        {/* Booking Summary Header */}
        <div className={styles.equipmentBrief}>
          <div>
            <h4 className={styles.equipmentName}>{booking.equipment_name}</h4>
            <p className={styles.bookingRef}>Ref: {booking.booking_reference}</p>
          </div>
          <div className={styles.dualStatusBadge}>
            <div className={styles.partyStatus}>
              <span>Seeker Video:</span>
              {seekerSubmitted ? (
                <Badge variant="approved" size="sm">Submitted</Badge>
              ) : (
                <Badge variant="pending" size="sm">Awaiting</Badge>
              )}
            </div>
            <div className={styles.partyStatus}>
              <span>Owner Video:</span>
              {ownerSubmitted ? (
                <Badge variant="approved" size="sm">Submitted</Badge>
              ) : (
                <Badge variant="pending" size="sm">Awaiting</Badge>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* WebRTC Video Recorder Component */}
        <div className={styles.recorderSection}>
          <CameraRecorder
            roleLabel={roleLabel}
            existingVideoUrl={videoUrl}
            onVideoReady={(url) => {
              setVideoUrl(url);
              setError('');
            }}
          />
        </div>

        {/* Condition Grade Selection */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Physical Condition Assessment</label>
          <div className={styles.gradeGrid}>
            {[
              { val: 'Good', desc: 'Fully operational, no new damage or excessive wear' },
              { val: 'Fair', desc: 'Operational with minor superficial blemishes' },
              { val: 'Needs Inspection', desc: 'Mechanical defect, missing parts, or structural concern' }
            ].map(({ val, desc }) => (
              <label
                key={val}
                className={`${styles.gradeCard} ${conditionGrade === val ? styles.gradeCardSelected : ''}`}
              >
                <input
                  type="radio"
                  name="conditionGrade"
                  value={val}
                  checked={conditionGrade === val}
                  onChange={() => setConditionGrade(val)}
                  className={styles.radioInput}
                />
                <div>
                  <div className={styles.gradeTitle}>{val}</div>
                  <div className={styles.gradeDesc}>{desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Inspection Notes */}
        <div className={styles.fieldGroup}>
          <label htmlFor="notes" className={styles.fieldLabel}>
            Inspection Notes & Visual Check Confirmation
          </label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Document verification of wheel locks, cleanliness, motor or battery charge state, folding mechanisms..."
            className={styles.textarea}
          />
        </div>

        {/* Dispute Flagging Option */}
        <div className={styles.disputeSection}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isDisputed}
              onChange={(e) => setIsDisputed(e.target.checked)}
            />
            <span className={styles.checkboxText}>
              Flag condition dispute or document pre-existing / return damage
            </span>
          </label>

          {isDisputed && (
            <div className={styles.disputeField}>
              <label className={styles.fieldLabel}>Dispute Explanation & Damage Summary</label>
              <textarea
                rows={2}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="State the discrepancy between handover condition and return condition..."
                className={styles.textarea}
                required={isDisputed}
              />
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className={styles.footerRow}>
          <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            icon={<CheckCircle2 size={18} />}
            isLoading={submitting}
            disabled={submitting || !videoUrl}
          >
            Submit Return Verification
          </Button>
        </div>
      </form>
    </Modal>
  );
}

