import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  X, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Calculator,
  Target,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";

interface PropertyData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  estimatedValue: number;
  yearBuilt: number;
  squareFootage: number;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  units?: number;
  monthlyPropertyTaxes: number;
  monthlyInsurance: number;
  rentalEstimates?: {
    monthlyRent: number;
    rentPerUnit?: number;
    capRate: number;
    netOperatingIncome?: number;
  };
  marketTrends: {
    priceChangeYearly: number;
    daysOnMarket: number;
    inventoryLevel: string;
  };
  confidence: number;
}

export default function PropertyComparison() {
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [newAddress, setNewAddress] = useState("");
  const [searchType, setSearchType] = useState<'unit' | 'building'>('unit');
  const { toast } = useToast();

  const searchMutation = useMutation({
    mutationFn: async (address: string) => {
      const response = await fetch(`/api/property-data?address=${encodeURIComponent(address)}&searchType=${searchType}`);
      if (!response.ok) {
        throw new Error("Failed to fetch property data");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (properties.length >= 4) {
        toast({
          title: "Maximum Properties",
          description: "You can compare up to 4 properties at once. Remove one to add another.",
          variant: "destructive",
        });
        return;
      }
      
      // Check for duplicates
      const isDuplicate = properties.some(p => p.address === data.address);
      if (isDuplicate) {
        toast({
          title: "Property Already Added",
          description: "This property is already in your comparison.",
          variant: "destructive",
        });
        return;
      }

      setProperties(prev => [...prev, data]);
      setNewAddress("");
      toast({
        title: "Property Added",
        description: `Added ${data.address} to comparison`,
      });
    },
    onError: (error) => {
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddProperty = () => {
    if (!newAddress.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter a property address",
        variant: "destructive",
      });
      return;
    }
    searchMutation.mutate(newAddress);
  };

  const removeProperty = (index: number) => {
    setProperties(prev => prev.filter((_, i) => i !== index));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getComparisonWinner = (values: number[], higher = true) => {
    if (values.length === 0) return -1;
    const targetValue = higher ? Math.max(...values) : Math.min(...values);
    return values.findIndex(v => v === targetValue);
  };

  const calculateROI = (property: PropertyData) => {
    if (!property.rentalEstimates) return 0;
    const annualRent = property.rentalEstimates.monthlyRent * 12;
    const annualExpenses = (property.monthlyPropertyTaxes + property.monthlyInsurance) * 12;
    const netIncome = annualRent - annualExpenses;
    return (netIncome / property.estimatedValue) * 100;
  };

  const getBestInvestment = () => {
    if (properties.length === 0) return null;
    const rois = properties.map(calculateROI);
    const bestIndex = getComparisonWinner(rois, true);
    return bestIndex >= 0 ? { property: properties[bestIndex], roi: rois[bestIndex], index: bestIndex } : null;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          Property Comparison Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Compare up to 4 properties side-by-side with intelligent investment analysis
        </p>
      </div>

      {/* Add Property Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Property to Compare
          </CardTitle>
          <CardDescription>
            Enter property addresses to build your comparison dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="Enter property address..."
                onKeyPress={(e) => e.key === "Enter" && handleAddProperty()}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="searchType"
                    value="unit"
                    checked={searchType === 'unit'}
                    onChange={(e) => setSearchType(e.target.value as 'unit' | 'building')}
                  />
                  <span className="text-sm">Unit</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="searchType"
                    value="building"
                    checked={searchType === 'building'}
                    onChange={(e) => setSearchType(e.target.value as 'unit' | 'building')}
                  />
                  <span className="text-sm">Building</span>
                </label>
              </div>
              <Button 
                onClick={handleAddProperty} 
                disabled={searchMutation.isPending || properties.length >= 4}
              >
                {searchMutation.isPending ? "Adding..." : "Add Property"}
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {properties.length}/4 properties added
          </div>
        </CardContent>
      </Card>

      {properties.length > 0 && (
        <>
          {/* Investment Summary */}
          {(() => {
            const bestInvestment = getBestInvestment();
            return bestInvestment && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Target className="w-5 h-5" />
                    Best Investment Opportunity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{bestInvestment.property.address}</p>
                      <p className="text-sm text-muted-foreground">
                        {bestInvestment.property.city}, {bestInvestment.property.state}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {bestInvestment.roi.toFixed(2)}% ROI
                      </div>
                      <div className="text-sm text-muted-foreground">Annual Return</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Property Comparison</CardTitle>
              <CardDescription>
                Side-by-side analysis of your selected properties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="investment">Investment</TabsTrigger>
                  <TabsTrigger value="market">Market</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Property</th>
                          {properties.map((property, index) => (
                            <th key={index} className="text-center p-2 min-w-48">
                              <div className="space-y-2">
                                <div className="font-medium text-sm">{property.address}</div>
                                <div className="text-xs text-muted-foreground">
                                  {property.city}, {property.state}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeProperty(index)}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2 font-medium">Property Value</td>
                          {properties.map((property, index) => {
                            const values = properties.map(p => p.estimatedValue);
                            const isWinner = index === getComparisonWinner(values, true);
                            return (
                              <td key={index} className="text-center p-2">
                                <div className={`${isWinner ? 'text-green-600 font-bold' : ''}`}>
                                  {formatCurrency(property.estimatedValue)}
                                  {isWinner && <div className="text-xs">HIGHEST</div>}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-medium">Property Type</td>
                          {properties.map((property, index) => (
                            <td key={index} className="text-center p-2">
                              <Badge variant="outline">{property.propertyType}</Badge>
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-medium">Square Footage</td>
                          {properties.map((property, index) => {
                            const values = properties.map(p => p.squareFootage);
                            const isWinner = index === getComparisonWinner(values, true);
                            return (
                              <td key={index} className="text-center p-2">
                                <div className={`${isWinner ? 'text-green-600 font-bold' : ''}`}>
                                  {property.squareFootage.toLocaleString()} sq ft
                                  {isWinner && <div className="text-xs">LARGEST</div>}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-medium">Year Built</td>
                          {properties.map((property, index) => {
                            const values = properties.map(p => p.yearBuilt);
                            const isWinner = index === getComparisonWinner(values, true);
                            return (
                              <td key={index} className="text-center p-2">
                                <div className={`${isWinner ? 'text-green-600 font-bold' : ''}`}>
                                  {property.yearBuilt}
                                  {isWinner && <div className="text-xs">NEWEST</div>}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                        {searchType === 'building' && (
                          <tr className="border-b">
                            <td className="p-2 font-medium">Units</td>
                            {properties.map((property, index) => {
                              const values = properties.map(p => p.units || 0);
                              const isWinner = index === getComparisonWinner(values, true);
                              return (
                                <td key={index} className="text-center p-2">
                                  <div className={`${isWinner ? 'text-green-600 font-bold' : ''}`}>
                                    {property.units || 'N/A'}
                                    {isWinner && property.units && <div className="text-xs">MOST UNITS</div>}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Financial Metric</th>
                          {properties.map((property, index) => (
                            <th key={index} className="text-center p-2 min-w-48">
                              {property.address}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2 font-medium">Monthly Rent</td>
                          {properties.map((property, index) => {
                            const values = properties.map(p => p.rentalEstimates?.monthlyRent || 0);
                            const isWinner = index === getComparisonWinner(values, true);
                            return (
                              <td key={index} className="text-center p-2">
                                <div className={`${isWinner ? 'text-green-600 font-bold' : ''}`}>
                                  {formatCurrency(property.rentalEstimates?.monthlyRent || 0)}
                                  {isWinner && <div className="text-xs">HIGHEST RENT</div>}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-medium">Cap Rate</td>
                          {properties.map((property, index) => {
                            const values = properties.map(p => p.rentalEstimates?.capRate || 0);
                            const isWinner = index === getComparisonWinner(values, true);
                            return (
                              <td key={index} className="text-center p-2">
                                <div className={`${isWinner ? 'text-green-600 font-bold' : ''}`}>
                                  {((property.rentalEstimates?.capRate || 0) * 100).toFixed(2)}%
                                  {isWinner && <div className="text-xs">BEST CAP RATE</div>}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-medium">Monthly Expenses</td>
                          {properties.map((property, index) => {
                            const expenses = property.monthlyPropertyTaxes + property.monthlyInsurance;
                            const values = properties.map(p => p.monthlyPropertyTaxes + p.monthlyInsurance);
                            const isWinner = index === getComparisonWinner(values, false);
                            return (
                              <td key={index} className="text-center p-2">
                                <div className={`${isWinner ? 'text-green-600 font-bold' : ''}`}>
                                  {formatCurrency(expenses)}
                                  {isWinner && <div className="text-xs">LOWEST COST</div>}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-medium">Price per Sq Ft</td>
                          {properties.map((property, index) => {
                            const pricePerSqFt = property.estimatedValue / property.squareFootage;
                            const values = properties.map(p => p.estimatedValue / p.squareFootage);
                            const isWinner = index === getComparisonWinner(values, false);
                            return (
                              <td key={index} className="text-center p-2">
                                <div className={`${isWinner ? 'text-green-600 font-bold' : ''}`}>
                                  {formatCurrency(pricePerSqFt)}
                                  {isWinner && <div className="text-xs">BEST VALUE</div>}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="investment" className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Investment Metric</th>
                          {properties.map((property, index) => (
                            <th key={index} className="text-center p-2 min-w-48">
                              {property.address}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2 font-medium">Annual ROI</td>
                          {properties.map((property, index) => {
                            const roi = calculateROI(property);
                            const values = properties.map(calculateROI);
                            const isWinner = index === getComparisonWinner(values, true);
                            return (
                              <td key={index} className="text-center p-2">
                                <div className={`${isWinner ? 'text-green-600 font-bold' : ''}`}>
                                  {roi.toFixed(2)}%
                                  {isWinner && <div className="text-xs">BEST ROI</div>}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-medium">Cash Flow (Monthly)</td>
                          {properties.map((property, index) => {
                            const cashFlow = (property.rentalEstimates?.monthlyRent || 0) - 
                                           (property.monthlyPropertyTaxes + property.monthlyInsurance);
                            const values = properties.map(p => 
                              (p.rentalEstimates?.monthlyRent || 0) - (p.monthlyPropertyTaxes + p.monthlyInsurance)
                            );
                            const isWinner = index === getComparisonWinner(values, true);
                            return (
                              <td key={index} className="text-center p-2">
                                <div className={`${isWinner ? 'text-green-600 font-bold' : ''} ${cashFlow < 0 ? 'text-red-600' : ''}`}>
                                  {formatCurrency(cashFlow)}
                                  {isWinner && cashFlow > 0 && <div className="text-xs">BEST CASH FLOW</div>}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-medium">Data Confidence</td>
                          {properties.map((property, index) => {
                            const values = properties.map(p => p.confidence);
                            const isWinner = index === getComparisonWinner(values, true);
                            return (
                              <td key={index} className="text-center p-2">
                                <div className={`${isWinner ? 'text-green-600 font-bold' : ''}`}>
                                  {property.confidence}%
                                  {isWinner && <div className="text-xs">MOST RELIABLE</div>}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="market" className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Market Metric</th>
                          {properties.map((property, index) => (
                            <th key={index} className="text-center p-2 min-w-48">
                              {property.address}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2 font-medium">Price Change (1 Year)</td>
                          {properties.map((property, index) => {
                            const change = property.marketTrends.priceChangeYearly;
                            const values = properties.map(p => p.marketTrends.priceChangeYearly);
                            const isWinner = index === getComparisonWinner(values, true);
                            return (
                              <td key={index} className="text-center p-2">
                                <div className={`${isWinner ? 'text-green-600 font-bold' : ''} ${change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                                  {isWinner && change > 0 && <div className="text-xs">BEST GROWTH</div>}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-medium">Days on Market</td>
                          {properties.map((property, index) => {
                            const values = properties.map(p => p.marketTrends.daysOnMarket);
                            const isWinner = index === getComparisonWinner(values, false);
                            return (
                              <td key={index} className="text-center p-2">
                                <div className={`${isWinner ? 'text-green-600 font-bold' : ''}`}>
                                  {property.marketTrends.daysOnMarket} days
                                  {isWinner && <div className="text-xs">FASTEST SALE</div>}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-medium">Inventory Level</td>
                          {properties.map((property, index) => (
                            <td key={index} className="text-center p-2">
                              <Badge variant={
                                property.marketTrends.inventoryLevel === 'Low' ? 'destructive' :
                                property.marketTrends.inventoryLevel === 'High' ? 'default' : 'secondary'
                              }>
                                {property.marketTrends.inventoryLevel}
                              </Badge>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {properties.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start Your Property Comparison</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Add up to 4 properties to compare their values, rental potential, market trends, and investment opportunities side-by-side.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}