
"use client";

import { useFirebase } from "@/contexts/FirebaseProvider";
import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export function SetupTab() {
  const { connectionStatus, error } = useFirebase();
  const { homeGameCode, firebaseConfig, logout } = useAuth();
  const { toast } = useToast();

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
       <Card>
        <CardHeader>
          <CardTitle>Connection Details</CardTitle>
          <CardDescription>
            View the current status of your connection to the Firebase database.
          </CardDescription>
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
