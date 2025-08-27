
"use client";

import { PokerPal } from "@/components/PokerPal";
import { AccessPage } from "@/components/AccessPage";
import { AuthProvider, useAuth } from "@/contexts/AuthProvider";
import { FirebaseProvider } from "@/contexts/FirebaseProvider";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function AppContent() {
  const { isAuthenticated, homeGameCode } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full max-w-2xl">
        <Skeleton className="h-[700px] w-full rounded-lg" />
      </div>
    );
  }

  if (isAuthenticated && homeGameCode) {
    return (
      <FirebaseProvider homeGameCode={homeGameCode}>
        <PokerPal />
      </FirebaseProvider>
    );
  }

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
