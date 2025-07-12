import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Phone, MessageSquare, Mail, Users, Brain, TrendingUp, 
  BarChart3, Shield, Globe, Building2, Zap, ArrowRight,
  Mic, Calendar, Link, Database, FileText, DollarSign
} from "lucide-react";

interface SystemMetrics {
  totalLeads: number;
  activeLoans: number;
  dialerCalls: number;
  smsMessages: number;
  emailCampaigns: number;
  aiInteractions: number;
  revenue: number;
  conversionRate: number;
}

interface FeatureCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'setup' | 'upgrade';
  metrics?: string;
  action: string;
}

export default function AllInOneDashboard() {
  const [metrics] = useState<SystemMetrics>({
    totalLeads: 12847,
    activeLoans: 287,
    dialerCalls: 4521,
    smsMessages: 9832,
    emailCampaigns: 47,
    aiInteractions: 1893,
    revenue: 2874500,
    conversionRate: 12.4
  });

  const features: FeatureCard[] = [
    {
      title: "AI Voice Dialer",
      description: "Predictive dialer with AI voice detection - 300% more connections",
      icon: <Phone className="w-5 h-5" />,
      status: 'active',
      metrics: "4,521 calls today",
      action: "Open Dialer"
    },
    {
      title: "SMS & Email Marketing",
      description: "Automated campaigns with AI personalization",
      icon: <MessageSquare className="w-5 h-5" />,
      status: 'active',
      metrics: "89% open rate",
      action: "Create Campaign"
    },
    {
      title: "Lead Distribution",
      description: "Smart routing with AI scoring and round-robin",
      icon: <Users className="w-5 h-5" />,
      status: 'active',
      metrics: "287 leads routed",
      action: "Manage Rules"
    },
    {
      title: "LinkedIn Integration",
      description: "Find and enrich leads from 800M+ profiles",
      icon: <Link className="w-5 h-5" />,
      status: 'active',
      metrics: "1,247 new connections",
      action: "Search LinkedIn"
    },
    {
      title: "AI Loan Advisor",
      description: "Voice & chat AI for 24/7 loan applications",
      icon: <Brain className="w-5 h-5" />,
      status: 'active',
      metrics: "93% satisfaction",
      action: "View Sessions"
    },
    {
      title: "Property Search",
      description: "MLS integration with instant valuation",
      icon: <Globe className="w-5 h-5" />,
      status: 'active',
      metrics: "50M+ properties",
      action: "Search Properties"
    }
  ];

  const competitorComparison = [
    { name: "LoanGenius", features: 25, price: "$39", rating: 5 },
    { name: "GoHighLevel", features: 15, price: "$97", rating: 4.2 },
    { name: "Arive LOS", features: 10, price: "$49", rating: 3.8 },
    { name: "Convoso", features: 5, price: "$90", rating: 3.5 },
    { name: "Salesforce", features: 12, price: "$150", rating: 4.0 },
    { name: "HubSpot", features: 11, price: "$99", rating: 4.1 }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">All-in-One Command Center</h1>
        <p className="text-gray-600">
          The only platform you need - replacing 15+ separate tools with one integrated solution
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold">{metrics.totalLeads.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Loans</p>
                <p className="text-2xl font-bold">{metrics.activeLoans}</p>
              </div>
              <FileText className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Interactions</p>
                <p className="text-2xl font-bold">{metrics.aiInteractions.toLocaleString()}</p>
              </div>
              <Brain className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold">${(metrics.revenue / 1000000).toFixed(1)}M</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="features" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="features">All Features</TabsTrigger>
          <TabsTrigger value="comparison">vs Competitors</TabsTrigger>
          <TabsTrigger value="savings">Cost Savings</TabsTrigger>
        </TabsList>

        {/* All Features Tab */}
        <TabsContent value="features">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        {feature.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                        <Badge 
                          variant={feature.status === 'active' ? 'default' : 'secondary'}
                          className={feature.status === 'active' ? 'bg-green-600' : ''}
                        >
                          {feature.status === 'active' ? 'Active' : 
                           feature.status === 'setup' ? 'Setup Required' : 'Upgrade'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
                  {feature.metrics && (
                    <p className="text-sm font-semibold text-indigo-600 mb-4">{feature.metrics}</p>
                  )}
                  <Button className="w-full" size="sm">
                    {feature.action}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Features Grid */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">More Integrated Tools</h3>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { name: "Calendar Booking", icon: Calendar },
                { name: "Document Center", icon: FileText },
                { name: "Analytics Dashboard", icon: BarChart3 },
                { name: "Compliance Manager", icon: Shield },
                { name: "Workflow Automation", icon: Zap },
                { name: "Team Management", icon: Users },
                { name: "API Builder", icon: Database },
                { name: "White Label", icon: Building2 }
              ].map((tool, index) => (
                <div key={index} className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                  <tool.icon className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">{tool.name}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Why We're Better Than All Competitors</CardTitle>
              <CardDescription>
                Feature comparison with major platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {competitorComparison.map((competitor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <h4 className="font-semibold">{competitor.name}</h4>
                        <p className="text-sm text-gray-600">{competitor.features} features</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-semibold">{competitor.price}/mo</p>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 rounded-full ${
                                i < Math.floor(competitor.rating) ? 'bg-yellow-400' : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {index === 0 && (
                        <Badge className="bg-green-600">Best Value</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Alert className="mt-6">
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  <strong>LoanGenius Advantage:</strong> We include AI in all plans, unlimited users in Enterprise, 
                  and features that others charge $500+/month for - all starting at just $39/month.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Savings Tab */}
        <TabsContent value="savings">
          <Card>
            <CardHeader>
              <CardTitle>Your Total Cost Savings</CardTitle>
              <CardDescription>
                Compare the cost of using separate tools vs LoanGenius All-in-One
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold">If You Used Separate Tools:</h3>
                {[
                  { tool: "GoHighLevel CRM", price: 97 },
                  { tool: "Convoso Dialer", price: 90 },
                  { tool: "Arive LOS", price: 49 },
                  { tool: "LinkedIn Sales Navigator", price: 79 },
                  { tool: "Slack/Teams", price: 15 },
                  { tool: "Calendly", price: 20 },
                  { tool: "DocuSign", price: 25 },
                  { tool: "Mailchimp", price: 35 },
                  { tool: "Twilio SMS", price: 50 },
                  { tool: "Analytics Tool", price: 49 }
                ].map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">{item.tool}</span>
                    <span className="font-medium">${item.price}/mo</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 text-lg font-bold">
                  <span>Total Cost (Separate Tools)</span>
                  <span className="text-red-600">$509/month</span>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">LoanGenius All-in-One</span>
                  <span className="text-2xl font-bold text-green-600">$39/month</span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold text-green-700">
                  <span>Your Monthly Savings</span>
                  <span>$470</span>
                </div>
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-center text-green-800 font-semibold">
                    That's $5,640 saved per year!
                  </p>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  Start Saving Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}