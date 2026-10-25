const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('medishare_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const waitlistService = {
  /**
   * Join waitlist for unavailable equipment
   */
  async joinWaitlist({ equipmentId, requestedFrom = null, requestedTo = null, notes = null }) {
    return request('/waitlist', {
      method: 'POST',
      body: JSON.stringify({ equipmentId, requestedFrom, requestedTo, notes })
    });
  },

  /**
   * Leave waitlist by equipment ID
   */
  async leaveByEquipment(equipmentId) {
    return request(`/waitlist/equipment/${equipmentId}`, {
      method: 'DELETE'
    });
  },

  /**
   * Leave waitlist by entry ID
   */
  async leaveWaitlist(id) {
    return request(`/waitlist/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Get active waitlist entries for logged-in seeker
   */
  async getMyWaitlist() {
    return request('/waitlist/my');
  },

  /**
   * Check waitlist status for a specific equipment item
   */
  async getStatusForEquipment(equipmentId) {
    return request(`/waitlist/equipment/${equipmentId}/status`);
  }
};

export default waitlistService;
