import React, { useState, useMemo } from 'react';
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
  Star
} from 'lucide-react';
import { getEquipmentById } from '../../services/equipmentService';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Card, { CardBody } from '../../components/common/Card/Card';
import Modal from '../../components/common/Modal/Modal';
import styles from './EquipmentDetails.module.css';

// SVG Fallback for resilient rendering
const FALLBACK_SVG = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'%3E%3Crect width='800' height='500' fill='%23F1F5F9'/%3E%3Ccircle cx='400' cy='220' r='80' fill='%23CCFBF1'/%3E%3Cpath d='M400 180v80M360 220h80' stroke='%230D9488' stroke-width='10' stroke-linecap='round'/%3E%3Ctext x='400' y='350' font-family='sans-serif' font-size='22' font-weight='600' fill='%23475569' text-anchor='middle'%3EMedical Assistive Equipment%3C/text%3E%3Ctext x='400' y='380' font-family='sans-serif' font-size='15' fill='%2394A3B8' text-anchor='middle'%3EMediShare Demonstration Record%3C/text%3E%3C/svg%3E";

export default function EquipmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Retrieve equipment record
  const item = useMemo(() => getEquipmentById(id), [id]);

  const gallery = useMemo(() => {
    if (!item) return [];
    return item.galleryImages && item.galleryImages.length > 0 ? item.galleryImages : [item.imageUrl];
  }, [item]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Request dialog state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

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
        return 'neutral';
      case 'Needs Inspection':
        return 'inspection';
      default:
        return 'neutral';
    }
  };

  return (
    <div className={styles.detailsPage}>
      {/* Top Breadcrumb & Back Strip */}
      <div className={styles.topNavigationStrip}>
        <div className="container">
          <div className={styles.breadcrumbRow}>
            <Link to="/marketplace" className={styles.backLink}>
              <ArrowLeft size={16} />
              <span>Back to Marketplace</span>
            </Link>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbCurrent}>{category}</span>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbItemName}>{name}</span>
          </div>
        </div>
      </div>

      <div className="container section" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        {/* Platform Notice Strip */}
        <div className={styles.demoNotice} role="note">
          <Info size={16} className={styles.demoNoticeIcon} aria-hidden="true" />
          <span>
            <strong>Platform Notice:</strong> Sample listing shown for illustration. Equipment condition observations reflect physical visual inspections.
          </span>
        </div>

        {/* Main Two-Column Layout */}
        <div className={styles.contentGrid}>
          {/* Left Column: Visual Media & Verification Highlights */}
          <div className={styles.mediaCol}>
            <div className={styles.mainImageContainer}>
              <img
                src={gallery[activeImageIndex] || FALLBACK_SVG}
                alt={`${name} photo ${activeImageIndex + 1}`}
                className={styles.mainImage}
                onError={(e) => { e.target.src = FALLBACK_SVG; }}
              />
              <div className={styles.imageOverlayBadges}>
                <Badge variant={sharingType} size="md">
                  {sharingLabel}
                </Badge>
                <Badge variant={isAvailable ? 'available' : 'borrowed'} size="md" dot>
                  {availabilityLabel}
                </Badge>
              </div>
            </div>

            {/* Thumbnail Gallery Strip */}
            {gallery.length > 1 && (
              <div className={styles.thumbnailRow} role="tablist" aria-label="Equipment image angles">
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`${styles.thumbnailBtn} ${activeImageIndex === idx ? styles.activeThumbnail : ''}`}
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={`View photo ${idx + 1} of ${gallery.length}`}
                    aria-selected={activeImageIndex === idx}
                  >
                    <img
                      src={img}
                      alt={`${name} thumbnail ${idx + 1}`}
                      className={styles.thumbnailImg}
                      onError={(e) => { e.target.src = FALLBACK_SVG; }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Quick Inspection Summary Card */}
            <div className={styles.inspectionSummaryCard}>
              <div className={styles.inspectionHeader}>
                <ShieldCheck size={20} color="var(--teal-600)" />
                <h4>Physical Observation Record</h4>
              </div>
              <p className={styles.inspectionLead}>
                Recorded during last logged physical inspection:
              </p>
              <div className={styles.inspectionBox}>
                <div className={styles.inspectionRow}>
                  <span className={styles.inspectionLabel}>Condition Assessment:</span>
                  <Badge variant={getConditionVariant(condition)} size="sm">
                    {condition}
                  </Badge>
                </div>
                <div className={styles.inspectionRow}>
                  <span className={styles.inspectionLabel}>Known Damage / Wear:</span>
                  <span className={styles.inspectionValue}>
                    {knownDamage || 'None documented'}
                  </span>
                </div>
              </div>
              <small className={styles.disclaimerText}>
                * Recorded physical observations only. Handover records do not substitute for certified clinical or biomedical equipment testing.
              </small>
            </div>
          </div>

          {/* Right Column: Key Details, Accessories, Partner Info, & Request Action */}
          <div className={styles.infoCol}>
            <div className={styles.categoryTag}>
              <span>{category}</span>
            </div>

            <h1 className={styles.equipmentTitle}>{name}</h1>

            <div className={styles.serviceLocationRow}>
              <MapPin size={16} className={styles.locIcon} />
              <span>Example Service Area: <strong>{serviceArea}</strong></span>
            </div>

            {/* Pricing / Access Arrangement Box */}
            <div className={styles.arrangementBox}>
              <div className={styles.arrangementHeader}>
                <span className={styles.arrangementLabel}>Sharing Arrangement</span>
                <span className={styles.arrangementValue}>
                  {sharingType === 'free' ? (
                    <strong className={styles.freeText}>Free Community Lending (₹0)</strong>
                  ) : sharingType === 'donation' ? (
                    <strong className={styles.donationText}>Permanent Donation (Gift)</strong>
                  ) : (
                    <span>
                      <strong className={styles.rentalPrice}>₹{price}</strong>
                      <span className={styles.rentalUnit}> / day (non-profit care maintenance)</span>
                    </span>
                  )}
                </span>
              </div>
              <p className={styles.arrangementNote}>
                MediShare is a community platform. No hidden commercial markups or profiteering.
              </p>
            </div>

            {/* Description Section */}
            <div className={styles.sectionBlock}>
              <h3 className={styles.sectionHeading}>Equipment Description</h3>
              <p className={styles.descriptionText}>{description}</p>
            </div>

            {/* Condition Details Section */}
            <div className={styles.sectionBlock}>
              <h3 className={styles.sectionHeading}>Condition Notes & Observations</h3>
              <p className={styles.descriptionText}>{conditionDetails}</p>
            </div>

            {/* Included Accessories */}
            {includedAccessories && includedAccessories.length > 0 && (
              <div className={styles.sectionBlock}>
                <h3 className={styles.sectionHeading}>Included Accessories & Parts</h3>
                <ul className={styles.accessoriesList}>
                  {includedAccessories.map((acc, idx) => (
                    <li key={idx} className={styles.accessoryItem}>
                      <CheckCircle2 size={16} className={styles.checkIcon} aria-hidden="true" />
                      <span>{acc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Category Physical Inspection Checklist */}
            {checklist && checklist.length > 0 && (
              <div className={styles.sectionBlock}>
                <div className={styles.checklistTitleRow}>
                  <h3 className={styles.sectionHeading} style={{ marginBottom: 0 }}>Physical Handover Checklist</h3>
                  <span className={styles.checklistLead}>{checklist.length}-Point Verification</span>
                </div>
                <div className={styles.checklistGrid}>
                  {checklist.map((check, idx) => (
                    <div key={idx} className={styles.checkCard}>
                      <div className={styles.checkCardTop}>
                        <CheckCircle2 size={16} className={styles.checkIconSuccess} aria-hidden="true" />
                        <strong className={styles.checkItemName}>{check.item}</strong>
                        <span className={`${styles.checkStatusPill} ${check.status === 'Passed' ? styles.statusPassed : styles.statusReview}`}>
                          {check.status}
                        </span>
                      </div>
                      <p className={styles.checkNotes}>{check.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Demonstration Owner Profile Box */}
            <div className={styles.ownerProfileCard}>
              <div className={styles.ownerHeader}>
                <div className={styles.ownerAvatar}>
                  <ShieldCheck size={22} color="var(--teal-700)" />
                </div>
                <div>
                  <h4 className={styles.ownerName}>{ownerName}</h4>
                  <span className={styles.ownerType}>{ownerType}</span>
                </div>
                {ownerRating ? (
                  <div className={styles.ownerRatingWrap} title={`Partner Rating: ${ownerRating} out of 5 stars based on ${reviewCount} reviews`}>
                    <Star size={14} className={styles.ownerStarIcon} fill="#F59E0B" color="#F59E0B" />
                    <span className={styles.ownerRatingScore}>{ownerRating.toFixed(1)}</span>
                    <span className={styles.ownerReviewCount}>({reviewCount} reviews)</span>
                  </div>
                ) : (
                  <span className={styles.demoPartnerTag}>Care Partner</span>
                )}
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
                onClick={() => setIsRequestModalOpen(true)}
              >
                {isAvailable ? 'Request Equipment' : 'Currently Unavailable (Waitlist)'}
              </Button>

              <p className={styles.actionSubtext}>
                {isAvailable
                  ? 'Online booking and verification will be enabled shortly.'
                  : 'This equipment is currently allocated to an active care loan.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Accessible Booking Information Dialog */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Equipment Request Notice"
        maxWidth="580px"
      >
        <div className={styles.modalBody}>
          <div className={styles.modalIconWrap}>
            <Sparkles size={32} color="var(--teal-600)" />
          </div>

          <h4 className={styles.modalHeading}>
            Equipment Request Notice
          </h4>

          <p className={styles.modalText}>
            You selected <strong>"Request Equipment"</strong> for:
            <br />
            <em>"{name}"</em>
          </p>

          <div className={styles.modalInfoBox}>
            <div className={styles.infoRow}>
              <strong>• Sample Listing:</strong> This equipment profile is a sample record shown for platform illustration.
            </div>
            <div className={styles.infoRow}>
              <strong>• Booking System:</strong> Online booking, identity verification, and handover coordination are currently in development.
            </div>
            <div className={styles.infoRow}>
              <strong>• No Reservation Placed:</strong> No actual booking has been created or equipment reserved at this time.
            </div>
          </div>

          <p className={styles.modalHelp}>
            When online booking is activated, registered seekers will be able to select required loan dates, review owner pickup instructions, and complete the digital handover checklist.
          </p>

          <div className={styles.modalActions}>
            <Button variant="primary" onClick={() => setIsRequestModalOpen(false)}>
              Understood
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

