"use client";

import React, { useMemo } from 'react';
import { useFirebase } from '@/contexts/FirebaseProvider';
import { PlayerStats } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';

const getMedalColor = (rank: number) => {
    if (rank === 0) return "text-primary";
    if (rank === 1) return "text-slate-400";
    if (rank === 2) return "text-amber-600";
    return "text-muted-foreground";
}

const PlayerRow = ({ player, rank }: { player: PlayerStats, rank: number }) => (
    <div className="flex items-center gap-4 py-2">
        <div className="flex items-center gap-2 w-1/3">
            <span className={`font-bold w-5 text-center ${getMedalColor(rank)}`}>{rank + 1}</span>
            <Crown className={`w-5 h-5 ${getMedalColor(rank)}`} />
            <p className="font-semibold truncate">{player.name}</p>
        </div>
        <div className="flex-1 flex justify-end items-baseline gap-1">
            <p className={`font-bold text-lg ${player.totalWinnings >= 0 ? 'text-gain' : 'text-loss'}`}>
                {player.totalWinnings.toFixed(2)}€
            </p>
        </div>
        <div className="hidden sm:flex items-center gap-1 w-20 justify-end" title="Sessões Ganhas / Perdidas">
            <TrendingUp className="w-4 h-4 text-gain" />
            <span className="text-sm text-gain">{player.sessionsWon}</span>
            <span className="text-sm text-muted-foreground">/</span>
            <TrendingDown className="w-4 h-4 text-loss" />
            <span className="text-sm text-loss">{player.sessionsLost}</span>
        </div>
    </div>
);

export function LeaderboardWidget({ onSeeMore }: { onSeeMore: () => void }) {
    const { sessions, playerNames, loading } = useFirebase();

    const topPlayers = useMemo<PlayerStats[]>(() => {
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

        sessions.forEach((session) => {
            playerNames.forEach((playerName) => {
                const data = session.players[playerName];
                if (stats[playerName] && data && data.buyIns > 0) {
                    const result = data.result;
                    stats[playerName].totalWinnings += result;
                    if (result > 0) {
                        stats[playerName].sessionsWon += 1;
                    } else if (result < 0) {
                        stats[playerName].sessionsLost += 1;
                    }
                }
            });
        });

        return Object.values(stats)
            .sort((a, b) => b.totalWinnings - a.totalWinnings)
            .slice(0, 3);

    }, [sessions, playerNames]);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-5 w-20 ml-auto" />
                        </div>
                    ))}
                </div>
            )
        }

        if (topPlayers.length === 0) {
            return (
                <div className="text-center text-muted-foreground py-6">
                    No data to show the podium. Add a session!
                </div>
            );
        }

        return (
            <div className="space-y-1">
                {topPlayers.map((player, index) => (
                    <PlayerRow key={player.name} player={player} rank={index} />
                ))}
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2"><Trophy /> Podium</CardTitle>
                    <CardDescription>The top 3 players.</CardDescription>
                </div>
                <Button variant="link" onClick={onSeeMore}>See All</Button>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
}
