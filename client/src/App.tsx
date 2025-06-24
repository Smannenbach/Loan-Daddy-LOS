import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import NewApplication from "@/pages/new-application";
import Pipeline from "@/pages/pipeline";
import Documents from "@/pages/documents";
import Underwriting from "@/pages/underwriting";
import Communications from "@/pages/communications";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/new-application" component={NewApplication} />
          <Route path="/pipeline" component={Pipeline} />
          <Route path="/documents" component={Documents} />
          <Route path="/underwriting" component={Underwriting} />
          <Route path="/communications" component={Communications} />
          <Route path="/reports" component={Reports} />
          <Route path="/customer-portal" component={() => {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');
            if (!token) {
              return <NotFound />;
            }
            // Dynamically import CustomerPortal to avoid circular dependencies
            const CustomerPortal = React.lazy(() => import("@/pages/customer-portal"));
            return (
              <React.Suspense fallback={<div>Loading...</div>}>
                <CustomerPortal token={token} />
              </React.Suspense>
            );
          }} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
