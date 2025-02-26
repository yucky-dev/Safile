import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Connectors } from "@/pages/Connectors";
import { Backups } from "@/pages/Backups";
import { BackupDetail } from "@/pages/BackupDetail";
import { Keys } from "@/pages/Keys";
import { StorageNodes } from "@/pages/StorageNodes";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/connectors" component={Connectors} />
        <Route path="/backups" component={Backups} />
        <Route path="/backups/:id" component={BackupDetail} />
        <Route path="/keys" component={Keys} />
        <Route path="/storage" component={StorageNodes} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
