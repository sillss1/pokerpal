
import { type Timestamp } from "firebase/firestore";

export interface Session {
  id: string;
  date: string;
  location: string;
  addedBy: string;
  players: {
    [key:string]: number;
  };
  timestamp: Timestamp;
  totalPot?: number;
  settled: boolean;
}

export interface PlayerStats {
    name: string;
    totalWinnings: number;
    sessionsWon: number;
    sessionsLost: number;
    winRate: number;
    biggestWin: number;
    biggestLoss: number;
    totalSessions: number;
}

export interface Debt {
  id: string;
  sessionId?: string;
  sessionDate?: string;
  description: string;
  fromPlayer: string;
  toPlayer: string;
  amount: number;
  settled: boolean;
  date: Timestamp;
  settledDate: Timestamp | null;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}
