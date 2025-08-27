
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { initializeApp, getApps, deleteApp, FirebaseApp } from 'firebase/app';
import { getFirestore, onSnapshot, collection, doc, updateDoc, getDoc, Firestore } from 'firebase/firestore';
import { FirebaseConfig, Session } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { getFirebaseConfig } from '@/lib/firebase-config';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface FirebaseContextType {
  db: Firestore | null;
  sessions: Session[];
  playerNames: string[];
  loading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  firebaseConfig: FirebaseConfig | null;
  updatePlayerNames: (newPlayerNames: string[]) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const [db, setDb] = useState<Firestore | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig | null>(null);
  const [storedPlayerNames, setStoredPlayerNames] = useLocalStorage<string[] | null>('playerNames', null);

  useEffect(() => {
    const config = getFirebaseConfig();
    if (config) {
      setFirebaseConfig(config);
    } else {
        setError("Firebase configuration is missing. Please set up environment variables.");
        setConnectionStatus('error');
        setLoading(false);
    }
  }, []);

  const initialize = useCallback(async (config: FirebaseConfig | null) => {
    if (!config) {
      setConnectionStatus('disconnected');
      setLoading(false);
      return;
    }

    setError(null);
    setConnectionStatus('connecting');
    setLoading(true);

    let app: FirebaseApp;
    try {
      if (getApps().length) {
        app = getApps()[0];
        await deleteApp(app);
      }
      app = initializeApp(config);
      const firestore = getFirestore(app);
      setDb(firestore);

      const playerNamesDocRef = doc(firestore, 'config', 'playerNames');
      const playerNamesSnap = await getDoc(playerNamesDocRef);
      let currentPlayers = storedPlayerNames || [];
      if (playerNamesSnap.exists()) {
        currentPlayers = playerNamesSnap.data().names;
        setPlayerNames(currentPlayers);
        setStoredPlayerNames(currentPlayers);
      } else if (storedPlayerNames) {
        // If config exists in local storage but not in DB, it's the first run for this DB.
        // Let's write it to the DB.
        const accessDocRef = doc(firestore, 'config', 'access');
        const accessDocSnap = await getDoc(accessDocRef);
        if(!accessDocSnap.exists()) { // Only do this if the game is truly new
             await updateDoc(playerNamesDocRef, { names: storedPlayerNames });
        }
      }
     

      const sessionsCollection = collection(firestore, 'sessions');
      const unsubscribe = onSnapshot(sessionsCollection, (snapshot) => {
        const sessionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Session)).sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
        setSessions(sessionsData);
        setConnectionStatus('connected');
        setLoading(false);
      }, (err) => {
        console.error("Firestore subscription error:", err);
        setError("Failed to connect to Firestore. Check console for details.");
        setConnectionStatus('error');
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (e: any) {
      console.error("Firebase initialization error:", e);
      let errorMessage = "Firebase initialization failed. Check your configuration.";
      if (e.code === 'invalid-api-key') {
        errorMessage = 'Invalid API Key. Please check your Firebase environment variables.';
      }
      setError(errorMessage);
      setConnectionStatus('error');
      setLoading(false);
      setDb(null);
    }
  }, [storedPlayerNames, setStoredPlayerNames]);

  useEffect(() => {
    if(firebaseConfig) {
        initialize(firebaseConfig);
    }
  }, [firebaseConfig, initialize]);

  const updatePlayerNames = async (newPlayerNames: string[]) => {
    if(!db) {
        setError("Not connected to Firebase.");
        return;
    }

    const playerNamesDocRef = doc(db, 'config', 'playerNames');
    await updateDoc(playerNamesDocRef, { names: newPlayerNames });

    setPlayerNames(newPlayerNames);
    setStoredPlayerNames(newPlayerNames);
  };

  const value = {
    db,
    sessions,
    playerNames,
    loading,
    error,
    connectionStatus,
    firebaseConfig,
    updatePlayerNames,
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
