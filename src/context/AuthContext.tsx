import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.js';
import { authService } from '../services/authService.js';
import { getAuthToken, setAuthToken, removeAuthToken } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (payload: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; message?: string }>;
  quickLogin: (role: UserRole) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      const storedToken = getAuthToken();
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (res.success && res.data) {
            setUser(res.data);
          } else {
            removeAuthToken();
            setTokenState(null);
            setUser(null);
          }
        } catch {
          removeAuthToken();
          setTokenState(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const res = await authService.login({ email, password });
    setIsLoading(false);

    if (res.success && res.data) {
      setAuthToken(res.data.token);
      setTokenState(res.data.token);
      setUser(res.data.user);
      return { success: true };
    }

    return { success: false, message: res.message || 'Login failed' };
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    const res = await authService.register(payload);
    setIsLoading(false);

    if (res.success && res.data) {
      setAuthToken(res.data.token);
      setTokenState(res.data.token);
      setUser(res.data.user);
      return { success: true };
    }

    return { success: false, message: res.message || 'Registration failed' };
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {}
    removeAuthToken();
    setTokenState(null);
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    const res = await authService.updateProfile(data);
    if (res.success && res.data) {
      setUser(res.data);
      return { success: true };
    }
    return { success: false, message: res.message || 'Update failed' };
  };

  const quickLogin = async (role: UserRole) => {
    if (role === 'admin') {
      const res = await login('admin@govtrack.demo', 'Admin@123456');
      return res.success;
    } else {
      const res = await login('citizen@govtrack.demo', 'Citizen@123456');
      return res.success;
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    const res = await authService.getMe();
    if (res.success && res.data) {
      setUser(res.data);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        quickLogin,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
