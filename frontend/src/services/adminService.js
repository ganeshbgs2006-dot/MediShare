/**
 * MediShare Admin Platform Management Service
 * Provides client interfaces for platform analytics, user governance & suspensions,
 * equipment moderation, booking overrides, and administrative audit inspection.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('medishare_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to MediShare backend server on port 5000.');
    }
    throw err;
  }
}

export const adminService = {
  /**
   * Fetch system-wide KPIs, operational metrics, and time-series trends
   */
  async getDashboardMetrics(range = '30d') {
    return request(`/admin/dashboard?range=${range}`, {
      method: 'GET'
    });
  },

  /**
   * Fetch actionable operational queues (overdue loans, condition disputes, pending moderation)
   */
  async getOperationalQueues() {
    return request('/admin/queues', {
      method: 'GET'
    });
  },

  /**
   * Resolve an inspection condition dispute
   */
  async resolveDispute(id, resolution) {
    return request(`/admin/disputes/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ resolution })
    });
  },

  /**
   * Run automated reminder checks
   */
  async runReminders() {
    return request('/admin/reminders/run', {
      method: 'POST'
    });
  },

  /**
   * Download sanitized CSV report
   */
  async downloadReportCsv(type = 'bookings') {
    const token = localStorage.getItem('medishare_token');
    const response = await fetch(`${API_BASE_URL}/admin/reports/export?type=${type}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to export ${type} report: Status ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medishare-${type}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  /**
   * List platform users with role, status filters and pagination
   */
  async getUsers({ role = 'all', status = 'all', search = '', page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams();
    if (role && role !== 'all') params.append('role', role);
    if (status && status !== 'all') params.append('status', status);
    if (search && search.trim()) params.append('search', search.trim());
    params.append('page', page);
    params.append('limit', limit);

    return request(`/admin/users?${params.toString()}`, {
      method: 'GET'
    });
  },

  /**
   * Suspend or reactivate user account
   */
  async updateUserStatus(id, { isActive, reason }) {
    return request(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive, reason })
    });
  },

  /**
   * List platform equipment catalog for moderation review
   */
  async getEquipment({ category = 'all', sharingType = 'all', moderationStatus = 'all', search = '', page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams();
    if (category && category !== 'all' && category !== 'All Categories') params.append('category', category);
    if (sharingType && sharingType !== 'all') params.append('sharingType', sharingType);
    if (moderationStatus && moderationStatus !== 'all') params.append('moderationStatus', moderationStatus);
    if (search && search.trim()) params.append('search', search.trim());
    params.append('page', page);
    params.append('limit', limit);

    return request(`/admin/equipment?${params.toString()}`, {
      method: 'GET'
    });
  },

  /**
   * Update equipment moderation status (approve, flag, reject)
   */
  async moderateEquipment(id, { moderationStatus, reason }) {
    return request(`/admin/equipment/${id}/moderation`, {
      method: 'PATCH',
      body: JSON.stringify({ moderationStatus, reason })
    });
  },

  /**
   * List all platform bookings with status filter & pagination
   */
  async getBookings({ status = 'all', search = '', page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (search && search.trim()) params.append('search', search.trim());
    params.append('page', page);
    params.append('limit', limit);

    return request(`/admin/bookings?${params.toString()}`, {
      method: 'GET'
    });
  },

  /**
   * Administrative override of booking state
   */
  async overrideBooking(id, { status, reason, handoverNotes }) {
    return request(`/admin/bookings/${id}/override`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason, handoverNotes })
    });
  },

  /**
   * Query regulatory audit logs
   */
  async getAuditLogs({ action = 'all', entityType = 'all', page = 1, limit = 50 } = {}) {
    const params = new URLSearchParams();
    if (action && action !== 'all') params.append('action', action);
    if (entityType && entityType !== 'all') params.append('entityType', entityType);
    params.append('page', page);
    params.append('limit', limit);

    return request(`/admin/audit-logs?${params.toString()}`, {
      method: 'GET'
    });
  },

  /**
   * List pending equipment owner applications awaiting admin review
   */
  async getPendingOwners({ search = '', page = 1, limit = 50 } = {}) {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    params.append('page', page);
    params.append('limit', limit);

    return request(`/admin/owners/pending?${params.toString()}`, {
      method: 'GET'
    });
  },

  /**
   * Review and approve or reject an owner / partner account
   */
  async updateOwnerApproval(id, { approvalStatus, reason }) {
    return request(`/admin/users/${id}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({ approvalStatus, reason })
    });
  }
};

export default adminService;

