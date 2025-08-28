"use client";

import React, { useEffect, useState } from "react";
import { useFirebase } from "@/contexts/FirebaseProvider";
import { Session } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { format } from "date-fns";
import { Button } from "../ui/button";

function SessionRow({ session }: { session: Session; }) {
    const [formattedDate, setFormattedDate] = useState("");

    useEffect(() => {
        if (session.date) {
            setFormattedDate(format(new Date(session.date), "dd MMM yyyy"));
        }
    }, [session.date]);

    return (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
                <Flame className="w-6 h-6 text-primary" />
                <div>
                    <p className="font-semibold">{session.location}</p>
                    <p className="text-sm text-muted-foreground">{formattedDate}</p>
                </div>
            </div>
            <p className="font-bold text-xl text-primary">{(session.totalPot || 0).toFixed(2)}€</p>
        </div>
    );
}

export function BiggestPotsWidget({ onSeeMore }: { onSeeMore: () => void }) {
    const { sessions, loading } = useFirebase();
    const [biggestSessions, setBiggestSessions] = useState<Session[]>([]);

    useEffect(() => {
        const sortedSessions = [...sessions]
            .filter(s => s.totalPot && s.totalPot > 0)
            .sort((a, b) => (b.totalPot || 0) - (a.totalPot || 0))
            .slice(0, 3);
        setBiggestSessions(sortedSessions);
    }, [sessions]);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            );
        }

        if (biggestSessions.length === 0) {
            return (
                <div className="text-center text-muted-foreground py-6">
                    Nenhuma sessão com pote registado.
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {biggestSessions.map((session) => (
                    <SessionRow key={session.id} session={session} />
                ))}
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2"><Flame />Maiores Potes</CardTitle>
                    <CardDescription>As sessões com maior volume.</CardDescription>
                </div>
                <Button variant="link" onClick={onSeeMore}>Ver sessões</Button>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
}
