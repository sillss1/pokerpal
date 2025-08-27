
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { initializeApp, getApps, deleteApp, FirebaseApp, getApp } from 'firebase/app';
import { getFirestore, onSnapshot, collection, doc, updateDoc, getDoc, Firestore, writeBatch, setDoc } from 'firebase/firestore';
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

// Helper function to get the initialized Firebase app
function getFirebaseApp(config: FirebaseConfig): FirebaseApp {
    if (getApps().length) {
        return getApp();
    }
    return initializeApp(config);
}


export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const [db, setDb] = useState<Firestore | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  
  const [firebaseConfig] = useState<FirebaseConfig | null>(getFirebaseConfig());
  const [storedHomeGameCode] = useLocalStorage<string | null>('homeGameCode', null);
  const [storedPlayerNames, setStoredPlayerNames] = useLocalStorage<string[] | null>('playerNames', null);

  useEffect(() => {
    if (!firebaseConfig) {
        setError("Firebase configuration is missing. Please set up environment variables.");
        setConnectionStatus('error');
        setLoading(false);
        return;
    }

    let unsubscribe: () => void = () => {};

    const initialize = async () => {
        setError(null);
        setConnectionStatus('connecting');
        setLoading(true);

        try {
            const app = getFirebaseApp(firebaseConfig);
            const firestore = getFirestore(app);
            setDb(firestore);

            const playerNamesDocRef = doc(firestore, 'config', 'playerNames');
            const playerNamesSnap = await getDoc(playerNamesDocRef);
            let currentPlayers: string[] = [];

            if (playerNamesSnap.exists()) {
                currentPlayers = playerNamesSnap.data().names || [];
            } else if (storedPlayerNames && storedHomeGameCode) {
                // If config exists in local storage but not in DB, this is the first run after creation.
                // Write the initial config to the DB.
                const batch = writeBatch(firestore);
                const accessDocRef = doc(firestore, 'config', 'access');
                
                batch.set(playerNamesDocRef, { names: storedPlayerNames });
                batch.set(accessDocRef, { code: storedHomeGameCode });
                
                await batch.commit();
                currentPlayers = storedPlayerNames;
            }
            
            setPlayerNames(currentPlayers);
            // Sync local storage with what's in DB (or what we just wrote)
            setStoredPlayerNames(currentPlayers);
            

            const sessionsCollection = collection(firestore, 'sessions');
            unsubscribe = onSnapshot(sessionsCollection, (snapshot) => {
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

    return () => unsubscribe();
  }, [firebaseConfig, storedPlayerNames, setStoredPlayerNames, storedHomeGameCode]);

  const updatePlayerNames = async (newPlayerNames: string[]) => {
    if(!db) {
        throw new Error("Not connected to Firebase.");
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
