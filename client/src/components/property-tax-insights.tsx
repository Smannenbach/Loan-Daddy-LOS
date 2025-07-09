import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Building, 
  AlertTriangle,
  CheckCircle,
  PieChart,
  BarChart3,
  LineChart,
  Target,
  Brain,
  Zap,
  Clock,
  MapPin,
  Home,
  Calculator,
  FileText,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts';

interface PropertyTaxInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  dataPoints: Array<{
    year: number;
    value: number;
    label: string;
  }>;
}

interface TaxTrendData {
  year: number;
  assessedValue: number;
  marketValue: number;
  taxAmount: number;
  taxRate: number;
  countyAverage: number;
}

interface ComparisonData {
  propertyType: string;
  averageTaxRate: number;
  count: number;
  medianValue: number;
}

interface PredictiveAnalysis {
  nextYearPrediction: {
    assessedValue: number;
    taxAmount: number;
    confidence: number;
  };
  fiveYearForecast: Array<{
    year: number;
    estimatedValue: number;
    estimatedTax: number;
  }>;
  riskFactors: Array<{
    factor: string;
    probability: number;
    impact: string;
  }>;
}

export default function PropertyTaxInsights({ propertyAddress }: { propertyAddress: string }) {
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1y' | '3y' | '5y' | '10y'>('5y');

  // Generate mock data for demonstration
  const generateTaxTrendData = (): TaxTrendData[] => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - 9 + i);
    
    return years.map((year, index) => ({
      year,
      assessedValue: 400000 + (index * 25000) + (Math.random() * 50000),
      marketValue: 450000 + (index * 30000) + (Math.random() * 60000),
      taxAmount: 4800 + (index * 300) + (Math.random() * 1000),
      taxRate: 1.2 + (Math.random() * 0.3),
      countyAverage: 5200 + (index * 280) + (Math.random() * 800)
    }));
  };

  const generateInsights = (): PropertyTaxInsight[] => {
    return [
      {
        id: '1',
        type: 'trend',
        title: 'Consistent Tax Assessment Growth',
        description: 'Property assessments have increased 15% over the past 3 years, following market trends.',
        confidence: 87,
        impact: 'medium',
        recommendation: 'Consider appeal if assessment exceeds market value significantly.',
        dataPoints: [
          { year: 2022, value: 420000, label: 'Assessed Value' },
          { year: 2023, value: 445000, label: 'Assessed Value' },
          { year: 2024, value: 485000, label: 'Assessed Value' }
        ]
      },
      {
        id: '2',
        type: 'opportunity',
        title: 'Tax Rate Below County Average',
        description: 'Current effective tax rate is 8% below county average, indicating good value.',
        confidence: 92,
        impact: 'high',
        recommendation: 'Favorable tax environment for property investment.',
        dataPoints: [
          { year: 2024, value: 1.18, label: 'Property Rate' },
          { year: 2024, value: 1.28, label: 'County Average' }
        ]
      },
      {
        id: '3',
        type: 'risk',
        title: 'Potential Assessment Increase',
        description: 'Market value growth suggests possible 12% assessment increase next year.',
        confidence: 74,
        impact: 'high',
        recommendation: 'Monitor assessment notices and prepare for potential appeal.',
        dataPoints: [
          { year: 2024, value: 485000, label: 'Current Assessment' },
          { year: 2025, value: 543200, label: 'Predicted Assessment' }
        ]
      },
      {
        id: '4',
        type: 'anomaly',
        title: 'Tax Bill Timing Pattern',
        description: 'Tax bills consistently arrive 2 weeks later than county average.',
        confidence: 65,
        impact: 'low',
        recommendation: 'Plan cash flow accordingly for late tax bill receipt.',
        dataPoints: [
          { year: 2024, value: 14, label: 'Days Late' },
          { year: 2023, value: 12, label: 'Days Late' },
          { year: 2022, value: 16, label: 'Days Late' }
        ]
      }
    ];
  };

  const generateComparisonData = (): ComparisonData[] => {
    return [
      { propertyType: 'Single Family', averageTaxRate: 1.24, count: 1250, medianValue: 485000 },
      { propertyType: 'Townhouse', averageTaxRate: 1.18, count: 680, medianValue: 425000 },
      { propertyType: 'Condo', averageTaxRate: 1.15, count: 920, medianValue: 385000 },
      { propertyType: 'Multi-Family', averageTaxRate: 1.32, count: 340, medianValue: 650000 },
      { propertyType: 'Commercial', averageTaxRate: 1.45, count: 180, medianValue: 890000 }
    ];
  };

  const generatePredictiveAnalysis = (): PredictiveAnalysis => {
    return {
      nextYearPrediction: {
        assessedValue: 543200,
        taxAmount: 6518,
        confidence: 82
      },
      fiveYearForecast: [
        { year: 2025, estimatedValue: 543200, estimatedTax: 6518 },
        { year: 2026, estimatedValue: 578000, estimatedTax: 6936 },
        { year: 2027, estimatedValue: 615000, estimatedTax: 7380 },
        { year: 2028, estimatedValue: 654000, estimatedTax: 7848 },
        { year: 2029, estimatedValue: 696000, estimatedTax: 8352 }
      ],
      riskFactors: [
        { factor: 'Market Volatility', probability: 35, impact: 'High assessment variance' },
        { factor: 'Tax Rate Changes', probability: 28, impact: 'Municipal budget adjustments' },
        { factor: 'Property Improvements', probability: 45, impact: 'Increased assessed value' }
      ]
    };
  };

  const taxTrendData = generateTaxTrendData();
  const insights = generateInsights();
  const comparisonData = generateComparisonData();
  const predictiveAnalysis = generatePredictiveAnalysis();

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="h-4 w-4" />;
      case 'opportunity': return <Target className="h-4 w-4" />;
      case 'risk': return <AlertTriangle className="h-4 w-4" />;
      case 'anomaly': return <Zap className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'trend': return 'bg-blue-100 text-blue-800';
      case 'opportunity': return 'bg-green-100 text-green-800';
      case 'risk': return 'bg-red-100 text-red-800';
      case 'anomaly': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Property Tax Insights</h2>
          <p className="text-gray-600 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {propertyAddress}
          </p>
        </div>
        <div className="flex gap-2">
          {(['1y', '3y', '5y', '10y'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Assessment</p>
                <p className="text-2xl font-bold">${(485000).toLocaleString()}</p>
              </div>
              <Home className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">+12% from last year</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Annual Tax</p>
                <p className="text-2xl font-bold">${(5820).toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">+8% from last year</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Effective Rate</p>
                <p className="text-2xl font-bold">1.20%</p>
              </div>
              <Calculator className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <TrendingDown className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">8% below county avg</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Confidence</p>
                <p className="text-2xl font-bold">84%</p>
              </div>
              <Brain className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-gray-600">High accuracy</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Tax Trends</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="comparison">Market Comparison</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        {/* Tax Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Tax Assessment Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={taxTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="assessedValue" stroke="#3b82f6" name="Assessed Value" />
                  <Line type="monotone" dataKey="marketValue" stroke="#10b981" name="Market Value" />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Tax Amount vs County Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={taxTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="taxAmount" fill="#3b82f6" name="Your Property" />
                  <Bar dataKey="countyAverage" fill="#e5e7eb" name="County Average" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight) => (
              <Card key={insight.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getInsightColor(insight.type)}>
                      {getInsightIcon(insight.type)}
                      <span className="ml-1 capitalize">{insight.type}</span>
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Brain className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{insight.confidence}%</span>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{insight.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-3">{insight.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">Impact Level</span>
                    <Badge variant="outline" className={getImpactColor(insight.impact)}>
                      {insight.impact.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-1">AI Recommendation:</p>
                    <p className="text-sm text-blue-800">{insight.recommendation}</p>
                  </div>
                  <div className="mt-3">
                    <Progress value={insight.confidence} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">Confidence: {insight.confidence}%</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Market Comparison Tab */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Property Type Tax Rates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={comparisonData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ propertyType, averageTaxRate }) => `${propertyType}: ${averageTaxRate}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="averageTaxRate"
                  >
                    {comparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Neighborhood Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comparisonData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.propertyType}</p>
                      <p className="text-sm text-gray-600">{item.count} properties</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.averageTaxRate}%</p>
                      <p className="text-sm text-gray-600">${item.medianValue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Next Year Prediction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Predicted Assessment</p>
                    <p className="text-2xl font-bold text-blue-900">
                      ${predictiveAnalysis.nextYearPrediction.assessedValue.toLocaleString()}
                    </p>
                    <p className="text-sm text-blue-700">
                      +{Math.round(((predictiveAnalysis.nextYearPrediction.assessedValue - 485000) / 485000) * 100)}% increase
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Predicted Tax Amount</p>
                    <p className="text-2xl font-bold text-green-900">
                      ${predictiveAnalysis.nextYearPrediction.taxAmount.toLocaleString()}
                    </p>
                    <p className="text-sm text-green-700">
                      +{Math.round(((predictiveAnalysis.nextYearPrediction.taxAmount - 5820) / 5820) * 100)}% increase
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">AI Confidence</p>
                    <div className="flex items-center gap-2">
                      <Progress value={predictiveAnalysis.nextYearPrediction.confidence} className="flex-1" />
                      <span className="text-sm font-medium">{predictiveAnalysis.nextYearPrediction.confidence}%</span>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 font-medium">Risk Factors</p>
                    <div className="space-y-2 mt-2">
                      {predictiveAnalysis.riskFactors.map((risk, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{risk.factor}</span>
                          <Badge variant="outline" className="text-xs">
                            {risk.probability}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                5-Year Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={predictiveAnalysis.fiveYearForecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Area type="monotone" dataKey="estimatedValue" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Estimated Value" />
                  <Area type="monotone" dataKey="estimatedTax" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Estimated Tax" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}