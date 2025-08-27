
"use client";

import React, { useState } from "react";
import { useFirebase } from "@/contexts/FirebaseProvider";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { HandCoins, ArrowRight, CheckCircle, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "../ui/button";

const addDebtSchema = z.object({
    fromPlayer: z.string().min(1, "You must select the player who owes money."),
    toPlayer: z.string().min(1, "You must select the player who is owed money."),
    amount: z.coerce.number().positive("Amount must be a positive number."),
    description: z.string().min(1, "Description is required"),
}).refine(data => data.fromPlayer !== data.toPlayer, {
    message: "A player cannot owe a debt to themselves.",
    path: ["toPlayer"],
});

type AddDebtFormValues = z.infer<typeof addDebtSchema>;

function AddDebtForm() {
    const { playerNames, addDebt } = useFirebase();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    const form = useForm<AddDebtFormValues>({
        resolver: zodResolver(addDebtSchema),
        defaultValues: {
            fromPlayer: "",
            toPlayer: "",
            amount: 0,
            description: "",
        },
    });

    async function onSubmit(values: AddDebtFormValues) {
        setIsLoading(true);
        try {
            await addDebt(values);
            toast({
                title: "Debt Recorded",
                description: `${values.fromPlayer} now owes ${values.toPlayer} ${values.amount.toFixed(2)}€.`,
            });
            form.reset();
        } catch (error) {
            console.error("Failed to add debt: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "There was a problem recording the debt.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><PlusCircle />Add New Debt</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="fromPlayer" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Who Owes?</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a player" /></SelectTrigger></FormControl>
                                        <SelectContent>{playerNames.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="toPlayer" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Who is Owed?</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a player" /></SelectTrigger></FormControl>
                                        <SelectContent>{playerNames.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                         <FormField control={form.control} name="amount" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount (€)</FormLabel>
                                <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl><Input placeholder="e.g., Poker night 25/12" {...field} /></FormControl>
                                <FormDescription>A brief note about this debt.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <Button type="submit" disabled={isLoading || playerNames.length < 2}>
                            {isLoading ? "Recording..." : "Record Debt"}
                        </Button>
                        {playerNames.length < 2 && <p className="text-sm text-muted-foreground mt-2">You need at least 2 players to record a debt.</p>}
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}


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
        <AddDebtForm />
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-medium mb-2">Active Debts</h3>
                <Card>
                    <ScrollArea className="h-[250px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Transaction</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-center">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && Array.from({length: 2}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                        <TableCell className="text-center"><Skeleton className="h-8 w-24 mx-auto" /></TableCell>
                                    </TableRow>
                                ))}
                                {!loading && activeDebts.map((debt: Debt) => (
                                    <TableRow key={debt.id}>
                                        <TableCell>{format(debt.date.toDate(), "dd MMM yyyy")}</TableCell>
                                        <TableCell className="flex items-center gap-2 font-medium">
                                            {debt.fromPlayer} <ArrowRight className="h-4 w-4 text-muted-foreground" /> {debt.toPlayer}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{debt.description}</TableCell>
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
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No active debts. Good job!</TableCell></TableRow>
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
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && Array.from({length: 1}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
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
                                        <TableCell>{debt.description}</TableCell>
                                        <TableCell className="text-right font-medium" style={{ color: 'hsl(var(--color-gain))'}}>{debt.amount.toFixed(2)}€</TableCell>
                                        <TableCell className="text-center">
                                            <span className="flex items-center justify-center text-gain gap-1 text-sm"><CheckCircle className="h-4 w-4" /> Paid</span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!loading && settledDebts.length === 0 && (
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center">No settled debts yet.</TableCell></TableRow>
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
