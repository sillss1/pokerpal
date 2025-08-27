
"use client";

import { useFirebase } from "@/contexts/FirebaseProvider";
import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut } from "lucide-react";

export function SetupTab() {
  const { firebaseConfig, playerNames, connectionStatus, error } = useFirebase();
  const { logout } = useAuth();

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

  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Connection Status</h3>
            {getStatusBadge()}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Current Configuration</CardTitle>
            <CardDescription>This is the configuration for the connected group.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <h4 className="font-semibold text-sm">Project ID</h4>
                <p className="text-muted-foreground text-sm">{firebaseConfig?.projectId || "N/A"}</p>
            </div>
            <div>
                <h4 className="font-semibold text-sm">Player Names</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                    {playerNames.map(name => <Badge key={name} variant="secondary">{name}</Badge>)}
                    {playerNames.length === 0 && <p className="text-sm text-muted-foreground">No players configured.</p>}
                </div>
            </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-medium">Actions</h3>
        <p className="text-sm text-muted-foreground mb-4">
            If you need to connect to a different group, you can reset the current configuration.
        </p>
        <Button variant="destructive" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Reset and Log Out
        </Button>
      </div>
    </div>
  );
}
