
"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { initializeApp, FirebaseApp, deleteApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PokerChipIcon } from "./icons/PokerChipIcon";
import { Trash2, PlusCircle, LogIn, Server } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Schemas
const joinGameSchema = z.object({
  homeGameCode: z.string().min(1, "Home Game Code is required"),
});

const createGameSchema = z.object({
  homeGameCode: z.string().min(1, "Home Game Code is required"),
  players: z.array(z.object({ name: z.string().min(1, "Player name is required") }))
    .min(1, "At least one player is required.")
    .max(10, "You can have a maximum of 10 players."),
});

type JoinGameFormValues = z.infer<typeof joinGameSchema>;
type CreateGameFormValues = z.infer<typeof createGameSchema>;


// Join Game Form Component
function JoinGameForm() {
    const { login, firebaseConfig } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<JoinGameFormValues>({
        resolver: zodResolver(joinGameSchema),
        defaultValues: {
            homeGameCode: ""
        }
    });

    async function onSubmit(values: JoinGameFormValues) {
        setIsLoading(true);
        if (!firebaseConfig) {
            toast({ variant: "destructive", title: "Configuration Error", description: "Firebase configuration is not available." });
            setIsLoading(false);
            return;
        }

        let tempApp: FirebaseApp | undefined;
        try {
            tempApp = initializeApp(firebaseConfig, `validation-join-${Date.now()}`);
            const db = getFirestore(tempApp);
            
            const gameDocRef = doc(db, 'homeGames', values.homeGameCode);
            const gameDocSnap = await getDoc(gameDocRef);

            if (!gameDocSnap.exists()) {
                throw new Error("Invalid Home Game Code.");
            }
            
            login(values.homeGameCode);
            toast({ title: "Success!", description: "Successfully joined the Home Game." });

        } catch (error: any) {
            let errorMessage = "An error occurred.";
            if (error.message.includes("Invalid Home Game Code")) {
                errorMessage = "The Home Game code you entered is incorrect.";
            } else if (error.code) {
                 errorMessage = `Firebase connection failed. Check your environment variables and Firestore rules. Error: ${error.code}`;
            }
            toast({ variant: "destructive", title: "Join Failed", description: errorMessage });
        } finally {
            setIsLoading(false);
            if (tempApp) await deleteApp(tempApp);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="homeGameCode" render={({ field }) => (
                    <FormItem><FormLabel>Home Game Code</FormLabel><FormControl><Input type="password" placeholder="Enter existing game code" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={isLoading || !firebaseConfig}>
                    {isLoading ? "Joining..." : "Join Game"}
                </Button>
            </form>
        </Form>
    );
}

// Create Game Form Component
function CreateGameForm() {
    const { login, firebaseConfig } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<CreateGameFormValues>({
        resolver: zodResolver(createGameSchema),
        defaultValues: {
            homeGameCode: "", players: [{ name: "" }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "players",
    });

    async function onSubmit(values: CreateGameFormValues) {
        setIsLoading(true);
        if (!firebaseConfig) {
            toast({ variant: "destructive", title: "Configuration Error", description: "Firebase configuration is not available." });
            setIsLoading(false);
            return;
        }
        
        const playerNames = values.players.map(p => p.name);
        let tempApp: FirebaseApp | undefined;
        try {
            tempApp = initializeApp(firebaseConfig, `validation-create-${Date.now()}`);
            const db = getFirestore(tempApp);

            const gameDocRef = doc(db, 'homeGames', values.homeGameCode);
            const gameDocSnap = await getDoc(gameDocRef);

            if (gameDocSnap.exists()) {
                throw new Error("A Home Game with this code already exists. Please choose a different code.");
            }

            // Create the new home game document
            await setDoc(gameDocRef, {
                playerNames: playerNames
            });

            login(values.homeGameCode);
            toast({ title: "Home Game Created!", description: "Successfully created and joined your new Home Game." });

        } catch (error: any) {
            let errorMessage = "An error occurred.";
            if (error.message.includes("already exists")) {
                errorMessage = error.message;
            } else if (error.code) {
                errorMessage = `Firebase connection failed. Check your environment variables and Firestore rules. Error: ${error.code}`;
            }
            toast({ variant: "destructive", title: "Creation Failed", description: errorMessage });
        } finally {
            setIsLoading(false);
            if (tempApp) await deleteApp(tempApp);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                 <FormField control={form.control} name="homeGameCode" render={({ field }) => (
                    <FormItem><FormLabel>Home Game Code</FormLabel><FormControl><Input type="password" placeholder="Choose a new code" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div>
                    <FormLabel>Players</FormLabel>
                    <FormDescription className="mb-2">Define the initial players for your game.</FormDescription>
                    <div className="space-y-2">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-2">
                                <FormField control={form.control} name={`players.${index}.name`} render={({ field }) => (
                                    <FormItem className="flex-grow">
                                        <FormControl><Input placeholder={`Player ${index + 1} Name`} {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ name: "" })} disabled={fields.length >= 10}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Player
                    </Button>
                        <FormMessage>{form.formState.errors.players?.message}</FormMessage>
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading || !firebaseConfig}>
                    {isLoading ? "Creating..." : "Create Game"}
                </Button>
            </form>
        </Form>
    );
}

// Main Access Page Component
export function AccessPage() {
    const { firebaseConfig } = useAuth();

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader className="text-center p-6">
                <div className="flex justify-center items-center gap-4 mb-2">
                    <PokerChipIcon className="w-12 h-12 text-primary" />
                    <div>
                        <CardTitle className="text-3xl md:text-4xl font-bold tracking-tight text-primary">PokerPal</CardTitle>
                    </div>
                </div>
                <CardDescription>Your friendly poker session tracker</CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
                {!firebaseConfig ? (
                    <Alert variant="destructive" className="m-6">
                         <Server className="h-4 w-4" />
                        <AlertTitle>Server Configuration Missing</AlertTitle>
                        <AlertDescription>
                            The application is not configured correctly. Please set up the Firebase
                            environment variables on the server to continue.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Tabs defaultValue="join" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="join"><LogIn className="mr-2"/>Join Game</TabsTrigger>
                            <TabsTrigger value="create"><PlusCircle className="mr-2"/>Create Game</TabsTrigger>
                        </TabsList>
                        <TabsContent value="join" className="p-6">
                           <JoinGameForm />
                        </TabsContent>
                        <TabsContent value="create" className="p-6">
                           <CreateGameForm />
                        </TabsContent>
                    </Tabs>
                )}
            </CardContent>
        </Card>
    );
}
