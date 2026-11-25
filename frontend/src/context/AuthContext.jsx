/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('agrosathi_token') || null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('agrosathi_token', token);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      fetchMe();
    } else {
      localStorage.removeItem('agrosathi_token');
      delete api.defaults.headers.common.Authorization;
      setUser(null);
      setProfile({});
    }
  }, [token]);

  const fetchMe = async () => {
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data.user);
      setProfile(res.data.profile || {});
    } catch {
      setToken(null);
    }
  };

  const login = async (email, password) => {
    setAuthLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      setToken(res.data.access_token);
      setUser(res.data.user);
      setProfile(res.data.profile || {});
      return res.data;
    } catch (err) {
      throw new Error(err?.response?.data?.detail || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (payload) => {
    setAuthLoading(true);
    try {
      const res = await api.post('/api/auth/register', payload);
      setToken(res.data.access_token);
      setUser(res.data.user);
      setProfile(res.data.profile || {});
      return res.data;
    } catch (err) {
      throw new Error(err?.response?.data?.detail || 'Registration failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const updateProfile = async (payload) => {
    const res = await api.put('/api/profile', payload);
    setUser(res.data.user);
    setProfile(res.data.profile || {});
    return res.data;
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        profile,
        isAuthenticated: Boolean(token && user),
        authLoading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
