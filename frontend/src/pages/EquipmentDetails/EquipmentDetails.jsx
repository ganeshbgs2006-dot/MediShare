import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Video,
  VideoOff,
  RefreshCw,
  CalendarPlus,
  Check,
  Truck,
  ArrowRight
} from 'lucide-react';
import { getEquipmentById, equipmentService } from '../../services/equipmentService';
import { bookingService } from '../../services/bookingService';
import { reviewService } from '../../services/reviewService';
import { waitlistService } from '../../services/waitlistService';
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
  const [item, setItem] = useState(() => getEquipmentById(id));
  const [loadingItem, setLoadingItem] = useState(true);

  // Video playback states
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoPlaybackError, setVideoPlaybackError] = useState(false);
  const videoPlayerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function loadItem() {
      setLoadingItem(true);
      try {
        const fetched = await equipmentService.fetchEquipmentById(id);
        if (isMounted) {
          if (fetched) {
            setItem(fetched);
          } else {
            const fallback = getEquipmentById(id);
            setItem(fallback || null);
          }
        }
      } catch (err) {
        console.warn('Failed loading equipment from API:', err.message);
        if (isMounted) {
          const fallback = getEquipmentById(id);
          setItem(fallback || null);
        }
      } finally {
        if (isMounted) setLoadingItem(false);
      }
    }
    loadItem();
    return () => { isMounted = false; };
  }, [id]);

  // Reset video playback state when video source changes
  useEffect(() => {
    setVideoPlaybackError(false);
    setIsVideoLoading(Boolean(item?.videoUrl || item?.video_url));
  }, [item?.videoUrl, item?.video_url]);

  const gallery = useMemo(() => {
    if (!item) return [];
    return item.galleryImages && item.galleryImages.length > 0 ? item.galleryImages : (item.imageUrl ? [item.imageUrl] : []);
  }, [item]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Booking Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [startDate, setStartDate] = useState(getTomorrowStr);
  const [endDate, setEndDate] = useState(getFiveDaysLaterStr);
  const [pickupPreference, setPickupPreference] = useState('self_pickup');
  const [seekerMessage, setSeekerMessage] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Concurrency & Availability check state
  const [isCheckingAvail, setIsCheckingAvail] = useState(false);
  const [availResult, setAvailResult] = useState(null);

  // Booking submission state
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState(null);

  // Reviews state
  const [reviewsData, setReviewsData] = useState({ reviews: [], summary: null });
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Waitlist state
  const [waitlistStatus, setWaitlistStatus] = useState(null);
  const [isWaitlistLoading, setIsWaitlistLoading] = useState(false);
  const [waitlistMsg, setWaitlistMsg] = useState(null);

  // Numeric database ID mapping
  const numericEquipmentId = useMemo(() => {
    if (item && item.id) {
      const parsed = parseInt(String(item.id).replace(/\D/g, ''), 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    const fromParam = parseInt(String(id).replace(/\D/g, ''), 10);
    return !isNaN(fromParam) && fromParam > 0 ? fromParam : 1;
  }, [id, item]);

  // Check if current authenticated user owns this equipment
  const isOwner = useMemo(() => {
    if (!user || !item) return false;
    const currentUserId = Number(user.id);
    const itemOwnerId = Number(item.ownerId || item.owner_id);
    return Boolean(currentUserId && itemOwnerId && currentUserId === itemOwnerId);
  }, [user, item]);

  // Check if current user is an equipment owner role
  const isOwnerRole = Boolean(user && user.role === 'owner');

  // Load reviews and waitlist status
  useEffect(() => {
    let isMounted = true;
    async function loadReviewsAndWaitlist() {
      setIsLoadingReviews(true);
      try {
        const res = await reviewService.getEquipmentReviews(numericEquipmentId);
        if (isMounted && res && res.success) {
          setReviewsData({ reviews: res.reviews || [], summary: res.summary || null });
        }
      } catch (e) {
        console.warn('Reviews load error:', e);
      } finally {
        if (isMounted) setIsLoadingReviews(false);
      }

      if (isAuthenticated) {
        try {
          const wStatus = await waitlistService.getStatusForEquipment(numericEquipmentId);
          if (isMounted && wStatus && wStatus.success) {
            setWaitlistStatus(wStatus);
          }
        } catch (e) {
          console.warn('Waitlist status error:', e);
        }
      }
    }

    loadReviewsAndWaitlist();
    return () => {
      isMounted = false;
    };
  }, [numericEquipmentId, isAuthenticated]);

  const handleJoinWaitlist = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsWaitlistLoading(true);
    setWaitlistMsg(null);
    try {
      const res = await waitlistService.joinWaitlist({
        equipmentId: numericEquipmentId,
        notes: 'Joined via equipment details page'
      });
      setWaitlistMsg({ type: 'success', text: `You are #${res.position} in line! You will be notified automatically when available.` });
      const updated = await waitlistService.getStatusForEquipment(numericEquipmentId);
      if (updated && updated.success) setWaitlistStatus(updated);
    } catch (err) {
      setWaitlistMsg({ type: 'error', text: err.message || 'Failed to join waitlist.' });
    } finally {
      setIsWaitlistLoading(false);
    }
  };

  const handleLeaveWaitlist = async () => {
    setIsWaitlistLoading(true);
    setWaitlistMsg(null);
    try {
      await waitlistService.leaveByEquipment(numericEquipmentId);
      setWaitlistMsg({ type: 'info', text: 'You have left the waitlist for this equipment.' });
      setWaitlistStatus({ is_on_waitlist: false, total_in_queue: Math.max(0, (waitlistStatus?.total_in_queue || 1) - 1) });
    } catch (err) {
      setWaitlistMsg({ type: 'error', text: err.message || 'Failed to leave waitlist.' });
    } finally {
      setIsWaitlistLoading(false);
    }
  };

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
        seekerMessage,
        pickupPreference
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

  // Loading state while retrieving equipment from backend
  if (loadingItem && !item) {
    return (
      <div className={`container ${styles.loadingContainer}`}>
        <div className={styles.pageSpinner} />
        <p style={{ marginTop: '1rem', color: 'var(--slate-600)', fontWeight: 600 }}>Loading equipment catalog record...</p>
      </div>
    );
  }

  // If item does not exist after loading completed, render clean 404 state
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

  const isAvailable = String(availabilityStatus || '').toLowerCase() === 'available';

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

      {item.isDemoRecord && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #fde68a',
          borderRadius: '8px',
          padding: '0.65rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          color: '#92400e',
          fontSize: '0.84rem'
        }}>
          <Info size={18} style={{ flexShrink: 0 }} />
          <span>
            <strong>Illustrative Demonstration Listing:</strong> This is a sample record for platform preview. Live items listed by verified community partners reflect actual database inventory.
          </span>
        </div>
      )}

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

          {/* Equipment Video Demonstration Tour */}
          <Card className={styles.videoTourCard}>
            <CardBody>
              <div className={styles.cardSectionHeader}>
                <Video size={20} className={styles.sectionIcon} />
                <h3 className={styles.sectionHeading}>Equipment Demonstration Video</h3>
              </div>

              {(item?.videoUrl || item?.video_url) ? (
                <div>
                  <div className={styles.videoPlayerContainer}>
                    {isVideoLoading && !videoPlaybackError && (
                      <div className={styles.videoLoadingOverlay}>
                        <div className={styles.videoSpinner} />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Loading video...</span>
                      </div>
                    )}

                    {videoPlaybackError ? (
                      <div className={styles.videoErrorCard}>
                        <VideoOff size={32} color="#dc2626" style={{ marginBottom: '0.5rem' }} />
                        <h4 className={styles.videoErrorTitle}>Demonstration Video Unavailable</h4>
                        <p className={styles.videoErrorText}>
                          The video stream could not be loaded or is in an unsupported format. You can still inspect the equipment photos or verify operational condition during in-person handover.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className={styles.retryVideoBtn}
                          leftIcon={<RefreshCw size={14} />}
                          onClick={() => {
                            setVideoPlaybackError(false);
                            setIsVideoLoading(true);
                            if (videoPlayerRef.current) {
                              videoPlayerRef.current.load();
                            }
                          }}
                        >
                          Retry Playback
                        </Button>
                      </div>
                    ) : (
                      <video
                        ref={videoPlayerRef}
                        src={item.videoUrl || item.video_url}
                        controls
                        playsInline
                        preload="metadata"
                        className={styles.detailVideoPlayer}
                        onLoadStart={() => setIsVideoLoading(true)}
                        onLoadedData={() => setIsVideoLoading(false)}
                        onCanPlay={() => setIsVideoLoading(false)}
                        onWaiting={() => setIsVideoLoading(true)}
                        onError={() => {
                          setIsVideoLoading(false);
                          setVideoPlaybackError(true);
                        }}
                      >
                        Your browser does not support HTML5 video playback.
                      </video>
                    )}
                  </div>
                  <p className={styles.videoNotice}>
                    Operational demonstration video showing physical condition, folding mechanism, and functionality.
                  </p>
                </div>
              ) : (
                <div className={styles.noVideoCard}>
                  <div className={styles.noVideoIconWrap}>
                    <VideoOff size={28} />
                  </div>
                  <h4 className={styles.noVideoTitle}>No Demonstration Video Available</h4>
                  <p className={styles.noVideoText}>
                    The owner has not uploaded an operational walkthrough video for this listing.
                    Physical condition and working mechanisms can still be verified through the photo gallery and checked during in-person handover.
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Inspection & Visual Verification Card */}
          <Card className={styles.conditionCard}>
            <CardBody>
              <div className={styles.cardSectionHeader}>
                <ShieldCheck size={20} className={styles.sectionIcon} />
                <h3 className={styles.sectionHeading}>Physical Inspection & Condition</h3>
              </div>

              <div className={styles.conditionSummaryRow}>
                <div>
                  <span className={styles.conditionLabel}>Owner-Reported Condition:</span>
                  <Badge variant={getConditionVariant(condition)}>
                    {condition || 'Good'}
                  </Badge>
                </div>
                {ownerRating ? (
                  <div className={styles.ratingBox}>
                    <Star size={16} fill="var(--amber-400)" color="var(--amber-500)" />
                    <span className={styles.ratingVal}>{ownerRating}</span>
                    <span className={styles.ratingCount}>({reviewCount || 0} reviews)</span>
                  </div>
                ) : null}
              </div>

              {/* Clear definition of condition grade */}
              <div className={styles.conditionDefinition}>
                {condition === 'Good' && '• Good: Equipment is clean, fully operational, and exhibits minimal cosmetic signs of prior use.'}
                {condition === 'Fair' && '• Fair: Equipment is fully functional with noticeable cosmetic wear, surface scratches, or minor blemishes.'}
                {condition === 'Needs Inspection' && '• Needs Inspection: Equipment requires a thorough physical functionality check by borrower and owner prior to loan handover.'}
                {(!condition || (condition !== 'Good' && condition !== 'Fair' && condition !== 'Needs Inspection')) &&
                  '• Verified by equipment owner. Physical mechanisms should be tested together at loan handover.'}
              </div>

              <div className={styles.detailBlock}>
                <h4 className={styles.blockTitle}>Owner Inspection Notes</h4>
                {conditionDetails && conditionDetails.trim() && !conditionDetails.includes('Enter the results') ? (
                  <p className={styles.blockText}>{conditionDetails}</p>
                ) : (
                  <p className={styles.emptyNoteText}>No inspection notes have been provided.</p>
                )}
              </div>

              <div className={styles.detailBlock}>
                <h4 className={styles.blockTitle}>Documented Cosmetic Wear & Damage</h4>
                {knownDamage && knownDamage.trim() && knownDamage !== 'None documented.' && !knownDamage.includes('None documented') ? (
                  <div className={styles.damageAlert}>
                    <AlertCircle size={18} className={styles.damageIcon} />
                    <div>
                      <h5 className={styles.damageTitle}>Documented Cosmetic Wear</h5>
                      <p className={styles.damageText}>{knownDamage}</p>
                    </div>
                  </div>
                ) : (
                  <p className={styles.emptyNoteText}>No cosmetic damage or blemishes documented by owner.</p>
                )}
              </div>

              <p className={styles.conditionDisclaimer}>
                Note: Condition details are reported by the listing owner. MediShare recommends completing a mutual physical check during handover.
              </p>

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

        {/* Right Column: Hero Booking Card, Description & Partner Info */}
        <div className={styles.infoCol}>
          {/* Equipment Booking Hero Card */}
          <div className={styles.bookingHeroCard}>
            <div className={styles.heroCardHeader}>
              <span className={styles.categoryBadge}>{category}</span>
              <h1 className={styles.productTitle}>{name}</h1>
              <div className={styles.locationStrip}>
                <MapPin size={16} className={styles.locationIcon} />
                <span>{serviceArea || 'Bangalore Urban & Rural Community'}</span>
              </div>
            </div>

            <div className={styles.heroCardPricingRow}>
              <div>
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
              <div>
                <Badge variant={isAvailable ? 'approved' : 'danger'} size="lg">
                  {isAvailable ? 'Available Now' : (availabilityLabel || 'Currently On Loan')}
                </Badge>
              </div>
            </div>

            {/* Requested Borrowing Dates Preview */}
            {isAvailable && (
              <div
                className={styles.bookingDatesPreview}
                onClick={handleOpenRequestModal}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenRequestModal(); }}
              >
                <div className={styles.datesPreviewContent}>
                  <Calendar size={18} className={styles.datesPreviewIcon} />
                  <div>
                    <div className={styles.datesPreviewLabel}>Standard Loan Period Preview</div>
                    <div className={styles.datesPreviewValue}>
                      {new Date(startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} – {new Date(endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} ({durationDays || 5} days)
                    </div>
                  </div>
                </div>
                <span className={styles.datesChangeHint}>Customize Dates →</span>
              </div>
            )}

            {/* Hero Action Area */}
            <div className={styles.heroActionArea}>
              {isOwner ? (
                <div className={styles.ownerNoticeBox}>
                  <div>
                    <strong>You are the owner of this listing</strong>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: '#166534' }}>
                      Owners cannot request their own equipment. You can manage bookings and inventory from your dashboard.
                    </p>
                  </div>
                  <Link to="/owner/inventory" className={styles.ownerManageLink}>
                    Owner Inventory →
                  </Link>
                </div>
              ) : isOwnerRole ? (
                <div className={styles.ownerNoticeBox} style={{ background: '#f8fafc', borderColor: '#cbd5e1', color: '#334155' }}>
                  <div>
                    <strong>Partner Account Active</strong>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
                      You are signed in as an Equipment Partner. Equipment loans are requested by Care Seeker accounts.
                    </p>
                  </div>
                  <Link to="/owner/inventory" className={styles.ownerManageLink}>
                    Partner Inventory →
                  </Link>
                </div>
              ) : isAvailable ? (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    className={styles.requestToBorrowBtn}
                    leftIcon={<CalendarPlus size={20} />}
                    onClick={handleOpenRequestModal}
                  >
                    {sharingType === 'rental' ? 'Book This Equipment' : 'Request to Borrow'}
                  </Button>

                  <div className={styles.bookingExplanation}>
                    <div className={styles.explanationTitle}>What happens after submitting your request?</div>
                    <ul className={styles.explanationList}>
                      <li>The equipment partner reviews your loan dates and patient recovery need.</li>
                      <li>Upon approval, you receive verified pickup instructions and contact details.</li>
                      <li>Both parties complete a mutual physical condition checklist at handover.</li>
                    </ul>
                  </div>

                  <div className={styles.trustMicrocopy}>
                    <span>✓ Real-time availability verified</span>
                    <span>•</span>
                    <span>✓ No upfront deposit</span>
                    <span>•</span>
                    <span>✓ Mutual condition check</span>
                  </div>
                </>
              ) : (
                <div>
                  <div className={styles.onLoanBanner}>
                    <Clock size={18} />
                    <span>Currently {availabilityLabel || 'On Loan (Waitlist Open)'}</span>
                  </div>

                  {waitlistMsg && (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      marginBottom: '0.75rem',
                      background: waitlistMsg.type === 'error' ? '#fef2f2' : waitlistMsg.type === 'success' ? '#f0fdf4' : '#eff6ff',
                      color: waitlistMsg.type === 'error' ? '#991b1b' : waitlistMsg.type === 'success' ? '#166534' : '#1e40af',
                      border: `1px solid ${waitlistMsg.type === 'error' ? '#fecaca' : waitlistMsg.type === 'success' ? '#bbf7d0' : '#bfdbfe'}`
                    }}>
                      {waitlistMsg.text}
                    </div>
                  )}

                  {waitlistStatus?.is_on_waitlist ? (
                    <div>
                      <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '6px', border: '1px solid #bbf7d0', color: '#166534', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                        <strong>✓ You are on the waitlist (Position #{waitlistStatus.position || 1} of {waitlistStatus.total_in_queue || 1})</strong>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: '#15803d' }}>
                          We will notify you immediately once this equipment is returned and sanitized.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        onClick={handleLeaveWaitlist}
                        isLoading={isWaitlistLoading}
                      >
                        Leave Waitlist
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={handleJoinWaitlist}
                        isLoading={isWaitlistLoading}
                      >
                        Join Priority Waitlist ({waitlistStatus?.total_in_queue || 0} waiting)
                      </Button>
                      <p className={styles.waitlistExplainer}>
                        You will receive an automatic notification the moment this equipment is returned and sanitized.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Equipment Overview */}
          <div className={styles.descriptionSection}>
            <h3 className={styles.descHeading}>Equipment Overview</h3>
            <p className={styles.descBody}>{description}</p>
          </div>

          {/* Verified Partner Card */}
          <div className={styles.ownerCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className={styles.ownerAvatar}>
                <User size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div className={styles.ownerMeta}>
                  <span className={styles.ownerName}>{ownerName}</span>
                  <span className={styles.ownerRoleTag}>{ownerType}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.15rem' }}>
                  Verified MediShare Community Equipment Partner
                </div>
              </div>
            </div>
            <p className={styles.ownerDesc}>
              Equipment condition logs, sanitization records, and handover checklists are verified at every exchange.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Booking Bar */}
      <div className={styles.mobileStickyBar}>
        <div className={styles.mobileStickyInfo}>
          <div className={styles.mobileStickyPrice}>
            {price === 0 ? 'Free' : `₹${price}/day`}
          </div>
          <div className={styles.mobileStickyAvailability}>
            {isAvailable ? '• Available Now' : '• On Loan'}
          </div>
        </div>

        {isOwner || isOwnerRole ? (
          <Link to="/owner/inventory">
            <Button variant="outline" size="sm">Partner Inventory</Button>
          </Link>
        ) : isAvailable ? (
          <Button
            variant="primary"
            size="md"
            leftIcon={<CalendarPlus size={16} />}
            onClick={handleOpenRequestModal}
          >
            {sharingType === 'rental' ? 'Book Now' : 'Request to Borrow'}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={handleJoinWaitlist}
            isLoading={isWaitlistLoading}
          >
            Join Waitlist
          </Button>
        )}
      </div>

      {/* ======================================================== */}
      {/* PHASE 6 COMMUNITY REVIEWS & VERIFIED FEEDBACK SECTION  */}
      {/* ======================================================== */}
      <div style={{ marginTop: '3.5rem', borderTop: '1px solid var(--slate-200)', paddingTop: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', margin: '0 0 0.25rem 0' }}>
              Community Reviews & Ratings
            </h2>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.875rem', margin: 0 }}>
              Verified feedback from patients and caregivers who completed equipment loans.
            </p>
          </div>
          {reviewsData.summary && Number(reviewsData.summary.total_reviews) > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fef3c7', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #fde68a' }}>
              <Star size={20} fill="#d97706" color="#d97706" />
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#92400e' }}>
                {Number(reviewsData.summary.average_rating || 0).toFixed(1)}
              </span>
              <span style={{ color: '#b45309', fontSize: '0.875rem', fontWeight: 600 }}>
                ({reviewsData.summary.total_reviews} verified {Number(reviewsData.summary.total_reviews) === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
        </div>

        {isLoadingReviews ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--slate-500)' }}>
            Loading verified reviews...
          </div>
        ) : reviewsData.reviews.length === 0 ? (
          <div style={{ background: '#f8fafc', padding: '2.5rem 1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--slate-200)' }}>
            <Star size={36} color="var(--slate-300)" style={{ margin: '0 auto 0.75rem' }} />
            <h4 style={{ color: 'var(--navy-900)', fontWeight: 700, marginBottom: '0.35rem' }}>No Community Reviews Yet</h4>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', maxWidth: '440px', margin: '0 auto' }}>
              Reviews can be submitted by verified community borrowers once their equipment loan has been returned and inspected.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {reviewsData.reviews.map((rev) => (
              <div key={rev.id} style={{ background: '#ffffff', borderRadius: '10px', padding: '1.25rem', border: '1px solid var(--slate-200)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--navy-900)', fontSize: '0.9375rem' }}>
                    {rev.reviewer_name || 'Community Borrower'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        fill={s <= rev.rating ? '#eab308' : 'none'}
                        color={s <= rev.rating ? '#eab308' : 'var(--slate-300)'}
                      />
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '0.75rem' }}>
                  Verified loan • {new Date(rev.created_at).toLocaleDateString()}
                </div>
                {rev.comment && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--slate-700)', lineHeight: 1.5, margin: 0 }}>
                    "{rev.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
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
              <Link to="/login" state={{ from: { pathname: `/equipment/${id}` } }}>
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

            {/* Handover / Delivery Preference */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--navy-900)' }}>
                Handover Preference *
              </label>
              <select
                value={pickupPreference}
                onChange={(e) => setPickupPreference(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '6px',
                  border: '1px solid var(--slate-300)',
                  fontSize: '0.875rem',
                  backgroundColor: '#ffffff',
                  color: 'var(--navy-900)'
                }}
              >
                <option value="self_pickup">Self-Pickup at Owner Location (Recommended)</option>
                <option value="delivery">Request Community Delivery Assistance (Subject to partner availability)</option>
              </select>
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
