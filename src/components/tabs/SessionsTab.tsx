
"use client";

import React, { useState } from "react";
import { useFirebase } from "@/contexts/FirebaseProvider";
import {
  collection,
  addDoc,
  Timestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle, Trash2, User, MapPin, Users, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@/lib/types";
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
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

const addPlayerSchema = z.object({
  newPlayerName: z.string().min(1, "Player name cannot be empty."),
});
type AddPlayerFormValues = z.infer<typeof addPlayerSchema>;

function PlayerManagement() {
    const { playerNames, updatePlayerNames } = useFirebase();
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);

    const form = useForm<AddPlayerFormValues>({
        resolver: zodResolver(addPlayerSchema),
        defaultValues: { newPlayerName: "" },
    });

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
    )
}

export function SessionsTab() {
  const { db, playerNames, sessions, loading } = useFirebase();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [homeGameCode] = useLocalStorage<string | null>('homeGameCode', null);

  const formSchema = z.object({
      date: z.date(),
      location: z.string().min(1, "Location is required"),
      addedBy: z.string().min(1, "Please select who is adding this session"),
      ...playerNames.reduce((acc, name) => {
        acc[name] = z.coerce.number().default(0);
        return acc;
      }, {} as Record<string, z.ZodType<any, any>>),
    }).refine(data => {
        const total = playerNames.reduce((sum, name) => sum + (data[name] || 0), 0);
        return Math.abs(total) < 0.01; // Allow for floating point inaccuracies
    }, {
        message: "The sum of all player results must be 0.",
        path: [playerNames.length > 0 ? playerNames[0] : ''] // Show error on the first player field
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      location: "",
      addedBy: "",
      ...playerNames.reduce((acc, name) => ({ ...acc, [name]: "" }), {}),
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!db || !homeGameCode) return;
    setIsAdding(true);
    const playersResult = playerNames.reduce((acc, name) => {
        acc[name] = values[name] as number;
        return acc;
    }, {} as Record<string, number>);

    try {
      await addDoc(collection(db, 'homeGames', homeGameCode, "sessions"), {
        date: format(values.date, "yyyy-MM-dd"),
        location: values.location,
        addedBy: values.addedBy,
        players: playersResult,
        timestamp: Timestamp.now(),
      });
      toast({
        title: "Success",
        description: "New session added successfully.",
      });
      form.reset({
          ...playerNames.reduce((acc, name) => ({ ...acc, [name]: "" }), {}),
          date: values.date, // Keep date
          location: values.location, // Keep location
          addedBy: values.addedBy, // Keep adder
      });
    } catch (error) {
      console.error("Error adding document: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add session. Please try again.",
      });
    } finally {
        setIsAdding(false);
    }
  }

  async function deleteSession(sessionId: string) {
    if(!db || !homeGameCode) return;
    try {
        await deleteDoc(doc(db, 'homeGames', homeGameCode, "sessions", sessionId));
        toast({
            title: "Session Deleted",
            description: "The session has been removed.",
        })
    } catch (error) {
        console.error("Error deleting document: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to delete session. Please try again.",
        });
    }
  }


  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <PlusCircle className="w-5 h-5"/>
            Add New Session
        </h3>
        {playerNames.length > 0 ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., John's House" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="addedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1"><User className="w-4 h-4" />Added by</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a player" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {playerNames.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel className="text-base font-medium">Player Results (€)</FormLabel>
              <FormDescription>Enter positive values for wins and negative for losses. The total must sum to 0.</FormDescription>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
                {playerNames.map((name) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name as any}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{name}</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>
            
            <Button type="submit" disabled={isAdding}>
              {isAdding ? "Adding..." : "Add Session"}
            </Button>
          </form>
        </Form>
        ) : (
          <p className="text-muted-foreground">Please add players in the Player Management section below to start logging sessions.</p>
        )}
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Past Sessions</h3>
        <ScrollArea className="h-[400px] w-full border rounded-md">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur-sm">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                {playerNames.map((name) => (
                  <TableHead key={name} className="text-right">{name}</TableHead>
                ))}
                <TableHead>Added By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {loading && (
                    Array.from({length: 3}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            {playerNames.map(p => <TableCell key={p}><Skeleton className="h-4 w-16 ml-auto" /></TableCell>)}
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                    ))
                )}
              {!loading && sessions.map((session: Session) => (
                <TableRow key={session.id}>
                  <TableCell>{format(new Date(session.date), "dd MMM yyyy")}</TableCell>
                  <TableCell>{session.location}</TableCell>
                  {playerNames.map((name) => (
                    <TableCell key={name} className={`text-right font-medium ${session.players[name] >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {session.players[name]?.toFixed(2) ?? 'N/A'}€
                    </TableCell>
                  ))}
                  <TableCell>{session.addedBy}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the session from
                                {format(new Date(session.date), "PPP")} at {session.location}.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteSession(session.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && sessions.length === 0 && (
                <TableRow>
                    <TableCell colSpan={playerNames.length + 4} className="h-24 text-center">
                        No sessions found. Add one to get started!
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      <div className="mt-8">
        <PlayerManagement />
      </div>
    </div>
  );
}
