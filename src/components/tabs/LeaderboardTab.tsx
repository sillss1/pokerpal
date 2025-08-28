"use client";

import React, { useMemo, useEffect, useState } from "react";
import { useFirebase } from "@/contexts/FirebaseProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlayerStats, Session } from "@/lib/types";
import { Crown, TrendingUp, TrendingDown, Swords, Percent, Target, Trophy, Wallet } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { format } from "date-fns";

const getRankingColor = (rank: number) => {
  switch (rank) {
    case 0:
      return "border-primary bg-primary/10 hover:bg-primary/20";
    case 1:
      return "border-slate-400 bg-slate-400/10 hover:bg-slate-400/20";
    case 2:
      return "border-amber-600 bg-amber-600/10 hover:bg-amber-600/20";
    default:
      return "border-border bg-card hover:bg-muted/50";
  }
};

const StatCard = ({ icon: Icon, label, value, className }: { icon: React.ElementType, label: string, value: string | number, className?: string }) => (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium">{label}:</span>
        <span className="text-muted-foreground ml-auto">{value}</span>
    </div>
);

function BiggestSessionRow({ session, index }: { session: Session; index: number }) {
    const [formattedDate, setFormattedDate] = useState("");

    useEffect(() => {
        if (session.date) {
            setFormattedDate(format(new Date(session.date), "PPP"));
        }
    }, [session.date]);

    return (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
                <Trophy className={`w-6 h-6 ${index === 0 ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                    <p className="font-semibold">{session.location}</p>
                    <p className="text-sm text-muted-foreground">{formattedDate}</p>
                </div>
            </div>
            <p className="font-bold text-xl text-primary">{(session.totalPot || 0).toFixed(2)}€</p>
        </div>
    );
}

export function LeaderboardTab() {
  const { sessions, playerNames, loading } = useFirebase();
  const [biggestSessions, setBiggestSessions] = useState<Session[]>([]);

  useEffect(() => {
      const sortedSessions = [...sessions]
        .sort((a, b) => (b.totalPot || 0) - (a.totalPot || 0))
        .slice(0, 5);
      setBiggestSessions(sortedSessions);
  }, [sessions]);


  const playerStats = useMemo<PlayerStats[]>(() => {
    if (!sessions || !playerNames) return [];

    const stats: { [key: string]: PlayerStats } = playerNames.reduce((acc, name) => {
      acc[name] = {
        name,
        totalWinnings: 0,
        sessionsWon: 0,
        sessionsLost: 0,
        winRate: 0,
        biggestWin: 0,
        biggestLoss: 0,
        totalSessions: 0,
        totalBuyIns: 0,
        averageBuyIns: 0,
      };
      return acc;
    }, {} as { [key: string]: PlayerStats });

    sessions.forEach((session: Session) => {
      Object.entries(session.players).forEach(([playerName, data]) => {
        if (stats[playerName] && data) { // Check if data exists
          const result = data.result;
          stats[playerName].totalWinnings += result;
          stats[playerName].totalSessions += 1;
          stats[playerName].totalBuyIns += data.buyIns || 0;

          if (result > 0) {
            stats[playerName].sessionsWon += 1;
            if (result > stats[playerName].biggestWin) {
              stats[playerName].biggestWin = result;
            }
          } else if (result < 0) {
            stats[playerName].sessionsLost += 1;
            if (result < stats[playerName].biggestLoss) {
              stats[playerName].biggestLoss = result;
            }
          }
        }
      });
    });

    Object.values(stats).forEach(player => {
        if(player.totalSessions > 0) {
            player.winRate = Math.round((player.sessionsWon / player.totalSessions) * 100);
            player.averageBuyIns = parseFloat((player.totalBuyIns / player.totalSessions).toFixed(1));
        }
    });

    return Object.values(stats).sort((a, b) => b.totalWinnings - a.totalWinnings);
  }, [sessions, playerNames]);

  if (loading) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i}><CardHeader><Skeleton className="h-6 w-24" /></CardHeader><CardContent className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /></CardContent></Card>
                ))}
            </div>
            <Card>
                <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                <CardContent className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </CardContent>
            </Card>
        </div>
    )
  }
  
  if (playerStats.length === 0) {
    return (
        <div className="text-center text-muted-foreground py-8">
            No session data available to build the leaderboard.
        </div>
    )
  }

  return (
    <div className="space-y-8">
        <div>
            <h3 className="text-lg font-medium mb-4">Player Rankings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {playerStats.map((player, index) => (
                <Card key={player.name} className={`transition-all border-2 ${getRankingColor(index)}`}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      {index < 3 && <Crown className={`w-6 h-6 ${
                        index === 0 ? "text-primary" :
                        index === 1 ? "text-slate-400" :
                        "text-amber-600"
                      }`} />}
                      {player.name}
                    </CardTitle>
                    <div className={`text-2xl font-bold`} style={{ color: player.totalWinnings >= 0 ? 'hsl(var(--color-gain))' : 'hsl(var(--color-loss))' }}>
                        {player.totalWinnings.toFixed(2)}€
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2">
                    <StatCard icon={Swords} label="Sessions Played" value={player.totalSessions} />
                    <StatCard icon={Percent} label="Win Rate" value={`${player.winRate}%`} />
                    <StatCard icon={Wallet} label="Avg. Buy-ins / Session" value={player.averageBuyIns} />
                    <StatCard icon={Target} label="Sessions Won" value={player.sessionsWon} />
                    <StatCard icon={TrendingDown} label="Sessions Lost" value={player.sessionsLost} />
                    <StatCard icon={TrendingUp} label="Biggest Win" value={`${player.biggestWin.toFixed(2)}€`} className="text-gain" />
                    <StatCard icon={TrendingDown} label="Biggest Loss" value={`${player.biggestLoss.toFixed(2)}€`} className="text-loss" />
                  </CardContent>
                </Card>
              ))}
            </div>
        </div>
        <div>
            <h3 className="text-lg font-medium mb-4">Biggest Sessions by Volume</h3>
            <Card>
                <CardContent className="pt-6">
                    {biggestSessions.length > 0 ? (
                         <div className="space-y-4">
                            {biggestSessions.map((session, index) => (
                                <BiggestSessionRow key={session.id} session={session} index={index} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-4">No sessions recorded yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
