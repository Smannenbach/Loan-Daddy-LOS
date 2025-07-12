import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building2, Palette, Globe, DollarSign, Users, Settings, 
  Sparkles, CheckCircle, Upload, Link, Mail, Phone,
  Brain, MessageSquare, Mic, BarChart3, Shield, Zap
} from "lucide-react";

interface WhiteLabelConfig {
  // Branding
  companyName: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  customDomain: string;
  
  // Features
  enabledFeatures: {
    aiVoiceAssistant: boolean;
    aiChatbot: boolean;
    linkedinIntegration: boolean;
    smsMarketing: boolean;
    emailCampaigns: boolean;
    dialerSystem: boolean;
    leadDistribution: boolean;
    documentProcessor: boolean;
    propertySearch: boolean;
    loanRecommendation: boolean;
    analytics: boolean;
    compliance: boolean;
  };
  
  // Pricing
  pricingTiers: Array<{
    name: string;
    price: number;
    features: string[];
    userLimit: number;
  }>;
  
  // Email/SMS Templates
  emailTemplates: {
    welcome: string;
    activation: string;
    passwordReset: string;
  };
  
  // Support
  supportEmail: string;
  supportPhone: string;
  helpDocs: string;
}

export default function WhiteLabelDashboard() {
  const [config, setConfig] = useState<WhiteLabelConfig>({
    companyName: "Your Company",
    logo: "",
    favicon: "",
    primaryColor: "#4F46E5",
    secondaryColor: "#10B981",
    customDomain: "",
    enabledFeatures: {
      aiVoiceAssistant: true,
      aiChatbot: true,
      linkedinIntegration: true,
      smsMarketing: true,
      emailCampaigns: true,
      dialerSystem: true,
      leadDistribution: true,
      documentProcessor: true,
      propertySearch: true,
      loanRecommendation: true,
      analytics: true,
      compliance: true,
    },
    pricingTiers: [
      {
        name: "Starter",
        price: 99,
        features: ["Up to 3 users", "1,000 contacts", "Basic features"],
        userLimit: 3
      },
      {
        name: "Professional",
        price: 299,
        features: ["Up to 10 users", "10,000 contacts", "Advanced features"],
        userLimit: 10
      },
      {
        name: "Enterprise",
        price: 599,
        features: ["Unlimited users", "Unlimited contacts", "All features"],
        userLimit: -1
      }
    ],
    emailTemplates: {
      welcome: "Welcome to {{company}}! Your account is ready.",
      activation: "Click here to activate your {{company}} account.",
      passwordReset: "Reset your {{company}} password."
    },
    supportEmail: "support@yourcompany.com",
    supportPhone: "(888) 555-0000",
    helpDocs: "https://help.yourcompany.com"
  });

  const [previewMode, setPreviewMode] = useState(false);

  const handleFeatureToggle = (feature: keyof WhiteLabelConfig['enabledFeatures']) => {
    setConfig(prev => ({
      ...prev,
      enabledFeatures: {
        ...prev.enabledFeatures,
        [feature]: !prev.enabledFeatures[feature]
      }
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">White Label Dashboard</h1>
        <p className="text-gray-600">
          Customize your platform branding, features, and pricing for your agency or resellers
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            Agency Pro Plan Required
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? "Exit Preview" : "Preview Changes"}
          </Button>
        </div>
        <Button>
          <CheckCircle className="w-4 h-4 mr-2" />
          Save Configuration
        </Button>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Brand Customization
              </CardTitle>
              <CardDescription>
                Customize your platform appearance and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={config.companyName}
                    onChange={(e) => setConfig(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Your Company Name"
                  />
                </div>
                <div>
                  <Label htmlFor="custom-domain">Custom Domain</Label>
                  <Input
                    id="custom-domain"
                    value={config.customDomain}
                    onChange={(e) => setConfig(prev => ({ ...prev, customDomain: e.target.value }))}
                    placeholder="app.yourcompany.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="logo-upload">Company Logo</Label>
                  <div className="mt-2 space-y-2">
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                    {config.logo && (
                      <img src={config.logo} alt="Logo preview" className="h-16 object-contain" />
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="favicon-upload">Favicon</Label>
                  <Input
                    id="favicon-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setConfig(prev => ({ ...prev, favicon: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-20 h-10"
                    />
                    <Input
                      value={config.primaryColor}
                      onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                      placeholder="#4F46E5"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={config.secondaryColor}
                      onChange={(e) => setConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-20 h-10"
                    />
                    <Input
                      value={config.secondaryColor}
                      onChange={(e) => setConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      placeholder="#10B981"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Feature Management
              </CardTitle>
              <CardDescription>
                Enable or disable features for your white-label platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { key: 'aiVoiceAssistant', label: 'AI Voice Assistant', icon: Mic },
                  { key: 'aiChatbot', label: 'AI Chatbot', icon: MessageSquare },
                  { key: 'linkedinIntegration', label: 'LinkedIn Integration', icon: Link },
                  { key: 'smsMarketing', label: 'SMS Marketing', icon: Phone },
                  { key: 'emailCampaigns', label: 'Email Campaigns', icon: Mail },
                  { key: 'dialerSystem', label: 'Dialer System', icon: Phone },
                  { key: 'leadDistribution', label: 'Lead Distribution', icon: Users },
                  { key: 'documentProcessor', label: 'Document Processor', icon: Shield },
                  { key: 'propertySearch', label: 'Property Search', icon: Globe },
                  { key: 'loanRecommendation', label: 'Loan Recommendation', icon: Brain },
                  { key: 'analytics', label: 'Advanced Analytics', icon: BarChart3 },
                  { key: 'compliance', label: 'Compliance Center', icon: Shield },
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <span className="font-medium">{label}</span>
                    </div>
                    <Switch
                      checked={config.enabledFeatures[key as keyof typeof config.enabledFeatures]}
                      onCheckedChange={() => handleFeatureToggle(key as keyof typeof config.enabledFeatures)}
                    />
                  </div>
                ))}
              </div>

              <Alert className="mt-6">
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  <strong>All-in-One Advantage:</strong> Unlike competitors who charge separately for each tool,
                  LoanGenius includes all features in one platform. Enable/disable based on your clients' needs.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pricing Configuration
              </CardTitle>
              <CardDescription>
                Set your own pricing tiers and features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {config.pricingTiers.map((tier, index) => (
                  <div key={index} className="border rounded-lg p-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label>Tier Name</Label>
                        <Input
                          value={tier.name}
                          onChange={(e) => {
                            const newTiers = [...config.pricingTiers];
                            newTiers[index].name = e.target.value;
                            setConfig(prev => ({ ...prev, pricingTiers: newTiers }));
                          }}
                        />
                      </div>
                      <div>
                        <Label>Monthly Price</Label>
                        <Input
                          type="number"
                          value={tier.price}
                          onChange={(e) => {
                            const newTiers = [...config.pricingTiers];
                            newTiers[index].price = parseInt(e.target.value);
                            setConfig(prev => ({ ...prev, pricingTiers: newTiers }));
                          }}
                        />
                      </div>
                      <div>
                        <Label>User Limit</Label>
                        <Input
                          type="number"
                          value={tier.userLimit === -1 ? "Unlimited" : tier.userLimit}
                          onChange={(e) => {
                            const newTiers = [...config.pricingTiers];
                            newTiers[index].userLimit = e.target.value === "Unlimited" ? -1 : parseInt(e.target.value);
                            setConfig(prev => ({ ...prev, pricingTiers: newTiers }));
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label>Features (one per line)</Label>
                      <Textarea
                        value={tier.features.join('\n')}
                        onChange={(e) => {
                          const newTiers = [...config.pricingTiers];
                          newTiers[index].features = e.target.value.split('\n').filter(f => f.trim());
                          setConfig(prev => ({ ...prev, pricingTiers: newTiers }));
                        }}
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  Add Pricing Tier
                </Button>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Your Profit Calculator</h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-green-700">Base Cost:</span>
                    <span className="font-bold text-green-900 ml-2">$39/user</span>
                  </div>
                  <div>
                    <span className="text-green-700">Your Price:</span>
                    <span className="font-bold text-green-900 ml-2">${config.pricingTiers[0].price}/user</span>
                  </div>
                  <div>
                    <span className="text-green-700">Profit Margin:</span>
                    <span className="font-bold text-green-900 ml-2">
                      {Math.round(((config.pricingTiers[0].price - 39) / config.pricingTiers[0].price) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email & SMS Templates
              </CardTitle>
              <CardDescription>
                Customize automated communications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Welcome Email</Label>
                <Textarea
                  value={config.emailTemplates.welcome}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    emailTemplates: { ...prev.emailTemplates, welcome: e.target.value }
                  }))}
                  rows={3}
                  placeholder="Use {{company}} for company name, {{user}} for user name"
                />
              </div>
              <div>
                <Label>Activation Email</Label>
                <Textarea
                  value={config.emailTemplates.activation}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    emailTemplates: { ...prev.emailTemplates, activation: e.target.value }
                  }))}
                  rows={3}
                />
              </div>
              <div>
                <Label>Password Reset Email</Label>
                <Textarea
                  value={config.emailTemplates.passwordReset}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    emailTemplates: { ...prev.emailTemplates, passwordReset: e.target.value }
                  }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="w-5 h-5" />
                Third-Party Integrations
              </CardTitle>
              <CardDescription>
                Configure webhooks and API connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Webhook Endpoints</h3>
                  <div className="space-y-3">
                    <div>
                      <Label>New Lead Webhook</Label>
                      <Input placeholder="https://your-api.com/webhooks/new-lead" />
                    </div>
                    <div>
                      <Label>Application Status Webhook</Label>
                      <Input placeholder="https://your-api.com/webhooks/status-update" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">API Configuration</h3>
                  <div className="space-y-3">
                    <div>
                      <Label>API Key</Label>
                      <div className="flex gap-2">
                        <Input value="wl_live_********************************" readOnly />
                        <Button variant="outline">Regenerate</Button>
                      </div>
                    </div>
                    <div>
                      <Label>Allowed Origins</Label>
                      <Textarea
                        placeholder="https://your-domain.com&#10;https://app.your-domain.com"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    All API calls are secured with OAuth 2.0 and rate-limited to prevent abuse.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deployment Tab */}
        <TabsContent value="deployment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Deployment & Launch
              </CardTitle>
              <CardDescription>
                Deploy your white-label platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Deployment Status</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>Platform configured</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>Custom domain verified</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>SSL certificate active</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>Email templates configured</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Platform URLs</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Main App:</span>
                        <a href="#" className="ml-2 text-indigo-600 hover:underline">
                          {config.customDomain || 'app.yourcompany.com'}
                        </a>
                      </div>
                      <div>
                        <span className="text-gray-600">Admin Panel:</span>
                        <a href="#" className="ml-2 text-indigo-600 hover:underline">
                          admin.{config.customDomain || 'yourcompany.com'}
                        </a>
                      </div>
                      <div>
                        <span className="text-gray-600">API Endpoint:</span>
                        <a href="#" className="ml-2 text-indigo-600 hover:underline">
                          api.{config.customDomain || 'yourcompany.com'}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-3">Quick Start Resources</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Button variant="outline" className="justify-start">
                      <Upload className="w-4 h-4 mr-2" />
                      Download Marketing Materials
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Globe className="w-4 h-4 mr-2" />
                      View Demo Site
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      Sales Training Videos
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      API Documentation
                    </Button>
                  </div>
                </div>

                <Alert className="bg-indigo-50 border-indigo-200">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <AlertDescription className="text-indigo-900">
                    <strong>Launch Special:</strong> First 100 clients get 50% off for 3 months. 
                    Use code LAUNCH50 in your marketing materials.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-center">
                  <Button size="lg" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Launch White Label Platform
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}