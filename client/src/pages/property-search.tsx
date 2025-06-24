import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  MapPin, 
  Home, 
  DollarSign,
  Calendar,
  Ruler,
  TrendingUp,
  Star,
  Building2,
  Banknote,
  Calculator
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
  lotSize?: number;
  annualPropertyTaxes: number;
  monthlyPropertyTaxes: number;
  estimatedInsurance: number;
  monthlyInsurance: number;
  neighborhood: string;
  walkScore?: number;
  schoolRatings?: Array<{
    name: string;
    rating: number;
    type: string;
  }>;
  recentSales: Array<{
    address: string;
    salePrice: number;
    saleDate: string;
    squareFootage: number;
  }>;
  marketTrends: {
    priceChange30Days: number;
    priceChange90Days: number;
    priceChangeYearly: number;
    inventoryLevel: string;
    daysOnMarket: number;
  };
  rentalEstimates?: {
    monthlyRent: number;
    rentPerSqFt: number;
    occupancyRate: number;
    capRate: number;
  };
  dataSource: string[];
  lastUpdated: Date;
  confidence: number;
}

export default function PropertySearch() {
  const [searchAddress, setSearchAddress] = useState("");
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();

  const searchMutation = useMutation({
    mutationFn: async (address: string) => {
      const response = await apiRequest(`/api/property-data?address=${encodeURIComponent(address)}`);
      return response;
    },
    onSuccess: (data) => {
      setPropertyData({
        ...data,
        lastUpdated: new Date(data.lastUpdated)
      });
      toast({
        title: "Property Data Retrieved",
        description: "Successfully loaded property information from multiple sources.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Search Failed",
        description: error.message || "Failed to retrieve property data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!searchAddress.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter a property address to search.",
        variant: "destructive",
      });
      return;
    }
    searchMutation.mutate(searchAddress.trim());
  };

  const handleAddressChange = (value: string) => {
    setSearchAddress(value);
    // Clear suggestions since we don't have a geocoding service integrated
    setAddressSuggestions([]);
    setShowSuggestions(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600 bg-green-50";
    if (confidence >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MapPin className="w-8 h-8 text-blue-600" />
          Property Intelligence
        </h1>
        <p className="text-text-secondary mt-2">
          Search and analyze property data from multiple real estate sources
        </p>
      </div>

      {/* Search Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Property Search
          </CardTitle>
          <CardDescription>
            Enter a property address to retrieve comprehensive data from Zillow, Trulia, LoopNet, and other sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="address">Property Address</Label>
              <div className="relative">
                <Input
                  id="address"
                  placeholder="123 Main St, City, State 12345"
                  value={searchAddress}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={() => setShowSuggestions(false)}
                  onBlur={() => setShowSuggestions(false)}
                />
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {addressSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                        onClick={() => {
                          setSearchAddress(suggestion);
                          setShowSuggestions(false);
                        }}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={searchMutation.isPending}
              className="mt-6"
            >
              {searchMutation.isPending ? "Searching..." : "Search Property"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Property Data Results */}
      {propertyData && (
        <div className="space-y-6">
          {/* Property Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Property Overview
                </div>
                <Badge className={getConfidenceColor(propertyData.confidence)}>
                  {propertyData.confidence}% Confidence
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(propertyData.estimatedValue)}
                  </div>
                  <div className="text-sm text-text-secondary">Estimated Value</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{propertyData.yearBuilt}</div>
                  <div className="text-sm text-text-secondary">Year Built</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{propertyData.squareFootage.toLocaleString()}</div>
                  <div className="text-sm text-text-secondary">Sq Ft</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {propertyData.bedrooms || 'N/A'}/{propertyData.bathrooms || 'N/A'}
                  </div>
                  <div className="text-sm text-text-secondary">Bed/Bath</div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Property Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Address:</span>
                      <span>{propertyData.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span>{propertyData.propertyType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Neighborhood:</span>
                      <span>{propertyData.neighborhood}</span>
                    </div>
                    {propertyData.lotSize && (
                      <div className="flex justify-between">
                        <span>Lot Size:</span>
                        <span>{propertyData.lotSize.toLocaleString()} sq ft</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Monthly Expenses</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Property Taxes:</span>
                      <span>{formatCurrency(propertyData.monthlyPropertyTaxes)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Insurance:</span>
                      <span>{formatCurrency(propertyData.monthlyInsurance)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total PITI:</span>
                      <span>{formatCurrency(propertyData.monthlyPropertyTaxes + propertyData.monthlyInsurance)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Market Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getTrendColor(propertyData.marketTrends.priceChange30Days)}`}>
                    {propertyData.marketTrends.priceChange30Days > 0 ? '+' : ''}
                    {propertyData.marketTrends.priceChange30Days.toFixed(1)}%
                  </div>
                  <div className="text-sm text-text-secondary">30 Day Change</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getTrendColor(propertyData.marketTrends.priceChangeYearly)}`}>
                    {propertyData.marketTrends.priceChangeYearly > 0 ? '+' : ''}
                    {propertyData.marketTrends.priceChangeYearly.toFixed(1)}%
                  </div>
                  <div className="text-sm text-text-secondary">Yearly Change</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{propertyData.marketTrends.daysOnMarket}</div>
                  <div className="text-sm text-text-secondary">Avg Days on Market</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rental Analysis */}
          {propertyData.rentalEstimates && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="w-5 h-5" />
                  Rental Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(propertyData.rentalEstimates.monthlyRent)}
                    </div>
                    <div className="text-sm text-text-secondary">Monthly Rent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {formatCurrency(propertyData.rentalEstimates.rentPerSqFt)}
                    </div>
                    <div className="text-sm text-text-secondary">Per Sq Ft</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {(propertyData.rentalEstimates.occupancyRate * 100).toFixed(0)}%
                    </div>
                    <div className="text-sm text-text-secondary">Occupancy Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {(propertyData.rentalEstimates.capRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-text-secondary">Cap Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comparable Sales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Recent Comparable Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {propertyData.recentSales.map((sale, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{sale.address}</div>
                        <div className="text-sm text-text-secondary">
                          {sale.squareFootage.toLocaleString()} sq ft • {new Date(sale.saleDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(sale.salePrice)}</div>
                        <div className="text-sm text-text-secondary">
                          {formatCurrency(sale.salePrice / sale.squareFootage)}/sq ft
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Data Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Data Sources & Reliability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {propertyData.dataSource.map((source, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {source}
                  </Badge>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                Last updated: {propertyData.lastUpdated.toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state */}
      {!propertyData && !searchMutation.isPending && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Search for Property Data</h3>
            <p className="text-text-secondary max-w-md mx-auto">
              Enter a property address above to retrieve comprehensive data including valuations, 
              market trends, rental analysis, and comparable sales.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}