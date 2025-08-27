
"use client";

import { PokerPal } from "@/components/PokerPal";
import { AccessPage } from "@/components/AccessPage";
import { AuthProvider, useAuth } from "@/contexts/AuthProvider";
import { FirebaseProvider } from "@/contexts/FirebaseProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PokerChipIcon } from "@/components/icons/PokerChipIcon";

function AppContent() {
  const { isAuthenticated, homeGameCode, configLoaded } = useAuth();

  // Show a skeleton loader while the configuration is being loaded on the client.
  if (!configLoaded) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center p-6">
            <div className="flex justify-center items-center gap-4 mb-2">
                <PokerChipIcon className="w-12 h-12 text-primary animate-pulse" />
                <div>
                    <Skeleton className="h-10 w-48" />
                </div>
            </div>
            <Skeleton className="h-4 w-64 mx-auto" />
        </CardHeader>
        <CardContent className="p-6">
            <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  // After loading, if the user is authenticated, show the main app.
  if (isAuthenticated && homeGameCode) {
    return (
      <FirebaseProvider homeGameCode={homeGameCode}>
        <PokerPal />
      </FirebaseProvider>
    );
  }

  // Otherwise, show the access page.
  return <AccessPage />;
}

export default function Home() {
  return (
    <main className="min-h-screen w-full p-4 md:p-8 flex items-center justify-center">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </main>
  );
}
