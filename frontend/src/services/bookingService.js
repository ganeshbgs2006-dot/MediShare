/**
 * MediShare Booking Service
 * Handles booking creation, seeker bookings list, owner booking management,
 * status transitions (approved, active_loan, returned), and cancellations.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

export const bookingService = {
  /**
   * Submit a new equipment booking request (Seeker)
   */
  async createBooking({ equipmentId, startDate, endDate, seekerMessage }) {
    return request('/bookings', {
      method: 'POST',
      body: JSON.stringify({ equipmentId, startDate, endDate, seekerMessage })
    });
  },

  /**
   * Get bookings created by logged-in seeker
   */
  async getMyBookings({ status = 'all', page = 1, limit = 50 } = {}) {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    params.append('page', page);
    params.append('limit', limit);

    return request(`/bookings/my?${params.toString()}`, {
      method: 'GET'
    });
  },

  /**
   * Get equipment booking requests for logged-in equipment partner/owner
   */
  async getOwnerBookings({ status = 'all', page = 1, limit = 50 } = {}) {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    params.append('page', page);
    params.append('limit', limit);

    return request(`/bookings/owner?${params.toString()}`, {
      method: 'GET'
    });
  },

  /**
   * Get single booking details
   */
  async getBookingById(id) {
    return request(`/bookings/${id}`, {
      method: 'GET'
    });
  },

  /**
   * Update request status (Owner: approve, reject, active_loan, returned)
   */
  async updateStatus(id, { status, reason, handoverNotes }) {
    return request(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason, handoverNotes })
    });
  },

  /**
   * Cancel booking (Seeker)
   */
  async cancelBooking(id, reason) {
    return request(`/bookings/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    });
  },

  /**
   * Check real-time date availability for equipment
   */
  async checkAvailability(equipmentId, startDate, endDate) {
    return request(`/equipment/${equipmentId}/availability?startDate=${startDate}&endDate=${endDate}`, {
      method: 'GET'
    });
  }
};

export default bookingService;
