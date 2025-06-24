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

// Lazy load new pages to avoid bundle size issues
const AIAdvisor = React.lazy(() => import("@/pages/ai-advisor"));
const MarketingDashboard = React.lazy(() => import("@/pages/marketing-dashboard"));
const PropertySearch = React.lazy(() => import("@/pages/property-search"));
const PropertyMap = React.lazy(() => import("@/pages/property-map"));

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
          <Route path="/ai-advisor" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading AI Advisor...</div>}>
              <AIAdvisor />
            </React.Suspense>
          )} />
          <Route path="/marketing" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Marketing Dashboard...</div>}>
              <MarketingDashboard />
            </React.Suspense>
          )} />
          <Route path="/property-search" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Property Search...</div>}>
              <PropertySearch />
            </React.Suspense>
          )} />
          <Route path="/property-map" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Property Map...</div>}>
              <PropertyMap />
            </React.Suspense>
          )} />
          <Route path="/settings" component={() => (
            <div className="p-8">
              <h1 className="text-2xl font-bold mb-4">Settings</h1>
              <p>Settings page coming soon...</p>
            </div>
          )} />
          <Route path="/customer-portal" component={() => {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');
            if (!token) {
              return (
                <div className="p-8">
                  <h1 className="text-2xl font-bold mb-4">Customer Portal Access Required</h1>
                  <p className="text-text-secondary">This page requires a valid access token. Please use the link provided in your email or contact your loan officer.</p>
                </div>
              );
            }
            // Dynamically import CustomerPortal to avoid circular dependencies
            const CustomerPortal = React.lazy(() => import("@/pages/customer-portal"));
            return (
              <React.Suspense fallback={<div className="p-8">Loading Customer Portal...</div>}>
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
