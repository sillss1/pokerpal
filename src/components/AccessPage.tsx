
"use client";

import { useState } from "react";
import { useForm, useFieldArray, useFormContext, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { initializeApp, FirebaseApp, deleteApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, writeBatch } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PokerChipIcon } from "./icons/PokerChipIcon";
import { FirebaseConfig } from "@/lib/types";
import { Trash2, PlusCircle, Users, LogIn, TestTubeDiagonal } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Schemas
const firebaseConfigSchema = z.object({
  apiKey: z.string().min(1, "API Key is required"),
  authDomain: z.string().min(1, "Auth Domain is required"),
  projectId: z.string().min(1, "Project ID is required"),
  storageBucket: z.string().min(1, "Storage Bucket is required"),
  messagingSenderId: z.string().min(1, "Messaging Sender ID is required"),
  appId: z.string().min(1, "App ID is required"),
});

const joinGameSchema = firebaseConfigSchema.extend({
  homeGameCode: z.string().min(1, "Home Game Code is required"),
});

const createGameSchema = firebaseConfigSchema.extend({
  homeGameCode: z.string().min(1, "Home Game Code is required"),
  players: z.array(z.object({ name: z.string().min(1, "Player name is required") }))
    .min(1, "At least one player is required.")
    .max(10, "You can have a maximum of 10 players."),
});

type JoinGameFormValues = z.infer<typeof joinGameSchema>;
type CreateGameFormValues = z.infer<typeof createGameSchema>;


async function testFirebaseConnection(config: FirebaseConfig, toast: (options: any) => void): Promise<boolean> {
    let tempApp: FirebaseApp | undefined;
    try {
        tempApp = initializeApp(config, `validation-${Date.now()}`);
        getFirestore(tempApp); // Attempt to get Firestore instance
        toast({ title: "Success!", description: "Firebase connection successful." });
        return true;
    } catch (error: any) {
        toast({ variant: "destructive", title: "Connection Failed", description: "Firebase connection failed. Check your credentials." });
        return false;
    } finally {
        if (tempApp) await deleteApp(tempApp);
    }
}


// Firebase Fields Component
const FirebaseFields = () => {
    const { toast } = useToast();
    const [isTesting, setIsTesting] = useState(false);
    const form = useFormContext();

    const handleTestConnection = async () => {
        setIsTesting(true);
        const values = form.getValues();
        const config: FirebaseConfig = {
            apiKey: values.apiKey,
            authDomain: values.authDomain,
            projectId: values.projectId,
            storageBucket: values.storageBucket,
            messagingSenderId: values.messagingSenderId,
            appId: values.appId,
        };

        // Validate config before testing
        const result = firebaseConfigSchema.safeParse(config);
        if (!result.success) {
            toast({ variant: "destructive", title: "Missing Fields", description: "Please fill in all Firebase credential fields." });
            setIsTesting(false);
            return;
        }

        await testFirebaseConnection(result.data, toast);
        setIsTesting(false);
    };

    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger>Firebase Credentials</AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="projectId" render={({ field }) => (
                                <FormItem><FormLabel>Project ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="appId" render={({ field }) => (
                                <FormItem><FormLabel>App ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="apiKey" render={({ field }) => (
                                <FormItem><FormLabel>API Key</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="authDomain" render={({ field }) => (
                                <FormItem><FormLabel>Auth Domain</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="storageBucket" render={({ field }) => (
                                <FormItem><FormLabel>Storage Bucket</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="messagingSenderId" render={({ field }) => (
                                <FormItem><FormLabel>Messaging Sender ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <Button type="button" variant="outline" onClick={handleTestConnection} disabled={isTesting}>
                           <TestTubeDiagonal className="mr-2" />
                            {isTesting ? "Testing..." : "Test Connection"}
                        </Button>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
};

// Join Game Form Component
function JoinGameForm() {
    const { login } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<JoinGameFormValues>({
        resolver: zodResolver(joinGameSchema),
        defaultValues: {
            apiKey: "", authDomain: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: "", homeGameCode: ""
        }
    });

    async function onSubmit(values: JoinGameFormValues) {
        setIsLoading(true);
        const config: FirebaseConfig = values;
        let tempApp: FirebaseApp | undefined;
        try {
            tempApp = initializeApp(config, `validation-${Date.now()}`);
            const db = getFirestore(tempApp);
            
            const accessDocRef = doc(db, 'config', 'access');
            const accessDocSnap = await getDoc(accessDocRef);

            if (!accessDocSnap.exists() || accessDocSnap.data().code !== values.homeGameCode) {
                throw new Error("Invalid Home Game Code.");
            }
            
            const playerNamesDocRef = doc(db, 'config', 'playerNames');
            const playerNamesSnap = await getDoc(playerNamesDocRef);
            const dbPlayerNames = playerNamesSnap.exists() ? playerNamesSnap.data().names : [];

            login(config, dbPlayerNames);
            toast({ title: "Success!", description: "Successfully joined the Home Game." });

        } catch (error: any) {
            let errorMessage = "An error occurred.";
            if (error.message.includes("Invalid Home Game Code")) {
                errorMessage = "The Home Game code you entered is incorrect.";
            } else if (error.code) {
                errorMessage = "Firebase connection failed. Check your credentials.";
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
                <div>
                    <h3 className="text-base font-semibold mb-4">Home Game Details</h3>
                    <FormField control={form.control} name="homeGameCode" render={({ field }) => (
                        <FormItem><FormLabel>Home Game Code</FormLabel><FormControl><Input type="password" placeholder="Enter existing game code" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <FirebaseFields />
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Joining..." : "Join Game"}
                </Button>
            </form>
        </Form>
    );
}

// Create Game Form Component
function CreateGameForm() {
    const { login } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<CreateGameFormValues>({
        resolver: zodResolver(createGameSchema),
        defaultValues: {
            apiKey: "", authDomain: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: "", homeGameCode: "", players: [{ name: "" }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "players",
    });

    async function onSubmit(values: CreateGameFormValues) {
        setIsLoading(true);
        const config: FirebaseConfig = {
            apiKey: values.apiKey, authDomain: values.authDomain, projectId: values.projectId,
            storageBucket: values.storageBucket, messagingSenderId: values.messagingSenderId, appId: values.appId,
        };
        const playerNames = values.players.map(p => p.name);
        let tempApp: FirebaseApp | undefined;
        try {
            tempApp = initializeApp(config, `validation-${Date.now()}`);
            const db = getFirestore(tempApp);

            const accessDocRef = doc(db, 'config', 'access');
            const accessDocSnap = await getDoc(accessDocRef);

            if (accessDocSnap.exists()) {
                throw new Error("A Home Game already exists for these credentials.");
            }

            const batch = writeBatch(db);
            batch.set(accessDocRef, { code: values.homeGameCode });
            const playerNamesDocRef = doc(db, 'config', 'playerNames');
            batch.set(playerNamesDocRef, { names: playerNames });
            await batch.commit();

            login(config, playerNames);
            toast({ title: "Home Game Created!", description: "Successfully created and joined your new Home Game." });

        } catch (error: any) {
            let errorMessage = "An error occurred.";
            if (error.message.includes("already exists")) {
                errorMessage = "A game is already set up with these credentials. Use the 'Join Game' tab.";
            } else if (error.code) {
                errorMessage = "Firebase connection failed. Check your credentials.";
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
                <div>
                    <h3 className="text-base font-semibold mb-4">Home Game Details</h3>
                    <div className="space-y-4">
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
                    </div>
                </div>
                <FirebaseFields />
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Game"}
                </Button>
            </form>
        </Form>
    );
}

// Main Access Page Component
export function AccessPage() {
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
            </CardContent>
        </Card>
    );
}
