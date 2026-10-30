import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  googleLogin: (email: string, name?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  // Guest-to-conversion auth modal trigger
  isAuthModalOpen: boolean;
  authModalReason: string;
  openAuthModal: (reason?: string, callback?: () => void) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('documorph_token'));
  const [loading, setLoading] = useState(true);

  // Auth modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState('Create a free account to continue processing your documents.');
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('documorph_token');
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        localStorage.removeItem('documorph_token');
        setToken(null);
        setUser(null);
      }
    } catch {
      localStorage.removeItem('documorph_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const openAuthModal = (reason?: string, callback?: () => void) => {
    if (reason) setAuthModalReason(reason);
    if (callback) setPendingCallback(() => callback);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setPendingCallback(null);
  };

  const onAuthSuccess = (newToken: string, newUser: User) => {
    localStorage.setItem('documorph_token', newToken);
    setToken(newToken);
    setUser(newUser);
    setIsAuthModalOpen(false);

    // If there was a pending conversion waiting for auth, execute it seamlessly!
    if (pendingCallback) {
      const cb = pendingCallback;
      setPendingCallback(null);
      setTimeout(() => cb(), 100);
    }
  };

  const login = async (email: string, pass: string) => {
    try {
      const res = await api.login({ email, password: pass });
      if (res.success && res.token && res.user) {
        onAuthSuccess(res.token, res.user);
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error' };
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    try {
      const res = await api.register({ name, email, password: pass });
      if (res.success && res.token && res.user) {
        onAuthSuccess(res.token, res.user);
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error' };
    }
  };

  const googleLogin = async (email: string, name?: string) => {
    try {
      const res = await api.googleAuth({ email, name });
      if (res.success && res.token && res.user) {
        onAuthSuccess(res.token, res.user);
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || 'Google login failed' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('documorph_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        loading,
        login,
        register,
        googleLogin,
        logout,
        refreshUser,
        isAuthModalOpen,
        authModalReason,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
