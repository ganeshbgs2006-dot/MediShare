import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('medishare_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('medishare_token') || null;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Validate existing token against backend /api/auth/me on initial load
  useEffect(() => {
    async function verifyExistingToken() {
      const storedToken = localStorage.getItem('medishare_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authService.getProfile();
        if (response && response.user) {
          setUser(response.user);
          localStorage.setItem('medishare_user', JSON.stringify(response.user));
        }
      } catch (err) {
        // If token has expired or is invalid, clear stale credentials
        if (err.status === 401 || err.status === 403) {
          localStorage.removeItem('medishare_token');
          localStorage.removeItem('medishare_user');
          setUser(null);
          setToken(null);
        }
      } finally {
        setIsLoading(false);
      }
    }

    verifyExistingToken();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await authService.login({ email, password });
      if (response && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem('medishare_token', response.token);
        localStorage.setItem('medishare_user', JSON.stringify(response.user));
        return { success: true, user: response.user };
      }
      throw new Error('Invalid response received from authentication server.');
    } catch (err) {
      const message = err.message || 'Login failed. Please check your credentials.';
      setError(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const response = await authService.register(userData);
      if (response && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem('medishare_token', response.token);
        localStorage.setItem('medishare_user', JSON.stringify(response.user));
        return { success: true, user: response.user };
      }
      throw new Error('Registration succeeded but session could not be established.');
    } catch (err) {
      const message = err.message || 'Registration failed. Please try again.';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
    setError(null);
  };

  const clearError = () => setError(null);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    error,
    login,
    register,
    logout,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
