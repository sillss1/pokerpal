
import { type Timestamp } from "firebase/firestore";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface Session {
  id: string;
  date: string;
  location: string;
  addedBy: string;
  players: {
    [key:string]: number;
  };
  timestamp: Timestamp;
}

export interface PlayerStats {
    name: string;
    totalWinnings: number;
    sessionsWon: number;
    winRate: number;
    biggestWin: number;
    biggestLoss: number;
    totalSessions: number;
}
