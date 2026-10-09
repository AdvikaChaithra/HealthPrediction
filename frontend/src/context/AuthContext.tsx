// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

// --- User type definition ---
type User = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  age?: number;
  sex?: string;
};

// --- Context type definition ---
type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, phone: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

// --- Create the Auth Context ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Auth Provider Component ---
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  // Function to refresh user profile
  const refreshProfile = async () => {
    if (!token) return;
    try {
      const { data } = await api.get<User>('/user/profile');
      setUser(data);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      logout();
    }
  };

  // Load user profile when token exists
  useEffect(() => {
    if (token) refreshProfile();
  }, [token]);

  // --- Login Function ---
  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  // --- Register Function ---
  const register = async (name: string, phone: string, email: string, password: string) => {
    await api.post('/auth/register', { name, phone, email, password });
    await login(email, password); // Auto login after successful register
  };

  // --- Logout Function ---
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- useAuth Hook ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
