
"use client"

import { useState } from "react";
import { useFirebase } from "@/contexts/FirebaseProvider";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Session } from "@/lib/types";
import { HandCoins, CheckCircle } from "lucide-react";
import { format } from "date-fns";


export function SessionSettlementDialog({ session }: { session: Session }) {
    const { markSessionSettled } = useFirebase();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    async function handleConfirmSettlement() {
        setIsLoading(true);
        try {
            await markSessionSettled(session.id);
            toast({
                title: "Session Settled",
                description: `The session on ${format(new Date(session.date), "PPP")} has been marked as settled.`,
            });
            setOpen(false); // Close the dialog on success
        } catch (error) {
            console.error("Failed to settle session: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "There was a problem settling this session.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    if (session.settled) {
        return (
            <Button size="sm" variant="secondary" disabled>
                <CheckCircle className="mr-2" />
                Settled
            </Button>
        );
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                 <Button size="sm" variant="default">
                    <HandCoins className="mr-2" />
                    Settle Session
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Settle Session?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Mark the session on {format(new Date(session.date), "PPP")} as settled? This indicates that all debts have been handled. This action doesn't create any transactions.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmSettlement} disabled={isLoading}>
                         {isLoading ? "Settling..." : "Yes, Mark as Settled"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

