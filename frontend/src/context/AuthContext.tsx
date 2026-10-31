import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('brightloop_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('brightloop_token');
    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await api.getMe();
      setUser(profile);
    } catch (err) {
      console.warn('Session expired or invalid:', err);
      localStorage.removeItem('brightloop_token');
      localStorage.removeItem('brightloop_user');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: any): Promise<User> => {
    const res = await api.login(credentials);
    const jwtToken = res.token;
    const authUser = res.user;

    localStorage.setItem('brightloop_token', jwtToken);
    localStorage.setItem('brightloop_user', JSON.stringify(authUser));
    setToken(jwtToken);
    setUser(authUser);
    return authUser;
  };

  const register = async (data: any): Promise<User> => {
    const res = await api.register(data);
    const jwtToken = res.token;
    const authUser = res.user;

    localStorage.setItem('brightloop_token', jwtToken);
    localStorage.setItem('brightloop_user', JSON.stringify(authUser));
    setToken(jwtToken);
    setUser(authUser);
    return authUser;
  };

  const logout = () => {
    localStorage.removeItem('brightloop_token');
    localStorage.removeItem('brightloop_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
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
