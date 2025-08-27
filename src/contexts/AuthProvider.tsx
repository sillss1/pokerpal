
"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface AuthContextType {
  isAuthenticated: boolean;
  homeGameCode: string | null;
  login: (homeGameCode: string, playerNames: string[]) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>('pokerpal-auth', false);
  const [homeGameCode, setHomeGameCode] = useLocalStorage<string | null>('homeGameCode', null);
  const [, setPlayerNames] = useLocalStorage<string[] | null>('playerNames', null);

  const login = useCallback((code: string, players: string[]) => {
    setHomeGameCode(code);
    setPlayerNames(players);
    setIsAuthenticated(true);
  }, [setHomeGameCode, setPlayerNames, setIsAuthenticated]);

  const logout = useCallback(() => {
    setHomeGameCode(null);
    setPlayerNames(null);
    setIsAuthenticated(false);
    // Use a timeout to ensure local storage is cleared before reload
    setTimeout(() => window.location.reload(), 100);
  }, [setHomeGameCode, setPlayerNames, setIsAuthenticated]);

  const value = { isAuthenticated, login, logout, homeGameCode };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
