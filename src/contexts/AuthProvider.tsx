
"use client";

import React, { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { getFirebaseConfig } from '@/lib/firebase-config';
import { FirebaseConfig } from '@/lib/types';

interface AuthContextType {
  isAuthenticated: boolean;
  homeGameCode: string | null;
  firebaseConfig: FirebaseConfig | null;
  login: (homeGameCode: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>('pokerpal-auth', false);
  const [homeGameCode, setHomeGameCode] = useLocalStorage<string | null>('homeGameCode', null);
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig | null>(null);

  useEffect(() => {
    setFirebaseConfig(getFirebaseConfig());
  }, []);

  const login = useCallback((code: string) => {
    setHomeGameCode(code);
    setIsAuthenticated(true);
  }, [setHomeGameCode, setIsAuthenticated]);

  const logout = useCallback(() => {
    setHomeGameCode(null);
    setIsAuthenticated(false);
    // Use a timeout to ensure local storage is cleared before reload
    setTimeout(() => window.location.reload(), 100);
  }, [setHomeGameCode, setIsAuthenticated]);

  const value = { isAuthenticated, login, logout, homeGameCode, firebaseConfig };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
