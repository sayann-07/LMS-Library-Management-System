import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('admin');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    try {
      // Invalidate the JWT server-side immediately
      api.post('/auth/logout').catch(() => {});
      localStorage.removeItem('token');
      localStorage.removeItem('admin');
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
    setToken(null);
    setUser(null);
  };

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { token: receivedToken, admin } = response.data.data;

    localStorage.setItem('token', receivedToken);
    localStorage.setItem('admin', JSON.stringify(admin));

    setToken(receivedToken);
    setUser(admin);

    return admin;
  };

  // Validate session on app initialization
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/profile');
        if (response.data && response.data.data) {
          setUser(response.data.data);
          localStorage.setItem('admin', JSON.stringify(response.data.data));
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    loading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
