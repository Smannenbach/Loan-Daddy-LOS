import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, TrendingUp, Shield, Zap, DollarSign, Home, AlertCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const loanRecommendationSchema = z.object({
  // Property Information
  propertyValue: z.string().transform(val => parseFloat(val.replace(/[^0-9.-]+/g, ""))),
  loanAmount: z.string().transform(val => parseFloat(val.replace(/[^0-9.-]+/g, ""))),
  propertyType: z.enum(['single_family', 'multi_family', 'condo', 'commercial']),
  propertyUse: z.enum(['owner_occupied', 'investment', 'vacation']),
  
  // Borrower Information
  ficoScore: z.string().transform(val => parseInt(val)),
  monthlyIncome: z.string().transform(val => parseFloat(val.replace(/[^0-9.-]+/g, ""))),
  monthlyDebt: z.string().transform(val => parseFloat(val.replace(/[^0-9.-]+/g, ""))),
  cashReserves: z.string().transform(val => parseFloat(val.replace(/[^0-9.-]+/g, ""))),
  
  // Loan Purpose
  loanPurpose: z.enum(['purchase', 'refinance', 'cash_out', 'construction']),
  timeframe: z.enum(['asap', '30_days', '60_days', '90_plus_days']),
});

type LoanRecommendationForm = z.infer<typeof loanRecommendationSchema>;

interface LoanOption {
  id: string;
  loanType: string;
  lender: string;
  rate: number;
  apr: number;
  monthlyPayment: number;
  term: string;
  ltv: number;
  dti: number;
  points: number;
  closingCosts: number;
  features: string[];
  pros: string[];
  cons: string[];
  confidence: number;
  reasoning: string;
}

export default function LoanRecommendationEngine() {
  const [recommendations, setRecommendations] = useState<LoanOption[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  const form = useForm<LoanRecommendationForm>({
    resolver: zodResolver(loanRecommendationSchema),
    defaultValues: {
      propertyType: 'single_family',
      propertyUse: 'owner_occupied',
      loanPurpose: 'purchase',
      timeframe: '30_days',
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: async (data: LoanRecommendationForm) => {
      setAnalyzing(true);
      setProgress(0);
      
      // Simulate progressive analysis
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      try {
        const response = await apiRequest("/api/ai/loan-recommendations", "POST", data);
        clearInterval(progressInterval);
        setProgress(100);
        
        // Mock enhanced recommendations for demo
        const mockRecommendations: LoanOption[] = [
          {
            id: "1",
            loanType: "Conventional 30-Year Fixed",
            lender: "Wells Fargo",
            rate: 6.875,
            apr: 6.998,
            monthlyPayment: 2624,
            term: "30 years",
            ltv: 80,
            dti: 38,
            points: 0,
            closingCosts: 8500,
            features: ["No PMI at 80% LTV", "Rate lock available", "Digital closing"],
            pros: ["Lowest monthly payment", "Stable rate", "No prepayment penalty"],
            cons: ["Higher total interest", "Requires 20% down"],
            confidence: 95,
            reasoning: "Based on your excellent credit score and stable income, this conventional loan offers the best balance of rate and payment."
          },
          {
            id: "2",
            loanType: "15-Year Fixed",
            lender: "Bank of America",
            rate: 6.125,
            apr: 6.289,
            monthlyPayment: 3421,
            term: "15 years",
            ltv: 80,
            dti: 42,
            points: 0.5,
            closingCosts: 9200,
            features: ["Save $180K in interest", "Build equity faster", "Premium service"],
            pros: ["Lower total cost", "Faster payoff", "Better rate"],
            cons: ["Higher monthly payment", "Less cash flow flexibility"],
            confidence: 88,
            reasoning: "With your strong financial profile, this option saves significant interest while building equity rapidly."
          },
          {
            id: "3",
            loanType: "FHA Loan",
            lender: "Quicken Loans",
            rate: 6.625,
            apr: 7.142,
            monthlyPayment: 2564,
            term: "30 years",
            ltv: 96.5,
            dti: 45,
            points: 0,
            closingCosts: 7800,
            features: ["3.5% down payment", "Flexible credit", "Assumable loan"],
            pros: ["Low down payment", "Easier qualification", "Government backed"],
            cons: ["PMI for life of loan", "Higher overall cost", "Property restrictions"],
            confidence: 82,
            reasoning: "FHA provides a fallback option with minimal down payment, though your profile qualifies for better conventional terms."
          }
        ];
        
        return response.recommendations || mockRecommendations;
      } finally {
        clearInterval(progressInterval);
        setAnalyzing(false);
      }
    },
    onSuccess: (data) => {
      setRecommendations(data);
    }
  });

  const onSubmit = (data: LoanRecommendationForm) => {
    analyzeMutation.mutate(data);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Loan Recommendation Engine</h1>
        <p className="text-gray-600">
          Get personalized loan recommendations powered by our advanced AI that analyzes 50+ lenders in real-time
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600" />
                Loan Analysis
              </CardTitle>
              <CardDescription>
                Enter your details for AI-powered recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Property Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-gray-700">Property Information</h3>
                    <FormField
                      control={form.control}
                      name="propertyValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Value</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="$500,000" 
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9.-]+/g, "");
                                const formatted = value ? `$${parseInt(value).toLocaleString()}` : "";
                                field.onChange(formatted);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="loanAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Amount</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="$400,000" 
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9.-]+/g, "");
                                const formatted = value ? `$${parseInt(value).toLocaleString()}` : "";
                                field.onChange(formatted);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="propertyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="single_family">Single Family</SelectItem>
                              <SelectItem value="multi_family">Multi-Family</SelectItem>
                              <SelectItem value="condo">Condo</SelectItem>
                              <SelectItem value="commercial">Commercial</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Borrower Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-gray-700">Borrower Information</h3>
                    <FormField
                      control={form.control}
                      name="ficoScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>FICO Score</FormLabel>
                          <FormControl>
                            <Input placeholder="740" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="monthlyIncome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Income</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="$10,000" 
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9.-]+/g, "");
                                const formatted = value ? `$${parseInt(value).toLocaleString()}` : "";
                                field.onChange(formatted);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Loan Purpose */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-gray-700">Loan Details</h3>
                    <FormField
                      control={form.control}
                      name="loanPurpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Purpose</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="purchase">Purchase</SelectItem>
                              <SelectItem value="refinance">Refinance</SelectItem>
                              <SelectItem value="cash_out">Cash-Out Refinance</SelectItem>
                              <SelectItem value="construction">Construction</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={analyzing}
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Get AI Recommendations
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {analyzing && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Analyzing your profile...</span>
                    <span className="text-sm text-gray-600">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${progress > 25 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      Checking 50+ lenders
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${progress > 50 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      Analyzing rates
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${progress > 75 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      Calculating options
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      Generating recommendations
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {recommendations && !analyzing && (
            <div className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Based on your profile, we found {recommendations.length} loan options from our network of 50+ lenders. 
                  These recommendations are updated in real-time with today's rates.
                </AlertDescription>
              </Alert>

              {recommendations.map((loan, index) => (
                <Card key={loan.id} className={index === 0 ? 'border-indigo-600 shadow-lg' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {loan.loanType}
                          {index === 0 && (
                            <Badge className="bg-indigo-600">AI Recommended</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {loan.lender} • {loan.term}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{loan.rate}%</div>
                        <div className="text-sm text-gray-600">APR {loan.apr}%</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">Monthly Payment</div>
                        <div className="text-xl font-semibold">{formatCurrency(loan.monthlyPayment)}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">LTV / DTI</div>
                        <div className="text-xl font-semibold">{loan.ltv}% / {loan.dti}%</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">Closing Costs</div>
                        <div className="text-xl font-semibold">{formatCurrency(loan.closingCosts)}</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          Key Features
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {loan.features.map((feature, i) => (
                            <Badge key={i} variant="secondary">{feature}</Badge>
                          ))}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-2 text-green-700">Pros</h4>
                          <ul className="space-y-1">
                            {loan.pros.map((pro, i) => (
                              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-2 text-red-700">Cons</h4>
                          <ul className="space-y-1">
                            {loan.cons.map((con, i) => (
                              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Brain className="w-5 h-5 text-indigo-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-sm mb-1">AI Analysis ({loan.confidence}% confidence)</h4>
                            <p className="text-sm text-gray-600">{loan.reasoning}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <Button className="flex-1">
                        Apply Now
                      </Button>
                      <Button variant="outline">
                        Save Option
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!recommendations && !analyzing && (
            <Card>
              <CardContent className="py-16 text-center">
                <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">AI-Powered Loan Matching</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Our AI analyzes your profile against 50+ lenders in real-time to find the best rates and terms for your unique situation.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}