
"use client";

import { useFirebase } from "@/contexts/FirebaseProvider";
import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, UserPlus, Trash2, Users, AlertCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

const addPlayerSchema = z.object({
  newPlayerName: z.string().min(1, "Player name cannot be empty."),
});

type AddPlayerFormValues = z.infer<typeof addPlayerSchema>;

export function SetupTab() {
  const { playerNames, connectionStatus, error, updatePlayerNames } = useFirebase();
  const { homeGameCode, firebaseConfig } = useAuth();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<AddPlayerFormValues>({
    resolver: zodResolver(addPlayerSchema),
    defaultValues: {
      newPlayerName: "",
    },
  });

  const getStatusBadge = () => {
    switch(connectionStatus) {
        case 'connected':
            return <Badge variant="default" className="bg-green-500">Connected</Badge>;
        case 'disconnected':
            return <Badge variant="secondary">Disconnected</Badge>;
        case 'connecting':
            return <Badge variant="outline">Connecting...</Badge>;
        case 'error':
            return <Badge variant="destructive">Error</Badge>;
    }
  }

  const handleAddPlayer = async (values: AddPlayerFormValues) => {
    if (playerNames.includes(values.newPlayerName)) {
        form.setError("newPlayerName", { type: "manual", message: "This player already exists."});
        return;
    }
    if (playerNames.length >= 10) {
        toast({
            variant: "destructive",
            title: "Player Limit Reached",
            description: "You cannot add more than 10 players.",
        });
        return;
    }
    setIsUpdating(true);
    try {
        const newPlayerList = [...playerNames, values.newPlayerName];
        await updatePlayerNames(newPlayerList);
        toast({ title: "Player Added", description: `${values.newPlayerName} has been added to the game.` });
        form.reset();
    } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Failed to add player." });
    } finally {
        setIsUpdating(false);
    }
  }

  const handleRemovePlayer = async (playerName: string) => {
    if (playerNames.length <= 1) {
        toast({
            variant: "destructive",
            title: "Cannot Remove Player",
            description: "You must have at least one player in the game.",
        });
        return;
    }
    setIsUpdating(true);
    try {
        const newPlayerList = playerNames.filter(name => name !== playerName);
        await updatePlayerNames(newPlayerList);
        toast({ title: "Player Removed", description: `${playerName} has been removed from the game.` });
    } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Failed to remove player." });
    } finally {
        setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-8">
       <Card>
        <CardHeader>
          <CardTitle>Connection Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-sm">Connection Status</h4>
                {getStatusBadge()}
            </div>
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Connection Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
             <div>
                <h4 className="font-semibold text-sm">Home Game Code</h4>
                <p className="text-muted-foreground text-sm">{homeGameCode || "N/A"}</p>
            </div>
            <div>
                <h4 className="font-semibold text-sm">Firebase Project ID</h4>
                <p className="text-muted-foreground text-sm">{firebaseConfig?.projectId || "N/A"}</p>
            </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users />Player Management</CardTitle>
            <CardDescription>Add or remove players from the current Home Game. You can have a maximum of 10 players.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddPlayer)} className="flex items-start gap-2">
                     <FormField
                        control={form.control}
                        name="newPlayerName"
                        render={({ field }) => (
                            <FormItem className="flex-grow">
                                <FormLabel className="sr-only">New Player Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter new player name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    <Button type="submit" disabled={isUpdating}>
                        <UserPlus className="mr-2 h-4 w-4"/> Add Player
                    </Button>
                </form>
            </Form>
             <div>
                <h4 className="font-semibold text-sm mb-2">Current Players ({playerNames.length}/10)</h4>
                <div className="flex flex-wrap gap-2">
                    {playerNames.map(name => (
                        <Badge key={name} variant="secondary" className="pl-3 pr-1 py-1 text-sm flex items-center gap-2">
                            {name}
                            <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full" onClick={() => handleRemovePlayer(name)} disabled={isUpdating}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </Badge>
                    ))}
                    {playerNames.length === 0 && <p className="text-sm text-muted-foreground">No players configured.</p>}
                </div>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>If you need to connect to a different group, you can reset the current configuration.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button variant="destructive" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" /> Reset and Log Out
            </Button>
        </CardContent>
      </Card>

    </div>
  );
}
