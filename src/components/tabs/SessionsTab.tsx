
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useFirebase } from "@/contexts/FirebaseProvider";
import { useForm } from "react-hook-form";
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
import { CalendarIcon, PlusCircle, Trash2, Users, UserPlus, AlertCircle, CheckCircle, Scale, MapPin, User, MinusCircle, DollarSign, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Session, SessionPlayer } from "@/lib/types";
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
import { SessionSettlementDialog } from "../SessionSettlementDialog";


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
                            <div key={name} className="flex items-center gap-2 rounded-full border border-border bg-secondary text-secondary-foreground px-3 py-1 text-sm">
                                {name}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <button disabled={isUpdating} className="flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors">
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Remove {name}?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will remove {name} from the game. They will still appear in past sessions, but you won't be able to add them to new ones. Are you sure?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleRemovePlayer(name)} className="bg-destructive hover:bg-destructive/90">Remove Player</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))}
                        {playerNames.length === 0 && <p className="text-sm text-muted-foreground">No players configured.</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function SessionCorrector({ form }: { form: any }) {
    const playerNames = useFirebase().playerNames;
    const watchedValues = form.watch(playerNames.map(name => `${name}.result`));

    const { totalWins, totalLosses } = useMemo(() => {
        let wins = 0;
        let losses = 0;
        
        playerNames.forEach((name, index) => {
            const result = parseFloat(watchedValues[index]) || 0;
            if (result > 0) wins += result;
            if (result < 0) losses += result;
        });

        return { totalWins: wins, totalLosses: losses };
    }, [watchedValues, playerNames]);
    
    const balance = totalWins + totalLosses;
    const isBalanced = Math.abs(balance) < 0.01;

    if (totalWins === 0 && totalLosses === 0) {
        return null;
    }

    return (
        <Card className="mt-4 bg-muted/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Scale/>Session Balance</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4">
                    <div className="text-center p-3 rounded-lg bg-gain/10">
                        <p className="text-sm text-gain font-semibold">Total Gains</p>
                        <p className="text-2xl font-bold text-gain">{totalWins.toFixed(2)}€</p>
                    </div>
                     <div className="text-center p-3 rounded-lg bg-loss/10">
                        <p className="text-sm text-loss font-semibold">Total Losses</p>
                        <p className="text-2xl font-bold text-loss">{totalLosses.toFixed(2)}€</p>
                    </div>
                </div>
                <div className={cn(
                    "flex items-center gap-2 font-bold p-3 rounded-md w-full md:w-auto justify-center text-lg",
                    isBalanced ? "text-gain bg-gain/10" : "text-destructive bg-destructive/10"
                )}>
                    {isBalanced ? <CheckCircle /> : <AlertCircle />}
                    <span>{isBalanced ? "Balanced" : `Unbalanced by ${balance.toFixed(2)}€`}</span>
                </div>
            </CardContent>
        </Card>
    );
}

export function SessionsTab() {
  const { playerNames, sessions, loading, addSession, deleteSession } = useFirebase();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  
  const playerSchema = z.object({
    result: z.coerce.number().default(0),
    buyIns: z.coerce.number().int().min(1, "Each player must have at least 1 buy-in.").default(1),
  });

  const formSchema = z.object({
      date: z.date(),
      location: z.string().min(1, "Location is required."),
      addedBy: z.string({required_error: "Please select who added this session."}).min(1, "Please select who added this session."),
      buyInAmount: z.coerce.number().positive("Buy-in amount must be a positive number.").default(10),
      ...playerNames.reduce((acc, name) => {
        acc[name] = playerSchema;
        return acc;
      }, {} as Record<string, z.ZodType<any, any>>),
    }).refine(data => {
        const total = playerNames.reduce((sum, name) => sum + (data[name]?.result || 0), 0);
        return Math.abs(total) < 0.01; // Allow for floating point inaccuracies
    }, {
        message: "The sum of all player results must be 0.",
        path: [''] // General form error
    });

    const getInitialFormValues = () => {
        const initialPlayerValues = playerNames.reduce((acc, name) => {
            acc[name] = { result: 0, buyIns: 1 };
            return acc;
        }, {} as any);
    
        return {
            date: new Date(),
            location: "",
            addedBy: "",
            buyInAmount: 10,
            ...initialPlayerValues,
        };
    };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialFormValues(),
  });

  useEffect(() => {
    form.reset(getInitialFormValues());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerNames, form]);
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsAdding(true);
    
    const playersResult: Record<string, SessionPlayer> = playerNames.reduce((acc, name) => {
        acc[name] = {
            result: values[name].result as number,
            buyIns: values[name].buyIns as number
        };
        return acc;
    }, {} as Record<string, SessionPlayer>);

    const totalBuyIns = Object.values(playersResult).reduce((sum, player) => sum + (player.buyIns || 0), 0);
    const totalPot = values.buyInAmount * totalBuyIns;

    try {
      await addSession({
        date: format(values.date, "yyyy-MM-dd"),
        location: values.location,
        addedBy: values.addedBy,
        buyInAmount: values.buyInAmount,
        players: playersResult,
        totalPot: totalPot,
        settled: false,
      });
      toast({
        title: "Success",
        description: "New session added successfully.",
      });
      form.reset();
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

  async function handleDeleteSession(sessionId: string) {
    try {
        await deleteSession(sessionId);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Date</FormLabel><Popover><PopoverTrigger asChild><FormControl>
                          <Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : (<span>Pick a date</span>)}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button></FormControl></PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus/>
                      </PopoverContent></Popover><FormMessage />
                  </FormItem>)}/>
              <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Location</FormLabel><FormControl><Input placeholder="e.g., John's House" {...field} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="addedBy" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-1"><User className="w-4 h-4" />Added by</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a player" /></SelectTrigger></FormControl><SelectContent>{playerNames.map((name) => (<SelectItem key={name} value={name}>{name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="buyInAmount" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-1"><DollarSign className="w-4 h-4" />Buy-in Amount (€)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>)}/>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <div>
                    <FormLabel className="text-base font-medium">Player Details</FormLabel>
                    <FormDescription>Enter results (win/loss) and number of buy-ins for each player.</FormDescription>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6 mt-4">
                {playerNames.map((name) => (
                  <div key={name} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                    <h4 className="font-semibold text-center">{name}</h4>
                     <FormField control={form.control} name={`${name}.result`} render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 text-sm"><Scale className="w-4 h-4"/>Result (€)</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                      </FormItem>)}/>
                    <FormField control={form.control} name={`${name}.buyIns`} render={({ field }) => (
                      <FormItem>
                         <FormLabel className="flex items-center gap-1.5 text-sm"><Wallet className="w-4 h-4" />Buy-ins</FormLabel>
                         <FormControl>
                            <div className="flex items-center gap-2">
                                <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => form.setValue(`${name}.buyIns`, Math.max(1, (field.value || 1) - 1))}>
                                    <MinusCircle className="h-4 w-4"/>
                                </Button>
                                <Input className="h-8 text-center" type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} value={field.value ?? ''} />
                                <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => form.setValue(`${name}.buyIns`, (field.value || 0) + 1)}>
                                    <PlusCircle className="h-4 w-4"/>
                                </Button>
                            </div>
                         </FormControl>
                        <FormMessage />
                      </FormItem>)}/>
                  </div>
                ))}
              </div>
            </div>
             {form.formState.errors.root && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
            )}
            <SessionCorrector form={form} />
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
                <TableHead className="text-right">Buy-in</TableHead>
                <TableHead className="text-right">Total Pot</TableHead>
                {playerNames.map((name) => (
                  <TableHead key={name} className="text-right">{name}</TableHead>
                ))}
                <TableHead>Added By</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {loading && (
                    Array.from({length: 3}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                            {playerNames.map(p => <TableCell key={p}><Skeleton key={p} className="h-4 w-16 ml-auto" /></TableCell>)}
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell className="space-x-2 text-center"><Skeleton className="h-8 w-8 mx-auto" /></TableCell>
                        </TableRow>
                    ))
                )}
              {!loading && sessions.map((session: Session) => (
                <TableRow key={session.id}>
                  <TableCell>{format(new Date(session.date), "dd MMM yyyy")}</TableCell>
                  <TableCell>{session.location}</TableCell>
                  <TableCell className="text-right">{(session.buyInAmount || 10).toFixed(2)}€</TableCell>
                  <TableCell className="text-right font-semibold">{(session.totalPot || 0).toFixed(2)}€</TableCell>
                  {playerNames.map((name) => (
                    <TableCell key={name} className="text-right font-medium" style={{ color: (session.players[name]?.result ?? 0) >= 0 ? 'hsl(var(--color-gain))' : 'hsl(var(--color-loss))' }}>
                      {(session.players[name]?.result ?? 0).toFixed(2)}€ 
                      <span className="text-xs text-muted-foreground ml-1">({session.players[name]?.buyIns || 0} BI)</span>
                    </TableCell>
                  ))}
                  <TableCell>{session.addedBy}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-2 justify-center">
                       <SessionSettlementDialog session={session}/>
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
                                <AlertDialogAction onClick={() => handleDeleteSession(session.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && sessions.length === 0 && (
                <TableRow>
                    <TableCell colSpan={playerNames.length + 6} className="h-24 text-center">
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

    