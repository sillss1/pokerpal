
"use client"

import { useState } from "react";
import { useFirebase } from "@/contexts/FirebaseProvider";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Session } from "@/lib/types";
import { HandCoins, ArrowRight, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface SettlementTransaction {
    fromPlayer: string;
    toPlayer: string;
    amount: number;
}

// This is a simplified debt settlement algorithm.
// It takes all losers and makes them pay all winners proportionally.
function calculateSettlements(players: {[key: string]: number}): SettlementTransaction[] {
    const winners = Object.entries(players).filter(([, amount]) => amount > 0).sort((a,b) => b[1] - a[1]);
    const losers = Object.entries(players).filter(([, amount]) => amount < 0).sort((a,b) => a[1] - b[1]);

    const transactions: SettlementTransaction[] = [];
    let winnerIndex = 0;
    let loserIndex = 0;

    const winnerAmounts = winners.map(w => w[1]);
    const loserAmounts = losers.map(l => Math.abs(l[1]));

    while(winnerIndex < winners.length && loserIndex < losers.length) {
        const winner = winners[winnerIndex][0];
        const loser = losers[loserIndex][0];

        const amountToSettle = Math.min(winnerAmounts[winnerIndex], loserAmounts[loserIndex]);

        if (amountToSettle > 0.005) { // Threshold to avoid tiny floating point debts
             transactions.push({
                fromPlayer: loser,
                toPlayer: winner,
                amount: amountToSettle,
            });
        }
       
        winnerAmounts[winnerIndex] -= amountToSettle;
        loserAmounts[loserIndex] -= amountToSettle;

        if (winnerAmounts[winnerIndex] < 0.005) winnerIndex++;
        if (loserAmounts[loserIndex] < 0.005) loserIndex++;
    }

    return transactions;
}

export function SessionSettlementDialog({ session }: { session: Session }) {
    const { addDebt, markSessionSettled } = useFirebase();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const settlementTransactions = calculateSettlements(session.players);

    async function handleConfirmSettlement() {
        setIsLoading(true);
        try {
            // Use a batch write in a real app for atomicity
            for (const trans of settlementTransactions) {
                await addDebt({
                    sessionId: session.id,
                    sessionDate: session.date,
                    fromPlayer: trans.fromPlayer,
                    toPlayer: trans.toPlayer,
                    amount: trans.amount,
                });
            }
            await markSessionSettled(session.id);
            
            toast({
                title: "Session Settled",
                description: `Debts for the session on ${format(new Date(session.date), "PPP")} have been recorded.`,
            });
            setOpen(false); // Close the dialog on success
        } catch (error) {
            console.error("Failed to settle debts: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "There was a problem recording the debts for this session.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                 <Button size="sm" variant={session.settled ? "secondary" : "default"} disabled={session.settled}>
                    {session.settled ? <CheckCircle className="mr-2" /> : <HandCoins className="mr-2" />}
                    {session.settled ? 'Settled' : 'Settle Session'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Settle Session Debts</DialogTitle>
                    <DialogDescription>
                        Confirm the debt transactions for the session on {format(new Date(session.date), "PPP")}. This will create these records in the Debts tab.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <h4 className="font-semibold">Suggested Transactions:</h4>
                    {settlementTransactions.length > 0 ? (
                        <div className="space-y-2">
                            {settlementTransactions.map((trans, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                    <div className="flex items-center gap-2 font-medium">
                                        <span>{trans.fromPlayer}</span>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        <span>{trans.toPlayer}</span>
                                    </div>
                                    <div className="font-bold text-destructive">
                                        {trans.amount.toFixed(2)}€
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">All players broke even. No debts to settle.</p>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                    <Button type="button" onClick={handleConfirmSettlement} disabled={isLoading || settlementTransactions.length === 0}>
                        {isLoading ? "Recording..." : "Confirm and Record Debts"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
