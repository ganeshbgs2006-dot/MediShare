import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Share2,
  Clock,
  Info,
  HelpCircle,
  Package,
  Layers,
  Sparkles,
  Star,
  User,
  ArrowRight
} from 'lucide-react';
import { getEquipmentById } from '../../services/equipmentService';
import { bookingService } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Card, { CardBody } from '../../components/common/Card/Card';
import Modal from '../../components/common/Modal/Modal';
import styles from './EquipmentDetails.module.css';

// SVG Fallback for resilient rendering
const FALLBACK_SVG = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'%3E%3Crect width='800' height='500' fill='%23F1F5F9'/%3E%3Ccircle cx='400' cy='220' r='80' fill='%23CCFBF1'/%3E%3Cpath d='M400 180v80M360 220h80' stroke='%230D9488' stroke-width='10' stroke-linecap='round'/%3E%3Ctext x='400' y='350' font-family='sans-serif' font-size='22' font-weight='600' fill='%23475569' text-anchor='middle'%3EMedical Assistive Equipment%3C/text%3E%3Ctext x='400' y='380' font-family='sans-serif' font-size='15' fill='%2394A3B8' text-anchor='middle'%3EMediShare Demonstration Record%3C/text%3E%3C/svg%3E";

const getTomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const getFiveDaysLaterStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0];
};

export default function EquipmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Retrieve equipment record
  const item = useMemo(() => getEquipmentById(id), [id]);

  const gallery = useMemo(() => {
    if (!item) return [];
    return item.galleryImages && item.galleryImages.length > 0 ? item.galleryImages : [item.imageUrl];
  }, [item]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Booking Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [startDate, setStartDate] = useState(getTomorrowStr);
  const [endDate, setEndDate] = useState(getFiveDaysLaterStr);
  const [seekerMessage, setSeekerMessage] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Concurrency & Availability check state
  const [isCheckingAvail, setIsCheckingAvail] = useState(false);
  const [availResult, setAvailResult] = useState(null);

  // Booking submission state
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState(null);

  // Numeric database ID mapping
  const numericEquipmentId = useMemo(() => {
    return parseInt(String(id).replace(/\D/g, ''), 10) || 1;
  }, [id]);

  // Real-time date availability check
  useEffect(() => {
    if (!isRequestModalOpen || !startDate || !endDate) return;

    let isSubscribed = true;
    async function checkAvailability() {
      setIsCheckingAvail(true);
      try {
        const res = await bookingService.checkAvailability(numericEquipmentId, startDate, endDate);
        if (isSubscribed) {
          setAvailResult(res);
        }
      } catch {
        if (isSubscribed) setAvailResult(null);
      } finally {
        if (isSubscribed) setIsCheckingAvail(false);
      }
    }

    checkAvailability();
    return () => {
      isSubscribed = false;
    };
  }, [isRequestModalOpen, startDate, endDate, numericEquipmentId]);

  // Reset modal on open
  const handleOpenRequestModal = () => {
    setBookingSuccess(null);
    setBookingError(null);
    setStartDate(getTomorrowStr());
    setEndDate(getFiveDaysLaterStr());
    setSeekerMessage('');
    setAgreeTerms(false);
    setIsRequestModalOpen(true);
  };

  // Submit booking request
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!agreeTerms) {
      setBookingError('Please review and accept the community care and inspection guidelines.');
      return;
    }

    setBookingSubmitting(true);
    setBookingError(null);

    try {
      const res = await bookingService.createBooking({
        equipmentId: numericEquipmentId,
        startDate,
        endDate,
        seekerMessage
      });

      if (res && res.success) {
        setBookingSuccess(res.booking);
      } else {
        throw new Error(res.error || 'Failed to submit booking request.');
      }
    } catch (err) {
      setBookingError(err.message || 'Failed to submit booking request.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Compute duration and estimated cost
  const startObj = new Date(startDate);
  const endObj = new Date(endDate);
  const durationDays = (!isNaN(startObj) && !isNaN(endObj) && endObj >= startObj)
    ? Math.round((endObj - startObj) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  const unitPrice = item ? Number(item.price || 0) : 0;
  const estimatedTotal = unitPrice > 0 ? (durationDays * unitPrice).toFixed(2) : '0.00';

  // If item does not exist, render clean 404 state
  if (!item) {
    return (
      <div className="container section" style={{ minHeight: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card style={{ maxWidth: '560px', width: '100%', textAlign: 'center' }}>
          <CardBody style={{ padding: '3.5rem 2rem' }}>
            <div className={styles.notFoundIconWrap}>
              <AlertCircle size={36} className={styles.notFoundIcon} />
            </div>
            <h1 className={styles.notFoundTitle}>Equipment Record Not Found</h1>
            <p className={styles.notFoundDesc}>
              No equipment record with ID "<strong>{id}</strong>" exists in the catalog.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <Link to="/marketplace">
                <Button variant="primary" leftIcon={<ArrowLeft size={16} />}>
                  Return to Equipment Marketplace
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const {
    name,
    category,
    description,
    serviceArea,
    sharingType,
    sharingLabel,
    price,
    availabilityStatus,
    availabilityLabel,
    condition,
    conditionDetails,
    knownDamage,
    includedAccessories,
    checklist,
    ownerName,
    ownerType,
    ownerRating,
    reviewCount,
    createdAt
  } = item;

  const isAvailable = availabilityStatus === 'available';

  const getConditionVariant = (cond) => {
    switch (cond) {
      case 'Good':
        return 'approved';
      case 'Fair':
        return 'warning';
      case 'Needs Inspection':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <div className={`container ${styles.detailsContainer}`}>
      {/* Top Breadcrumb Navigation */}
      <div className={styles.topNav}>
        <Link to="/marketplace" className={styles.backLink}>
          <ArrowLeft size={18} />
          <span>Back to Marketplace</span>
        </Link>
        <span className={styles.breadcrumbCategory}>Catalog / {category} / {name}</span>
      </div>

      {/* Main Two-Column Layout */}
      <div className={styles.mainGrid}>
        {/* Left Column: Visual Photos & Checklist */}
        <div className={styles.mediaCol}>
          <div className={styles.mainImageWrapper}>
            <img
              src={gallery[activeImageIndex] || FALLBACK_SVG}
              alt={name}
              className={styles.mainImage}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_SVG;
              }}
            />
            <div className={styles.imageOverlayBadges}>
              <Badge variant={sharingType === 'free' ? 'approved' : sharingType === 'rental' ? 'warning' : 'info'}>
                {sharingLabel}
              </Badge>
              <Badge variant={isAvailable ? 'approved' : 'danger'}>
                {availabilityLabel}
              </Badge>
            </div>
          </div>

          {/* Thumbnail Gallery */}
          {gallery.length > 1 && (
            <div className={styles.thumbnailStrip}>
              {gallery.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`${styles.thumbBtn} ${activeImageIndex === idx ? styles.activeThumb : ''}`}
                  onClick={() => setActiveImageIndex(idx)}
                >
                  <img
                    src={imgUrl || FALLBACK_SVG}
                    alt={`Angle ${idx + 1}`}
                    className={styles.thumbImage}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_SVG;
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Inspection & Visual Verification Card */}
          <Card className={styles.conditionCard}>
            <CardBody>
              <div className={styles.cardSectionHeader}>
                <ShieldCheck size={20} className={styles.sectionIcon} />
                <h3 className={styles.sectionHeading}>Physical Inspection Verification</h3>
              </div>

              <div className={styles.conditionSummaryRow}>
                <div>
                  <span className={styles.conditionLabel}>Overall Visual Condition:</span>
                  <Badge variant={getConditionVariant(condition)}>
                    {condition}
                  </Badge>
                </div>
                <div className={styles.ratingBox}>
                  <Star size={16} fill="var(--amber-400)" color="var(--amber-500)" />
                  <span className={styles.ratingVal}>{ownerRating}</span>
                  <span className={styles.ratingCount}>({reviewCount} reviews)</span>
                </div>
              </div>

              <div className={styles.detailBlock}>
                <h4 className={styles.blockTitle}>Visual Verification Notes</h4>
                <p className={styles.blockText}>{conditionDetails}</p>
              </div>

              {knownDamage && knownDamage !== 'None documented.' && (
                <div className={styles.damageAlert}>
                  <AlertCircle size={18} className={styles.damageIcon} />
                  <div>
                    <h5 className={styles.damageTitle}>Documented Cosmetic Wear</h5>
                    <p className={styles.damageText}>{knownDamage}</p>
                  </div>
                </div>
              )}

              {/* Handover Verification Checklist */}
              {checklist && checklist.length > 0 && (
                <div className={styles.checklistSection}>
                  <h4 className={styles.blockTitle}>Handover Verification Checklist</h4>
                  <ul className={styles.checkList}>
                    {checklist.map((check, i) => (
                      <li key={i} className={styles.checkItem}>
                        <CheckCircle2 size={16} className={styles.checkIcon} />
                        <span>{check}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Accessories Included */}
              {includedAccessories && includedAccessories.length > 0 && (
                <div className={styles.accessoriesSection}>
                  <h4 className={styles.blockTitle}>Included Attachments & Accessories</h4>
                  <div className={styles.accessoryTags}>
                    {includedAccessories.map((acc, i) => (
                      <span key={i} className={styles.accessoryPill}>
                        <Package size={14} />
                        {acc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Key Details & Booking Action */}
        <div className={styles.infoCol}>
          <div className={styles.headerInfo}>
            <span className={styles.categoryBadge}>{category}</span>
            <h1 className={styles.productTitle}>{name}</h1>

            <div className={styles.locationStrip}>
              <MapPin size={16} className={styles.locationIcon} />
              <span>{serviceArea}</span>
            </div>

            <div className={styles.pricingCard}>
              <div className={styles.priceRow}>
                <span className={styles.priceMain}>
                  {price === 0 ? 'Free Community Lending' : `₹${price}`}
                </span>
                {price > 0 && <span className={styles.pricePeriod}>/ day</span>}
              </div>
              <p className={styles.pricingExplainer}>
                {sharingType === 'free'
                  ? 'Provided freely by community health cell for eligible rehabilitation needs.'
                  : sharingType === 'rental'
                  ? 'Subsidized community rental to cover equipment maintenance & sanitation.'
                  : 'Permanent equipment donation for patients in documented financial need.'}
              </p>
            </div>

            {/* Description */}
            <div className={styles.descriptionSection}>
              <h3 className={styles.descHeading}>Equipment Overview</h3>
              <p className={styles.descBody}>{description}</p>
            </div>

            {/* Verified Partner Card */}
            <div className={styles.ownerCard}>
              <div className={styles.ownerAvatar}>
                <User size={20} />
              </div>
              <div className={styles.ownerMeta}>
                <div className={styles.ownerName}>{ownerName}</div>
                <div className={styles.ownerRoleTag}>{ownerType}</div>
              </div>
              <p className={styles.ownerDesc}>
                Verified community equipment partner. Equipment condition logs and handover checklists are recorded at every exchange.
              </p>
            </div>

            {/* Action Buttons: Request Equipment */}
            <div className={styles.actionSection}>
              <Button
                variant={isAvailable ? 'primary' : 'secondary'}
                size="lg"
                fullWidth
                disabled={!isAvailable}
                onClick={handleOpenRequestModal}
              >
                {isAvailable ? 'Request Equipment' : 'Currently Unavailable (Waitlist)'}
              </Button>

              <p className={styles.actionSubtext}>
                {isAvailable
                  ? 'Direct booking with real-time availability verification and partner handover coordination.'
                  : 'This equipment is currently allocated to an active care loan.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PHASE 4 INTERACTIVE EQUIPMENT BOOKING MODAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title={bookingSuccess ? 'Booking Request Submitted!' : 'Request Medical Equipment'}
        maxWidth="600px"
      >
        {bookingSuccess ? (
          /* Success Screen */
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
              Booking Request Received!
            </h3>

            <div style={{
              display: 'inline-block',
              background: 'var(--slate-100)',
              padding: '0.4rem 1rem',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontWeight: 700,
              fontSize: '1rem',
              color: 'var(--navy-900)',
              marginBottom: '1rem'
            }}>
              Ref: {bookingSuccess.booking_reference}
            </div>

            <p style={{ color: 'var(--slate-600)', lineHeight: 1.6, marginBottom: '1.5rem', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
              Your request for <strong>{name}</strong> from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()} has been dispatched to <strong>{ownerName}</strong>.
            </p>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--slate-200)', textAlign: 'left', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>Next Steps:</div>
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--slate-600)', margin: 0, lineHeight: 1.5 }}>
                <li>The equipment partner will review your inquiry.</li>
                <li>Once approved, you will receive pickup instructions and contact details.</li>
                <li>Both parties will verify the physical checklist at handover.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <Button
                variant="outline"
                onClick={() => setIsRequestModalOpen(false)}
              >
                Close
              </Button>
              <Link to="/my-bookings">
                <Button variant="primary" rightIcon={<ArrowRight size={16} />}>
                  View in My Requests
                </Button>
              </Link>
            </div>
          </div>
        ) : !isAuthenticated ? (
          /* Authentication Required Screen */
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--teal-50)',
              color: 'var(--teal-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <User size={28} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
              Sign In to Request Equipment
            </h3>
            <p style={{ color: 'var(--slate-600)', lineHeight: 1.6, marginBottom: '1.5rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
              To ensure safety, accountability, and coordinate handovers, you must be logged in with a verified MediShare account.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <Button variant="outline" onClick={() => setIsRequestModalOpen(false)}>
                Cancel
              </Button>
              <Link to="/login">
                <Button variant="primary">
                  Sign In / Register
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Active Booking Request Form */
          <form onSubmit={handleSubmitBooking}>
            {bookingError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={16} />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Equipment Summary Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              background: '#f8fafc',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--slate-200)',
              marginBottom: '1.25rem'
            }}>
              <img
                src={gallery[0] || FALLBACK_SVG}
                alt={name}
                style={{ width: '60px', height: '48px', objectFit: 'cover', borderRadius: '6px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--navy-900)', fontSize: '0.9375rem' }}>{name}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
                  Provided by: {ownerName} • Location: {serviceArea}
                </div>
              </div>
            </div>

            {/* Date Pickers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--navy-900)' }}>
                  Start Date *
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '6px',
                    border: '1px solid var(--slate-300)',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--navy-900)' }}>
                  End Date *
                </label>
                <input
                  type="date"
                  min={startDate || new Date().toISOString().split('T')[0]}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '6px',
                    border: '1px solid var(--slate-300)',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            {/* Availability Verification Strip */}
            <div style={{ marginBottom: '1rem', fontSize: '0.8125rem' }}>
              {isCheckingAvail ? (
                <span style={{ color: 'var(--slate-500)' }}>Checking calendar availability...</span>
              ) : availResult && !availResult.available ? (
                <span style={{ color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <AlertCircle size={14} /> Dates conflict with an existing reservation. Please choose alternate dates.
                </span>
              ) : (
                <span style={{ color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle2 size={14} /> Dates are currently available for reservation.
                </span>
              )}
            </div>

            {/* Pricing Summary Card */}
            <div style={{
              background: 'var(--teal-50)',
              border: '1px solid var(--teal-200)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--teal-800)', fontWeight: 600 }}>
                  Estimated Loan Duration: <strong>{durationDays} {durationDays === 1 ? 'day' : 'days'}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--teal-700)' }}>
                  {unitPrice > 0 ? `Rate: ₹${unitPrice} / day` : 'Community Free Lending Program'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--teal-800)' }}>Estimated Total</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--teal-900)' }}>
                  {unitPrice > 0 ? `₹${estimatedTotal}` : 'Free'}
                </div>
              </div>
            </div>

            {/* Intended Care Need / Patient Message */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--navy-900)' }}>
                Care Need & Handover Notes (Required)
              </label>
              <textarea
                rows={3}
                required
                value={seekerMessage}
                onChange={(e) => setSeekerMessage(e.target.value)}
                placeholder="Explain the patient's condition or recovery need (e.g., post-knee surgery physical rehabilitation, elder mobility assistance at home)..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--slate-300)',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Terms & Inspection Agreement Checkbox */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--slate-700)', lineHeight: 1.4 }}>
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  style={{ marginTop: '0.2rem' }}
                />
                <span>
                  I agree to complete the visual condition check upon physical handover, follow sanitized care guidelines, and return the equipment in good condition at the end of the loan period.
                </span>
              </label>
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                disabled={bookingSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={bookingSubmitting}
                disabled={availResult && !availResult.available}
              >
                Submit Booking Request
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
