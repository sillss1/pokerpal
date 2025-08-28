"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SetupTab } from "./tabs/SetupTab";
import { SessionsTab } from "./tabs/SessionsTab";
import { LeaderboardTab } from "./tabs/LeaderboardTab";
import { DebtsTab } from "./tabs/DebtsTab";
import { Trophy, History, Settings, HandCoins } from "lucide-react";
import { PokerChipIcon } from "./icons/PokerChipIcon";

export function PokerPal() {
  return (
    <div className="max-w-7xl mx-auto w-full">
      <header className="flex items-center gap-4 mb-6">
        <PokerChipIcon className="w-12 h-12 text-primary" />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            PokerPal
          </h1>
          <p className="text-muted-foreground">Your friendly poker session tracker</p>
        </div>
      </header>

      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-background/50 backdrop-blur-sm">
          <TabsTrigger value="sessions">
            <History className="w-4 h-4 mr-2" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="leaderboard">
            <Trophy className="w-4 h-4 mr-2" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="debts">
            <HandCoins className="w-4 h-4 mr-2" />
            Debts
          </TabsTrigger>
          <TabsTrigger value="setup">
            <Settings className="w-4 h-4 mr-2" />
            Setup
          </TabsTrigger>
        </TabsList>
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Session History</CardTitle>
              <CardDescription>
                Log a new session or view past results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SessionsTab />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
              <CardDescription>
                See who's on top and view player statistics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaderboardTab />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="debts">
          <Card>
            <CardHeader>
              <CardTitle>Debt Management</CardTitle>
              <CardDescription>
                Manually record and settle debts between players.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DebtsTab />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="setup">
          <Card>
            <CardHeader>
              <CardTitle>Configuration & Settings</CardTitle>
              <CardDescription>
                View current configuration or reset to connect to a new group.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SetupTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
