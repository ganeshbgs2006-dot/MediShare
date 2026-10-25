import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Package,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Lock,
  Unlock,
  Flag,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Modal from '../../components/common/Modal/Modal';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
  const { user: currentAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Overview Metrics State
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Users Tab State
  const [users, setUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  // Equipment Tab State
  const [equipmentList, setEquipmentList] = useState([]);
  const [equipmentModFilter, setEquipmentModFilter] = useState('all');
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [equipmentLoading, setEquipmentLoading] = useState(false);

  // Bookings Tab State
  const [bookingsList, setBookingsList] = useState([]);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Audit Logs Tab State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTypeFilter, setAuditTypeFilter] = useState('all');
  const [auditLoading, setAuditLoading] = useState(false);

  // Action Modals State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({});
  const [modalReason, setModalReason] = useState('');
  const [modalSelectedStatus, setModalSelectedStatus] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // 1. Load Overview Metrics
  const loadMetrics = async () => {
    setMetricsLoading(true);
    try {
      const data = await adminService.getDashboardMetrics();
      if (data && data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  };

  // 2. Load Users
  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await adminService.getUsers({
        role: userRoleFilter,
        status: userStatusFilter,
        search: userSearch
      });
      if (data && data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  // 3. Load Equipment
  const loadEquipment = async () => {
    setEquipmentLoading(true);
    try {
      const data = await adminService.getEquipment({
        moderationStatus: equipmentModFilter,
        search: equipmentSearch
      });
      if (data && data.equipment) {
        setEquipmentList(data.equipment);
      }
    } catch (err) {
      console.error('Failed to load equipment:', err);
    } finally {
      setEquipmentLoading(false);
    }
  };

  // 4. Load Bookings
  const loadBookings = async () => {
    setBookingsLoading(true);
    try {
      const data = await adminService.getBookings({
        status: bookingStatusFilter,
        search: bookingSearch
      });
      if (data && data.bookings) {
        setBookingsList(data.bookings);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setBookingsLoading(false);
    }
  };

  // 5. Load Audit Logs
  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const data = await adminService.getAuditLogs({
        entityType: auditTypeFilter
      });
      if (data && data.logs) {
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  // Initial & Tab-switch triggers
  useEffect(() => {
    if (activeTab === 'overview') loadMetrics();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'equipment') loadEquipment();
    if (activeTab === 'bookings') loadBookings();
    if (activeTab === 'audit') loadAuditLogs();
  }, [activeTab]);

  // Modal Handlers
  const handleOpenUserModal = (targetUser, makeActive) => {
    setModalConfig({
      type: 'user_status',
      user: targetUser,
      isActive: makeActive,
      title: makeActive ? 'Reactivate User Account' : 'Suspend User Account',
      description: makeActive
        ? `Are you sure you want to reactivate access for ${targetUser.full_name} (${targetUser.email})?`
        : `Are you sure you want to suspend account access for ${targetUser.full_name} (${targetUser.email})?`
    });
    setModalReason('');
    setModalError(null);
    setModalOpen(true);
  };

  const handleOpenEquipmentModal = (item, newStatus) => {
    setModalConfig({
      type: 'equipment_moderation',
      item,
      status: newStatus,
      title: `Update Moderation: ${newStatus.toUpperCase()}`,
      description: `Set moderation status for "${item.name}" to ${newStatus}.`
    });
    setModalReason('');
    setModalError(null);
    setModalOpen(true);
  };

  const handleOpenBookingOverrideModal = (booking) => {
    setModalConfig({
      type: 'booking_override',
      booking,
      title: `Administrative Override: ${booking.booking_reference}`,
      description: `Change the status of booking ${booking.booking_reference} (${booking.equipment_name}).`
    });
    setModalSelectedStatus(booking.status);
    setModalReason('');
    setModalError(null);
    setModalOpen(true);
  };

  const handleModalSubmit = async () => {
    setModalSubmitting(true);
    setModalError(null);

    try {
      if (modalConfig.type === 'user_status') {
        await adminService.updateUserStatus(modalConfig.user.id, {
          isActive: modalConfig.isActive,
          reason: modalReason
        });
        loadUsers();
      } else if (modalConfig.type === 'equipment_moderation') {
        await adminService.moderateEquipment(modalConfig.item.id, {
          moderationStatus: modalConfig.status,
          reason: modalReason
        });
        loadEquipment();
      } else if (modalConfig.type === 'booking_override') {
        if (!modalReason || !modalReason.trim()) {
          throw new Error('An administrative override justification is required.');
        }
        await adminService.overrideBooking(modalConfig.booking.id, {
          status: modalSelectedStatus,
          reason: modalReason
        });
        loadBookings();
      }

      setModalOpen(false);
      loadMetrics(); // refresh metrics in background
    } catch (err) {
      setModalError(err.message || 'Operation failed.');
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <div className={`container ${styles.container}`}>
      {/* Top Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 className={styles.title}>MediShare Administrative Console</h1>
            <span className={styles.adminBadge}>
              <ShieldCheck size={14} /> Admin Access
            </span>
          </div>
          <p className={styles.subtitle}>
            Platform governance, equipment safety verification, user access control, and regulatory compliance audit trail.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw size={14} />}
          onClick={() => {
            if (activeTab === 'overview') loadMetrics();
            if (activeTab === 'users') loadUsers();
            if (activeTab === 'equipment') loadEquipment();
            if (activeTab === 'bookings') loadBookings();
            if (activeTab === 'audit') loadAuditLogs();
          }}
        >
          Refresh Data
        </Button>
      </div>

      {/* Tabs Navigation Bar */}
      <div className={styles.tabBar}>
        {[
          { key: 'overview', label: 'Platform Overview', icon: <Package size={16} /> },
          { key: 'users', label: 'User Governance', icon: <Users size={16} /> },
          { key: 'equipment', label: 'Equipment Moderation', icon: <ShieldCheck size={16} /> },
          { key: 'bookings', label: 'Booking Oversight', icon: <Calendar size={16} /> },
          { key: 'audit', label: 'Regulatory Audit Trail', icon: <FileText size={16} /> }
        ].map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tabItem} ${activeTab === tab.key ? styles.tabItemActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ========================================================= */}
      {/* 1. OVERVIEW TAB */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div>
          {metricsLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-500)' }}>
              Loading platform metrics from MySQL database...
            </div>
          ) : !metrics ? (
            <div style={{ color: '#ef4444' }}>Unable to load dashboard metrics.</div>
          ) : (
            <>
              {/* Top 4 KPI Metrics */}
              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <div className={styles.metricTop}>
                    <div className={styles.metricLabel}>Total Users</div>
                    <div className={styles.metricIconWrap} style={{ background: 'var(--teal-50)', color: 'var(--teal-600)' }}>
                      <Users size={22} />
                    </div>
                  </div>
                  <div>
                    <div className={styles.metricValue}>{metrics.users.total}</div>
                    <div className={styles.metricSubtext}>
                      {metrics.users.seekers} Seekers • {metrics.users.owners} Partners • {metrics.users.admins} Admins
                    </div>
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricTop}>
                    <div className={styles.metricLabel}>Equipment Listings</div>
                    <div className={styles.metricIconWrap} style={{ background: '#f0fdf4', color: '#16a34a' }}>
                      <Package size={22} />
                    </div>
                  </div>
                  <div>
                    <div className={styles.metricValue}>{metrics.equipment.total}</div>
                    <div className={styles.metricSubtext}>
                      {metrics.equipment.byModeration.approved} Approved • {metrics.equipment.byModeration.flagged || 0} Flagged
                    </div>
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricTop}>
                    <div className={styles.metricLabel}>Active Loans</div>
                    <div className={styles.metricIconWrap} style={{ background: '#e0f2fe', color: '#0284c7' }}>
                      <Calendar size={22} />
                    </div>
                  </div>
                  <div>
                    <div className={styles.metricValue}>{metrics.bookings.byStatus.active_loan || 0}</div>
                    <div className={styles.metricSubtext}>
                      Currently deployed in the community
                    </div>
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricTop}>
                    <div className={styles.metricLabel}>Completed Loans</div>
                    <div className={styles.metricIconWrap} style={{ background: '#fef3c7', color: '#d97706' }}>
                      <CheckCircle2 size={22} />
                    </div>
                  </div>
                  <div>
                    <div className={styles.metricValue}>{metrics.bookings.byStatus.returned || 0}</div>
                    <div className={styles.metricSubtext}>
                      {metrics.bookings.total} Total Lifetime Bookings
                    </div>
                  </div>
                </div>
              </div>

              {/* Moderation Status Highlights */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid var(--slate-200)' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', fontWeight: 600 }}>ACCOUNT SAFETY</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '0.25rem' }}>
                    {metrics.users.active} Active / {metrics.users.suspended} Suspended
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid var(--slate-200)' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', fontWeight: 600 }}>PENDING INQUIRIES</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d97706', marginTop: '0.25rem' }}>
                    {metrics.bookings.byStatus.pending || 0} Awaiting Partner Action
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid var(--slate-200)' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', fontWeight: 600 }}>CONFIRMED BOOKINGS</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0d9488', marginTop: '0.25rem' }}>
                    {metrics.bookings.byStatus.approved || 0} Ready for Pickup
                  </div>
                </div>
              </div>

              {/* Two Tables: Recent Users & Recent Bookings */}
              <div className={styles.twoColGrid}>
                {/* Recent Users */}
                <div className={styles.tableCard}>
                  <div className={styles.tableHeader}>
                    <h3 className={styles.tableTitle}>Recent Registrations</h3>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('users')}>
                      View All Users
                    </Button>
                  </div>
                  <div className={styles.tableWrap}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Role</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.recentUsers && metrics.recentUsers.map((u) => (
                          <tr key={u.id}>
                            <td>
                              <strong>{u.full_name}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{u.email}</div>
                            </td>
                            <td>
                              <Badge variant="neutral">{u.role}</Badge>
                            </td>
                            <td>
                              <span className={`${styles.statusPill} ${u.is_active ? styles.statusActive : styles.statusSuspended}`}>
                                {u.is_active ? 'Active' : 'Suspended'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Bookings */}
                <div className={styles.tableCard}>
                  <div className={styles.tableHeader}>
                    <h3 className={styles.tableTitle}>Recent Booking Inquiries</h3>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('bookings')}>
                      View All Bookings
                    </Button>
                  </div>
                  <div className={styles.tableWrap}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Reference</th>
                          <th>Equipment & Seeker</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.recentBookings && metrics.recentBookings.map((b) => (
                          <tr key={b.id}>
                            <td>
                              <strong style={{ fontFamily: 'monospace' }}>{b.booking_reference}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                                {new Date(b.created_at).toLocaleDateString()}
                              </div>
                            </td>
                            <td>
                              <strong>{b.equipment_name}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>By {b.seeker_name}</div>
                            </td>
                            <td>
                              <Badge variant={b.status === 'active_loan' ? 'info' : b.status === 'approved' ? 'approved' : 'warning'}>
                                {b.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. USER GOVERNANCE TAB */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h3 className={styles.tableTitle}>User Governance & Access Management</h3>
            <span style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
              Total: {users.length} accounts
            </span>
          </div>

          <div className={styles.tableFilterBar}>
            <input
              type="text"
              placeholder="Search by name, email, or organization..."
              className={styles.filterInput}
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
            />

            <select
              className={styles.filterSelect}
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="seeker">Care Seekers</option>
              <option value="owner">Equipment Partners</option>
              <option value="admin">Administrators</option>
            </select>

            <select
              className={styles.filterSelect}
              value={userStatusFilter}
              onChange={(e) => setUserStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>

            <Button variant="primary" size="sm" onClick={loadUsers}>
              Apply Filters
            </Button>
          </div>

          <div className={styles.tableWrap}>
            {usersLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--slate-500)' }}>
                Loading user accounts...
              </div>
            ) : users.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--slate-500)' }}>
                No users found matching current filters.
              </div>
            ) : (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User / Organization</th>
                    <th>Email / Phone</th>
                    <th>Role</th>
                    <th>Account Status</th>
                    <th>Registered</th>
                    <th>Governance Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = currentAdmin && currentAdmin.id === u.id;
                    return (
                      <tr key={u.id}>
                        <td>#{u.id}</td>
                        <td>
                          <strong>{u.full_name}</strong>
                          {u.organization_name && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--teal-700)' }}>{u.organization_name}</div>
                          )}
                          {isSelf && (
                            <span style={{ fontSize: '0.6875rem', background: 'var(--teal-100)', color: 'var(--teal-800)', padding: '0.1rem 0.4rem', borderRadius: '4px', marginLeft: '0.35rem' }}>
                              You
                            </span>
                          )}
                        </td>
                        <td>
                          <div>{u.email}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{u.phone || 'No phone'}</div>
                        </td>
                        <td>
                          <Badge variant={u.role === 'admin' ? 'info' : u.role === 'owner' ? 'approved' : 'neutral'}>
                            {u.role}
                          </Badge>
                        </td>
                        <td>
                          <span className={`${styles.statusPill} ${u.is_active ? styles.statusActive : styles.statusSuspended}`}>
                            {u.is_active ? 'Active' : 'Suspended'}
                          </span>
                          {u.status_reason && (
                            <div style={{ fontSize: '0.6875rem', color: '#991b1b', maxWidth: '160px' }}>
                              {u.status_reason}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          {isSelf ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontStyle: 'italic' }}>
                              Current Session
                            </span>
                          ) : u.is_active ? (
                            <Button
                              variant="danger"
                              size="sm"
                              leftIcon={<Lock size={12} />}
                              onClick={() => handleOpenUserModal(u, false)}
                            >
                              Suspend
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<Unlock size={12} />}
                              onClick={() => handleOpenUserModal(u, true)}
                            >
                              Reactivate
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. EQUIPMENT MODERATION TAB */}
      {/* ========================================================= */}
      {activeTab === 'equipment' && (
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h3 className={styles.tableTitle}>Equipment Safety & Moderation Review</h3>
            <span style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
              Total: {equipmentList.length} items
            </span>
          </div>

          <div className={styles.tableFilterBar}>
            <input
              type="text"
              placeholder="Search equipment by name or category..."
              className={styles.filterInput}
              value={equipmentSearch}
              onChange={(e) => setEquipmentSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadEquipment()}
            />

            <select
              className={styles.filterSelect}
              value={equipmentModFilter}
              onChange={(e) => setEquipmentModFilter(e.target.value)}
            >
              <option value="all">All Moderation States</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending Review</option>
              <option value="flagged">Flagged</option>
              <option value="rejected">Rejected</option>
            </select>

            <Button variant="primary" size="sm" onClick={loadEquipment}>
              Filter Catalog
            </Button>
          </div>

          <div className={styles.tableWrap}>
            {equipmentLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--slate-500)' }}>
                Loading equipment catalog...
              </div>
            ) : equipmentList.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--slate-500)' }}>
                No equipment records found matching current criteria.
              </div>
            ) : (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Equipment Details</th>
                    <th>Category</th>
                    <th>Sharing Type</th>
                    <th>Partner / Owner</th>
                    <th>Moderation</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {equipmentList.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <img
                          src={item.image_url || 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80'}
                          alt={item.name}
                          style={{ width: '56px', height: '44px', objectFit: 'cover', borderRadius: '6px' }}
                        />
                      </td>
                      <td>
                        <strong>{item.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{item.service_area}</div>
                      </td>
                      <td>{item.category}</td>
                      <td>
                        <Badge variant="neutral">{item.sharing_type}</Badge>
                      </td>
                      <td>
                        <div>{item.owner_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{item.owner_organization}</div>
                      </td>
                      <td>
                        <span className={`${styles.statusPill} ${
                          item.moderation_status === 'approved' ? styles.statusApproved :
                          item.moderation_status === 'flagged' ? styles.statusFlagged :
                          item.moderation_status === 'rejected' ? styles.statusRejected : styles.statusPending
                        }`}>
                          {item.moderation_status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          {item.moderation_status !== 'approved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEquipmentModal(item, 'approved')}
                            >
                              Approve
                            </Button>
                          )}
                          {item.moderation_status !== 'flagged' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              leftIcon={<Flag size={12} />}
                              onClick={() => handleOpenEquipmentModal(item, 'flagged')}
                            >
                              Flag
                            </Button>
                          )}
                          {item.moderation_status !== 'rejected' && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleOpenEquipmentModal(item, 'rejected')}
                            >
                              Reject
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. BOOKING OVERSIGHT TAB */}
      {/* ========================================================= */}
      {activeTab === 'bookings' && (
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h3 className={styles.tableTitle}>Platform Booking Inquiries & Loan Oversight</h3>
            <span style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
              Total: {bookingsList.length} records
            </span>
          </div>

          <div className={styles.tableFilterBar}>
            <input
              type="text"
              placeholder="Search by reference, equipment, or seeker..."
              className={styles.filterInput}
              value={bookingSearch}
              onChange={(e) => setBookingSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadBookings()}
            />

            <select
              className={styles.filterSelect}
              value={bookingStatusFilter}
              onChange={(e) => setBookingStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="active_loan">Active Loan</option>
              <option value="returned">Returned</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>

            <Button variant="primary" size="sm" onClick={loadBookings}>
              Search
            </Button>
          </div>

          <div className={styles.tableWrap}>
            {bookingsLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--slate-500)' }}>
                Loading bookings...
              </div>
            ) : bookingsList.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--slate-500)' }}>
                No bookings found matching current filter.
              </div>
            ) : (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Equipment</th>
                    <th>Care Seeker</th>
                    <th>Partner / Owner</th>
                    <th>Dates</th>
                    <th>Status</th>
                    <th>Override</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingsList.map((b) => (
                    <tr key={b.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                        {b.booking_reference}
                      </td>
                      <td>
                        <strong>{b.equipment_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{b.equipment_category}</div>
                      </td>
                      <td>
                        <div>{b.seeker_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{b.seeker_email}</div>
                      </td>
                      <td>
                        <div>{b.owner_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{b.owner_email}</div>
                      </td>
                      <td style={{ fontSize: '0.8125rem' }}>
                        {new Date(b.start_date).toLocaleDateString()} to {new Date(b.end_date).toLocaleDateString()}
                      </td>
                      <td>
                        <Badge variant={
                          b.status === 'active_loan' ? 'info' :
                          b.status === 'approved' ? 'approved' :
                          b.status === 'returned' ? 'neutral' :
                          b.status === 'pending' ? 'warning' : 'danger'
                        }>
                          {b.status}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenBookingOverrideModal(b)}
                        >
                          Override
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. REGULATORY AUDIT TRAIL TAB */}
      {/* ========================================================= */}
      {activeTab === 'audit' && (
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h3 className={styles.tableTitle}>Regulatory Compliance Audit Trail</h3>
            <span style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
              Complete record of all administrative governance modifications
            </span>
          </div>

          <div className={styles.tableFilterBar}>
            <select
              className={styles.filterSelect}
              value={auditTypeFilter}
              onChange={(e) => setAuditTypeFilter(e.target.value)}
            >
              <option value="all">All Entity Types</option>
              <option value="user">User Governance</option>
              <option value="equipment">Equipment Moderation</option>
              <option value="booking">Booking Overrides</option>
            </select>

            <Button variant="primary" size="sm" onClick={loadAuditLogs}>
              Filter Audit Log
            </Button>
          </div>

          <div className={styles.tableWrap}>
            {auditLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--slate-500)' }}>
                Loading audit trail records...
              </div>
            ) : auditLogs.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--slate-500)' }}>
                No audit log records recorded yet.
              </div>
            ) : (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Administrator</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Reason / Justification</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap', color: 'var(--slate-600)' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td>
                        <strong>{log.admin_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{log.admin_email}</div>
                      </td>
                      <td>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '0.8125rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: 'var(--slate-100)',
                          color: 'var(--navy-900)',
                          fontWeight: 700
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <span style={{ textTransform: 'capitalize' }}>{log.entity_type}</span> #{log.entity_id}
                      </td>
                      <td style={{ fontSize: '0.875rem', maxWidth: '300px' }}>
                        {log.reason || 'No justification provided'}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontFamily: 'monospace' }}>
                        {log.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* UNIVERSAL ADMINISTRATIVE ACTION MODAL */}
      {/* ========================================================= */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalConfig.title || 'Administrative Action'}
        maxWidth="520px"
      >
        <div>
          <p style={{ color: 'var(--slate-600)', marginBottom: '1rem', lineHeight: 1.5 }}>
            {modalConfig.description}
          </p>

          {modalError && (
            <div style={{ background: '#fef2f2', padding: '0.75rem', borderRadius: '8px', color: '#991b1b', marginBottom: '1rem' }}>
              <strong>Error:</strong> {modalError}
            </div>
          )}

          {modalConfig.type === 'booking_override' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--navy-900)' }}>
                Target Status
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '6px',
                  border: '1px solid var(--slate-300)',
                  fontSize: '0.875rem'
                }}
                value={modalSelectedStatus}
                onChange={(e) => setModalSelectedStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="active_loan">Active Loan</option>
                <option value="returned">Returned</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--navy-900)' }}>
              Administrative Justification (Required for Audit Trail)
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
              placeholder="Explain the regulatory, safety, or compliance reason for this modification..."
              value={modalReason}
              onChange={(e) => setModalReason(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={modalSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant={modalConfig.isActive === false ? 'danger' : 'primary'}
              onClick={handleModalSubmit}
              isLoading={modalSubmitting}
            >
              Confirm Modification
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
