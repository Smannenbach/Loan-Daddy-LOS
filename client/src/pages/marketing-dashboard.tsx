import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity, 
  Share2, 
  TrendingUp, 
  Users, 
  Zap,
  Facebook,
  Mail,
  Phone,
  MessageSquare,
  Target,
  BarChart3,
  Settings,
  Webhook,
  Bot
} from "lucide-react";

interface IntegrationStatus {
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
  leadsToday?: number;
  totalLeads?: number;
}

interface LeadData {
  id: number;
  source: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  loanAmount: number;
  leadScore: number;
  createdAt: Date;
  status: string;
}

export default function MarketingDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');

  // Mock data for integrations status
  const integrations: IntegrationStatus[] = [
    { name: 'Facebook Lead Ads', status: 'connected', lastSync: new Date(), leadsToday: 12, totalLeads: 342 },
    { name: 'HighLevel CRM', status: 'connected', lastSync: new Date(Date.now() - 300000), leadsToday: 8, totalLeads: 156 },
    { name: 'Google Ads', status: 'connected', lastSync: new Date(), leadsToday: 5, totalLeads: 89 },
    { name: 'Zapier', status: 'connected', lastSync: new Date(), leadsToday: 3, totalLeads: 67 },
    { name: 'Make', status: 'disconnected', lastSync: undefined, leadsToday: 0, totalLeads: 23 },
  ];

  // Fetch recent leads
  const { data: recentLeads = [] } = useQuery({
    queryKey: ['/api/loan-applications'],
    select: (data: any[]) => data
      .filter(app => app.source && app.source !== 'manual')
      .slice(0, 10)
      .map(app => ({
        id: app.id,
        source: app.source,
        firstName: app.borrower?.firstName || '',
        lastName: app.borrower?.lastName || '',
        email: app.borrower?.email || '',
        phone: app.borrower?.phone || '',
        loanAmount: app.loanAmount,
        leadScore: app.borrower?.leadScore || 50,
        createdAt: new Date(app.createdAt),
        status: app.status
      }))
  });

  // Test webhook endpoint
  const testWebhookMutation = useMutation({
    mutationFn: async (data: { source: string; testData: any }) => {
      return await apiRequest(`/api/webhooks/${data.source}`, {
        method: 'POST',
        body: JSON.stringify(data.testData)
      });
    },
    onSuccess: () => {
      toast({
        title: "Webhook Test Successful",
        description: "Test lead was processed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/loan-applications'] });
    },
    onError: (error) => {
      toast({
        title: "Webhook Test Failed",
        description: "Failed to process test webhook",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50';
      case 'disconnected': return 'text-gray-600 bg-gray-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleTestWebhook = (source: string) => {
    const testData = {
      facebook: {
        campaign_id: "test_campaign",
        adset_id: "test_adset",
        field_data: [
          { name: "first_name", values: ["John"] },
          { name: "last_name", values: ["Doe"] },
          { name: "email", values: ["john.doe@example.com"] },
          { name: "phone_number", values: ["+1234567890"] },
          { name: "loan_amount", values: ["500000"] },
          { name: "loan_purpose", values: ["flip"] },
          { name: "credit_score", values: ["720"] }
        ]
      },
      highlevel: {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        phone: "+1987654321",
        loanAmount: "750000",
        loan_purpose: "rental",
        creditScore: "680",
        contactId: "test_contact_123"
      },
      google: {
        campaign_id: "test_google_campaign",
        lead_id: "test_lead_456",
        user_column_data: [
          { column_id: "FIRST_NAME", string_value: "Mike" },
          { column_id: "LAST_NAME", string_value: "Johnson" },
          { column_id: "EMAIL", string_value: "mike.johnson@example.com" },
          { column_id: "PHONE_NUMBER", string_value: "+1555123456" },
          { column_id: "LOAN_AMOUNT", string_value: "600000" }
        ]
      }
    };

    testWebhookMutation.mutate({
      source: source.toLowerCase().replace(' ', ''),
      testData: testData[source.toLowerCase().replace(' ', '') as keyof typeof testData]
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Share2 className="w-8 h-8 text-blue-600" />
          Marketing Automation
        </h1>
        <p className="text-text-secondary mt-2">
          Manage lead generation integrations and monitor campaign performance
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="leads">Recent Leads</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Leads Today</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {integrations.reduce((sum, integration) => sum + (integration.leadsToday || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">+12% from yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {integrations.reduce((sum, integration) => sum + (integration.totalLeads || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {integrations.filter(i => i.status === 'connected').length}
                </div>
                <p className="text-xs text-muted-foreground">of {integrations.length} total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Lead Score</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78</div>
                <p className="text-xs text-muted-foreground">Quality indicator</p>
              </CardContent>
            </Card>
          </div>

          {/* Integration Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">{integration.name}</CardTitle>
                  <Badge className={getStatusColor(integration.status)}>
                    {integration.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-semibold">{integration.leadsToday || 0}</div>
                      <div className="text-text-secondary">Today</div>
                    </div>
                    <div>
                      <div className="font-semibold">{integration.totalLeads || 0}</div>
                      <div className="text-text-secondary">Total</div>
                    </div>
                  </div>
                  {integration.lastSync && (
                    <p className="text-xs text-text-secondary mt-2">
                      Last sync: {integration.lastSync.toLocaleTimeString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Facebook className="w-5 h-5 text-blue-600" />
                  Facebook Lead Ads
                </CardTitle>
                <CardDescription>
                  Automatically import leads from Facebook Lead Ad campaigns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Webhook URL</Label>
                    <Input value="https://yourdomain.com/api/webhooks/facebook" readOnly />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge className="text-green-600 bg-green-50">Connected</Badge>
                  </div>
                </div>
                <Button 
                  onClick={() => handleTestWebhook('facebook')}
                  disabled={testWebhookMutation.isPending}
                  variant="outline"
                  size="sm"
                >
                  Test Integration
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-600" />
                  HighLevel CRM
                </CardTitle>
                <CardDescription>
                  Sync contacts and opportunities with HighLevel CRM
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Webhook URL</Label>
                    <Input value="https://yourdomain.com/api/webhooks/highlevel" readOnly />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge className="text-green-600 bg-green-50">Connected</Badge>
                  </div>
                </div>
                <Button 
                  onClick={() => handleTestWebhook('highlevel')}
                  disabled={testWebhookMutation.isPending}
                  variant="outline"
                  size="sm"
                >
                  Test Integration
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-600" />
                  Zapier
                </CardTitle>
                <CardDescription>
                  Connect 5000+ apps through Zapier automation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Webhook URL</Label>
                    <Input value="https://yourdomain.com/api/webhooks/zapier" readOnly />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge className="text-green-600 bg-green-50">Connected</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm">Test Integration</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Make (Integromat)
                </CardTitle>
                <CardDescription>
                  Advanced automation scenarios and data processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Webhook URL</Label>
                    <Input value="https://yourdomain.com/api/webhooks/make" readOnly />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge className="text-gray-600 bg-gray-50">Disconnected</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm">Setup Integration</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>
                Latest leads from all marketing channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentLeads.map((lead: LeadData) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <Badge variant="outline">{lead.source}</Badge>
                      </div>
                      <div>
                        <div className="font-semibold">{lead.firstName} {lead.lastName}</div>
                        <div className="text-sm text-text-secondary">
                          {lead.email} • {lead.phone}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold">${lead.loanAmount?.toLocaleString()}</div>
                        <div className="text-sm text-text-secondary">{lead.status}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getLeadScoreColor(lead.leadScore)}`}></div>
                        <span className="text-sm">{lead.leadScore}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {recentLeads.length === 0 && (
                  <div className="text-center py-8 text-text-secondary">
                    No recent leads found. Connect your marketing channels to start receiving leads.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Lead Routing Rules</CardTitle>
                <CardDescription>
                  Configure how leads are assigned and prioritized
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Default Assignment</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select loan officer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto Assignment</SelectItem>
                      <SelectItem value="round_robin">Round Robin</SelectItem>
                      <SelectItem value="manual">Manual Assignment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>High Priority Threshold</Label>
                  <Input type="number" placeholder="80" />
                  <p className="text-xs text-text-secondary mt-1">
                    Leads with scores above this threshold get priority handling
                  </p>
                </div>
                <Button>Save Settings</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Automation Settings</CardTitle>
                <CardDescription>
                  Configure AI responses and automation triggers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Auto AI Response</Label>
                  <Button variant="outline" size="sm">Enabled</Button>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Lead Scoring</Label>
                  <Button variant="outline" size="sm">Enabled</Button>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Property Data Enrichment</Label>
                  <Button variant="outline" size="sm">Enabled</Button>
                </div>
                <div>
                  <Label>Response Delay (minutes)</Label>
                  <Input type="number" placeholder="5" />
                </div>
                <Button>Update Settings</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}