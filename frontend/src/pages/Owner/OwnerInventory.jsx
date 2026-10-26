import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Tag,
  Trash2,
  Edit,
  ExternalLink,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { equipmentService } from '../../services/equipmentService';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Card, { CardBody, CardFooter } from '../../components/common/Card/Card';
import styles from './OwnerInventory.module.css';

export default function OwnerInventory() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const isPending = user?.approvalStatus === 'pending' || user?.approval_status === 'pending';
  const isRejected = user?.approvalStatus === 'rejected' || user?.approval_status === 'rejected';

  useEffect(() => {
    loadMyEquipment();
  }, []);

  const loadMyEquipment = async () => {
    setLoading(true);
    setError('');
    try {
      const items = await equipmentService.fetchOwnerEquipment();
      setEquipmentList(items);
    } catch (err) {
      setError(err.message || 'Failed to load equipment inventory.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this equipment listing?')) {
      return;
    }
    setDeleteError('');
    try {
      await equipmentService.deleteEquipment(id);
      setEquipmentList((prev) => prev.filter((item) => String(item.id) !== String(id)));
    } catch (err) {
      setDeleteError(err.message || 'Cannot delete equipment item.');
    }
  };

  return (
    <div className={styles.inventoryPage}>
      <div className="container">
        {/* Header section */}
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.breadcrumbs}>
              <Link to="/">Home</Link> / <span>Partner Portal</span> / <span>Inventory</span>
            </div>
            <h1 className={styles.pageTitle}>Equipment Inventory Management</h1>
            <p className={styles.pageSubtitle}>
              Publish, monitor, and manage your community assistive equipment listings and reservations.
            </p>
          </div>

          <div className={styles.headerActions}>
            <Button
              variant="primary"
              icon={<PlusCircle size={18} />}
              onClick={() => navigate('/owner/add-equipment')}
              disabled={isPending || isRejected}
            >
              Add New Equipment
            </Button>
            <Button
              variant="outline"
              icon={<Calendar size={18} />}
              onClick={() => navigate('/owner/bookings')}
            >
              Loan Requests
            </Button>
          </div>
        </div>

        {/* Account Status Alert Banner */}
        {isPending && (
          <div className={styles.pendingBanner}>
            <Clock size={24} className={styles.pendingIcon} />
            <div>
              <h3 className={styles.bannerTitle}>Partner Account Pending Administrator Verification</h3>
              <p className={styles.bannerDesc}>
                Thank you for joining MediShare as an Equipment Partner. Platform administrators review all partner organizations and lenders to ensure community safety. You can prepare your inventory, but listings will be published to the public marketplace upon verification approval.
              </p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className={styles.rejectedBanner}>
            <ShieldAlert size={24} className={styles.rejectedIcon} />
            <div>
              <h3 className={styles.bannerTitle}>Account Verification Action Required</h3>
              <p className={styles.bannerDesc}>
                Your partner verification requires additional information: {user?.approvalReason || user?.approval_reason || 'Please contact platform support.'}
              </p>
            </div>
          </div>
        )}

        {deleteError && (
          <div className={styles.errorAlert}>
            <AlertTriangle size={18} />
            <span>{deleteError}</span>
          </div>
        )}

        {/* Equipment List Grid */}
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Loading your equipment inventory...</p>
          </div>
        ) : error ? (
          <div className={styles.errorAlert}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        ) : equipmentList.length === 0 ? (
          <div className={styles.emptyState}>
            <Package size={56} className={styles.emptyIcon} />
            <h3>No Equipment Listed Yet</h3>
            <p>
              Start sharing medical and assistive mobility devices with individuals and families in your community.
            </p>
            <Button
              variant="primary"
              icon={<PlusCircle size={18} />}
              onClick={() => navigate('/owner/add-equipment')}
              disabled={isPending || isRejected}
            >
              List Your First Equipment
            </Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {equipmentList.map((item) => (
              <Card key={item.id} hoverable className={styles.card}>
                <div className={styles.imageWrapper}>
                  <img
                    src={item.imageUrl || item.image_url || '/placeholder.png'}
                    alt={item.name}
                    className={styles.image}
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'%3E%3Crect width='400' height='250' fill='%23F1F5F9'/%3E%3Ctext x='200' y='130' font-family='sans-serif' font-size='16' fill='%2394A3B8' text-anchor='middle'%3EMedical Equipment%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <div className={styles.statusPill}>
                    <Badge variant={item.sharingType || item.sharing_type} size="sm">
                      {item.sharingLabel || item.sharing_type}
                    </Badge>
                  </div>
                </div>

                <CardBody className={styles.cardBody}>
                  <div className={styles.categoryBadge}>{item.category}</div>
                  <h3 className={styles.itemName}>{item.name}</h3>

                  <div className={styles.metaRow}>
                    <div className={styles.metaItem}>
                      <MapPin size={15} />
                      <span>{item.serviceArea || item.service_area}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <Tag size={15} />
                      <span>
                        {item.pricePerDay > 0 ? `₹${item.pricePerDay}/day` : 'Free Lending'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.conditionRow}>
                    <span>Condition:</span>
                    <Badge variant="approved" size="sm">
                      {item.conditionGrade || item.condition_grade || 'Good'}
                    </Badge>
                    <span className={styles.availabilityStatus}>
                      Status: <strong>{item.availabilityStatus || item.availability_status}</strong>
                    </span>
                  </div>
                </CardBody>

                <CardFooter className={styles.cardFooter}>
                  <Link to={`/equipment/${item.id}`} className={styles.viewLink}>
                    View Listing <ExternalLink size={14} />
                  </Link>
                  <div className={styles.actionButtons}>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Trash2 size={15} />}
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

