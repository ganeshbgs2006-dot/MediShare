import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Filter,
  CheckCircle2,
  ShieldCheck,
  HeartHandshake,
  Clock,
  Sparkles,
  ArrowRight,
  Accessibility,
  Wind,
  Bed,
  Activity,
  Baby,
  Camera,
  ClipboardCheck,
  RefreshCw,
  Users,
  Award,
  AlertCircle,
  HelpCircle,
  Share2
} from 'lucide-react';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Card, { CardBody } from '../../components/common/Card/Card';
import EquipmentCard from '../../components/common/EquipmentCard/EquipmentCard';
import {
  SAMPLE_EQUIPMENT_CATEGORIES,
  IMPACT_METRICS
} from '../../data/sampleEquipment';
import { getFeaturedEquipment } from '../../services/equipmentService';
import styles from './Home.module.css';

// Category icon mapper helper
const getCategoryIcon = (iconName) => {
  switch (iconName) {
    case 'Accessibility':
      return <Accessibility size={28} className={styles.categoryIcon} />;
    case 'Wind':
      return <Wind size={28} className={styles.categoryIcon} />;
    case 'Bed':
      return <Bed size={28} className={styles.categoryIcon} />;
    case 'Activity':
      return <Activity size={28} className={styles.categoryIcon} />;
    case 'HeartHandshake':
      return <HeartHandshake size={28} className={styles.categoryIcon} />;
    case 'Baby':
      return <Baby size={28} className={styles.categoryIcon} />;
    default:
      return <Activity size={28} className={styles.categoryIcon} />;
  }
};

export default function Home() {
  const navigate = useNavigate();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMode, setSelectedMode] = useState('all');

  // Filter tab for featured equipment
  const [featuredTab, setFeaturedTab] = useState('all');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('q', searchQuery.trim());
    if (selectedCategory !== 'all') params.append('category', selectedCategory);
    if (selectedMode !== 'all') params.append('sharingType', selectedMode);
    navigate(`/marketplace?${params.toString()}`);
  };

  // Featured equipment from single unified service
  const featuredList = useMemo(() => getFeaturedEquipment(6), []);

  const filteredEquipment = useMemo(() => {
    return featuredList.filter((item) => {
      if (featuredTab === 'all') return true;
      return item.sharingType === featuredTab;
    });
  }, [featuredList, featuredTab]);

  return (
    <div className={styles.homeContainer}>
      {/* ======================================================== */}
      {/* 1. HERO SECTION                                          */}
      {/* ======================================================== */}
      <section className={styles.heroSection}>
        <div className={`container ${styles.heroContainer}`}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <Sparkles size={16} className={styles.heroBadgeIcon} />
              <span>Community-Powered Healthcare Equipment Sharing</span>
            </div>

            <h1 className={styles.heroTitle}>
              Accessible Medical Equipment When You Need It Most
            </h1>

            <p className={styles.heroDescription}>
              MediShare connects recovering patients and families with verified local equipment
              owners, healthcare clinics, and donors. Borrow wheelchairs, oxygen concentrators, and
              hospital beds securely with dual-party condition checklists.
            </p>

            {/* Comprehensive Search & Filter Box */}
            <form className={styles.searchBox} onSubmit={handleSearchSubmit}>
              <div className={styles.searchFields}>
                <div className={styles.inputGroup}>
                  <Search size={18} className={styles.searchFieldIcon} />
                  <input
                    type="text"
                    placeholder="Search wheelchair, oxygen concentrator, hospital bed..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.heroInput}
                  />
                </div>

                <div className={styles.selectGroup}>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={styles.heroSelect}
                  >
                    <option value="all">All Care Categories</option>
                    <option value="mobility">Mobility Aids</option>
                    <option value="respiratory">Respiratory Support</option>
                    <option value="beds">Hospital Beds</option>
                    <option value="monitoring">Vital Monitoring</option>
                    <option value="rehab">Rehabilitation</option>
                  </select>
                </div>

                <div className={styles.selectGroup}>
                  <select
                    value={selectedMode}
                    onChange={(e) => setSelectedMode(e.target.value)}
                    className={styles.heroSelect}
                  >
                    <option value="all">All Sharing Modes</option>
                    <option value="free">Free Community Lending</option>
                    <option value="rental">Non-Profit Care Rental</option>
                    <option value="donation">Permanent Donation</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className={styles.searchSubmitBtn}
                rightIcon={<ArrowRight size={18} />}
              >
                Find Equipment
              </Button>
            </form>

            {/* Hero Quick Proof Points */}
            <div className={styles.heroTrustPoints}>
              <div className={styles.trustPoint}>
                <CheckCircle2 size={16} className={styles.trustCheckIcon} />
                <span>Admin-Verified Owners</span>
              </div>
              <div className={styles.trustPoint}>
                <CheckCircle2 size={16} className={styles.trustCheckIcon} />
                <span>Photo & Video Condition Evidence</span>
              </div>
              <div className={styles.trustPoint}>
                <CheckCircle2 size={16} className={styles.trustCheckIcon} />
                <span>Transparent Community Waitlists</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. STATS & COMMUNITY METRICS TICKER                     */}
      {/* ======================================================== */}
      <section className={styles.statsStrip} aria-label="Community Values">
        <div className={`container ${styles.statsGrid}`}>
          {IMPACT_METRICS.map((pillar) => (
            <div key={pillar.id} className={styles.statCard}>
              <span className={styles.statPillarTag}>{pillar.tag}</span>
              <h3 className={styles.statPillarTitle}>{pillar.title}</h3>
              <p className={styles.statDescription}>{pillar.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. EQUIPMENT CATEGORIES                                  */}
      {/* ======================================================== */}
      <section className={`section ${styles.categorySection}`}>
        <div className="container">
          <div className="section-title">
            <span className="badge-pill">Clinical Categories</span>
            <h2>Find Equipment by Care Need</h2>
            <p>
              Browse verified devices tailored to mobility recovery, post-surgical care, chronic respiratory needs, and home monitoring.
            </p>
          </div>

          <div className={styles.categoriesGrid}>
            {SAMPLE_EQUIPMENT_CATEGORIES.map((cat) => (
              <Card
                key={cat.id}
                hoverable
                className={styles.categoryCard}
                onClick={() => navigate(`/marketplace?category=${encodeURIComponent(cat.categoryName)}`)}
              >
                <div className={styles.categoryIconWrap}>
                  {getCategoryIcon(cat.iconName)}
                </div>
                <div className={styles.categoryContent}>
                  <div className={styles.categoryHeader}>
                    <h3 className={styles.categoryTitle}>{cat.name}</h3>
                  </div>
                  <p className={styles.categoryDesc}>{cat.description}</p>
                  <span className={styles.categoryExploreLink}>
                    Browse Category <ArrowRight size={14} />
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. FEATURED AVAILABLE EQUIPMENT                          */}
      {/* ======================================================== */}
      <section className={`section ${styles.featuredSection}`}>
        <div className="container">
          <div className={styles.featuredHeaderRow}>
            <div>
              <span className="badge-pill">Verified Showcase</span>
              <h2>Featured Community Equipment</h2>
              <p>
                Browse representative devices currently listed in the local network. Sample listings are shown for illustration.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className={styles.tabGroup} role="tablist">
              <button
                type="button"
                className={`${styles.tabBtn} ${featuredTab === 'all' ? styles.tabActive : ''}`}
                onClick={() => setFeaturedTab('all')}
              >
                All Equipment
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${featuredTab === 'free' ? styles.tabActive : ''}`}
                onClick={() => setFeaturedTab('free')}
              >
                Free Lending
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${featuredTab === 'rental' ? styles.tabActive : ''}`}
                onClick={() => setFeaturedTab('rental')}
              >
                Non-Profit Rental
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${featuredTab === 'donation' ? styles.tabActive : ''}`}
                onClick={() => setFeaturedTab('donation')}
              >
                Donation
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className={styles.equipmentGrid}>
            {filteredEquipment.map((item) => (
              <EquipmentCard
                key={item.id}
                item={item}
              />
            ))}
          </div>

          {/* Bottom Link to Full Marketplace */}
          <div className={styles.viewAllRow}>
            <Link to="/marketplace">
              <Button variant="secondary" size="lg" rightIcon={<ArrowRight size={18} />}>
                Explore All Available Equipment in Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. HOW MEDISHARE WORKS (4-STEP COMMUNITY LIFECYCLE)      */}
      {/* ======================================================== */}
      <section id="how-it-works" className={`section ${styles.workflowSection}`}>
        <div className="container">
          <div className="section-title">
            <span className="badge-pill">Transparent Workflow</span>
            <h2>How MediShare Works</h2>
            <p>
              A responsible, transparent sharing model that protects both equipment owners and recovering patients through structured handovers.
            </p>
          </div>

          <div className={styles.workflowGrid}>
            {/* Step 1 */}
            <div className={styles.stepCard}>
              <div className={styles.stepNumberBadge}>1</div>
              <div className={styles.stepIconWrap}>
                <Search size={24} className={styles.stepIcon} />
              </div>
              <h3 className={styles.stepTitle}>Browse & Request</h3>
              <p className={styles.stepDesc}>
                Search by medical category, location, and dates. Review condition logs, inspection photos, and owner ratings before submitting a request.
              </p>
            </div>

            {/* Step 2 */}
            <div className={styles.stepCard}>
              <div className={styles.stepNumberBadge}>2</div>
              <div className={styles.stepIconWrap}>
                <ShieldCheck size={24} className={styles.stepIcon} />
              </div>
              <h3 className={styles.stepTitle}>Owner Verification</h3>
              <p className={styles.stepDesc}>
                The approved owner reviews the booking request, checks availability, and coordinates an in-person handover or clinical delivery.
              </p>
            </div>

            {/* Step 3 */}
            <div className={styles.stepCard}>
              <div className={styles.stepNumberBadge}>3</div>
              <div className={styles.stepIconWrap}>
                <ClipboardCheck size={24} className={styles.stepIcon} />
              </div>
              <h3 className={styles.stepTitle}>Condition Checklist & Media</h3>
              <p className={styles.stepDesc}>
                At handover, both parties complete a categorized digital inspection checklist with mandatory photos to document baseline condition.
              </p>
            </div>

            {/* Step 4 */}
            <div className={styles.stepCard}>
              <div className={styles.stepNumberBadge}>4</div>
              <div className={styles.stepIconWrap}>
                <RefreshCw size={24} className={styles.stepIcon} />
              </div>
              <h3 className={styles.stepTitle}>Safe Return & Review</h3>
              <p className={styles.stepDesc}>
                Upon recovery, equipment is inspected against initial records. Once verified clean and functional, it is safely re-listed for the next family.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. TRUST & SAFETY ARCHITECTURE                            */}
      {/* ======================================================== */}
      <section id="safety" className={`section ${styles.safetySection}`}>
        <div className="container">
          <div className={styles.safetyContainer}>
            <div className={styles.safetyInfo}>
              <span className="badge-pill">Patient Protection First</span>
              <h2>Safety, Hygiene & Accountability by Design</h2>
              <p className={styles.safetyLead}>
                Medical equipment requires higher standards than standard rental goods. MediShare embeds accountability directly into the software architecture.
              </p>

              <div className={styles.safetyFeatures}>
                <div className={styles.safetyFeatureItem}>
                  <div className={styles.featureIconBox}>
                    <Award size={20} />
                  </div>
                  <div>
                    <h4>Mandatory Owner Approval</h4>
                    <p>Every equipment partner must submit credentials and undergo administrator moderation before any listing becomes visible to seekers.</p>
                  </div>
                </div>

                <div className={styles.safetyFeatureItem}>
                  <div className={styles.featureIconBox}>
                    <Camera size={20} />
                  </div>
                  <div>
                    <h4>Cryptographically Timestamped Media</h4>
                    <p>Handover and return photos are securely indexed with time, booking ID, and checklist observations to prevent condition disputes.</p>
                  </div>
                </div>

                <div className={styles.safetyFeatureItem}>
                  <div className={styles.featureIconBox}>
                    <ClipboardCheck size={20} />
                  </div>
                  <div>
                    <h4>Specialized Checklist Protocols</h4>
                    <p>Wheelchairs undergo brake, tire, and frame inspections; oxygen units undergo filter, flow rate, and electrical cable checks.</p>
                  </div>
                </div>

                <div className={styles.safetyFeatureItem}>
                  <div className={styles.featureIconBox}>
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h4>No Automatic Re-allocation on Damaged Returns</h4>
                    <p>If an item returns with flagged issues or damage, backend locks prevent immediate re-allocation until administrative clearance.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.safetyCardWrapper}>
              <div className={styles.checklistPreviewCard}>
                <div className={styles.previewHeader}>
                  <ClipboardCheck size={20} color="var(--teal-600)" />
                  <span className={styles.previewTitle}>Digital Inspection Protocol Preview</span>
                  <Badge variant="approved" size="sm">Standard Checklist</Badge>
                </div>

                <div className={styles.checkItemList}>
                  <div className={styles.checkItem}>
                    <CheckCircle2 size={16} color="var(--green-600)" />
                    <span>Structural frame: Zero cracks, bends, or weld fractures</span>
                  </div>
                  <div className={styles.checkItem}>
                    <CheckCircle2 size={16} color="var(--green-600)" />
                    <span>Hygiene: Medical-grade sanitization applied & certified</span>
                  </div>
                  <div className={styles.checkItem}>
                    <CheckCircle2 size={16} color="var(--green-600)" />
                    <span>Controls & Locks: Handbrakes & wheel locks fully functional</span>
                  </div>
                  <div className={styles.checkItem}>
                    <CheckCircle2 size={16} color="var(--green-600)" />
                    <span>Accessories: Footrests, straps, and chargers verified</span>
                  </div>
                  <div className={styles.checkItem}>
                    <CheckCircle2 size={16} color="var(--green-600)" />
                    <span>4-angle photographic condition evidence uploaded</span>
                  </div>
                </div>

                <div className={styles.disclaimerNote}>
                  <small>
                    * Checklists document physical observations and condition history. They do not substitute for clinical medical evaluation.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. COMMUNITY IMPACT & CARE CREDITS                       */}
      {/* ======================================================== */}
      <section id="impact" className={`section ${styles.impactSection}`}>
        <div className="container">
          <div className="section-title">
            <span className="badge-pill">Care Economics</span>
            <h2>Reimagining Healthcare Equipment Access</h2>
            <p>
              Millions of dollars worth of durable medical equipment sit in storage closets after patient recovery. MediShare unlocks this latent value for our community.
            </p>
          </div>

          <div className={styles.impactGrid}>
            <Card className={styles.impactCard}>
              <CardBody>
                <div className={styles.impactIconWrap}>
                  <Users size={28} color="var(--teal-600)" />
                </div>
                <h3>Dignity for Recovering Families</h3>
                <p>
                  Sudden injuries or surgeries shouldn't force families into high debt. Community sharing allows instant access without financial ruin.
                </p>
              </CardBody>
            </Card>

            <Card className={styles.impactCard}>
              <CardBody>
                <div className={styles.impactIconWrap}>
                  <Share2 size={28} color="var(--blue-600)" />
                </div>
                <h3>Care Credit Ledger</h3>
                <p>
                  Community members who lend out idle equipment earn Care Credits. These credits guarantee priority allocation when their own family needs medical devices.
                </p>
              </CardBody>
            </Card>

            <Card className={styles.impactCard}>
              <CardBody>
                <div className={styles.impactIconWrap}>
                  <RefreshCw size={28} color="var(--green-600)" />
                </div>
                <h3>Circular Health Sustainability</h3>
                <p>
                  By extending the lifecycle of robust metal frames, electrical motors, and hospital beds, we divert tons of complex medical e-waste from landfills.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 8. CALL TO ACTION DUAL BANNER                            */}
      {/* ======================================================== */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaGrid}>
            {/* Seeker CTA */}
            <div className={styles.ctaBoxSeeker}>
              <div className={styles.ctaBadge}>For Patients & Families</div>
              <h3>Need Medical Equipment for Recovery?</h3>
              <p>
                Search verified wheelchairs, oxygen systems, and recovery beds available in your neighborhood today.
              </p>
              <Link to="/marketplace">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight size={18} />}>
                  Find Equipment in Marketplace
                </Button>
              </Link>
            </div>

            {/* Owner CTA */}
            <div className={styles.ctaBoxOwner}>
              <div className={styles.ctaBadgeLight}>For Owners & Clinics</div>
              <h3>Have Idle Medical Equipment at Home?</h3>
              <p>
                List your equipment, support a neighbor in need, and join our admin-verified community care network.
              </p>
              <Link to="/register?role=owner">
                <Button variant="outline" size="lg" rightIcon={<ArrowRight size={18} />}>
                  Register as Equipment Partner
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

