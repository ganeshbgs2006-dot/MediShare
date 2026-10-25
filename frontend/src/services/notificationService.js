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

export const notificationService = {
  /**
   * Get notifications for authenticated user
   */
  async getNotifications({ limit = 20, page = 1, unreadOnly = false } = {}) {
    const params = new URLSearchParams({ limit, page, unreadOnly: String(unreadOnly) });
    return request(`/notifications?${params.toString()}`);
  },

  /**
   * Get total unread count for badge
   */
  async getUnreadCount() {
    return request('/notifications/unread-count');
  },

  /**
   * Mark single notification as read
   */
  async markAsRead(id) {
    return request(`/notifications/${id}/read`, { method: 'PATCH' });
  },

  /**
   * Mark all unread notifications as read
   */
  async markAllAsRead() {
    return request('/notifications/read-all', { method: 'PATCH' });
  },

  /**
   * Dismiss notification
   */
  async dismiss(id) {
    return request(`/notifications/${id}`, { method: 'DELETE' });
  }
};

export default notificationService;
