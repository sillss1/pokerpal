"use client";

import React, { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { getFirebaseConfig } from '@/lib/firebase-config';
import { FirebaseConfig } from '@/lib/types';

interface AuthContextType {
  isAuthenticated: boolean;
  homeGameCode: string | null;
  firebaseConfig: FirebaseConfig | null;
  configLoaded: boolean; 
  login: (homeGameCode: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>('pokerpal-auth', false);
  const [homeGameCode, setHomeGameCode] = useLocalStorage<string | null>('homeGameCode', null);
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    // This effect runs only on the client-side, ensuring process.env is available.
    const config = getFirebaseConfig();
    setFirebaseConfig(config);
    setConfigLoaded(true); // Mark config as loaded after attempting to get it.
  }, []);

  const login = useCallback((code: string) => {
    setHomeGameCode(code);
    setIsAuthenticated(true);
  }, [setHomeGameCode, setIsAuthenticated]);

  const logout = useCallback(() => {
    setHomeGameCode(null);
    setIsAuthenticated(false);
    setTimeout(() => window.location.reload(), 100);
  }, [setHomeGameCode, setIsAuthenticated]);

  const value = { isAuthenticated, login, logout, homeGameCode, firebaseConfig, configLoaded };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
