import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  TrendingUp, TrendingDown, CheckCircle2, XCircle, 
  DollarSign, Users, Zap, Brain, Building2, Phone,
  BarChart3, MessageSquare, FileText, Settings2,
  Smartphone, Mail, Megaphone, Bot, Palette, Shield
} from "lucide-react";

interface Competitor {
  name: string;
  pricing: string;
  monthlyPrice: number;
  category: string;
  keyFeatures: string[];
  weaknesses: string[];
  marketPosition: string;
  userBase: string;
}

export default function CompetitiveAnalysis() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const competitors: Competitor[] = [
    {
      name: "Go High Level",
      pricing: "$97 - $497/month",
      monthlyPrice: 97,
      category: "White Label CRM",
      keyFeatures: ["White label platform", "Website builder", "Marketing automation", "Funnels"],
      weaknesses: ["No mortgage-specific features", "Complex setup", "Limited AI capabilities"],
      marketPosition: "Market leader in white label CRM",
      userBase: "50,000+ agencies"
    },
    {
      name: "Arive LOS",
      pricing: "$42 - $49/month",
      monthlyPrice: 42,
      category: "Mortgage LOS",
      keyFeatures: ["AI loan assistant", "Basic CRM", "Application tracking"],
      weaknesses: ["No dialer", "Limited integrations", "No white label"],
      marketPosition: "Entry-level LOS",
      userBase: "Small mortgage brokers"
    },
    {
      name: "SetShape",
      pricing: "$119/month",
      monthlyPrice: 119,
      category: "Mortgage CRM",
      keyFeatures: ["Lead management", "Email marketing", "Basic dialer"],
      weaknesses: ["No AI features", "Limited automation", "Expensive for features"],
      marketPosition: "Mid-market CRM",
      userBase: "1,000+ loan officers"
    },
    {
      name: "BNTouch",
      pricing: "$148 - $165/month",
      monthlyPrice: 148,
      category: "Mortgage CRM",
      keyFeatures: ["35+ mortgage tools", "Marketing automation", "Mobile app"],
      weaknesses: ["Outdated UI", "High price", "Complex navigation"],
      marketPosition: "Legacy mortgage CRM",
      userBase: "10,000+ loan officers"
    },
    {
      name: "Ricochet360",
      pricing: "$24 - $198/user",
      monthlyPrice: 102,
      category: "CRM + Dialer",
      keyFeatures: ["Auto-dialer", "Lead distribution", "Multi-channel"],
      weaknesses: ["Learning curve", "Setup complexity", "Per-user pricing"],
      marketPosition: "Call center focused",
      userBase: "Call centers"
    },
    {
      name: "Leadspedia",
      pricing: "$350 - $2,500/month",
      monthlyPrice: 350,
      category: "Lead Distribution",
      keyFeatures: ["Lead routing", "Call tracking", "Compliance"],
      weaknesses: ["Very expensive", "Enterprise only", "No CRM features"],
      marketPosition: "Enterprise lead platform",
      userBase: "Large enterprises"
    },
    {
      name: "Close.com",
      pricing: "$19 - $149/user",
      monthlyPrice: 99,
      category: "Sales CRM",
      keyFeatures: ["Built-in calling", "Email sequences", "Pipeline"],
      weaknesses: ["Not mortgage-specific", "Per-user costs", "Limited features"],
      marketPosition: "General sales CRM",
      userBase: "25,000+ companies"
    },
    {
      name: "Five9",
      pricing: "$119 - $299/user",
      monthlyPrice: 119,
      category: "Contact Center",
      keyFeatures: ["Predictive dialer", "Omnichannel", "Analytics"],
      weaknesses: ["50 seat minimum", "Very expensive", "Enterprise focus"],
      marketPosition: "Enterprise contact center",
      userBase: "3,000+ enterprises"
    },
    {
      name: "ICE Encompass",
      pricing: "Enterprise pricing",
      monthlyPrice: 2000,
      category: "Enterprise LOS",
      keyFeatures: ["Full LOS", "Compliance", "Integrations"],
      weaknesses: ["Extremely expensive", "Complex", "Requires IT team"],
      marketPosition: "Market leader LOS",
      userBase: "Large lenders"
    },
    {
      name: "LendingPad",
      pricing: "$50 - $55/month",
      monthlyPrice: 55,
      category: "Cloud LOS",
      keyFeatures: ["Cloud-based", "Fast setup", "Good support"],
      weaknesses: ["Basic features", "Limited automation", "No AI"],
      marketPosition: "Simple cloud LOS",
      userBase: "Small brokers"
    },
    {
      name: "LendingWise",
      pricing: "$149 - $695/month",
      monthlyPrice: 149,
      category: "Private Lending",
      keyFeatures: ["Private lending focus", "Servicing", "White label lite"],
      weaknesses: ["Niche market", "Limited CRM", "High cost"],
      marketPosition: "Private lending specialist",
      userBase: "Hard money lenders"
    },
    {
      name: "Salesforce FSC",
      pricing: "$300 - $700/user",
      monthlyPrice: 300,
      category: "Enterprise CRM",
      keyFeatures: ["Customizable", "AppExchange", "AI features"],
      weaknesses: ["Very expensive", "Complex setup", "Needs consultants"],
      marketPosition: "Enterprise CRM leader",
      userBase: "Fortune 500"
    },
    {
      name: "Zoho One",
      pricing: "$37 - $45/employee",
      monthlyPrice: 37,
      category: "Business Suite",
      keyFeatures: ["45+ apps", "Affordable", "Customizable"],
      weaknesses: ["Not mortgage-specific", "Integration limits", "Learning curve"],
      marketPosition: "SMB all-in-one",
      userBase: "500,000+ businesses"
    },
    {
      name: "HubSpot",
      pricing: "Free - $4,300/month",
      monthlyPrice: 1170,
      category: "Marketing Platform",
      keyFeatures: ["Free CRM", "Marketing hub", "Great UI"],
      weaknesses: ["Expensive scaling", "Not mortgage-specific", "Limited free features"],
      marketPosition: "Inbound marketing leader",
      userBase: "200,000+ companies"
    },
    {
      name: "Shape CRM",
      pricing: "$119/month",
      monthlyPrice: 119,
      category: "Mortgage CRM",
      keyFeatures: ["Simple UI", "AI insights", "Mobile app", "Lead tracking"],
      weaknesses: ["Limited integrations", "No white label", "Basic automation"],
      marketPosition: "User-friendly mortgage CRM",
      userBase: "Mid-size mortgage companies"
    },
    {
      name: "Surefire CRM",
      pricing: "$399+/month",
      monthlyPrice: 399,
      category: "Enterprise Mortgage",
      keyFeatures: ["ICE/Ellie Mae owned", "Marketing automation", "Compliance"],
      weaknesses: ["Very expensive", "Requires Encompass", "Complex setup"],
      marketPosition: "Enterprise mortgage marketing",
      userBase: "Large lenders"
    },
    {
      name: "Velocify",
      pricing: "$250+/user",
      monthlyPrice: 250,
      category: "Lead Management",
      keyFeatures: ["Lead distribution", "Predictive dialing", "Analytics"],
      weaknesses: ["Expensive per-user", "Steep learning curve", "Limited CRM features"],
      marketPosition: "Lead management specialist",
      userBase: "Sales teams"
    },
    {
      name: "PreApp1003",
      pricing: "$99-299/month",
      monthlyPrice: 99,
      category: "Mobile LOS",
      keyFeatures: ["Mobile-first", "1003 application", "Document management"],
      weaknesses: ["Limited features", "No AI", "Basic CRM"],
      marketPosition: "Mobile loan applications",
      userBase: "Small brokers"
    },
    {
      name: "Bonzo",
      pricing: "$25+/month",
      monthlyPrice: 25,
      category: "Conversation CRM",
      keyFeatures: ["Multi-channel messaging", "Campaign builder", "Video messaging"],
      weaknesses: ["6-8 week setup", "Billing issues reported", "Limited features"],
      marketPosition: "Conversation-focused CRM",
      userBase: "Mortgage & real estate"
    }
  ];

  const categories = ["all", "White Label CRM", "Mortgage LOS", "Mortgage CRM", "CRM + Dialer", "Enterprise", "Mobile LOS", "Lead Management", "Enterprise Mortgage", "Conversation CRM"];

  const filteredCompetitors = selectedCategory === "all" 
    ? competitors 
    : competitors.filter(c => c.category === selectedCategory);

  const loanGeniusAdvantages = {
    pricing: { value: 39.99, savings: 0 },
    features: [
      "AI Loan Advisor (All Plans)",
      "LinkedIn Integration",
      "Full White Label",
      "Unlimited Users",
      "Built-in Dialer",
      "Property Search",
      "Document AI",
      "Video Generation",
      "Blockchain Verification",
      "Advanced Analytics"
    ],
    uniqueSellingPoints: [
      { feature: "Price", advantage: "80% cheaper than competitors", icon: DollarSign },
      { feature: "AI Integration", advantage: "AI in all plans (competitors charge extra)", icon: Brain },
      { feature: "All-in-One", advantage: "Replaces 5+ separate tools", icon: Zap },
      { feature: "White Label", advantage: "Full branding at starter price", icon: Building2 }
    ]
  };

  const calculateSavings = (competitorPrice: number) => {
    return ((competitorPrice - loanGeniusAdvantages.pricing.value) / competitorPrice * 100).toFixed(0);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          LoanGenius Competitive Analysis
        </h1>
        <p className="text-xl text-muted-foreground">
          How we deliver 10x more value at 80% less cost
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Our Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">${loanGeniusAdvantages.pricing.value}</div>
            <p className="text-xs text-muted-foreground">All features included</p>
          </CardContent>
        </Card>
        <Card className="border-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Competitor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">$247</div>
            <p className="text-xs text-muted-foreground">Limited features</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">You Save</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">84%</div>
            <p className="text-xs text-muted-foreground">$2,472/year</p>
          </CardContent>
        </Card>
        <Card className="border-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Feature Advantage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">10x</div>
            <p className="text-xs text-muted-foreground">More features</p>
          </CardContent>
        </Card>
      </div>

      {/* Unique Selling Points */}
      <Card>
        <CardHeader>
          <CardTitle>Why LoanGenius Wins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loanGeniusAdvantages.uniqueSellingPoints.map((usp, index) => (
              <div key={index} className="flex flex-col items-center text-center space-y-2 p-4 rounded-lg bg-muted">
                <usp.icon className="h-8 w-8 text-primary" />
                <h3 className="font-semibold">{usp.feature}</h3>
                <p className="text-sm text-muted-foreground">{usp.advantage}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Competitor Comparison */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="text-xs">
              {cat === "all" ? "All Competitors" : cat}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          <ScrollArea className="h-[600px] w-full rounded-md border p-4">
            <div className="space-y-4">
              {filteredCompetitors.map((competitor, index) => (
                <Card key={index} className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2">
                    <Badge variant={competitor.monthlyPrice > 100 ? "destructive" : "secondary"}>
                      {calculateSavings(competitor.monthlyPrice)}% more expensive
                    </Badge>
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{competitor.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{competitor.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{competitor.pricing}</p>
                        <p className="text-xs text-muted-foreground">{competitor.userBase}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Their Features
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {competitor.keyFeatures.map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        What They're Missing
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {competitor.weaknesses.map((weakness, idx) => (
                          <Badge key={idx} variant="destructive" className="text-xs">
                            {weakness}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Cost vs LoanGenius:</span>
                        <span className="font-bold text-red-600">
                          +${(competitor.monthlyPrice - loanGeniusAdvantages.pricing.value).toFixed(2)}/month
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Feature Comparison Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Comparison Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Feature</th>
                  <th className="text-center p-2 bg-green-50">LoanGenius</th>
                  <th className="text-center p-2">Go High Level</th>
                  <th className="text-center p-2">Arive</th>
                  <th className="text-center p-2">BNTouch</th>
                  <th className="text-center p-2">Salesforce</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Starting Price", loangenius: "$39.99", ghl: "$97", arive: "$42", bntouch: "$148", salesforce: "$300" },
                  { feature: "AI Loan Advisor", loangenius: "✓", ghl: "✗", arive: "Limited", bntouch: "✗", salesforce: "Add-on" },
                  { feature: "White Label", loangenius: "✓", ghl: "✓", arive: "✗", bntouch: "✗", salesforce: "✗" },
                  { feature: "Built-in Dialer", loangenius: "✓", ghl: "Limited", arive: "✗", bntouch: "✗", salesforce: "✗" },
                  { feature: "LinkedIn Integration", loangenius: "✓", ghl: "✗", arive: "✗", bntouch: "✗", salesforce: "Limited" },
                  { feature: "Property Search", loangenius: "✓", ghl: "✗", arive: "✗", bntouch: "✗", salesforce: "✗" },
                  { feature: "Document AI", loangenius: "✓", ghl: "✗", arive: "✗", bntouch: "✗", salesforce: "✗" },
                  { feature: "Unlimited Users", loangenius: "✓", ghl: "✗", arive: "✗", bntouch: "✗", salesforce: "✗" },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2 font-medium">{row.feature}</td>
                    <td className="p-2 text-center bg-green-50 font-semibold">{row.loangenius}</td>
                    <td className="p-2 text-center">{row.ghl}</td>
                    <td className="p-2 text-center">{row.arive}</td>
                    <td className="p-2 text-center">{row.bntouch}</td>
                    <td className="p-2 text-center">{row.salesforce}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="text-center py-8 space-y-4">
          <h2 className="text-3xl font-bold">Ready to Save 84% While Getting 10x More Features?</h2>
          <p className="text-xl opacity-90">
            Join thousands of loan officers who switched to LoanGenius and transformed their business
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" variant="secondary">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/20">
              Schedule Demo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}