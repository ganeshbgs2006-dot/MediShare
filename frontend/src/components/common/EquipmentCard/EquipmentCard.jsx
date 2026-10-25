import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, ShieldCheck, CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import Badge from '../Badge/Badge';
import Button from '../Button/Button';
import Card, { CardBody, CardFooter } from '../Card/Card';
import styles from './EquipmentCard.module.css';

export default function EquipmentCard({
  item,
  onQuickView
}) {
  const {
    id,
    title,
    category,
    sharingType,
    sharingLabel,
    pricePerDay,
    condition,
    location,
    availabilityStatus,
    owner,
    imageUrl,
    description
  } = item;

  const isAvailable = availabilityStatus === 'available';

  return (
    <Card hoverable className={styles.equipmentCard}>
      {/* Image Thumbnail Container */}
      <div className={styles.imageContainer}>
        <img
          src={imageUrl}
          alt={title}
          className={styles.image}
          loading="lazy"
          onError={(e) => {
            // Graceful fallback to medical placeholder if Unsplash network image fails
            e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Sharing Type Pill (Top Left) */}
        <div className={styles.sharingBadge}>
          <Badge variant={sharingType} size="sm">
            {sharingLabel}
          </Badge>
        </div>

        {/* Availability Status Badge (Top Right) */}
        <div className={styles.statusBadge}>
          {isAvailable ? (
            <Badge variant="available" size="sm" dot>
              Available Now
            </Badge>
          ) : (
            <Badge variant="borrowed" size="sm" dot>
              In Care / Allocated
            </Badge>
          )}
        </div>

        {/* Academic Demo Watermark */}
        <span className={styles.demoWatermark}>Demo Record</span>
      </div>

      <CardBody className={styles.body}>
        {/* Category & Condition */}
        <div className={styles.metaRow}>
          <span className={styles.categoryName}>{category}</span>
          <span className={styles.conditionTag}>
            Condition: <strong>{condition}</strong>
          </span>
        </div>

        {/* Title */}
        <h3 className={styles.title} title={title}>
          {title}
        </h3>

        {/* Description snippet */}
        <p className={styles.description}>
          {description}
        </p>

        {/* Location & Owner info */}
        <div className={styles.detailsList}>
          <div className={styles.detailItem}>
            <MapPin size={14} className={styles.detailIcon} />
            <span className={styles.detailText}>{location}</span>
          </div>

          <div className={styles.detailItem}>
            <ShieldCheck size={14} className={styles.verifiedIcon} />
            <span className={styles.ownerName}>{owner.name}</span>
            <div className={styles.ratingBadge}>
              <Star size={12} fill="#F59E0B" color="#F59E0B" />
              <span>{owner.rating}</span>
              <span className={styles.reviewCount}>({owner.reviewCount})</span>
            </div>
          </div>
        </div>
      </CardBody>

      <CardFooter className={styles.footer}>
        <div className={styles.priceContainer}>
          <span className={styles.priceLabel}>Access Model</span>
          <span className={styles.priceValue}>
            {sharingType === 'free' ? (
              <span className={styles.freeHighlight}>Free Lending</span>
            ) : sharingType === 'donation' ? (
              <span className={styles.donationHighlight}>Gift / Donation</span>
            ) : (
              <span>₹{pricePerDay} <small className={styles.perDay}>/day</small></span>
            )}
          </span>
        </div>

        <div className={styles.cardActions}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickView && onQuickView(item)}
          >
            Details
          </Button>
          <Link to={`/marketplace?item=${id}`}>
            <Button
              variant={isAvailable ? 'primary' : 'secondary'}
              size="sm"
              disabled={!isAvailable}
              rightIcon={<ArrowRight size={14} />}
            >
              {isAvailable ? 'Request' : 'Waitlist'}
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
