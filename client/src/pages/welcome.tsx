import { useState, useEffect } from "react";
import { useSearchParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, ArrowRight, Sparkles, Rocket, Building2, Users, Brain, TrendingUp } from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  action: string;
}

export default function Welcome() {
  const [searchParams] = useSearchParams();
  const subdomain = searchParams.get("subdomain") || "yourcompany";
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  
  const onboardingSteps: OnboardingStep[] = [
    {
      id: "brand",
      title: "Customize Your Brand",
      description: "Upload your logo and set brand colors",
      icon: <Building2 className="w-5 h-5" />,
      completed: false,
      action: "Customize Brand"
    },
    {
      id: "team",
      title: "Invite Your Team",
      description: "Add loan officers and set permissions",
      icon: <Users className="w-5 h-5" />,
      completed: false,
      action: "Invite Team"
    },
    {
      id: "linkedin",
      title: "Connect LinkedIn",
      description: "Start generating leads from LinkedIn",
      icon: <TrendingUp className="w-5 h-5" />,
      completed: false,
      action: "Connect LinkedIn"
    },
    {
      id: "ai",
      title: "Configure AI Assistant",
      description: "Set up your AI voice assistant preferences",
      icon: <Brain className="w-5 h-5" />,
      completed: false,
      action: "Configure AI"
    }
  ];

  useEffect(() => {
    // Animate progress
    const timer = setTimeout(() => {
      setProgress(25);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const completeStep = (index: number) => {
    setCurrentStep(index + 1);
    setProgress((index + 1) * 25);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Welcome to LoanGenius! 🎉</h1>
          <p className="text-xl text-gray-600 mb-6">
            Your loan origination platform is ready at:
          </p>
          <div className="inline-flex items-center gap-2 bg-gray-100 rounded-lg px-6 py-3">
            <span className="text-lg font-mono font-semibold text-indigo-600">
              {subdomain}.loangenius.ai
            </span>
            <Badge className="bg-green-600">ACTIVE</Badge>
          </div>
        </div>

        {/* Quick Start Guide */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-indigo-600" />
              Quick Start Guide
            </CardTitle>
            <CardDescription>
              Complete these steps to unlock the full power of LoanGenius
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Setup Progress</span>
                <span className="font-medium">{progress}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="space-y-4">
              {onboardingSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`border rounded-lg p-4 transition-all ${
                    index === currentStep ? 'border-indigo-600 bg-indigo-50' : 
                    index < currentStep ? 'border-green-500 bg-green-50' : 
                    'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        index < currentStep ? 'bg-green-600 text-white' :
                        index === currentStep ? 'bg-indigo-600 text-white' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {index < currentStep ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          step.icon
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{step.title}</h3>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                    </div>
                    {index === currentStep ? (
                      <Button 
                        size="sm"
                        onClick={() => completeStep(index)}
                      >
                        {step.action}
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    ) : index < currentStep ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Brain className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold mb-2">AI-Powered Everything</h3>
                <p className="text-sm text-gray-600">
                  Your AI assistant is ready to handle loan applications via voice
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Lead Generation</h3>
                <p className="text-sm text-gray-600">
                  LinkedIn integration ready to find qualified borrowers
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Advanced Analytics</h3>
                <p className="text-sm text-gray-600">
                  Real-time dashboards and predictive insights at your fingertips
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <strong>Pro Tip:</strong> Complete the setup in the next 24 hours to unlock a special bonus - 
            1000 free LinkedIn lead searches (normally $100 value)!
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button size="lg" onClick={() => window.location.href = `https://${subdomain}.loangenius.ai`}>
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button size="lg" variant="outline">
            Watch Tutorial
          </Button>
        </div>

        {/* Support Footer */}
        <div className="text-center mt-12 text-gray-600">
          <p className="text-sm">
            Need help? Contact our support team at{" "}
            <a href="mailto:support@loangenius.ai" className="text-indigo-600 hover:underline">
              support@loangenius.ai
            </a>
            {" "}or call (888) 555-LOAN
          </p>
        </div>
      </div>
    </div>
  );
}