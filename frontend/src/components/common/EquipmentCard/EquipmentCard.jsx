import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ClipboardCheck,
  AlertCircle
} from 'lucide-react';
import Badge from '../Badge/Badge';
import Button from '../Button/Button';
import Card, { CardBody, CardFooter } from '../Card/Card';
import styles from './EquipmentCard.module.css';

// Crisp, self-contained SVG fallback in case network image cannot be retrieved
const FALLBACK_SVG = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23F1F5F9'/%3E%3Ccircle cx='300' cy='180' r='60' fill='%23CCFBF1'/%3E%3Cpath d='M300 150v60M270 180h60' stroke='%230D9488' stroke-width='8' stroke-linecap='round'/%3E%3Ctext x='300' y='280' font-family='sans-serif' font-size='18' font-weight='600' fill='%23475569' text-anchor='middle'%3EMedical Assistive Equipment%3C/text%3E%3Ctext x='300' y='305' font-family='sans-serif' font-size='13' fill='%2394A3B8' text-anchor='middle'%3EMediShare Sample Listing%3C/text%3E%3C/svg%3E";

export default function EquipmentCard({ item }) {
  const [imgSrc, setImgSrc] = useState(item.imageUrl || FALLBACK_SVG);

  const {
    id,
    name,
    title,
    category,
    sharingType,
    sharingLabel,
    price,
    pricePerDay,
    condition,
    serviceArea,
    location,
    availabilityStatus,
    availabilityLabel,
    ownerName,
    owner,
    description
  } = item;

  const displayName = name || title;
  const displayLocation = serviceArea || location;
  const displayOwner = ownerName || (owner && (typeof owner === 'string' ? owner : owner.name));
  const displayPrice = price !== undefined ? price : (pricePerDay !== undefined ? pricePerDay : 0);

  const isAvailable = availabilityStatus === 'available';

  // Condition badge variant mapping
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
    <Card hoverable className={styles.equipmentCard}>
      {/* Equipment Image Container */}
      <div className={styles.imageContainer}>
        <img
          src={imgSrc}
          alt={displayName}
          className={styles.image}
          loading="lazy"
          onError={() => setImgSrc(FALLBACK_SVG)}
        />

        {/* Sharing Type Pill (Top Left) */}
        <div className={styles.sharingBadge}>
          <Badge variant={sharingType} size="sm">
            {sharingLabel || (sharingType === 'free' ? 'Free Lending' : sharingType === 'rental' ? 'Paid Rental' : 'Donation')}
          </Badge>
        </div>

        {/* Availability Badge (Top Right) */}
        <div className={styles.statusBadge}>
          <Badge
            variant={isAvailable ? 'available' : 'borrowed'}
            size="sm"
            dot
          >
            {availabilityLabel || (isAvailable ? 'Available' : 'Currently Unavailable')}
          </Badge>
        </div>

        {/* Sample Listing Tag */}
        <span className={styles.demoWatermark}>Sample Listing</span>
      </div>

      <CardBody className={styles.body}>
        {/* Category & Condition Badges */}
        <div className={styles.metaRow}>
          <span className={styles.categoryName}>{category}</span>
          <Badge variant={getConditionVariant(condition)} size="sm">
            Condition: {condition}
          </Badge>
        </div>

        {/* Equipment Name */}
        <h3 className={styles.title} title={displayName}>
          <Link to={`/equipment/${id}`} className={styles.titleLink}>
            {displayName}
          </Link>
        </h3>

        {/* Short Description */}
        <p className={styles.description}>
          {description}
        </p>

        {/* Location & Owner Info */}
        <div className={styles.detailsList}>
          <div className={styles.detailItem}>
            <MapPin size={14} className={styles.detailIcon} aria-hidden="true" />
            <span className={styles.detailText}>{displayLocation}</span>
          </div>

          <div className={styles.detailItem}>
            <ShieldCheck size={14} className={styles.verifiedIcon} aria-hidden="true" />
            <span className={styles.ownerText}>
              Listed by: <strong className={styles.ownerName}>{displayOwner}</strong>
            </span>
          </div>
        </div>
      </CardBody>

      <CardFooter className={styles.footer}>
        {/* Price / Model */}
        <div className={styles.priceContainer}>
          <span className={styles.priceLabel}>Access Arrangement</span>
          <span className={styles.priceValue}>
            {sharingType === 'free' ? (
              <span className={styles.freeHighlight}>Free Community Loan</span>
            ) : sharingType === 'donation' ? (
              <span className={styles.donationHighlight}>Gift / Donation</span>
            ) : (
              <span>
                ₹{displayPrice} <small className={styles.perDay}>/day</small>
              </span>
            )}
          </span>
        </div>

        {/* Action Button */}
        <Link to={`/equipment/${id}`} className={styles.actionLink}>
          <Button
            variant="outline"
            size="sm"
            rightIcon={<ArrowRight size={14} />}
          >
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
