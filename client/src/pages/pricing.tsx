import { Check, X, Zap, Shield, Brain, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "wouter";

const plans = [
  {
    name: "Starter",
    id: "starter",
    price: "$39.99",
    originalPrice: "$60",
    description: "Perfect for solo loan officers starting their journey",
    seats: "1 User",
    features: [
      { name: "AI-Powered Loan Advisor", included: true, premium: true },
      { name: "Unlimited Loan Applications", included: true },
      { name: "Basic CRM & Pipeline", included: true },
      { name: "Document Management & OCR", included: true },
      { name: "LinkedIn Lead Generation (50/mo)", included: true },
      { name: "AI Property Analysis", included: true },
      { name: "Email & SMS Automation", included: true },
      { name: "Mobile App Access", included: true },
      { name: "Basic Analytics Dashboard", included: true },
      { name: "Standard Support", included: true },
      { name: "Advanced AI Features", included: false },
      { name: "Team Collaboration", included: false },
      { name: "Custom Branding", included: false },
      { name: "API Access", included: false },
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    id: "professional",
    price: "$69.99",
    originalPrice: "$120",
    description: "For growing teams who need advanced features",
    seats: "Up to 5 Users",
    features: [
      { name: "Everything in Starter, plus:", included: true, header: true },
      { name: "AI Voice Assistant & Chatbot", included: true, premium: true },
      { name: "Advanced AI Underwriting", included: true, premium: true },
      { name: "LinkedIn Lead Generation (500/mo)", included: true },
      { name: "Multi-channel Communication", included: true },
      { name: "Team Collaboration Tools", included: true },
      { name: "Custom Branded Portal", included: true },
      { name: "Advanced Analytics & Reporting", included: true },
      { name: "Workflow Automation Builder", included: true },
      { name: "Priority Support", included: true },
      { name: "API Access (1000 calls/mo)", included: true },
      { name: "Blockchain Document Verification", included: false },
      { name: "White-label Options", included: false },
      { name: "Dedicated Account Manager", included: false },
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    id: "enterprise",
    price: "$149.99",
    originalPrice: "$300",
    description: "Full platform access with unlimited possibilities",
    seats: "Unlimited Users",
    features: [
      { name: "Everything in Professional, plus:", included: true, header: true },
      { name: "AI Video Property Tours", included: true, premium: true },
      { name: "Predictive Analytics & ML Models", included: true, premium: true },
      { name: "Blockchain Document Verification", included: true, premium: true },
      { name: "LinkedIn Lead Generation (Unlimited)", included: true },
      { name: "White-label & Custom Domain", included: true },
      { name: "Unlimited API Access", included: true },
      { name: "Custom AI Model Training", included: true },
      { name: "Dedicated Account Manager", included: true },
      { name: "24/7 Premium Support", included: true },
      { name: "Custom Integrations", included: true },
      { name: "Compliance Automation", included: true },
      { name: "Advanced Security & SSO", included: true },
      { name: "SLA Guarantee", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const comparisonData = [
  { feature: "Loan Applications", starter: "Unlimited", professional: "Unlimited", enterprise: "Unlimited", arive: "Limited" },
  { feature: "AI Loan Advisor", starter: "✓", professional: "✓", enterprise: "✓", arive: "✗" },
  { feature: "LinkedIn Integration", starter: "50/mo", professional: "500/mo", enterprise: "Unlimited", arive: "✗" },
  { feature: "Document OCR", starter: "✓", professional: "✓", enterprise: "✓", arive: "Basic" },
  { feature: "AI Voice Assistant", starter: "✗", professional: "✓", enterprise: "✓", arive: "✗" },
  { feature: "Custom Branding", starter: "✗", professional: "✓", enterprise: "✓", arive: "Limited" },
  { feature: "API Access", starter: "✗", professional: "1000/mo", enterprise: "Unlimited", arive: "✗" },
  { feature: "Support", starter: "Standard", professional: "Priority", enterprise: "24/7", arive: "Standard" },
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img src="/loangenius-logo.png" alt="LoanGenius" className="h-8 w-auto" />
            </div>
            <Button onClick={() => navigate("/signup")} className="bg-indigo-600 hover:bg-indigo-700">
              Get Started
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center py-16 px-4">
        <Badge className="mb-4" variant="secondary">
          <Sparkles className="w-3 h-3 mr-1" />
          Limited Time: Save up to 50% vs Competitors
        </Badge>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Pricing That Grows With You
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          More features, better AI, lower prices than Arive. Start with a 14-day free trial.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'border-indigo-600 shadow-xl scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-0 right-0 mx-auto w-32">
                  <Badge className="w-full justify-center py-1 bg-indigo-600">
                    MOST POPULAR
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-8 pt-6">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="mt-2">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-lg text-gray-600">/user/month</span>
                  {plan.originalPrice && (
                    <div className="text-sm text-gray-500 line-through mt-1">
                      {plan.originalPrice}/user/month
                    </div>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-600">{plan.seats}</div>
              </CardHeader>
              <CardContent className="pt-6 pb-8">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className={`flex items-start ${feature.header ? 'font-semibold mb-2' : ''}`}>
                      {!feature.header && (
                        feature.included ? (
                          <Check className={`w-5 h-5 mr-2 flex-shrink-0 ${feature.premium ? 'text-indigo-600' : 'text-green-600'}`} />
                        ) : (
                          <X className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
                        )
                      )}
                      <span className={!feature.included ? 'text-gray-400' : ''}>
                        {feature.name}
                        {feature.premium && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            <Brain className="w-3 h-3 mr-1" />
                            AI
                          </Badge>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className={`w-full ${plan.popular ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => navigate(`/signup?plan=${plan.id}`)}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why LoanGenius Beats the Competition
            </h2>
            <p className="text-lg text-gray-600">
              See how we compare to Arive and other loan origination platforms
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Features</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      <div>Starter</div>
                      <div className="text-indigo-600 font-normal">$39.99</div>
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      <div>Professional</div>
                      <div className="text-indigo-600 font-normal">$69.99</div>
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      <div>Enterprise</div>
                      <div className="text-indigo-600 font-normal">$149.99</div>
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 bg-gray-100">
                      <div>Arive</div>
                      <div className="text-gray-600 font-normal">$49.99+</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {comparisonData.map((row, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.feature}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">{row.starter}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">{row.professional}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">{row.enterprise}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600 bg-gray-50">{row.arive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Enterprise-Grade Features in Every Plan
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Everything</h3>
              <p className="text-gray-600">
                From loan recommendations to document processing, our AI does the heavy lifting
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Bank-Level Security</h3>
              <p className="text-gray-600">
                SOC 2 compliant with end-to-end encryption and blockchain verification
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-gray-600">
                Process loans 10x faster with automated workflows and instant decisions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Supercharge Your Loan Business?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of loan officers saving time and closing more deals with LoanGenius
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate("/signup")}
          >
            Start Your 14-Day Free Trial
          </Button>
          <p className="text-sm text-indigo-100 mt-4">
            No credit card required • Setup in 5 minutes • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}