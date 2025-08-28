"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, onSnapshot, collection, doc, updateDoc, Firestore, addDoc, Timestamp, writeBatch, deleteDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { FirebaseConfig, Session, Debt } from '@/lib/types';
import { getFirebaseConfig } from '@/lib/firebase-config';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface FirebaseContextType {
  db: Firestore | null;
  sessions: Session[];
  debts: Debt[];
  playerNames: string[];
  locations: string[];
  loading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  firebaseConfig: FirebaseConfig | null;
  updatePlayerNames: (newPlayerNames: string[]) => Promise<void>;
  updateLocations: (newLocations: string[]) => Promise<void>;
  addDebt: (debt: Omit<Debt, 'id' | 'date' | 'settled' | 'settledDate'>) => Promise<void>;
  settleDebt: (debtId: string) => Promise<void>;
  addSession: (session: Omit<Session, 'id' | 'timestamp'>) => Promise<void>;
  updateSession: (sessionId: string, session: Omit<Session, 'id' | 'timestamp'>) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
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
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  
  const [firebaseConfig] = useState<FirebaseConfig | null>(getFirebaseConfig());

  useEffect(() => {
    if (!firebaseConfig || !homeGameCode) {
        setConnectionStatus(homeGameCode ? 'error' : 'disconnected');
        setError(homeGameCode ? "Firebase configuration is missing." : null);
        setLoading(false);
        setDb(null);
        setSessions([]);
        setDebts([]);
        setPlayerNames([]);
        setLocations([]);
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
                  const data = docSnap.data();
                  const currentPlayers: string[] = data.playerNames || [];
                  const currentLocations: string[] = data.locations || [];
                  setPlayerNames(currentPlayers);
                  setLocations(currentLocations);
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
            const sessionsQuery = query(sessionsCollection, orderBy("timestamp", "desc"));
            sessionsUnsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
                const sessionsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                } as Session));
                setSessions(sessionsData);
                setLoading(false);
            }, (err) => {
                console.error("Firestore sessions subscription error:", err);
                setError("Failed to connect to sessions. Check console for details.");
                setConnectionStatus('error');
                setLoading(false);
            });

            const debtsCollection = collection(firestore, 'homeGames', homeGameCode, 'debts');
            const debtsQuery = query(debtsCollection, orderBy("date", "desc"));
            debtsUnsubscribe = onSnapshot(debtsQuery, (snapshot) => {
                const debtsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                } as Debt)).sort((a, b) => {
                    if (a.settled && !b.settled) return 1;
                    if (!a.settled && b.settled) return -1;
                    return 0; // The primary sort is already done by Firestore
                });
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

  const updateLocations = useCallback(async (newLocations: string[]) => {
    if(!db || !homeGameCode) {
        throw new Error("Not connected to Firebase or no Home Game code specified.");
    }
    const gameConfigDocRef = doc(db, 'homeGames', homeGameCode);
    await updateDoc(gameConfigDocRef, { locations: newLocations });
  },[db, homeGameCode]);

  const addDebt = useCallback(async (debt: Omit<Debt, 'id' | 'date' | 'settled' | 'settledDate'>) => {
    if (!db || !homeGameCode) throw new Error("Database not connected.");
    const debtsCollection = collection(db, 'homeGames', homeGameCode, 'debts');
    
    const debtPayload: any = {
      fromPlayer: debt.fromPlayer,
      toPlayer: debt.toPlayer,
      amount: debt.amount,
      description: debt.description,
      settled: false,
      date: Timestamp.now(),
      settledDate: null
    };

    if (debt.sessionId && debt.sessionDate) {
      debtPayload.sessionId = debt.sessionId;
      debtPayload.sessionDate = Timestamp.fromDate(new Date(debt.sessionDate));
    }

    await addDoc(debtsCollection, debtPayload);
  }, [db, homeGameCode]);

  const settleDebt = useCallback(async (debtId: string) => {
    if (!db || !homeGameCode) throw new Error("Database not connected.");
    const debtDocRef = doc(db, 'homeGames', homeGameCode, 'debts', debtId);
    await updateDoc(debtDocRef, {
        settled: true,
        settledDate: Timestamp.now()
    });
  }, [db, homeGameCode]);

  const addSession = useCallback(async (session: Omit<Session, 'id' | 'timestamp'>) => {
    if (!db || !homeGameCode) throw new Error("Database not connected.");
    await addDoc(collection(db, 'homeGames', homeGameCode, "sessions"), {
      ...session,
      timestamp: Timestamp.now(),
    });
  }, [db, homeGameCode]);

  const updateSession = useCallback(async (sessionId: string, session: Omit<Session, 'id' | 'timestamp'>) => {
    if (!db || !homeGameCode) throw new Error("Database not connected.");
    const sessionDocRef = doc(db, 'homeGames', homeGameCode, "sessions", sessionId);
    await updateDoc(sessionDocRef, {
        ...session,
        timestamp: Timestamp.now(), // Update timestamp on edit
    });
  }, [db, homeGameCode]);

  const deleteSession = useCallback(async (sessionId: string) => {
    if(!db || !homeGameCode) throw new Error("Database not connected.");
    
    const batch = writeBatch(db);
    
    // Delete the session document
    const sessionDocRef = doc(db, 'homeGames', homeGameCode, "sessions", sessionId);
    batch.delete(sessionDocRef);

    // Find and delete all debts associated with this session
    const debtsQuery = query(collection(db, 'homeGames', homeGameCode, "debts"), where("sessionId", "==", sessionId));
    const debtsSnapshot = await getDocs(debtsQuery);
    debtsSnapshot.forEach(debtDoc => {
        batch.delete(debtDoc.ref);
    });

    await batch.commit();

  }, [db, homeGameCode]);
  

  const value = {
    db,
    sessions,
    debts,
    playerNames,
    locations,
    loading,
    error,
    connectionStatus,
    firebaseConfig,
    updatePlayerNames,
    updateLocations,
    addDebt,
    settleDebt,
    addSession,
    updateSession,
    deleteSession,
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
