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

export const reviewService = {
  /**
   * Submit a review for a completed loan
   */
  async createReview({ bookingId, rating, comment }) {
    return request('/reviews', {
      method: 'POST',
      body: JSON.stringify({ bookingId, rating, comment })
    });
  },

  /**
   * Get public reviews and ratings breakdown for an equipment item
   */
  async getEquipmentReviews(equipmentId, { page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams({ page, limit });
    return request(`/reviews/equipment/${equipmentId}?${params.toString()}`);
  },

  /**
   * Check if user already reviewed a booking
   */
  async getBookingReview(bookingId) {
    return request(`/reviews/booking/${bookingId}`);
  }
};

export default reviewService;
