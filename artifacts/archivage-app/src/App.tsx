import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { AppSidebar } from "@/components/layout/sidebar";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import ProjetsPage from "@/pages/projets";
import LotsPage from "@/pages/lots";
import PhasesPage from "@/pages/phases";
import DocumentsPage from "@/pages/documents";
import RecherchePage from "@/pages/recherche";
import HistoriquePage from "@/pages/historique";
import UtilisateursPage from "@/pages/utilisateurs";
import DepartementsPage from "@/pages/departements";
import BETPage from "@/pages/bet";
import BlocksPage from "@/pages/blocks";
import ZonesPage from "@/pages/zones";
import UnitesPage from "@/pages/unites";
import TagsPage from "@/pages/tags";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Switch>
            <Route path="/" component={DashboardPage} />
            <Route path="/projets" component={ProjetsPage} />
            <Route path="/lots" component={LotsPage} />
            <Route path="/documents" component={DocumentsPage} />
            <Route path="/recherche" component={RecherchePage} />
            <Route path="/historique" component={HistoriquePage} />
            <Route path="/utilisateurs" component={UtilisateursPage} />
            <Route path="/departements" component={DepartementsPage} />
            <Route path="/bet" component={BETPage} />
            <Route path="/blocks" component={BlocksPage} />
            <Route path="/zones" component={ZonesPage} />
            <Route path="/unites" component={UnitesPage} />
            <Route path="/tags" component={TagsPage} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppLayout />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
