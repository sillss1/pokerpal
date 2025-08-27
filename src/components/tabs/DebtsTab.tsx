
"use client";

import React from "react";
import { useFirebase } from "@/contexts/FirebaseProvider";
import { useToast } from "@/hooks/use-toast";
import { Debt } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { HandCoins, ArrowRight, CheckCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { Button } from "../ui/button";

export function DebtsTab() {
  const { debts, loading, settleDebt } = useFirebase();
  const { toast } = useToast();
  
  async function handleSettleDebt(debtId: string) {
    try {
        await settleDebt(debtId);
        toast({
            title: "Debt Settled",
            description: "The debt has been marked as paid.",
        });
    } catch (error) {
        console.error("Error settling debt: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to settle debt. Please try again.",
        });
    }
  }

  const activeDebts = debts.filter(d => !d.settled);
  const settledDebts = debts.filter(d => d.settled);

  return (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><HandCoins />Debt Overview</CardTitle>
                <CardDescription>
                    This tab shows all outstanding and settled debts from past poker sessions.
                    Debts are created from the "Sessions" tab after a game is finished.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center p-4 bg-accent/50 rounded-lg">
                    <Info className="w-5 h-5 mr-3 text-accent-foreground" />
                    <p className="text-sm text-accent-foreground">
                        To record new debts, go to the <strong>Sessions</strong> tab and use the <strong>Settle Session</strong> button on a past game.
                    </p>
                </div>
            </CardContent>
        </Card>

        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-medium mb-2">Active Debts</h3>
                <Card>
                    <ScrollArea className="h-[250px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Session Date</TableHead>
                                    <TableHead>Transaction</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-center">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && Array.from({length: 2}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                        <TableCell className="text-center"><Skeleton className="h-8 w-24 mx-auto" /></TableCell>
                                    </TableRow>
                                ))}
                                {!loading && activeDebts.map((debt: Debt) => (
                                    <TableRow key={debt.id}>
                                        <TableCell>{format(new Date(debt.sessionDate), "dd MMM yyyy")}</TableCell>
                                        <TableCell className="flex items-center gap-2 font-medium">
                                            {debt.fromPlayer} <ArrowRight className="h-4 w-4 text-muted-foreground" /> {debt.toPlayer}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-destructive">{debt.amount.toFixed(2)}€</TableCell>
                                        <TableCell className="text-center">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="sm" variant="outline">Settle</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Settle Debt?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to mark this debt as settled? This indicates that {debt.fromPlayer} has paid {debt.amount.toFixed(2)}€ to {debt.toPlayer}. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleSettleDebt(debt.id)} className="bg-primary hover:bg-primary/90">Confirm Payment</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!loading && activeDebts.length === 0 && (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No active debts. Good job!</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </Card>
            </div>
            <div>
                <h3 className="text-lg font-medium mb-2">Settled Debts History</h3>
                <Card>
                    <ScrollArea className="h-[250px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Settled On</TableHead>
                                    <TableHead>Transaction</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && Array.from({length: 1}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                        <TableCell className="text-center"><Skeleton className="h-4 w-20 mx-auto" /></TableCell>
                                    </TableRow>
                                ))}
                                {!loading && settledDebts.map((debt: Debt) => (
                                    <TableRow key={debt.id} className="text-muted-foreground">
                                        <TableCell>{debt.settledDate ? format(debt.settledDate.toDate(), "dd MMM yyyy") : 'N/A'}</TableCell>
                                        <TableCell className="flex items-center gap-2">
                                            {debt.fromPlayer} <ArrowRight className="h-4 w-4" /> {debt.toPlayer}
                                        </TableCell>
                                        <TableCell className="text-right font-medium" style={{ color: 'hsl(var(--color-gain))'}}>{debt.amount.toFixed(2)}€</TableCell>
                                        <TableCell className="text-center">
                                            <span className="flex items-center justify-center text-gain gap-1 text-sm"><CheckCircle className="h-4 w-4" /> Paid</span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!loading && settledDebts.length === 0 && (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">No settled debts yet.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </Card>
            </div>
        </div>
    </div>
  );
}
