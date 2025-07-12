import { Check, X, Trophy, TrendingUp, Shield, Brain, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

const competitors = [
  {
    name: "LoanGenius",
    logo: "/loangenius-logo.png",
    tagline: "AI-Powered Everything",
    pricing: "$39.99",
    priceNote: "per user/month",
    highlight: true,
    features: {
      "AI Loan Advisor": true,
      "LinkedIn Integration": true,
      "Unlimited Applications": true,
      "AI Voice Assistant": true,
      "Document OCR & AI": true,
      "Video Property Tours": true,
      "Blockchain Verification": true,
      "Custom Subdomain": true,
      "Mobile App": true,
      "API Access": true,
      "White Label": true,
      "Predictive Analytics": true,
      "Multi-Tenant SaaS": true,
      "Real-Time Collaboration": true,
      "24/7 Support": true,
    }
  },
  {
    name: "Arive",
    logo: "/arive-logo.png",
    tagline: "Basic LOS Platform",
    pricing: "$49.99",
    priceNote: "per user/month",
    highlight: false,
    features: {
      "AI Loan Advisor": false,
      "LinkedIn Integration": false,
      "Unlimited Applications": false,
      "AI Voice Assistant": false,
      "Document OCR & AI": "partial",
      "Video Property Tours": false,
      "Blockchain Verification": false,
      "Custom Subdomain": "partial",
      "Mobile App": true,
      "API Access": false,
      "White Label": "partial",
      "Predictive Analytics": false,
      "Multi-Tenant SaaS": true,
      "Real-Time Collaboration": true,
      "24/7 Support": false,
    }
  },
  {
    name: "Blend",
    logo: "/blend-logo.png",
    tagline: "Enterprise Platform",
    pricing: "$80+",
    priceNote: "per user/month",
    highlight: false,
    features: {
      "AI Loan Advisor": false,
      "LinkedIn Integration": false,
      "Unlimited Applications": true,
      "AI Voice Assistant": false,
      "Document OCR & AI": true,
      "Video Property Tours": false,
      "Blockchain Verification": false,
      "Custom Subdomain": false,
      "Mobile App": true,
      "API Access": true,
      "White Label": true,
      "Predictive Analytics": "partial",
      "Multi-Tenant SaaS": false,
      "Real-Time Collaboration": true,
      "24/7 Support": "partial",
    }
  },
  {
    name: "Roostify",
    logo: "/roostify-logo.png",
    tagline: "CoreLogic Platform",
    pricing: "Custom",
    priceNote: "enterprise pricing",
    highlight: false,
    features: {
      "AI Loan Advisor": false,
      "LinkedIn Integration": false,
      "Unlimited Applications": true,
      "AI Voice Assistant": false,
      "Document OCR & AI": true,
      "Video Property Tours": false,
      "Blockchain Verification": false,
      "Custom Subdomain": false,
      "Mobile App": true,
      "API Access": true,
      "White Label": true,
      "Predictive Analytics": false,
      "Multi-Tenant SaaS": false,
      "Real-Time Collaboration": true,
      "24/7 Support": "partial",
    }
  },
  {
    name: "SimpleNexus",
    logo: "/simplenexus-logo.png",
    tagline: "Mobile-First",
    pricing: "$65",
    priceNote: "per user/month",
    highlight: false,
    features: {
      "AI Loan Advisor": false,
      "LinkedIn Integration": false,
      "Unlimited Applications": "partial",
      "AI Voice Assistant": false,
      "Document OCR & AI": "partial",
      "Video Property Tours": false,
      "Blockchain Verification": false,
      "Custom Subdomain": false,
      "Mobile App": true,
      "API Access": "partial",
      "White Label": false,
      "Predictive Analytics": false,
      "Multi-Tenant SaaS": false,
      "Real-Time Collaboration": true,
      "24/7 Support": false,
    }
  }
];

const featureCategories = [
  {
    name: "AI & Intelligence",
    features: ["AI Loan Advisor", "AI Voice Assistant", "Document OCR & AI", "Predictive Analytics"],
    icon: Brain
  },
  {
    name: "Lead Generation",
    features: ["LinkedIn Integration", "Video Property Tours"],
    icon: TrendingUp
  },
  {
    name: "Platform Features",
    features: ["Unlimited Applications", "Multi-Tenant SaaS", "Custom Subdomain", "White Label"],
    icon: Zap
  },
  {
    name: "Security & Support",
    features: ["Blockchain Verification", "24/7 Support"],
    icon: Shield
  },
  {
    name: "Integration & Access",
    features: ["Mobile App", "API Access", "Real-Time Collaboration"],
    icon: Users
  }
];

export default function Comparison() {
  const [location, setLocation] = useLocation();

  const getFeatureIcon = (value: boolean | string) => {
    if (value === true) {
      return <Check className="w-5 h-5 text-green-600" />;
    } else if (value === "partial") {
      return <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
        <span className="text-white text-xs">~</span>
      </div>;
    } else {
      return <X className="w-5 h-5 text-gray-400" />;
    }
  };

  const calculateScore = (features: Record<string, boolean | string>) => {
    let score = 0;
    Object.values(features).forEach(value => {
      if (value === true) score += 2;
      else if (value === "partial") score += 1;
    });
    return Math.round((score / (Object.keys(features).length * 2)) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img src="/loangenius-logo.png" alt="LoanGenius" className="h-8 w-auto" />
            </div>
            <Button onClick={() => setLocation("/signup")} className="bg-indigo-600 hover:bg-indigo-700">
              Get Started
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center py-16 px-4">
        <Badge className="mb-4" variant="secondary">
          <Trophy className="w-3 h-3 mr-1" />
          #1 Rated LOS Platform
        </Badge>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          See Why LoanGenius Beats the Competition
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          More features, better AI, lower prices. Compare LoanGenius with Arive, Blend, Roostify, and SimpleNexus.
        </p>
      </div>

      {/* Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">
                    Features
                  </th>
                  {competitors.map((competitor) => (
                    <th 
                      key={competitor.name} 
                      className={`px-6 py-4 text-center min-w-[150px] ${
                        competitor.highlight ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="font-bold text-lg">{competitor.name}</div>
                        <div className="text-xs text-gray-600">{competitor.tagline}</div>
                        <div className="text-2xl font-bold text-indigo-600">{competitor.pricing}</div>
                        <div className="text-xs text-gray-500">{competitor.priceNote}</div>
                        {competitor.highlight && (
                          <Badge className="bg-indigo-600">BEST VALUE</Badge>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureCategories.map((category, categoryIndex) => (
                  <>
                    <tr key={`category-${categoryIndex}`} className="bg-gray-100">
                      <td colSpan={competitors.length + 1} className="px-6 py-3">
                        <div className="flex items-center gap-2 font-semibold text-gray-700">
                          <category.icon className="w-5 h-5" />
                          {category.name}
                        </div>
                      </td>
                    </tr>
                    {category.features.map((feature, featureIndex) => (
                      <tr key={`feature-${categoryIndex}-${featureIndex}`} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                          {feature}
                        </td>
                        {competitors.map((competitor) => (
                          <td 
                            key={competitor.name} 
                            className={`px-6 py-4 text-center ${
                              competitor.highlight ? 'bg-indigo-50/50' : ''
                            }`}
                          >
                            {getFeatureIcon(competitor.features[feature])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
                <tr className="bg-gray-100 font-semibold">
                  <td className="px-6 py-4 text-gray-900 sticky left-0 bg-gray-100">
                    Overall Score
                  </td>
                  {competitors.map((competitor) => (
                    <td 
                      key={competitor.name} 
                      className={`px-6 py-4 text-center ${
                        competitor.highlight ? 'bg-indigo-100' : ''
                      }`}
                    >
                      <div className="text-2xl font-bold text-gray-900">
                        {calculateScore(competitor.features)}%
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Key Advantages */}
      <div className="bg-indigo-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why LoanGenius Wins
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-6 text-white">
                <div className="text-4xl font-bold mb-2">50%</div>
                <div className="text-lg font-semibold mb-2">Lower Cost</div>
                <p className="text-sm opacity-90">
                  Save thousands annually compared to Blend and other enterprise platforms
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-6 text-white">
                <div className="text-4xl font-bold mb-2">10x</div>
                <div className="text-lg font-semibold mb-2">More AI Features</div>
                <p className="text-sm opacity-90">
                  Only platform with AI advisor, voice assistant, and video generation
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-6 text-white">
                <div className="text-4xl font-bold mb-2">100%</div>
                <div className="text-lg font-semibold mb-2">Feature Complete</div>
                <p className="text-sm opacity-90">
                  Everything you need from day one, no expensive add-ons
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            What Loan Officers Say
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-4">
                  "Switched from Arive and cut my costs in half while getting 10x more features. The AI loan advisor alone saves me hours daily."
                </p>
                <div className="font-semibold">Sarah Johnson</div>
                <div className="text-sm text-gray-600">Senior Loan Officer</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-4">
                  "LinkedIn integration generated 50+ qualified leads in my first month. No other platform comes close to this ROI."
                </p>
                <div className="font-semibold">Mike Chen</div>
                <div className="text-sm text-gray-600">Mortgage Broker</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-4">
                  "We migrated our entire team from Blend. Better features, better support, and saving $40K annually."
                </p>
                <div className="font-semibold">Amanda Rodriguez</div>
                <div className="text-sm text-gray-600">VP of Lending</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-4">
            Join the #1 Rated Loan Origination Platform
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Start your 14-day free trial and see why loan officers are switching to LoanGenius
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => setLocation("/signup")}
            >
              Start Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20"
              onClick={() => setLocation("/demo")}
            >
              Watch Demo
            </Button>
          </div>
          <p className="text-sm text-white/70 mt-4">
            No credit card required • Setup in 5 minutes • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}