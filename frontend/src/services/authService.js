/**
 * MediShare Authentication API Service
 * Handles client-to-backend REST communication for user registration,
 * session authentication, token storage, and user profile verification.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Make an HTTP request to the MediShare backend API
 */
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
      throw new Error('Unable to connect to MediShare backend server. Please verify that the backend is running on port 5000.');
    }
    throw err;
  }
}

export const authService = {
  /**
   * Register a new user
   * @param {Object} userData - { fullName, email, password, phone, role, organizationName, serviceArea }
   */
  async register(userData) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  /**
   * Sign in with email and password
   * @param {Object} credentials - { email, password }
   */
  async login(credentials) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  /**
   * Fetch current authenticated user profile
   */
  async getProfile() {
    return request('/auth/me', {
      method: 'GET'
    });
  },

  /**
   * Signal logout to backend
   */
  async logout() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('medishare_token');
      localStorage.removeItem('medishare_user');
    }
  },

  /**
   * Check backend health
   */
  async checkHealth() {
    return request('/health', { method: 'GET' });
  }
};

export default authService;

