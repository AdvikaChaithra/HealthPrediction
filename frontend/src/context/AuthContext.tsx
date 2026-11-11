// src/context/AuthContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import api from '../lib/api';
import type { User } from '../types';

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, phone: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const readToken = () => {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(readToken);
  const [user, setUser] = useState<User | null>(null);
  // While a stored token is being validated, show a spinner instead of the login screen.
  const [loading, setLoading] = useState<boolean>(() => !!readToken());

  const saveSession = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!readToken()) return;
    try {
      const { data } = await api.get<User>('/user/profile');
      setUser(data);
    } catch (error) {
      // Only drop the session when the token itself is rejected,
      // not on a temporary network/server error.
      const status = isAxiosError(error) ? error.response?.status : undefined;
      if (status === 401 || status === 403 || status === 404) logout();
      else console.error('Failed to refresh profile:', error);
    }
  }, [logout]);

  // Validate a stored token once on startup.
  useEffect(() => {
    if (!readToken()) return;
    refreshProfile().finally(() => setLoading(false));
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    saveSession(data.token, data.user);
  };

  const register = async (name: string, phone: string, email: string, password: string) => {
    const { data } = await api.post('/auth/register', { name, phone, email, password });
    if (data.token) saveSession(data.token, data.user);
    else await login(email, password);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
