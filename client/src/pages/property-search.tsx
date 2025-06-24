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
  const [searchAddress, setSearchAddress] = useState('');
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const { toast } = useToast();

  // Property data search
  const handleSearch = async () => {
    if (!searchAddress.trim()) {
      toast({
        title: "Missing Address",
        description: "Please enter a property address to search",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Call the property data service endpoint
      const response = await fetch(`/api/property/data?address=${encodeURIComponent(searchAddress)}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      setPropertyData(data);
      
      toast({
        title: "Property Found",
        description: `Retrieved data for ${data.address}`,
      });
    } catch (error) {
      console.error('Property search failed:', error);
      
      // Show demo data for testing purposes
      const demoData: PropertyData = {
        address: searchAddress,
        city: "Los Angeles",
        state: "CA",
        zipCode: "90210",
        estimatedValue: 850000,
        yearBuilt: 1995,
        squareFootage: 2400,
        propertyType: "Single Family",
        bedrooms: 4,
        bathrooms: 3,
        annualPropertyTaxes: 10625,
        monthlyPropertyTaxes: 885,
        estimatedInsurance: 2400,
        monthlyInsurance: 200,
        neighborhood: "Beverly Hills",
        recentSales: [
          { address: "123 Similar St", salePrice: 825000, saleDate: "2024-01-15", squareFootage: 2350 },
          { address: "456 Nearby Ave", salePrice: 875000, saleDate: "2024-02-20", squareFootage: 2500 }
        ],
        marketTrends: {
          priceChange30Days: 2.5,
          priceChange90Days: 5.2,
          priceChangeYearly: 8.7,
          inventoryLevel: "Low",
          daysOnMarket: 28
        },
        rentalEstimates: {
          monthlyRent: 4200,
          rentPerSqFt: 1.75,
          occupancyRate: 95,
          capRate: 5.2
        },
        dataSource: ["Demo Data"],
        lastUpdated: new Date(),
        confidence: 85
      };
      
      setPropertyData(demoData);
      
      toast({
        title: "Demo Data Loaded",
        description: "Showing sample property data for demonstration",
      });
    } finally {
      setIsLoading(false);
    }
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
              <Input
                id="address"
                placeholder="123 Main St, City, State 12345"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleSearch}
                disabled={propertySearchMutation.isPending}
                className="px-8"
              >
                {propertySearchMutation.isPending ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Data Results */}
      {propertyData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Property Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="w-5 h-5" />
                      Property Overview
                    </CardTitle>
                    <CardDescription>{propertyData.address}, {propertyData.city}, {propertyData.state}</CardDescription>
                  </div>
                  <Badge className={getConfidenceColor(propertyData.confidence)}>
                    {propertyData.confidence}% Confidence
                  </Badge>
                </div>
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
                    <div className="text-2xl font-bold">{propertyData.bedrooms}/{propertyData.bathrooms}</div>
                    <div className="text-sm text-text-secondary">Bed/Bath</div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="font-semibold mb-2">Property Details</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Property Type:</span>
                        <span>{propertyData.propertyType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lot Size:</span>
                        <span>{propertyData.lotSize?.toLocaleString()} sq ft</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Neighborhood:</span>
                        <span>{propertyData.neighborhood}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Walk Score:</span>
                        <span>{propertyData.walkScore}/100</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold mb-2">Monthly Costs</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Property Taxes:</span>
                        <span>{formatCurrency(propertyData.monthlyPropertyTaxes)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Insurance:</span>
                        <span>{formatCurrency(propertyData.monthlyInsurance)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total Monthly:</span>
                        <span>{formatCurrency(propertyData.monthlyPropertyTaxes + propertyData.monthlyInsurance)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rental Analysis */}
            {propertyData.rentalEstimates && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
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
                        ${propertyData.rentalEstimates.rentPerSqFt.toFixed(2)}
                      </div>
                      <div className="text-sm text-text-secondary">Rent/Sq Ft</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {(propertyData.rentalEstimates.occupancyRate * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-text-secondary">Occupancy Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {(propertyData.rentalEstimates.capRate * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-text-secondary">Cap Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Market Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Market Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getTrendColor(propertyData.marketTrends.priceChange30Days)}`}>
                      {propertyData.marketTrends.priceChange30Days > 0 ? '+' : ''}
                      {propertyData.marketTrends.priceChange30Days.toFixed(1)}%
                    </div>
                    <div className="text-sm text-text-secondary">30 Days</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getTrendColor(propertyData.marketTrends.priceChange90Days)}`}>
                      {propertyData.marketTrends.priceChange90Days > 0 ? '+' : ''}
                      {propertyData.marketTrends.priceChange90Days.toFixed(1)}%
                    </div>
                    <div className="text-sm text-text-secondary">90 Days</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getTrendColor(propertyData.marketTrends.priceChangeYearly)}`}>
                      {propertyData.marketTrends.priceChangeYearly > 0 ? '+' : ''}
                      {propertyData.marketTrends.priceChangeYearly.toFixed(1)}%
                    </div>
                    <div className="text-sm text-text-secondary">1 Year</div>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Inventory Level:</span>
                    <span className="capitalize">{propertyData.marketTrends.inventoryLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Days on Market:</span>
                    <span>{propertyData.marketTrends.daysOnMarket} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* School Ratings */}
            {propertyData.schoolRatings && propertyData.schoolRatings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    School Ratings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {propertyData.schoolRatings.map((school, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-sm">{school.name}</div>
                          <div className="text-xs text-text-secondary">{school.type}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{school.rating}/10</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Sales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Recent Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {propertyData.recentSales.map((sale, index) => (
                      <div key={index} className="border-b pb-3 last:border-b-0">
                        <div className="font-medium text-sm">{sale.address}</div>
                        <div className="flex justify-between text-xs text-text-secondary">
                          <span>{formatCurrency(sale.salePrice)}</span>
                          <span>{sale.saleDate}</span>
                        </div>
                        <div className="text-xs text-text-secondary">
                          {sale.squareFootage.toLocaleString()} sq ft
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
                <CardTitle className="text-sm">Data Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {propertyData.dataSource.map((source, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {source}
                    </Badge>
                  ))}
                  <div className="text-xs text-text-secondary mt-2">
                    Last updated: {new Date(propertyData.lastUpdated).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!propertyData && !propertySearchMutation.isPending && (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Search for Property Data</h3>
            <p className="text-text-secondary">
              Enter a property address above to retrieve comprehensive data including value estimates,
              market trends, rental analysis, and comparable sales.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}