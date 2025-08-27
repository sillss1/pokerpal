
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, onSnapshot, collection, doc, updateDoc, getDoc, Firestore, addDoc, Timestamp } from 'firebase/firestore';
import { FirebaseConfig, Session, Debt } from '@/lib/types';
import { getFirebaseConfig } from '@/lib/firebase-config';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface FirebaseContextType {
  db: Firestore | null;
  sessions: Session[];
  debts: Debt[];
  playerNames: string[];
  loading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  firebaseConfig: FirebaseConfig | null;
  updatePlayerNames: (newPlayerNames: string[]) => Promise<void>;
  addDebt: (from: string, to: string, amount: number) => Promise<void>;
  settleDebt: (debtId: string) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

function getFirebaseApp(config: FirebaseConfig): FirebaseApp {
    const existingApp = getApps().find(app => app.options.projectId === config.projectId);
    if (existingApp) {
        return existingApp;
    }
    return initializeApp(config, `firebase-app-${Date.now()}`);
}

export const FirebaseProvider = ({ children, homeGameCode }: { children: ReactNode, homeGameCode: string | null }) => {
  const [db, setDb] = useState<Firestore | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  
  const [firebaseConfig] = useState<FirebaseConfig | null>(getFirebaseConfig());

  useEffect(() => {
    if (!firebaseConfig || !homeGameCode) {
        setConnectionStatus(homeGameCode ? 'error' : 'disconnected');
        setError(homeGameCode ? "Firebase configuration is missing from environment variables." : null);
        setLoading(false);
        setDb(null);
        setSessions([]);
        setDebts([]);
        setPlayerNames([]);
        return;
    }

    let sessionsUnsubscribe: () => void = () => {};
    let debtsUnsubscribe: () => void = () => {};
    let configUnsubscribe: () => void = () => {};

    const initialize = async () => {
        setError(null);
        setConnectionStatus('connecting');
        setLoading(true);

        try {
            const app = getFirebaseApp(firebaseConfig);
            const firestore = getFirestore(app);
            setDb(firestore);

            const gameConfigDocRef = doc(firestore, 'homeGames', homeGameCode);
            
            configUnsubscribe = onSnapshot(gameConfigDocRef, (docSnap) => {
              if (docSnap.exists()) {
                  const currentPlayers: string[] = docSnap.data().playerNames || [];
                  setPlayerNames(currentPlayers);
                  setConnectionStatus('connected');
              } else {
                  setError("This Home Game does not exist. Please check the code or create a new game.");
                  setConnectionStatus('error');
                  setLoading(false);
              }
            }, (err) => {
               console.error("Firestore config subscription error:", err);
               setError("Failed to sync game settings. Check console for details.");
               setConnectionStatus('error');
            });


            const sessionsCollection = collection(firestore, 'homeGames', homeGameCode, 'sessions');
            sessionsUnsubscribe = onSnapshot(sessionsCollection, (snapshot) => {
                const sessionsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                } as Session)).sort((a, b) => {
                    if (!a.timestamp || !b.timestamp) return 0;
                    return b.timestamp.toMillis() - a.timestamp.toMillis()
                });
                setSessions(sessionsData);
                setLoading(false);
            }, (err) => {
                console.error("Firestore sessions subscription error:", err);
                setError("Failed to connect to sessions. Check console for details.");
                setConnectionStatus('error');
                setLoading(false);
            });

            const debtsCollection = collection(firestore, 'homeGames', homeGameCode, 'debts');
            debtsUnsubscribe = onSnapshot(debtsCollection, (snapshot) => {
                const debtsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                } as Debt)).sort((a, b) => b.date.toMillis() - a.date.toMillis());
                setDebts(debtsData);
            }, (err) => {
                console.error("Firestore debts subscription error:", err);
                setError("Failed to connect to debts. Check console for details.");
            });


        } catch (e: any) {
            console.error("Firebase initialization error:", e);
            let errorMessage = "Firebase initialization failed. Check your configuration.";
            if (e.code === 'invalid-api-key') {
                errorMessage = 'Invalid API Key. Please check your Firebase environment variables.';
            } else if(e.code) {
                errorMessage = `Firebase Error: ${e.code}. Check your configuration and rules.`;
            }
            setError(errorMessage);
            setConnectionStatus('error');
            setLoading(false);
            setDb(null);
        }
    };
    
    initialize();

    return () => {
        if(sessionsUnsubscribe) sessionsUnsubscribe();
        if(debtsUnsubscribe) debtsUnsubscribe();
        if(configUnsubscribe) configUnsubscribe();
    }
  }, [firebaseConfig, homeGameCode]);

  const updatePlayerNames = useCallback(async (newPlayerNames: string[]) => {
    if(!db || !homeGameCode) {
        throw new Error("Not connected to Firebase or no Home Game code specified.");
    }
    const gameConfigDocRef = doc(db, 'homeGames', homeGameCode);
    await updateDoc(gameConfigDocRef, { playerNames: newPlayerNames });
  },[db, homeGameCode]);

  const addDebt = useCallback(async (from: string, to: string, amount: number) => {
    if (!db || !homeGameCode) throw new Error("Database not connected.");
    const debtsCollection = collection(db, 'homeGames', homeGameCode, 'debts');
    await addDoc(debtsCollection, {
        fromPlayer: from,
        toPlayer: to,
        amount: amount,
        settled: false,
        date: Timestamp.now(),
        settledDate: null
    });
  }, [db, homeGameCode]);

  const settleDebt = useCallback(async (debtId: string) => {
    if (!db || !homeGameCode) throw new Error("Database not connected.");
    const debtDocRef = doc(db, 'homeGames', homeGameCode, 'debts', debtId);
    await updateDoc(debtDocRef, {
        settled: true,
        settledDate: Timestamp.now()
    });
  }, [db, homeGameCode]);


  const value = {
    db,
    sessions,
    debts,
    playerNames,
    loading,
    error,
    connectionStatus,
    firebaseConfig,
    updatePlayerNames,
    addDebt,
    settleDebt
  };

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
};

export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
