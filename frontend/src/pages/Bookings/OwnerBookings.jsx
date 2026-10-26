import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  AlertCircle,
  Package,
  Video
} from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Modal from '../../components/common/Modal/Modal';
import ReturnInspectionModal from '../../components/ReturnInspectionModal/ReturnInspectionModal';
import styles from './OwnerBookings.module.css';

export default function OwnerBookings() {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status Action Modal State
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'approve' | 'reject' | 'handover' | 'return'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Return Video Inspection Modal State
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnBooking, setReturnBooking] = useState(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await bookingService.getOwnerBookings({ status: activeTab });
      if (data && data.bookings) {
        setBookings(data.bookings);
      }
    } catch (err) {
      setError(err.message || 'Failed to load booking requests for your equipment.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const handleOpenAction = (booking, type) => {
    setSelectedBooking(booking);
    setModalType(type);
    setActionNotes('');
    setActionError(null);
    setActionModalOpen(true);
  };

  const handleOpenReturnInspection = (booking) => {
    setReturnBooking(booking);
    setReturnModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedBooking) return;
    setIsSubmitting(true);
    setActionError(null);

    let status = '';
    let reason = null;
    let handoverNotes = null;

    if (modalType === 'approve') {
      status = 'approved';
      handoverNotes = actionNotes;
    } else if (modalType === 'reject') {
      status = 'rejected';
      reason = actionNotes || 'Equipment unavailable for requested dates.';
    } else if (modalType === 'handover') {
      status = 'active_loan';
      handoverNotes = actionNotes;
    } else if (modalType === 'return') {
      status = 'returned';
      handoverNotes = actionNotes;
    }

    try {
      await bookingService.updateStatus(selectedBooking.id, {
        status,
        reason,
        handoverNotes
      });
      setActionModalOpen(false);
      fetchBookings();
    } catch (err) {
      setActionError(err.message || 'Failed to update booking status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Needs Review</Badge>;
      case 'approved':
        return <Badge variant="approved">Accepted</Badge>;
      case 'active_loan':
        return <Badge variant="info">Active Loan</Badge>;
      case 'returned':
        return <Badge variant="neutral">Returned</Badge>;
      case 'cancelled':
        return <Badge variant="neutral">Cancelled by Seeker</Badge>;
      case 'rejected':
        return <Badge variant="danger">Declined</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // Stats computation
  const totalCount = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const approvedCount = bookings.filter((b) => b.status === 'approved').length;
  const activeCount = bookings.filter((b) => b.status === 'active_loan').length;

  return (
    <div className={`container ${styles.container}`}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Equipment Partner Booking Queue</h1>
        <p className={styles.subtitle}>
          Review incoming loan requests, coordinate equipment handovers, and track returning assistive devices.
        </p>
      </div>

      {/* KPI Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Inquiries</div>
          <div className={styles.statValue}>{totalCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Awaiting Response</div>
          <div className={styles.statValue} style={{ color: '#d97706' }}>{pendingCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Ready for Handover</div>
          <div className={styles.statValue} style={{ color: '#0d9488' }}>{approvedCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Active Loans in Field</div>
          <div className={styles.statValue} style={{ color: '#0284c7' }}>{activeCount}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        {[
          { key: 'all', label: 'All Inquiries' },
          { key: 'pending', label: 'Pending Review' },
          { key: 'approved', label: 'Accepted' },
          { key: 'active_loan', label: 'Active Loans' },
          { key: 'returned', label: 'Returned' },
          { key: 'rejected', label: 'Declined' }
        ].map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--slate-500)' }}>
          <p>Loading partner queue from database...</p>
        </div>
      ) : error ? (
        <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '8px', color: '#991b1b' }}>
          <strong>Error:</strong> {error}
        </div>
      ) : bookings.length === 0 ? (
        <div className={styles.emptyState}>
          <Package size={48} color="var(--slate-400)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
            No Requests Found
          </h3>
          <p style={{ color: 'var(--slate-500)' }}>
            There are currently no equipment requests matching the selected filter.
          </p>
        </div>
      ) : (
        <div className={styles.bookingList}>
          {bookings.map((booking) => (
            <div key={booking.id} className={styles.bookingCard}>
              <div className={styles.cardHeader}>
                <div>
                  <span className={styles.reference}>Ref: {booking.booking_reference}</span>
                  <span style={{ marginLeft: '1rem', fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
                    Received on {new Date(booking.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div>{getStatusBadge(booking.status)}</div>
              </div>

              <div className={styles.cardBody}>
                <img
                  src={booking.equipment_image || 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80'}
                  alt={booking.equipment_name}
                  className={styles.itemImage}
                />

                <div className={styles.itemDetails}>
                  <h3 className={styles.itemName}>{booking.equipment_name}</h3>

                  {/* Seeker Contact Details */}
                  <div className={styles.seekerBox}>
                    <div className={styles.seekerTitle}>
                      <User size={16} color="var(--teal-600)" />
                      <span>Care Seeker: {booking.seeker_name}</span>
                    </div>
                    {booking.seeker_phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--slate-600)' }}>
                        <Phone size={14} />
                        <span>Phone: {booking.seeker_phone}</span>
                      </div>
                    )}
                    {booking.seeker_service_area && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--slate-600)' }}>
                        <MapPin size={14} />
                        <span>Location: {booking.seeker_service_area}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.metaRow}>
                    <div className={styles.metaItem}>
                      <Calendar size={15} color="var(--teal-600)" />
                      <span>
                        <strong>Requested Dates:</strong> {new Date(booking.start_date).toLocaleDateString()} to {new Date(booking.end_date).toLocaleDateString()}
                      </span>
                    </div>

                    <div className={styles.metaItem}>
                      <strong>Pricing:</strong>{' '}
                      {Number(booking.total_price) > 0 ? `₹${booking.total_price}` : 'Free Lending'}
                    </div>
                  </div>

                  {booking.seeker_message && (
                    <div className={styles.messageBox}>
                      <strong>Seeker's Intended Need:</strong> {booking.seeker_message}
                    </div>
                  )}

                  {booking.handover_notes && (
                    <div className={styles.handoverBox}>
                      <strong>Your Handover Notes:</strong> {booking.handover_notes}
                    </div>
                  )}

                  {/* Return Video status banner for active loans */}
                  {booking.status === 'active_loan' && (
                    <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8125rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Video size={16} color="#0d9488" />
                        <strong style={{ color: '#134e4a' }}>Mandatory Dual Return Condition Verification:</strong>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.25rem' }}>
                        <span>
                          Borrower Video:{' '}
                          {booking.seeker_return_video_url ? (
                            <span style={{ color: '#059669', fontWeight: 600 }}>Recorded & Uploaded ✓</span>
                          ) : (
                            <span style={{ color: '#d97706', fontWeight: 600 }}>Awaiting borrower recording</span>
                          )}
                        </span>
                        <span>
                          Your Video:{' '}
                          {booking.owner_return_video_url ? (
                            <span style={{ color: '#059669', fontWeight: 600 }}>Recorded & Uploaded ✓</span>
                          ) : (
                            <span style={{ color: '#d97706', fontWeight: 600 }}>Your recording required</span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.cardFooter}>
                {booking.status === 'pending' && (
                  <>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleOpenAction(booking, 'reject')}
                    >
                      Decline Request
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenAction(booking, 'approve')}
                    >
                      Accept Request
                    </Button>
                  </>
                )}

                {booking.status === 'approved' && (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Truck size={15} />}
                    onClick={() => handleOpenAction(booking, 'handover')}
                  >
                    Confirm Handover (Start Loan)
                  </Button>
                )}

                {booking.status === 'active_loan' && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Button
                      variant={booking.owner_return_video_url ? 'outline' : 'accent'}
                      size="sm"
                      leftIcon={<Video size={15} />}
                      onClick={() => handleOpenReturnInspection(booking)}
                    >
                      {booking.owner_return_video_url ? 'Update Owner Video' : 'Record Owner Video'}
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<RotateCcw size={15} />}
                      disabled={!booking.seeker_return_video_url || !booking.owner_return_video_url}
                      onClick={() => handleOpenAction(booking, 'return')}
                    >
                      {(!booking.seeker_return_video_url || !booking.owner_return_video_url)
                        ? 'Confirm Return (Awaiting Videos)'
                        : 'Confirm Safe Return (Complete)'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Dialog Modal */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title={
          modalType === 'approve'
            ? 'Accept Equipment Request'
            : modalType === 'reject'
            ? 'Decline Equipment Request'
            : modalType === 'handover'
            ? 'Confirm Equipment Handover'
            : 'Confirm Equipment Return'
        }
        maxWidth="520px"
      >
        <div>
          <p style={{ color: 'var(--slate-600)', marginBottom: '1rem', lineHeight: 1.5 }}>
            {modalType === 'approve' && (
              <>
                You are accepting the request for <strong>{selectedBooking?.equipment_name}</strong> by <strong>{selectedBooking?.seeker_name}</strong>.
              </>
            )}
            {modalType === 'reject' && (
              <>
                Please provide a brief reason for declining the request for <strong>{selectedBooking?.equipment_name}</strong>.
              </>
            )}
            {modalType === 'handover' && (
              <>
                Confirm that the equipment has been inspected, sanitized, and handed over to <strong>{selectedBooking?.seeker_name}</strong>.
              </>
            )}
            {modalType === 'return' && (
              <>
                Confirm that the equipment has been safely returned, inspected, and checked back into inventory.
              </>
            )}
          </p>

          {actionError && (
            <div style={{ background: '#fef2f2', padding: '0.75rem', borderRadius: '8px', color: '#991b1b', marginBottom: '1rem' }}>
              {actionError}
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--navy-900)' }}>
              {modalType === 'approve'
                ? 'Pickup Instructions / Handover Notes'
                : modalType === 'reject'
                ? 'Reason for Declining (Required)'
                : 'Condition Notes on Handover / Return'}
            </label>
            <textarea
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--slate-300)',
                fontFamily: 'inherit',
                fontSize: '0.875rem'
              }}
              placeholder={
                modalType === 'approve'
                  ? 'e.g., Available for pickup Mon-Fri between 9am-4pm at Main Clinic desk...'
                  : modalType === 'reject'
                  ? 'e.g., Equipment scheduled for sanitization maintenance on requested dates...'
                  : 'e.g., Sanitized, battery tested, verified clean condition...'
              }
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button
              variant="outline"
              onClick={() => setActionModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant={modalType === 'reject' ? 'danger' : 'primary'}
              onClick={handleConfirmAction}
              isLoading={isSubmitting}
            >
              {modalType === 'approve'
                ? 'Confirm & Accept'
                : modalType === 'reject'
                ? 'Decline Request'
                : modalType === 'handover'
                ? 'Start Active Loan'
                : 'Confirm Return'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Owner Return Video Inspection Modal */}
      <ReturnInspectionModal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        booking={returnBooking}
        userRole="owner"
        onSubmitted={() => fetchBookings()}
      />
    </div>
  );
}

