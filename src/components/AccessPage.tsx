
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { PokerChipIcon } from "./icons/PokerChipIcon";
import { FirebaseConfig } from "@/lib/types";

const firebaseConfigSchema = z.object({
  apiKey: z.string().min(1, "API Key is required"),
  authDomain: z.string().min(1, "Auth Domain is required"),
  projectId: z.string().min(1, "Project ID is required"),
  storageBucket: z.string().min(1, "Storage Bucket is required"),
  messagingSenderId: z.string().min(1, "Messaging Sender ID is required"),
  appId: z.string().min(1, "App ID is required"),
});

const playerNamesSchema = z.object({
    player1: z.string().min(1, "Player name is required"),
    player2: z.string().min(1, "Player name is required"),
    player3: z.string().min(1, "Player name is required"),
    player4: z.string().min(1, "Player name is required"),
    player5: z.string().min(1, "Player name is required"),
});

const formSchema = firebaseConfigSchema.merge(playerNamesSchema).extend({
  groupCode: z.string().min(1, "Group Code is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function AccessPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: "",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: "",
      player1: "",
      player2: "",
      player3: "",
      player4: "",
      player5: "",
      groupCode: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    const config: FirebaseConfig = {
      apiKey: values.apiKey,
      authDomain: values.authDomain,
      projectId: values.projectId,
      storageBucket: values.storageBucket,
      messagingSenderId: values.messagingSenderId,
      appId: values.appId,
    };
    const playerNames = [values.player1, values.player2, values.player3, values.player4, values.player5];

    let tempApp: FirebaseApp | undefined;
    try {
      const appName = `validation-${Date.now()}`;
      tempApp = initializeApp(config, appName);
      const db = getFirestore(tempApp);

      const accessDocRef = doc(db, 'config', 'access');
      const accessDocSnap = await getDoc(accessDocRef);

      if (accessDocSnap.exists()) {
        if (accessDocSnap.data().code !== values.groupCode) {
          throw new Error("Invalid Group Code.");
        }
        const playerNamesDocRef = doc(db, 'config', 'playerNames');
        const playerNamesSnap = await getDoc(playerNamesDocRef);
        const dbPlayerNames = playerNamesSnap.exists() ? playerNamesSnap.data().names : playerNames;
        login(config, dbPlayerNames);
      } else {
        const batch = writeBatch(db);
        batch.set(accessDocRef, { code: values.groupCode });
        const playerNamesDocRef = doc(db, 'config', 'playerNames');
        batch.set(playerNamesDocRef, { names: playerNames });
        await batch.commit();
        login(config, playerNames);
      }
      
      toast({
        title: "Success!",
        description: "Successfully connected to your poker group.",
      });

    } catch (error: any) {
      console.error(error);
      let errorMessage = "An error occurred during setup.";
      if (error.message.includes("Invalid Group Code")) {
        errorMessage = "The group code you entered is incorrect.";
      } else if (error.code) {
        errorMessage = "Firebase connection failed. Please check your credentials and Firestore rules.";
      }
      toast({
        variant: "destructive",
        title: "Setup Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
      if (tempApp) {
        await deleteApp(tempApp);
      }
    }
  }

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
      <CardContent className="space-y-6 p-6">
        <div>
            <h3 className="text-lg font-medium text-center">Group Access</h3>
            <p className="text-sm text-muted-foreground text-center mt-1">
                Enter your group's Firebase credentials and code to get started.
                If you're the first, your settings will create the group.
            </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h3 className="text-base font-semibold mb-4">Firebase Credentials</h3>
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
            </div>

            <div>
              <h3 className="text-base font-semibold mb-4">Player & Group Details</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                      <FormField key={i} control={form.control} name={`player${i + 1}` as keyof FormValues} render={({ field }) => (
                          <FormItem><FormLabel>Player {i+1}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                  ))}
                  <FormField control={form.control} name="groupCode" render={({ field }) => (
                      <FormItem><FormLabel>Group Code</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
              </div>
              <FormDescription className="mt-2">Player names are set once by the first user. Subsequent users must enter the correct group code to join.</FormDescription>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Connecting..." : "Connect & Enter"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
