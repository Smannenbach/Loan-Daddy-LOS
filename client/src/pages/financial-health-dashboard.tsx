import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, PiggyBank, CreditCard, 
  Home, BarChart3, Target, Zap, AlertTriangle, CheckCircle, Info,
  Brain, Sparkles, ChartLine, Award, ShieldCheck
} from 'lucide-react';

interface FinancialMetrics {
  creditScore: number;
  creditTrend: 'improving' | 'stable' | 'declining';
  monthlyIncome: number;
  monthlyExpenses: number;
  totalDebt: number;
  totalAssets: number;
  debtToIncomeRatio: number;
  emergencyFundMonths: number;
  netWorth: number;
  liquidAssets: number;
  investmentPortfolio: number;
  realEstateValue: number;
  savingsRate: number;
}

interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  category: 'savings' | 'debt' | 'investment' | 'property';
  priority: 'high' | 'medium' | 'low';
  progress: number;
}

interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  potentialSavings?: number;
  category: 'credit' | 'savings' | 'debt' | 'investment' | 'tax';
  actionItems: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

interface FinancialHealthScore {
  overall: number;
  creditHealth: number;
  debtManagement: number;
  savingsStrength: number;
  investmentDiversity: number;
  emergencyReadiness: number;
}

export default function FinancialHealthDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'month' | 'quarter' | 'year'>('month');
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [healthScore, setHealthScore] = useState<FinancialHealthScore | null>(null);
  const [aiRecommendations, setAIRecommendations] = useState<AIRecommendation[]>([]);

  // Fetch financial data
  const { data: financialData, isLoading } = useQuery({
    queryKey: ['/api/financial-health/dashboard'],
    refetchInterval: 60000 // Refresh every minute
  });

  // AI Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/financial-health/analyze', {
        method: 'POST',
        body: JSON.stringify({ metrics, goals })
      });
    },
    onSuccess: (data) => {
      setAIRecommendations(data.recommendations);
      setHealthScore(data.healthScore);
    }
  });

  useEffect(() => {
    if (financialData) {
      setMetrics(financialData.metrics);
      setGoals(financialData.goals);
      setHealthScore(financialData.healthScore);
      setAIRecommendations(financialData.recommendations || []);
    }
  }, [financialData]);

  // Mock data for visualization
  const monthlyTrendData = [
    { month: 'Jan', income: 12000, expenses: 8500, savings: 3500 },
    { month: 'Feb', income: 12500, expenses: 8200, savings: 4300 },
    { month: 'Mar', income: 13000, expenses: 9000, savings: 4000 },
    { month: 'Apr', income: 12800, expenses: 8700, savings: 4100 },
    { month: 'May', income: 13500, expenses: 8900, savings: 4600 },
    { month: 'Jun', income: 14000, expenses: 9200, savings: 4800 }
  ];

  const debtBreakdown = [
    { name: 'Mortgage', value: 380000, color: '#0088FE' },
    { name: 'Auto Loan', value: 25000, color: '#00C49F' },
    { name: 'Credit Cards', value: 8500, color: '#FFBB28' },
    { name: 'Student Loans', value: 15000, color: '#FF8042' }
  ];

  const assetAllocation = [
    { name: 'Real Estate', value: 550000, percentage: 55 },
    { name: 'Stocks', value: 250000, percentage: 25 },
    { name: 'Bonds', value: 100000, percentage: 10 },
    { name: 'Cash', value: 100000, percentage: 10 }
  ];

  const healthMetrics = healthScore ? [
    { metric: 'Overall', score: healthScore.overall, fullMark: 100 },
    { metric: 'Credit', score: healthScore.creditHealth, fullMark: 100 },
    { metric: 'Debt', score: healthScore.debtManagement, fullMark: 100 },
    { metric: 'Savings', score: healthScore.savingsStrength, fullMark: 100 },
    { metric: 'Investment', score: healthScore.investmentDiversity, fullMark: 100 },
    { metric: 'Emergency', score: healthScore.emergencyReadiness, fullMark: 100 }
  ] : [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  if (isLoading || !metrics || !healthScore) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Health Dashboard</h1>
          <p className="text-muted-foreground">
            AI-powered insights and recommendations for your financial wellness
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Brain className="h-3 w-3" />
            AI Enhanced
          </Badge>
          <Button 
            onClick={() => analysisMutation.mutate()}
            disabled={analysisMutation.isPending}
          >
            {analysisMutation.isPending ? 'Analyzing...' : 'Refresh Analysis'}
          </Button>
        </div>
      </div>

      {/* Overall Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Financial Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className={`text-5xl font-bold ${getHealthScoreColor(healthScore.overall)}`}>
                {healthScore.overall}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {getHealthScoreLabel(healthScore.overall)}
              </p>
            </div>
            <div className="w-64 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={healthMetrics}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar 
                    name="Score" 
                    dataKey="score" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.6} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries({
              creditHealth: 'Credit',
              debtManagement: 'Debt',
              savingsStrength: 'Savings',
              investmentDiversity: 'Investment',
              emergencyReadiness: 'Emergency'
            }).map(([key, label]) => (
              <div key={key} className="text-center">
                <div className="text-2xl font-semibold">
                  {healthScore[key as keyof FinancialHealthScore]}
                </div>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Worth</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(metrics.netWorth)}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5% YoY
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Savings</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(metrics.monthlyIncome - metrics.monthlyExpenses)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.savingsRate}% savings rate
                </p>
              </div>
              <PiggyBank className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Debt-to-Income</p>
                <p className="text-2xl font-bold">
                  {(metrics.debtToIncomeRatio * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.debtToIncomeRatio < 0.36 ? 'Healthy' : 'High'}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Credit Score</p>
                <p className="text-2xl font-bold">{metrics.creditScore}</p>
                <p className={`text-xs flex items-center mt-1 ${
                  metrics.creditTrend === 'improving' ? 'text-green-600' : 
                  metrics.creditTrend === 'declining' ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {metrics.creditTrend === 'improving' ? 
                    <TrendingUp className="h-3 w-3 mr-1" /> : 
                    metrics.creditTrend === 'declining' ? 
                    <TrendingDown className="h-3 w-3 mr-1" /> : null
                  }
                  {metrics.creditTrend}
                </p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="assets">Assets & Debt</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="recommendations">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Income vs Expenses Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Area 
                        type="monotone" 
                        dataKey="income" 
                        stackId="1"
                        stroke="#82ca9d" 
                        fill="#82ca9d" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="expenses" 
                        stackId="2"
                        stroke="#8884d8" 
                        fill="#8884d8" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Savings Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Line 
                        type="monotone" 
                        dataKey="savings" 
                        stroke="#00C49F" 
                        strokeWidth={3}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Emergency Fund</p>
                    <p className="text-lg font-semibold">
                      {metrics.emergencyFundMonths} months
                    </p>
                  </div>
                  <Progress value={(metrics.emergencyFundMonths / 6) * 100} className="w-16" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Liquid Assets</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(metrics.liquidAssets)}
                    </p>
                  </div>
                  <Zap className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Investments</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(metrics.investmentPortfolio)}
                    </p>
                  </div>
                  <ChartLine className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Real Estate</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(metrics.realEstateValue)}
                    </p>
                  </div>
                  <Home className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Cash Flow Analysis</CardTitle>
              <CardDescription>
                Detailed breakdown of income and expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Monthly Income</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(metrics.monthlyIncome)}
                    </span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Expense Categories</h4>
                  {[
                    { name: 'Housing', amount: 3500, percentage: 40 },
                    { name: 'Transportation', amount: 1200, percentage: 14 },
                    { name: 'Food & Dining', amount: 1000, percentage: 11 },
                    { name: 'Utilities', amount: 400, percentage: 5 },
                    { name: 'Insurance', amount: 800, percentage: 9 },
                    { name: 'Other', amount: 1800, percentage: 21 }
                  ].map((expense) => (
                    <div key={expense.name}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">{expense.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(expense.amount)} ({expense.percentage}%)
                        </span>
                      </div>
                      <Progress value={expense.percentage} className="h-2" />
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-medium">
                  <span>Net Cash Flow</span>
                  <span className="text-green-600">
                    +{formatCurrency(metrics.monthlyIncome - metrics.monthlyExpenses)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assetAllocation}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {assetAllocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={debtBreakdown[index].color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {assetAllocation.map((asset, index) => (
                    <div key={asset.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: debtBreakdown[index].color }}
                        />
                        <span className="text-sm">{asset.name}</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(asset.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Debt Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={debtBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Bar dataKey="value" fill="#8884d8">
                        {debtBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Total debt: {formatCurrency(metrics.totalDebt)} | 
                    Total assets: {formatCurrency(metrics.totalAssets)}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid gap-4">
            {goals.map((goal) => (
              <Card key={goal.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{goal.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Target: {formatCurrency(goal.targetAmount)} by {new Date(goal.deadline).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={
                      goal.priority === 'high' ? 'destructive' : 
                      goal.priority === 'medium' ? 'default' : 
                      'secondary'
                    }>
                      {goal.priority} priority
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Current: {formatCurrency(goal.currentAmount)}</span>
                      <span>Remaining: {formatCurrency(goal.targetAmount - goal.currentAmount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-4">
            {aiRecommendations.map((rec) => (
              <Card key={rec.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-500" />
                      {rec.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        rec.impact === 'high' ? 'destructive' : 
                        rec.impact === 'medium' ? 'default' : 
                        'secondary'
                      }>
                        {rec.impact} impact
                      </Badge>
                      <Badge variant="outline">
                        {rec.category}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{rec.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {rec.potentialSavings && (
                      <Alert>
                        <DollarSign className="h-4 w-4" />
                        <AlertDescription>
                          Potential savings: {formatCurrency(rec.potentialSavings)} annually
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Action Items:</h4>
                      <ul className="space-y-1">
                        {rec.actionItems.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-sm text-muted-foreground">
                        Timeframe: {rec.timeframe}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Risk: {rec.riskLevel}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}