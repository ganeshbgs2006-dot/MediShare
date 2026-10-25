import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Package
} from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Modal from '../../components/common/Modal/Modal';
import styles from './MyBookings.module.css';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cancellation modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await bookingService.getMyBookings({ status: activeTab });
      if (data && data.bookings) {
        setBookings(data.bookings);
      }
    } catch (err) {
      setError(err.message || 'Failed to load your equipment bookings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const handleOpenCancel = (booking) => {
    setSelectedBooking(booking);
    setCancelReason('');
    setCancelError(null);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;
    setIsSubmittingCancel(true);
    setCancelError(null);

    try {
      await bookingService.cancelBooking(selectedBooking.id, cancelReason);
      setCancelModalOpen(false);
      fetchBookings();
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel booking request.');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="approved">Confirmed</Badge>;
      case 'active_loan':
        return <Badge variant="info">Active Loan</Badge>;
      case 'returned':
        return <Badge variant="neutral">Completed Return</Badge>;
      case 'cancelled':
        return <Badge variant="neutral">Cancelled</Badge>;
      case 'rejected':
        return <Badge variant="danger">Declined</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // Compute stats
  const totalCount = bookings.length;
  const activeCount = bookings.filter((b) => b.status === 'active_loan').length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const completedCount = bookings.filter((b) => b.status === 'returned').length;

  return (
    <div className={`container ${styles.container}`}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>My Equipment Requests & Loans</h1>
        <p className={styles.subtitle}>
          Track your medical assistive equipment applications, view partner pickup instructions, and manage active loans.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Requests</div>
          <div className={styles.statValue}>{totalCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Pending Review</div>
          <div className={styles.statValue} style={{ color: '#d97706' }}>{pendingCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Active Loans</div>
          <div className={styles.statValue} style={{ color: '#0284c7' }}>{activeCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Completed Returns</div>
          <div className={styles.statValue} style={{ color: '#16a34a' }}>{completedCount}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        {[
          { key: 'all', label: 'All Requests' },
          { key: 'pending', label: 'Pending Review' },
          { key: 'approved', label: 'Confirmed' },
          { key: 'active_loan', label: 'Active Loans' },
          { key: 'returned', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled' }
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

      {/* Content State Handling */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--slate-500)' }}>
          <p>Loading your requests from MediShare database...</p>
        </div>
      ) : error ? (
        <div className={styles.alertBox}>
          <strong>Connection Notice:</strong> {error}
        </div>
      ) : bookings.length === 0 ? (
        <div className={styles.emptyState}>
          <Package size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No Equipment Requests Found</h3>
          <p className={styles.emptySubtitle}>
            {activeTab === 'all'
              ? 'You have not submitted any equipment booking requests yet. Browse the community catalog to request equipment.'
              : `You have no equipment requests with status "${activeTab}".`}
          </p>
          <Link to="/marketplace">
            <Button variant="primary" rightIcon={<ArrowRight size={16} />}>
              Explore Equipment Catalog
            </Button>
          </Link>
        </div>
      ) : (
        <div className={styles.bookingList}>
          {bookings.map((booking) => (
            <div key={booking.id} className={styles.bookingCard}>
              <div className={styles.cardHeader}>
                <div>
                  <span className={styles.reference}>Ref: {booking.booking_reference}</span>
                  <span className={styles.createdAt} style={{ marginLeft: '1rem' }}>
                    Requested on {new Date(booking.created_at).toLocaleDateString()}
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

                  <div className={styles.metaRow}>
                    <div className={styles.metaItem}>
                      <Calendar size={15} color="var(--teal-600)" />
                      <span>
                        <strong>Loan Dates:</strong> {new Date(booking.start_date).toLocaleDateString()} to {new Date(booking.end_date).toLocaleDateString()}
                      </span>
                    </div>

                    <div className={styles.metaItem}>
                      <MapPin size={15} color="var(--teal-600)" />
                      <span>{booking.service_area || 'Central Metro'}</span>
                    </div>

                    <div className={styles.metaItem}>
                      <strong>Total Cost:</strong>{' '}
                      {Number(booking.total_price) > 0 ? `₹${booking.total_price}` : 'Free Lending'}
                    </div>
                  </div>

                  {booking.seeker_message && (
                    <div className={styles.messageBox}>
                      <strong>Your Intended Care Use:</strong> {booking.seeker_message}
                    </div>
                  )}

                  {booking.handover_notes && (
                    <div className={styles.handoverBox}>
                      <strong>Partner Handover Instructions:</strong> {booking.handover_notes}
                    </div>
                  )}

                  {booking.rejection_reason && (
                    <div className={styles.alertBox}>
                      <strong>Decline Reason:</strong> {booking.rejection_reason}
                    </div>
                  )}

                  {booking.cancellation_reason && (
                    <div className={styles.alertBox}>
                      <strong>Cancellation Reason:</strong> {booking.cancellation_reason}
                    </div>
                  )}

                  {booking.owner_name && (
                    <div style={{ fontSize: '0.875rem', color: 'var(--slate-600)' }}>
                      <strong>Equipment Provider:</strong> {booking.owner_organization || booking.owner_name}
                      {booking.owner_phone && <span> • Contact: {booking.owner_phone}</span>}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.cardFooter}>
                <Link to={`/equipment/${booking.equipment_id}`}>
                  <Button variant="outline" size="sm">
                    View Equipment Profile
                  </Button>
                </Link>

                {['pending', 'approved'].includes(booking.status) && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleOpenCancel(booking)}
                  >
                    Cancel Request
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancellation Dialog Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Equipment Request"
        maxWidth="500px"
      >
        <div>
          <p style={{ color: 'var(--slate-600)', marginBottom: '1rem', lineHeight: 1.5 }}>
            Are you sure you want to cancel your booking request for{' '}
            <strong>{selectedBooking?.equipment_name}</strong> (Ref: {selectedBooking?.booking_reference})?
          </p>

          {cancelError && (
            <div className={styles.alertBox} style={{ marginBottom: '1rem' }}>
              {cancelError}
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--navy-900)' }}>
              Reason for Cancellation (Optional)
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
              placeholder="e.g., Patient recovered early, equipment arranged from another source..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button
              variant="outline"
              onClick={() => setCancelModalOpen(false)}
              disabled={isSubmittingCancel}
            >
              Keep Request
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmCancel}
              isLoading={isSubmittingCancel}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
