import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  Calculator, TrendingUp, AlertTriangle, CheckCircle, 
  Home, DollarSign, Calendar, ChevronRight, Info
} from 'lucide-react';
import PropertySearch from '@/components/property-search';

interface TaxBreakdown {
  propertyValue: number;
  assessedValue: number;
  taxableValue: number;
  countyTax: number;
  cityTax: number;
  schoolDistrictTax: number;
  specialDistrictTax: number;
  totalAnnualTax: number;
  monthlyTax: number;
  countyRate: number;
  cityRate: number;
  schoolRate: number;
  specialRate: number;
  effectiveRate: number;
  homesteadExemption: number;
  seniorExemption: number;
  veteranExemption: number;
  agriculturalExemption: number;
  totalExemptions: number;
  historicalTaxes: Array<{
    year: number;
    amount: number;
    percentChange: number;
  }>;
  predictions: {
    nextYear: number;
    threeYear: number;
    fiveYear: number;
    confidenceScore: number;
  };
  neighborhoodAverage: number;
  countyAverage: number;
  percentileRanking: number;
  insights: string[];
  recommendations: string[];
  warnings: string[];
}

export default function PropertyTaxCalculator() {
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [propertyValue, setPropertyValue] = useState('');
  const [exemptions, setExemptions] = useState({
    homestead: false,
    senior: false,
    veteran: false,
    agricultural: false
  });
  const [taxBreakdown, setTaxBreakdown] = useState<TaxBreakdown | null>(null);

  const calculateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/property-tax/calculate', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      setTaxBreakdown(data);
    }
  });

  const handleCalculate = () => {
    if (!selectedProperty && !propertyValue) {
      return;
    }

    calculateMutation.mutate({
      address: selectedProperty?.address || 'Manual Entry',
      propertyValue: propertyValue ? parseFloat(propertyValue) : selectedProperty?.estimatedValue,
      propertyType: selectedProperty?.propertyType,
      squareFootage: selectedProperty?.livingArea,
      yearBuilt: selectedProperty?.yearBuilt,
      lotSize: selectedProperty?.lotSize,
      exemptions
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const taxComponentData = taxBreakdown ? [
    { name: 'County', value: taxBreakdown.countyTax, rate: taxBreakdown.countyRate },
    { name: 'City', value: taxBreakdown.cityTax, rate: taxBreakdown.cityRate },
    { name: 'School', value: taxBreakdown.schoolDistrictTax, rate: taxBreakdown.schoolRate },
    { name: 'Special', value: taxBreakdown.specialDistrictTax, rate: taxBreakdown.specialRate }
  ] : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">AI Property Tax Calculator</h1>
          <p className="text-muted-foreground">
            Advanced tax analysis with AI-powered insights and predictions
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Calculator className="h-4 w-4" />
          AI-Powered
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,2fr]">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
              <CardDescription>
                Search for a property or enter value manually
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Search Property</Label>
                <PropertySearch 
                  onPropertySelect={setSelectedProperty}
                  placeholder="Enter property address..."
                />
              </div>

              {selectedProperty && (
                <Alert>
                  <Home className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">{selectedProperty.address}</div>
                    <div className="text-sm text-muted-foreground">
                      Est. Value: {formatCurrency(selectedProperty.estimatedValue)}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="propertyValue">Property Value</Label>
                <Input
                  id="propertyValue"
                  type="number"
                  placeholder="Enter property value"
                  value={propertyValue}
                  onChange={(e) => setPropertyValue(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exemptions</CardTitle>
              <CardDescription>
                Select applicable tax exemptions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries({
                homestead: 'Homestead Exemption',
                senior: 'Senior Citizen (65+)',
                veteran: 'Military Veteran',
                agricultural: 'Agricultural Use'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key} className="font-normal">
                    {label}
                  </Label>
                  <Switch
                    id={key}
                    checked={exemptions[key as keyof typeof exemptions]}
                    onCheckedChange={(checked) => 
                      setExemptions(prev => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Button 
            onClick={handleCalculate} 
            className="w-full"
            disabled={calculateMutation.isPending || (!selectedProperty && !propertyValue)}
          >
            {calculateMutation.isPending ? 'Calculating...' : 'Calculate Taxes'}
          </Button>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {taxBreakdown ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Annual Tax</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(taxBreakdown.totalAnnualTax)}
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
                        <p className="text-sm text-muted-foreground">Monthly</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(taxBreakdown.monthlyTax)}
                        </p>
                      </div>
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Analysis Tabs */}
              <Tabs defaultValue="breakdown" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
                  <TabsTrigger value="trends">Trends</TabsTrigger>
                  <TabsTrigger value="comparisons">Compare</TabsTrigger>
                  <TabsTrigger value="insights">AI Insights</TabsTrigger>
                </TabsList>

                <TabsContent value="breakdown" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tax Component Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={taxComponentData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {taxComponentData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-2">
                          {taxComponentData.map((component, index) => (
                            <div key={component.name} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: COLORS[index] }}
                                />
                                <span className="text-sm">{component.name}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">{formatCurrency(component.value)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatPercent(component.rate)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Property Value</span>
                          <span className="font-medium">{formatCurrency(taxBreakdown.propertyValue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Assessed Value</span>
                          <span className="font-medium">{formatCurrency(taxBreakdown.assessedValue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Exemptions</span>
                          <span className="font-medium text-green-600">
                            -{formatCurrency(taxBreakdown.totalExemptions)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Taxable Value</span>
                          <span className="font-medium">{formatCurrency(taxBreakdown.taxableValue)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-medium pt-2 border-t">
                          <span>Effective Tax Rate</span>
                          <span>{formatPercent(taxBreakdown.effectiveRate)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="trends" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Historical & Predicted Trends</CardTitle>
                      <CardDescription>
                        Tax history and AI-powered predictions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[
                            ...taxBreakdown.historicalTaxes,
                            {
                              year: new Date().getFullYear() + 1,
                              amount: taxBreakdown.predictions.nextYear,
                              percentChange: 0,
                              predicted: true
                            },
                            {
                              year: new Date().getFullYear() + 3,
                              amount: taxBreakdown.predictions.threeYear,
                              percentChange: 0,
                              predicted: true
                            },
                            {
                              year: new Date().getFullYear() + 5,
                              amount: taxBreakdown.predictions.fiveYear,
                              percentChange: 0,
                              predicted: true
                            }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="amount" 
                              stroke="#8884d8" 
                              strokeWidth={2}
                              name="Tax Amount"
                              strokeDasharray={(data) => data.predicted ? "5 5" : "0"}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="mt-6 grid grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Next Year</p>
                            <p className="text-xl font-bold">
                              {formatCurrency(taxBreakdown.predictions.nextYear)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              +{formatPercent((taxBreakdown.predictions.nextYear / taxBreakdown.totalAnnualTax - 1) * 100)}
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">3 Years</p>
                            <p className="text-xl font-bold">
                              {formatCurrency(taxBreakdown.predictions.threeYear)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              +{formatPercent((taxBreakdown.predictions.threeYear / taxBreakdown.totalAnnualTax - 1) * 100)}
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">5 Years</p>
                            <p className="text-xl font-bold">
                              {formatCurrency(taxBreakdown.predictions.fiveYear)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              +{formatPercent((taxBreakdown.predictions.fiveYear / taxBreakdown.totalAnnualTax - 1) * 100)}
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      <Alert className="mt-4">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Prediction confidence: {formatPercent(taxBreakdown.predictions.confidenceScore * 100)}
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="comparisons" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Regional Comparisons</CardTitle>
                      <CardDescription>
                        How your taxes compare to others in the area
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Your Property Tax</span>
                            <span className="text-sm font-medium">
                              {formatCurrency(taxBreakdown.totalAnnualTax)}
                            </span>
                          </div>
                          <Progress value={100} className="h-2" />
                        </div>

                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Neighborhood Average</span>
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(taxBreakdown.neighborhoodAverage)}
                            </span>
                          </div>
                          <Progress 
                            value={(taxBreakdown.neighborhoodAverage / taxBreakdown.totalAnnualTax) * 100} 
                            className="h-2"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-muted-foreground">County Average</span>
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(taxBreakdown.countyAverage)}
                            </span>
                          </div>
                          <Progress 
                            value={(taxBreakdown.countyAverage / taxBreakdown.totalAnnualTax) * 100} 
                            className="h-2"
                          />
                        </div>

                        <Alert>
                          <TrendingUp className="h-4 w-4" />
                          <AlertDescription>
                            Your property tax is in the {taxBreakdown.percentileRanking}th percentile 
                            for your county
                          </AlertDescription>
                        </Alert>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="insights" className="space-y-4">
                  {taxBreakdown.warnings.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc pl-4 space-y-1">
                          {taxBreakdown.warnings.map((warning, i) => (
                            <li key={i}>{warning}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle>AI Insights</CardTitle>
                      <CardDescription>
                        Personalized analysis powered by artificial intelligence
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {taxBreakdown.insights.map((insight, i) => (
                          <li key={i} className="flex gap-3">
                            <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                            <span className="text-sm">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {taxBreakdown.recommendations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Recommendations</CardTitle>
                        <CardDescription>
                          Actions you can take to optimize your property taxes
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {taxBreakdown.recommendations.map((rec, i) => (
                            <li key={i} className="flex gap-3">
                              <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                              <span className="text-sm">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center p-12">
                <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Calculation Yet</h3>
                <p className="text-muted-foreground">
                  Enter property information to see tax analysis
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}