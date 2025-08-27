
"use client";

import React, { useState } from "react";
import { useFirebase } from "@/contexts/FirebaseProvider";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { HandCoins, ArrowRight, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export function DebtsTab() {
  const { playerNames, debts, loading, addDebt, settleDebt } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availablePlayers = playerNames || [];

  const addDebtSchema = z.object({
    fromPlayer: z.string().min(1, "Please select the debtor."),
    toPlayer: z.string().min(1, "Please select who is owed."),
    amount: z.coerce.number().positive("Amount must be a positive number."),
  }).refine(data => data.fromPlayer !== data.toPlayer, {
    message: "A player cannot owe money to themselves.",
    path: ["toPlayer"],
  });

  const form = useForm<z.infer<typeof addDebtSchema>>({
    resolver: zodResolver(addDebtSchema),
    defaultValues: {
      fromPlayer: "",
      toPlayer: "",
      amount: "" as any,
    },
  });

  async function onAddDebtSubmit(values: z.infer<typeof addDebtSchema>) {
    setIsSubmitting(true);
    try {
      await addDebt(values.fromPlayer, values.toPlayer, values.amount);
      toast({
        title: "Success",
        description: `Debt of ${values.amount}€ from ${values.fromPlayer} to ${values.toPlayer} has been recorded.`,
      });
      form.reset();
    } catch (error) {
      console.error("Error adding debt: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to record debt. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
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
                <CardTitle className="flex items-center gap-2"><HandCoins />Record a New Debt</CardTitle>
                <CardDescription>Register a payment owed between two players. This will not affect the leaderboard.</CardDescription>
            </CardHeader>
            <CardContent>
               {availablePlayers.length > 1 ? (
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onAddDebtSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="fromPlayer"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Who Owes?</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select a player" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {availablePlayers.map((name) => (
                                        <SelectItem key={`from-${name}`} value={name}>{name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="toPlayer"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>To Whom?</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select a player" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {availablePlayers.map((name) => (
                                        <SelectItem key={`to-${name}`} value={name}>{name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount (€)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="e.g., 50.00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Recording..." : "Record Debt"}
                        </Button>
                    </form>
                </Form>
               ) : (
                <p className="text-muted-foreground text-center">You need at least two players in the game to manage debts.</p>
               )}
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
                                    <TableHead>Date</TableHead>
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
                                        <TableCell>{format(debt.date.toDate(), "dd MMM yyyy")}</TableCell>
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
                                        <TableCell className="text-right font-medium text-gain">{debt.amount.toFixed(2)}€</TableCell>
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
