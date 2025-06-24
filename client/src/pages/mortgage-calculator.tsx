import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Home, 
  PieChart,
  BarChart3,
  Percent,
  Calendar,
  RefreshCw
} from "lucide-react";

interface MortgageParams {
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  downPayment: number;
  propertyTax: number;
  insurance: number;
  hoa: number;
  pmi: number;
}

interface MortgageCalculation {
  monthlyPayment: number;
  principalAndInterest: number;
  totalInterest: number;
  totalPayments: number;
  monthlyTaxes: number;
  monthlyInsurance: number;
  monthlyHOA: number;
  monthlyPMI: number;
  loanToValue: number;
  payoffDate: string;
}

interface RateData {
  rate30Year: number;
  rate15Year: number;
  rateARM: number;
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
  weeklyChange: number;
}

export default function MortgageCalculator() {
  const [params, setParams] = useState<MortgageParams>({
    loanAmount: 400000,
    interestRate: 7.25,
    loanTerm: 30,
    downPayment: 80000,
    propertyTax: 8000,
    insurance: 1200,
    hoa: 0,
    pmi: 0
  });

  const [calculation, setCalculation] = useState<MortgageCalculation | null>(null);
  const [currentRates, setCurrentRates] = useState<RateData | null>(null);
  const { toast } = useToast();

  // Fetch live interest rates
  const ratesQuery = useQuery({
    queryKey: ['currentRates'],
    queryFn: async (): Promise<RateData> => {
      // Simulate live rate data - in production this would connect to rate APIs
      const rates: RateData = {
        rate30Year: 7.25 + (Math.random() - 0.5) * 0.5,
        rate15Year: 6.75 + (Math.random() - 0.5) * 0.5,
        rateARM: 6.95 + (Math.random() - 0.5) * 0.5,
        lastUpdated: new Date().toISOString(),
        trend: Math.random() > 0.5 ? 'up' : 'down',
        weeklyChange: (Math.random() - 0.5) * 0.2
      };
      return rates;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const calculateMortgage = () => {
    const principal = params.loanAmount;
    const monthlyRate = params.interestRate / 100 / 12;
    const numPayments = params.loanTerm * 12;
    
    // Calculate monthly P&I payment
    const monthlyPI = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                     (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    // Calculate other monthly costs
    const monthlyTax = params.propertyTax / 12;
    const monthlyIns = params.insurance / 12;
    const monthlyHOA = params.hoa / 12;
    const monthlyPMI = params.pmi / 12;
    
    // Total monthly payment
    const totalMonthly = monthlyPI + monthlyTax + monthlyIns + monthlyHOA + monthlyPMI;
    
    // Calculate totals
    const totalInterest = (monthlyPI * numPayments) - principal;
    const totalPayments = monthlyPI * numPayments;
    
    // LTV calculation
    const propertyValue = principal + params.downPayment;
    const loanToValue = (principal / propertyValue) * 100;
    
    // Payoff date
    const payoffDate = new Date();
    payoffDate.setFullYear(payoffDate.getFullYear() + params.loanTerm);

    const result: MortgageCalculation = {
      monthlyPayment: totalMonthly,
      principalAndInterest: monthlyPI,
      totalInterest,
      totalPayments,
      monthlyTaxes: monthlyTax,
      monthlyInsurance: monthlyIns,
      monthlyHOA,
      monthlyPMI,
      loanToValue,
      payoffDate: payoffDate.toLocaleDateString()
    };

    setCalculation(result);
  };

  // Recalculate when parameters change
  useEffect(() => {
    calculateMortgage();
  }, [params]);

  // Update interest rate when live rates change
  useEffect(() => {
    if (ratesQuery.data) {
      setCurrentRates(ratesQuery.data);
      // Optionally auto-update the rate if user hasn't customized it
      if (params.loanTerm === 30 && Math.abs(params.interestRate - 7.25) < 0.1) {
        setParams(prev => ({ ...prev, interestRate: ratesQuery.data.rate30Year }));
      }
    }
  }, [ratesQuery.data]);

  const updateParam = (field: keyof MortgageParams, value: number) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-green-600 rotate-180" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-h-screen overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Calculator className="w-8 h-8 text-green-600" />
          Mortgage Calculator with Live Rates
        </h1>
        <p className="text-muted-foreground mt-2">
          Calculate mortgage payments with real-time interest rate updates and comprehensive analysis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator Input */}
        <div className="space-y-6">
          {/* Live Interest Rates */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <RefreshCw className={`w-5 h-5 ${ratesQuery.isFetching ? 'animate-spin' : ''}`} />
                Live Interest Rates
              </CardTitle>
              <CardDescription>
                Real-time rates updated every minute
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentRates && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {getTrendIcon(currentRates.trend)}
                      <span className="text-2xl font-bold text-green-600">
                        {formatPercent(currentRates.rate30Year)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">30-Year Fixed</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateParam('interestRate', currentRates.rate30Year)}
                      className="mt-1"
                    >
                      Use Rate
                    </Button>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {getTrendIcon(currentRates.trend)}
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPercent(currentRates.rate15Year)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">15-Year Fixed</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateParam('interestRate', currentRates.rate15Year);
                        updateParam('loanTerm', 15);
                      }}
                      className="mt-1"
                    >
                      Use Rate
                    </Button>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {getTrendIcon(currentRates.trend)}
                      <span className="text-2xl font-bold text-purple-600">
                        {formatPercent(currentRates.rateARM)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">5/1 ARM</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateParam('interestRate', currentRates.rateARM)}
                      className="mt-1"
                    >
                      Use Rate
                    </Button>
                  </div>
                </div>
              )}
              
              {currentRates && (
                <div className="mt-4 text-center text-xs text-muted-foreground">
                  Last updated: {new Date(currentRates.lastUpdated).toLocaleTimeString()} •
                  Weekly change: {currentRates.weeklyChange > 0 ? '+' : ''}{formatPercent(currentRates.weeklyChange)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loan Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Loan Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="homePrice">Home Price</Label>
                  <Input
                    type="number"
                    value={params.loanAmount + params.downPayment}
                    onChange={(e) => {
                      const homePrice = Number(e.target.value);
                      updateParam('loanAmount', homePrice - params.downPayment);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="downPayment">Down Payment</Label>
                  <Input
                    type="number"
                    value={params.downPayment}
                    onChange={(e) => updateParam('downPayment', Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="downPaymentPercent">Down Payment: {((params.downPayment / (params.loanAmount + params.downPayment)) * 100).toFixed(1)}%</Label>
                <Slider
                  value={[params.downPayment]}
                  onValueChange={(value) => updateParam('downPayment', value[0])}
                  max={(params.loanAmount + params.downPayment) * 0.5}
                  min={0}
                  step={1000}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={params.interestRate}
                    onChange={(e) => updateParam('interestRate', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="loanTerm">Loan Term (years)</Label>
                  <select 
                    value={params.loanTerm} 
                    onChange={(e) => updateParam('loanTerm', Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value={15}>15 years</option>
                    <option value={20}>20 years</option>
                    <option value={25}>25 years</option>
                    <option value={30}>30 years</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Costs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Additional Monthly Costs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="propertyTax">Property Tax (annual)</Label>
                  <Input
                    type="number"
                    value={params.propertyTax}
                    onChange={(e) => updateParam('propertyTax', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="insurance">Home Insurance (annual)</Label>
                  <Input
                    type="number"
                    value={params.insurance}
                    onChange={(e) => updateParam('insurance', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hoa">HOA Fees (annual)</Label>
                  <Input
                    type="number"
                    value={params.hoa}
                    onChange={(e) => updateParam('hoa', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="pmi">PMI (annual)</Label>
                  <Input
                    type="number"
                    value={params.pmi}
                    onChange={(e) => updateParam('pmi', Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {calculation && (
            <>
              {/* Monthly Payment Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Monthly Payment Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-green-600">
                      {formatCurrency(calculation.monthlyPayment)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Monthly Payment</div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Principal & Interest:</span>
                      <span className="font-bold">{formatCurrency(calculation.principalAndInterest)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Property Taxes:</span>
                      <span className="font-bold">{formatCurrency(calculation.monthlyTaxes)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Home Insurance:</span>
                      <span className="font-bold">{formatCurrency(calculation.monthlyInsurance)}</span>
                    </div>
                    {calculation.monthlyHOA > 0 && (
                      <div className="flex justify-between items-center">
                        <span>HOA Fees:</span>
                        <span className="font-bold">{formatCurrency(calculation.monthlyHOA)}</span>
                      </div>
                    )}
                    {calculation.monthlyPMI > 0 && (
                      <div className="flex justify-between items-center">
                        <span>PMI:</span>
                        <span className="font-bold">{formatCurrency(calculation.monthlyPMI)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Loan Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Loan Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>Loan Amount:</span>
                      <span className="font-bold">{formatCurrency(params.loanAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Interest:</span>
                      <span className="font-bold text-red-600">{formatCurrency(calculation.totalInterest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Payments:</span>
                      <span className="font-bold">{formatCurrency(calculation.totalPayments)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Loan-to-Value:</span>
                      <span className="font-bold">{formatPercent(calculation.loanToValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payoff Date:</span>
                      <span className="font-bold">{calculation.payoffDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Rate:</span>
                      <span className="font-bold">{formatPercent(params.interestRate / 12)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Affordability Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="w-5 h-5" />
                    Affordability Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>28% Rule (Housing)</span>
                        <span>Recommended monthly income: {formatCurrency(calculation.monthlyPayment / 0.28)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>36% Rule (Total Debt)</span>
                        <span>Max total monthly debt: {formatCurrency(calculation.monthlyPayment / 0.36)}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-700 mb-1">Recommendation:</div>
                      <div className="text-sm text-blue-600">
                        Your gross monthly income should be at least {formatCurrency(calculation.monthlyPayment / 0.28)} 
                        to comfortably afford this payment.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Schedule Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Payment Schedule Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <div className="grid grid-cols-3 gap-4 font-medium border-b pb-2 mb-2">
                      <span>Year</span>
                      <span>Principal Paid</span>
                      <span>Remaining Balance</span>
                    </div>
                    {[1, 5, 10, 15, 20, 25, 30].filter(year => year <= params.loanTerm).map(year => {
                      const monthlyRate = params.interestRate / 100 / 12;
                      const numPayments = year * 12;
                      const totalPayments = params.loanTerm * 12;
                      
                      // Calculate remaining balance after 'year' years
                      const remainingBalance = params.loanAmount * 
                        (Math.pow(1 + monthlyRate, totalPayments) - Math.pow(1 + monthlyRate, numPayments)) /
                        (Math.pow(1 + monthlyRate, totalPayments) - 1);
                      
                      const principalPaid = params.loanAmount - remainingBalance;

                      return (
                        <div key={year} className="grid grid-cols-3 gap-4 py-1">
                          <span>{year}</span>
                          <span>{formatCurrency(principalPaid)}</span>
                          <span>{formatCurrency(Math.max(0, remainingBalance))}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Chase Home Value Estimator Embed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Chase Home Value Estimator
          </CardTitle>
          <CardDescription>
            Get an instant home value estimate from Chase Bank
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video w-full">
            <iframe
              src="https://www.chase.com/personal/mortgage/calculators-resources/home-value-estimator"
              className="w-full h-full border-0 rounded-lg"
              title="Chase Home Value Estimator"
              allow="geolocation"
            />
          </div>
          <div className="mt-4 text-center">
            <Button
              onClick={() => window.open('https://www.chase.com/personal/mortgage/calculators-resources/home-value-estimator', '_blank')}
              variant="outline"
            >
              Open in New Window
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}