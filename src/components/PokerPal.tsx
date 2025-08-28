"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SetupTab } from "./tabs/SetupTab";
import { SessionsTab } from "./tabs/SessionsTab";
import { LeaderboardTab } from "./tabs/LeaderboardTab";
import { DebtsTab } from "./tabs/DebtsTab";
import { Trophy, History, Settings, HandCoins, ArrowLeft, PlusCircle } from "lucide-react";
import { PokerChipIcon } from "./icons/PokerChipIcon";
import { Button } from "./ui/button";
import { LeaderboardWidget } from "./widgets/LeaderboardWidget";
import { BiggestPotsWidget } from "./widgets/BiggestPotsWidget";

type ActiveTab = "dashboard" | "sessions" | "leaderboard" | "debts" | "setup";

interface NavButtonProps {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  isActive: boolean;
}

const NavButton = ({ label, icon: Icon, onClick, isActive }: NavButtonProps) => (
    <Button 
        variant={isActive ? "secondary" : "ghost"} 
        className="flex-1 justify-center gap-2"
        onClick={onClick}
    >
        <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
        {label}
    </Button>
);


function MainDashboard({ setActiveTab }: { setActiveTab: (tab: ActiveTab) => void }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <LeaderboardWidget onSeeMore={() => setActiveTab('leaderboard')} />
                <BiggestPotsWidget onSeeMore={() => setActiveTab('sessions')}/>
            </div>

            <div>
                <h3 className="text-lg font-medium mb-4">Ações Rápidas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <Card 
                        className="p-6 flex flex-col items-center justify-center text-center gap-4 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setActiveTab('sessions')}
                    >
                        <div className="p-3 bg-primary/10 rounded-full">
                            <History className="w-8 h-8 text-primary" />
                        </div>
                        <div className="flex-grow">
                            <h4 className="font-semibold text-lg">Adicionar Sessão</h4>
                            <p className="text-sm text-muted-foreground">Registe os resultados de uma nova sessão de jogo.</p>
                        </div>
                    </Card>
                    <Card 
                        className="p-6 flex flex-col items-center justify-center text-center gap-4 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setActiveTab('debts')}
                    >
                        <div className="p-3 bg-primary/10 rounded-full">
                             <HandCoins className="w-8 h-8 text-primary" />
                        </div>
                        <div className="flex-grow">
                            <h4 className="font-semibold text-lg">Gerir Dívidas</h4>
                            <p className="text-sm text-muted-foreground">Registe ou liquide dívidas entre jogadores.</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export function PokerPal() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "sessions":
        return <SessionsTab />;
      case "leaderboard":
        return <LeaderboardTab />;
      case "debts":
        return <DebtsTab />;
      case "setup":
        return <SetupTab />;
      default:
        return <MainDashboard setActiveTab={setActiveTab} />;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case "sessions": return "Histórico de Sessões";
      case "leaderboard": return "Leaderboard";
      case "debts": return "Gestão de Dívidas";
      case "setup": return "Configurações";
      default: return "Dashboard";
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto w-full">
      <header className="flex items-center gap-4 mb-6">
        <PokerChipIcon className="w-12 h-12 text-primary" />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            PokerPal
          </h1>
          <p className="text-muted-foreground">O seu tracker de poker amigável</p>
        </div>
      </header>

      <main>
        {activeTab !== 'dashboard' && (
            <Button variant="outline" onClick={() => setActiveTab('dashboard')} className="mb-4 gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar à Dashboard
            </Button>
        )}
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">{getTitle()}</CardTitle>
            </CardHeader>
            <CardContent>
                 {renderContent()}
            </CardContent>
        </Card>
      </main>

       <footer className="fixed bottom-0 left-0 right-0 md:hidden bg-background/80 backdrop-blur-sm border-t p-2">
            <div className="flex justify-around items-center">
               <NavButton label="Sessões" icon={History} onClick={() => setActiveTab('sessions')} isActive={activeTab === 'sessions'} />
               <NavButton label="Ranking" icon={Trophy} onClick={() => setActiveTab('leaderboard')} isActive={activeTab === 'leaderboard'} />
               <NavButton label="Dívidas" icon={HandCoins} onClick={() => setActiveTab('debts')} isActive={activeTab === 'debts'} />
               <NavButton label="Setup" icon={Settings} onClick={() => setActiveTab('setup')} isActive={active-dtab === 'setup'} />
            </div>
       </footer>

    </div>
  );
}
