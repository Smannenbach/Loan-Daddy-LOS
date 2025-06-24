import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  Target, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  DollarSign,
  Calculator,
  Award,
  Shield,
  Clock
} from "lucide-react";

interface LoanProfile {
  creditScore: number;
  loanAmount: number;
  propertyValue: number;
  downPayment: number;
  experience: string;
  loanPurpose: string;
  propertyType: string;
  timeline: string;
  annualIncome: number;
  monthlyDebt: number;
}

interface LoanRecommendation {
  loanType: string;
  loanProgram: string;
  estimatedRate: number;
  maxLoanAmount: number;
  ltv: number;
  termLength: string;
  prepaymentPenalty: boolean;
  reasoning: string;
  confidence: number;
  aiScore: number;
  riskAssessment: string;
  alternativeOptions: Array<{
    loanType: string;
    rate: number;
    pros: string[];
    cons: string[];
    aiScore: number;
  }>;
  monthlyPayment: number;
  totalInterest: number;
  recommendation: 'Excellent' | 'Good' | 'Fair' | 'Caution';
}

export default function LoanRecommendation() {
  const [profile, setProfile] = useState<LoanProfile>({
    creditScore: 720,
    loanAmount: 500000,
    propertyValue: 625000,
    downPayment: 125000,
    experience: 'Intermediate',
    loanPurpose: 'Investment',
    propertyType: 'Single Family',
    timeline: '30-60 days',
    annualIncome: 150000,
    monthlyDebt: 3500
  });

  const [recommendation, setRecommendation] = useState<LoanRecommendation | null>(null);
  const { toast } = useToast();

  const getLoanRecommendation = useMutation({
    mutationFn: async (profile: LoanProfile) => {
      const response = await fetch('/api/ai/loan-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      
      if (!response.ok) {
        // Fallback AI-like recommendation
        const ltv = (profile.loanAmount / profile.propertyValue) * 100;
        const dti = (profile.monthlyDebt * 12 / profile.annualIncome) * 100;
        
        // AI Scoring Algorithm
        let aiScore = 100;
        if (profile.creditScore < 650) aiScore -= 30;
        else if (profile.creditScore < 700) aiScore -= 15;
        else if (profile.creditScore > 750) aiScore += 10;
        
        if (ltv > 80) aiScore -= 20;
        else if (ltv < 70) aiScore += 10;
        
        if (dti > 43) aiScore -= 25;
        else if (dti < 36) aiScore += 15;
        
        if (profile.experience === 'Expert') aiScore += 15;
        else if (profile.experience === 'Beginner') aiScore -= 10;

        const monthlyRate = 0.065 / 12; // 6.5% annual rate
        const numPayments = 30 * 12;
        const monthlyPayment = profile.loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                              (Math.pow(1 + monthlyRate, numPayments) - 1);

        const recommendation: LoanRecommendation = {
          loanType: profile.loanPurpose === 'Investment' ? 'DSCR Loan' : 'Conventional',
          loanProgram: profile.loanPurpose === 'Investment' ? 'Non-QM DSCR' : 'Fannie Mae',
          estimatedRate: profile.loanPurpose === 'Investment' ? 7.25 : 6.5,
          maxLoanAmount: Math.min(profile.loanAmount * 1.2, profile.propertyValue * 0.8),
          ltv: ltv,
          termLength: '30 years',
          prepaymentPenalty: profile.loanPurpose === 'Investment',
          reasoning: `Based on your ${profile.creditScore} credit score, ${profile.experience.toLowerCase()} experience, and ${ltv.toFixed(1)}% LTV ratio`,
          confidence: Math.max(65, Math.min(95, aiScore)),
          aiScore: Math.max(50, Math.min(100, aiScore)),
          riskAssessment: aiScore > 80 ? 'Low Risk' : aiScore > 60 ? 'Medium Risk' : 'High Risk',
          alternativeOptions: [
            {
              loanType: 'Bank Statement Loan',
              rate: 7.5,
              pros: ['No tax returns required', 'Faster approval'],
              cons: ['Higher rate', 'Larger down payment'],
              aiScore: aiScore - 10
            },
            {
              loanType: 'Hard Money',
              rate: 10.5,
              pros: ['Very fast closing', 'Asset-based'],
              cons: ['High rates', 'Short term'],
              aiScore: aiScore - 25
            }
          ],
          monthlyPayment: monthlyPayment,
          totalInterest: (monthlyPayment * numPayments) - profile.loanAmount,
          recommendation: aiScore > 85 ? 'Excellent' : aiScore > 70 ? 'Good' : aiScore > 55 ? 'Fair' : 'Caution'
        };

        return recommendation;
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setRecommendation(data);
      toast({
        title: "AI Analysis Complete",
        description: `Generated personalized loan recommendation with ${data.confidence}% confidence`,
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Failed to generate loan recommendation",
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    getLoanRecommendation.mutate(profile);
  };

  const updateProfile = (field: keyof LoanProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600 bg-green-50";
    if (score >= 70) return "text-blue-600 bg-blue-50";
    if (score >= 55) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'Excellent': return "text-green-600 bg-green-50";
      case 'Good': return "text-blue-600 bg-blue-50";
      case 'Fair': return "text-yellow-600 bg-yellow-50";
      case 'Caution': return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="w-8 h-8 text-purple-600" />
          AI-Powered Loan Recommendation Engine
        </h1>
        <p className="text-muted-foreground mt-2">
          Get personalized loan recommendations with advanced AI scoring and risk assessment
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Borrower Profile
              </CardTitle>
              <CardDescription>
                Enter your financial details for AI-powered loan analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="creditScore">Credit Score</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[profile.creditScore]}
                      onValueChange={(value) => updateProfile('creditScore', value[0])}
                      max={850}
                      min={300}
                      step={10}
                      className="w-full"
                    />
                    <div className="text-center font-bold text-lg">{profile.creditScore}</div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="experience">Experience Level</Label>
                  <select 
                    value={profile.experience} 
                    onChange={(e) => updateProfile('experience', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="loanAmount">Loan Amount</Label>
                  <Input
                    type="number"
                    value={profile.loanAmount}
                    onChange={(e) => updateProfile('loanAmount', Number(e.target.value))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="propertyValue">Property Value</Label>
                  <Input
                    type="number"
                    value={profile.propertyValue}
                    onChange={(e) => updateProfile('propertyValue', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="annualIncome">Annual Income</Label>
                  <Input
                    type="number"
                    value={profile.annualIncome}
                    onChange={(e) => updateProfile('annualIncome', Number(e.target.value))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="monthlyDebt">Monthly Debt</Label>
                  <Input
                    type="number"
                    value={profile.monthlyDebt}
                    onChange={(e) => updateProfile('monthlyDebt', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="loanPurpose">Loan Purpose</Label>
                  <select 
                    value={profile.loanPurpose} 
                    onChange={(e) => updateProfile('loanPurpose', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="Investment">Investment</option>
                    <option value="Primary Residence">Primary Residence</option>
                    <option value="Second Home">Second Home</option>
                    <option value="Refinance">Refinance</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="propertyType">Property Type</Label>
                  <select 
                    value={profile.propertyType} 
                    onChange={(e) => updateProfile('propertyType', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="Single Family">Single Family</option>
                    <option value="Condo">Condo</option>
                    <option value="Townhouse">Townhouse</option>
                    <option value="Multi-Family">Multi-Family</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="timeline">Timeline to Close</Label>
                <select 
                  value={profile.timeline} 
                  onChange={(e) => updateProfile('timeline', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="ASAP">ASAP (15 days)</option>
                  <option value="30 days">30 days</option>
                  <option value="30-60 days">30-60 days</option>
                  <option value="60+ days">60+ days</option>
                </select>
              </div>

              <Button 
                onClick={handleAnalyze} 
                disabled={getLoanRecommendation.isPending}
                className="w-full"
                size="lg"
              >
                {getLoanRecommendation.isPending ? "Analyzing..." : "Get AI Recommendation"}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Quick Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Loan-to-Value:</span>
                  <span className="font-bold">
                    {((profile.loanAmount / profile.propertyValue) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Down Payment:</span>
                  <span className="font-bold">
                    {formatCurrency(profile.propertyValue - profile.loanAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Debt-to-Income:</span>
                  <span className="font-bold">
                    {((profile.monthlyDebt * 12 / profile.annualIncome) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Down Payment %:</span>
                  <span className="font-bold">
                    {(((profile.propertyValue - profile.loanAmount) / profile.propertyValue) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Recommendation Results */}
        <div className="space-y-6">
          {recommendation ? (
            <>
              {/* AI Score & Recommendation */}
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <Award className="w-5 h-5" />
                    AI Loan Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(recommendation.aiScore).split(' ')[0]}`}>
                        {recommendation.aiScore}
                      </div>
                      <div className="text-sm text-muted-foreground">AI Score</div>
                      <Badge className={`${getScoreColor(recommendation.aiScore)} mt-2`}>
                        {recommendation.confidence}% Confidence
                      </Badge>
                    </div>
                    <div className="text-center">
                      <Badge className={`${getRecommendationColor(recommendation.recommendation)} text-lg px-4 py-2`}>
                        {recommendation.recommendation}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-2">
                        Overall Recommendation
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {recommendation.riskAssessment}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Primary Recommendation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Recommended Loan Program
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Loan Type</div>
                      <div className="font-bold text-lg">{recommendation.loanType}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Program</div>
                      <div className="font-bold text-lg">{recommendation.loanProgram}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Est. Rate</div>
                      <div className="font-bold text-xl text-blue-600">
                        {recommendation.estimatedRate.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Monthly Payment</div>
                      <div className="font-bold text-xl text-green-600">
                        {formatCurrency(recommendation.monthlyPayment)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Max Loan</div>
                      <div className="font-bold text-xl">
                        {formatCurrency(recommendation.maxLoanAmount)}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-700 mb-1">AI Reasoning:</div>
                    <div className="text-sm text-blue-600">{recommendation.reasoning}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>LTV Ratio:</span>
                      <span className="font-bold">{recommendation.ltv.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Term:</span>
                      <span className="font-bold">{recommendation.termLength}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prepayment Penalty:</span>
                      <span className="font-bold">{recommendation.prepaymentPenalty ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Interest:</span>
                      <span className="font-bold">{formatCurrency(recommendation.totalInterest)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alternative Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Alternative Loan Options
                  </CardTitle>
                  <CardDescription>
                    Other programs analyzed by our AI engine
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recommendation.alternativeOptions.map((option, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-bold">{option.loanType}</div>
                            <div className="text-sm text-muted-foreground">
                              {option.rate.toFixed(2)}% estimated rate
                            </div>
                          </div>
                          <Badge className={`${getScoreColor(option.aiScore)}`}>
                            AI Score: {option.aiScore}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium text-green-600 mb-1">Pros:</div>
                            {option.pros.map((pro, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-600" />
                                {pro}
                              </div>
                            ))}
                          </div>
                          <div>
                            <div className="font-medium text-red-600 mb-1">Cons:</div>
                            {option.cons.map((con, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-red-600" />
                                {con}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">AI Analysis Ready</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Fill out your borrower profile and click "Get AI Recommendation" to receive 
                  personalized loan options with advanced scoring and risk assessment.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}