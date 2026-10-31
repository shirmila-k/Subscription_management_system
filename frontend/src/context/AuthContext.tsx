import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { ApiClient } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: Role | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    role?: Role;
    companyName?: string;
  }) => Promise<void>;
  logout: () => void;
  setMockSession: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Initialize session from localStorage
    const savedToken = localStorage.getItem('brightloop_token');
    const savedUser = localStorage.getItem('brightloop_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Failed to parse cached user data', err);
        ApiClient.removeToken();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const response = await ApiClient.post<{ user: User; token: string }>('/auth/login', credentials);
      setUser(response.user);
      setToken(response.token);
      ApiClient.setToken(response.token);
      localStorage.setItem('brightloop_user', JSON.stringify(response.user));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    name: string;
    role?: Role;
    companyName?: string;
  }) => {
    setIsLoading(true);
    try {
      const response = await ApiClient.post<{ user: User; token: string }>('/auth/register', data);
      setUser(response.user);
      setToken(response.token);
      ApiClient.setToken(response.token);
      localStorage.setItem('brightloop_user', JSON.stringify(response.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    ApiClient.removeToken();
  };

  /**
   * Helper to switch mock preview session instantly for Admin / Customer / Staff
   */
  const setMockSession = (targetRole: Role) => {
    const mockUsers: Record<Role, User> = {
      ADMIN: {
        id: 'mock-admin-01',
        email: 'admin@brightloop.com',
        name: 'Alex Administrator',
        role: 'ADMIN',
        companyName: 'Brightloop Software HQ',
        createdAt: new Date().toISOString(),
      },
      STAFF: {
        id: 'mock-staff-01',
        email: 'staff@brightloop.com',
        name: 'Sarah Operations',
        role: 'STAFF',
        companyName: 'Brightloop Billing Team',
        createdAt: new Date().toISOString(),
      },
      CUSTOMER: {
        id: 'mock-customer-01',
        email: 'customer@acmecorp.com',
        name: 'David Acme',
        role: 'CUSTOMER',
        companyName: 'Acme Global Enterprises',
        createdAt: new Date().toISOString(),
      },
    };

    const selectedUser = mockUsers[targetRole];
    setUser(selectedUser);
    setToken(`mock-token-${targetRole.toLowerCase()}`);
    localStorage.setItem('brightloop_user', JSON.stringify(selectedUser));
    localStorage.setItem('brightloop_token', `mock-token-${targetRole.toLowerCase()}`);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        role: user?.role || null,
        login,
        register,
        logout,
        setMockSession,
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
