
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
