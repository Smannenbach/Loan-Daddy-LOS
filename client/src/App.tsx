import React, { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
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
const PropertyComparison = React.lazy(() => import("@/pages/property-comparison"));
const MarketTrends = React.lazy(() => import("@/pages/market-trends"));

const MortgageCalculator = React.lazy(() => import("@/pages/mortgage-calculator"));
const Contacts = React.lazy(() => import("@/pages/contacts"));
const ContactRecommendations = React.lazy(() => import("@/pages/contact-recommendations"));
const TeamManagement = React.lazy(() => import("@/pages/team-management"));
const Profile = React.lazy(() => import("@/pages/profile"));
const Permissions = React.lazy(() => import("@/pages/permissions"));
const AIDashboard = React.lazy(() => import("@/pages/ai-dashboard"));

const AnalyticsDashboard = React.lazy(() => import("@/pages/analytics-dashboard"));
const WorkflowAutomation = React.lazy(() => import("@/pages/workflow-automation"));
const DocumentCenter = React.lazy(() => import("@/pages/document-center"));
const DocumentProcessor = React.lazy(() => import("@/pages/document-processor"));
const PaymentProcessing = React.lazy(() => import("@/pages/payment-processing"));
const ComplianceCenter = React.lazy(() => import("@/pages/compliance-center"));
const PropertyTaxManager = React.lazy(() => import("@/pages/property-tax-manager"));
const Comparison = React.lazy(() => import("@/pages/comparison"));
const LoanRecommendationEngine = React.lazy(() => import("@/pages/loan-recommendation-engine"));
const Pricing = React.lazy(() => import("@/pages/pricing"));
const Signup = React.lazy(() => import("@/pages/signup"));
const AIVoiceAssistant = React.lazy(() => import("@/pages/ai-voice-assistant"));

// New feature pages
const PropertyTaxCalculator = React.lazy(() => import("@/pages/property-tax-calculator"));
const FinancialHealthDashboard = React.lazy(() => import("@/pages/financial-health-dashboard"));
const SmartDocumentUpload = React.lazy(() => import("@/pages/smart-document-upload"));

// Customer portal pages
const CustomerLogin = React.lazy(() => import("@/pages/customer/customer-login"));
const CustomerSignup = React.lazy(() => import("@/pages/customer/customer-signup"));
const CustomerDashboard = React.lazy(() => import("@/pages/customer/customer-dashboard"));
const CustomerLoanApplication = React.lazy(() => import("@/pages/customer/loan-application"));
const DocumentUpload = React.lazy(() => import("@/pages/customer/document-upload"));

// Borrower portal pages
const BorrowerPortal = React.lazy(() => import("@/pages/borrower-portal"));
const BorrowerPortalV2 = React.lazy(() => import("@/pages/borrower-portal-v2"));
const BorrowerLogin = React.lazy(() => import("@/pages/borrower-login"));
const BorrowerApplication = React.lazy(() => import("@/pages/borrower-application"));
const BorrowerDashboard = React.lazy(() => import("@/pages/borrower-dashboard"));
const RealtorPortal = React.lazy(() => import("@/pages/realtor-portal"));
const RealtorLogin = React.lazy(() => import("@/pages/realtor-login"));
const LoanOfficerLogin = React.lazy(() => import("@/pages/loan-officer-login"));

// Detect which portal to show based on subdomain
function getPortalType() {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  
  // Check for apply subdomain (borrower portal)
  if (hostname.includes('apply.loangenius.ai') || 
      hostname.includes('apply-') || 
      pathname.startsWith('/apply') ||
      searchParams.get('apply') === 'true') {
    return 'borrower';
  }
  
  // Check for realtor subdomain
  if (hostname.includes('realtor.loangenius.ai') || 
      hostname.includes('realtor-') || 
      pathname.startsWith('/realtor') ||
      searchParams.get('realtor') === 'true') {
    return 'realtor';
  }
  
  // Check for app subdomain (loan officer portal)
  if (hostname.includes('app.loangenius.ai') || 
      hostname.includes('app-') || 
      pathname.startsWith('/app') ||
      searchParams.get('app') === 'true') {
    return 'loan-officer';
  }
  
  // Check for branded subdomains (e.g., johndoe.loangenius.ai)
  const hostParts = hostname.split('.');
  if (hostParts.length >= 3 && hostname.includes('loangenius.ai')) {
    const subdomain = hostParts[0];
    if (!['app', 'apply', 'www', 'realtor'].includes(subdomain)) {
      return 'borrower'; // Branded subdomains show borrower portal
    }
  }
  
  // Default to loan officer portal for development
  return 'loan-officer';
}

function Router() {
  const [location, setLocation] = useLocation();
  const [portalType] = useState(getPortalType());
  const isAuthenticated = localStorage.getItem('authToken');
  
  // Render different portals based on subdomain
  if (portalType === 'borrower') {
    return (
      <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <BorrowerPortalV2 />
      </React.Suspense>
    );
  }
  
  if (portalType === 'realtor') {
    return (
      <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <RealtorPortal />
      </React.Suspense>
    );
  }
  
  // Default loan officer portal logic
  useEffect(() => {
    if (!isAuthenticated && location !== '/login' && location !== '/signup') {
      setLocation('/login');
    }
  }, [isAuthenticated, location, setLocation]);
  
  // Show login/signup pages without sidebar
  if (location === '/login' || location === '/signup') {
    return (
      <Switch>
        <Route path="/login" component={() => (
          <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <LoanOfficerLogin />
          </React.Suspense>
        )} />
        <Route path="/signup" component={() => (
          <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <Signup />
          </React.Suspense>
        )} />
      </Switch>
    );
  }
  
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
          <Route path="/property-comparison" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Property Comparison...</div>}>
              <PropertyComparison />
            </React.Suspense>
          )} />
          <Route path="/market-trends" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Market Trends...</div>}>
              <MarketTrends />
            </React.Suspense>
          )} />

          <Route path="/mortgage-calculator" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Mortgage Calculator...</div>}>
              <MortgageCalculator />
            </React.Suspense>
          )} />
          <Route path="/contacts" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Contacts...</div>}>
              <Contacts />
            </React.Suspense>
          )} />
          <Route path="/contact-recommendations" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Contact Recommendations...</div>}>
              <ContactRecommendations />
            </React.Suspense>
          )} />
          <Route path="/team-management" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Team Management...</div>}>
              <TeamManagement />
            </React.Suspense>
          )} />
          <Route path="/profile" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Profile...</div>}>
              <Profile />
            </React.Suspense>
          )} />
          <Route path="/permissions" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Permissions...</div>}>
              <Permissions />
            </React.Suspense>
          )} />
          <Route path="/ai-dashboard" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading AI Dashboard...</div>}>
              <AIDashboard />
            </React.Suspense>
          )} />
          <Route path="/analytics" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Analytics...</div>}>
              <AnalyticsDashboard />
            </React.Suspense>
          )} />
          <Route path="/workflow-automation" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Workflow Automation...</div>}>
              <WorkflowAutomation />
            </React.Suspense>
          )} />
          <Route path="/document-center" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Document Center...</div>}>
              <DocumentCenter />
            </React.Suspense>
          )} />
          <Route path="/document-processor" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Document Processor...</div>}>
              <DocumentProcessor />
            </React.Suspense>
          )} />
          <Route path="/payment-processing" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Payment Processing...</div>}>
              <PaymentProcessing />
            </React.Suspense>
          )} />
          <Route path="/compliance" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Compliance Center...</div>}>
              <ComplianceCenter />
            </React.Suspense>
          )} />
          <Route path="/property-tax-manager" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Property Tax Manager...</div>}>
              <PropertyTaxManager />
            </React.Suspense>
          )} />
          <Route path="/comparison" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Comparison...</div>}>
              <Comparison />
            </React.Suspense>
          )} />
          <Route path="/loan-recommendation" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Loan Recommendation Engine...</div>}>
              <LoanRecommendationEngine />
            </React.Suspense>
          )} />
          <Route path="/pricing" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Pricing...</div>}>
              <Pricing />
            </React.Suspense>
          )} />
          <Route path="/signup" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Signup...</div>}>
              <Signup />
            </React.Suspense>
          )} />
          <Route path="/ai-voice-assistant" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading AI Voice Assistant...</div>}>
              <AIVoiceAssistant />
            </React.Suspense>
          )} />
          
          {/* New Feature Routes */}
          <Route path="/property-tax-calculator" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Property Tax Calculator...</div>}>
              <PropertyTaxCalculator />
            </React.Suspense>
          )} />
          <Route path="/financial-health" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Financial Health Dashboard...</div>}>
              <FinancialHealthDashboard />
            </React.Suspense>
          )} />
          <Route path="/smart-document-upload" component={() => (
            <React.Suspense fallback={<div className="p-8">Loading Smart Document Upload...</div>}>
              <SmartDocumentUpload />
            </React.Suspense>
          )} />
          
          <Route path="/settings" component={() => (
            <div className="p-8">
              <h1 className="text-2xl font-bold mb-4">Settings</h1>
              <p>Settings page coming soon...</p>
            </div>
          )} />

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
        <MainRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function MainRouter() {
  const [location] = useLocation();
  
  // Check if we're on the apply subdomain (borrower portal)
  const hostname = window.location.hostname;
  const isApplySubdomain = hostname.startsWith('apply.') || 
    (hostname.includes('replit.dev') && window.location.search.includes('apply=true'));
  
  // Check if we're on the realtor subdomain
  const isRealtorSubdomain = hostname.startsWith('realtor.') || 
    (hostname.includes('replit.dev') && window.location.search.includes('realtor=true'));
  
  if (isApplySubdomain) {
    return <BorrowerRouter />;
  }
  
  if (isRealtorSubdomain) {
    return <RealtorRouter />;
  }
  
  // Check if we're in the customer portal
  if (location.startsWith('/customer/')) {
    return <CustomerRouter />;
  }
  
  // Otherwise, render the main app with sidebar
  return <Router />;
}

function BorrowerRouter() {
  const [location, setLocation] = useLocation();
  const isAuthenticated = localStorage.getItem('borrowerToken');
  
  useEffect(() => {
    if (!isAuthenticated && location !== '/login') {
      setLocation('/login');
    }
  }, [isAuthenticated, location, setLocation]);
  
  return (
    <Switch>
      <Route path="/login" component={() => (
        <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
          <BorrowerLogin />
        </React.Suspense>
      )} />
      <Route path="/" component={() => (
        <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading LoanGenius...</div>}>
          <BorrowerPortalV2 />
        </React.Suspense>
      )} />
      <Route path="/borrower-dashboard" component={() => (
        <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading Dashboard...</div>}>
          <BorrowerDashboard />
        </React.Suspense>
      )} />
      <Route path="/borrower-application" component={() => (
        <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading Application...</div>}>
          <BorrowerApplication />
        </React.Suspense>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function RealtorRouter() {
  const [location, setLocation] = useLocation();
  const isAuthenticated = localStorage.getItem('realtorToken');
  
  useEffect(() => {
    if (!isAuthenticated && location !== '/login') {
      setLocation('/login');
    }
  }, [isAuthenticated, location, setLocation]);
  
  return (
    <Switch>
      <Route path="/login" component={() => (
        <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
          <RealtorLogin />
        </React.Suspense>
      )} />
      <Route path="/" component={() => (
        <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading LoanGenius Realtor Portal...</div>}>
          <RealtorPortal />
        </React.Suspense>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function CustomerRouter() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Switch>
        <Route path="/customer/login" component={() => (
          <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <CustomerLogin />
          </React.Suspense>
        )} />
        <Route path="/customer/signup" component={() => (
          <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <CustomerSignup />
          </React.Suspense>
        )} />
        <Route path="/customer/dashboard" component={() => (
          <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <CustomerDashboard />
          </React.Suspense>
        )} />
        <Route path="/customer/loan-application" component={() => (
          <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <CustomerLoanApplication />
          </React.Suspense>
        )} />
        <Route path="/customer/documents" component={() => (
          <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <DocumentUpload />
          </React.Suspense>
        )} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

export default App;
