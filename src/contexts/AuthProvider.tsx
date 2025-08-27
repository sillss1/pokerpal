
"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { FirebaseConfig } from '@/lib/types';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (config: FirebaseConfig, playerNames: string[]) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>('pokerpal-auth', false);
  const [, setFirebaseConfig] = useLocalStorage<FirebaseConfig | null>('firebaseConfig', null);
  const [, setPlayerNames] = useLocalStorage<string[] | null>('playerNames', null);

  const login = useCallback((config: FirebaseConfig, players: string[]) => {
    setFirebaseConfig(config);
    setPlayerNames(players);
    setIsAuthenticated(true);
  }, [setFirebaseConfig, setPlayerNames, setIsAuthenticated]);

  const logout = useCallback(() => {
    setFirebaseConfig(null);
    setPlayerNames(null);
    setIsAuthenticated(false);
    // Use a timeout to ensure local storage is cleared before reload
    setTimeout(() => window.location.reload(), 100);
  }, [setFirebaseConfig, setPlayerNames, setIsAuthenticated]);

  const value = { isAuthenticated, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
