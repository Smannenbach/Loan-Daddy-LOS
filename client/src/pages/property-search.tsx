import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Calculator,
  ExternalLink,
  Copy,
  Shield,
  School,
  Car,
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
  salesHistory: Array<{
    date: string;
    price: number;
    type: string;
    source: string;
  }>;
  countyTaxData: {
    county: string;
    taxYear: number;
    assessedValue: number;
    marketValue: number;
    taxRate: string;
    annualTax: number;
    exemptions: string[];
    millageRate: string;
    paymentDueDates: string[];
    lastAssessment: string;
    appealDeadline: string;
    parcelNumber: string;
  };
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
  lastUpdated: string;
  confidence: number;
}

export default function PropertySearch() {
  const [address, setAddress] = useState("");
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchType, setSearchType] = useState<'unit' | 'building'>('unit');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const searchMutation = useMutation({
    mutationFn: async (searchAddress: string) => {
      console.log('Searching for:', searchAddress, 'Type:', searchType);
      const response = await fetch(`/api/property-data?address=${encodeURIComponent(searchAddress)}&searchType=${searchType}`);
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch property data: ${response.status} - ${errorData}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Property data received:', data);
      try {
        setError(null);
        setPropertyData(data);
        setShowSuggestions(false);
        toast({
          title: "Property Found",
          description: `Found data for ${data.address}`,
        });
      } catch (err) {
        console.error('Error setting property data:', err);
        setError('Failed to display property data');
      }
    },
    onError: (error) => {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!address.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter a property address to search",
        variant: "destructive",
      });
      return;
    }
    console.log('Starting search for:', address);
    setShowSuggestions(false);
    searchMutation.mutate(address.trim());
  };

  // Address autocomplete with Google Places API
  useEffect(() => {
    if (address.length > 3) {
      const timeoutId = setTimeout(() => {
        fetchAddressSuggestions(address);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  }, [address]);

  const fetchAddressSuggestions = async (query: string) => {
    try {
      // Use our backend API to get address suggestions (avoiding CORS issues)
      const response = await fetch(`/api/address-autocomplete?input=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.suggestions) {
        setAddressSuggestions(data.suggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      // Fallback to basic suggestions for common addresses
      const basicSuggestions = [
        `${query}, New York, NY`,
        `${query}, Los Angeles, CA`,
        `${query}, Chicago, IL`,
        `${query}, Houston, TX`,
        `${query}, Phoenix, AZ`
      ];
      setAddressSuggestions(basicSuggestions);
      setShowSuggestions(true);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Address copied to clipboard",
    });
  };

  const getPropertyLinks = (data: PropertyData) => {
    const encodedAddress = encodeURIComponent(`${data.address}, ${data.city}, ${data.state} ${data.zipCode}`);
    const isCommercial = searchType === 'building' || data.propertyType?.toLowerCase().includes('apartment') || data.propertyType?.toLowerCase().includes('complex');
    
    return {
      zillow: `https://www.zillow.com/homes/${encodedAddress}_rb/`,
      realtor: `https://www.realtor.com/realestateandhomes-search/${data.city}_${data.state}/address-${encodedAddress}`,
      trulia: `https://www.trulia.com/for_sale/${data.city},${data.state}/`,
      redfin: `https://www.redfin.com/stingray/do/location-search?location=${encodedAddress}`,
      loopnet: isCommercial 
        ? `https://www.loopnet.com/search/commercial-real-estate/for-sale/?sk=191ba1d0f375bf5ae0068f420ca832d1&loc=${encodedAddress}`
        : `https://www.loopnet.com/search/commercial-real-estate/${data.city}-${data.state}/`,
      apartments: `https://www.apartments.com/${data.city}-${data.state}/`,
      rent: `https://www.rent.com/${data.city}-${data.state}/`,
      googleMaps: `https://maps.google.com/maps?q=${encodedAddress}`
    };
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
                  placeholder="Enter property address (e.g., 4111 N Drinkwater Blvd, Scottsdale, AZ)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={() => setShowSuggestions(addressSuggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {addressSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm flex items-center gap-2"
                        onClick={() => {
                          setAddress(suggestion);
                          setShowSuggestions(false);
                          searchMutation.mutate(suggestion);
                        }}
                      >
                        <MapPin className="h-4 w-4 text-gray-400" />
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
          
          <div className="mt-4">
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium">Search Type:</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="searchType"
                    value="unit"
                    checked={searchType === 'unit'}
                    onChange={(e) => setSearchType(e.target.value as 'unit' | 'building')}
                    className="text-primary"
                  />
                  <span className="text-sm">Individual Unit/Home</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="searchType"
                    value="building"
                    checked={searchType === 'building'}
                    onChange={(e) => setSearchType(e.target.value as 'unit' | 'building')}
                    className="text-primary"
                  />
                  <span className="text-sm">Entire Building/Complex</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-800">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Property Data Results */}
      {propertyData && !error && (
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

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="tax">County Tax</TabsTrigger>
                  <TabsTrigger value="history">Sales History</TabsTrigger>
                  <TabsTrigger value="market">Market</TabsTrigger>
                  <TabsTrigger value="neighborhood">Area</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Property Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <span className="font-medium">{propertyData.propertyType}</span>
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
                        {searchType === 'building' && propertyData.units && (
                          <div className="flex justify-between">
                            <span>Total Units:</span>
                            <span className="font-bold text-orange-600">{propertyData.units}</span>
                          </div>
                        )}
                        {propertyData.walkScore && (
                          <div className="flex justify-between">
                            <span>Walk Score:</span>
                            <span>{propertyData.walkScore}/100</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Value Breakdown
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Price per Sq Ft:</span>
                          <span>{formatCurrency(propertyData.estimatedValue / propertyData.squareFootage)}</span>
                        </div>
                        {searchType === 'building' && propertyData.units && (
                          <div className="flex justify-between">
                            <span>Price per Unit:</span>
                            <span className="font-bold">{formatCurrency(propertyData.estimatedValue / propertyData.units)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Data Sources:</span>
                          <span>{propertyData.dataSource.length} APIs</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Updated:</span>
                          <span>{propertyData.lastUpdated ? new Date(propertyData.lastUpdated).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-4">
                  {/* Enhanced Financial Analysis */}
                  {searchType === 'building' && propertyData.rentalEstimates?.rentPerUnit ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Commercial Income Analysis
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Rent per Unit:</span>
                            <span className="font-bold">{formatCurrency(propertyData.rentalEstimates.rentPerUnit)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Monthly Rent:</span>
                            <span className="font-bold text-green-600">{formatCurrency(propertyData.rentalEstimates.monthlyRent)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Gross Annual Income:</span>
                            <span>{formatCurrency(propertyData.rentalEstimates.grossRentalIncome)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Net Operating Income:</span>
                            <span className="font-bold">{formatCurrency(propertyData.rentalEstimates.netOperatingIncome)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span>Cap Rate:</span>
                            <span className="font-bold text-blue-600">{(propertyData.rentalEstimates.capRate * 100).toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Calculator className="w-4 h-4" />
                          Operating Metrics
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Occupancy Rate:</span>
                            <span>{(propertyData.rentalEstimates.occupancyRate * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Operating Expense Ratio:</span>
                            <span>{(propertyData.rentalEstimates.operatingExpenseRatio * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rent-to-Value Ratio:</span>
                            <span>{((propertyData.rentalEstimates.monthlyRent * 12 / propertyData.estimatedValue) * 100).toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Home className="w-4 h-4" />
                          Residential Analysis
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Estimated Monthly Rent:</span>
                            <span className="font-bold text-green-600">{formatCurrency(propertyData.rentalEstimates?.monthlyRent || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rent per Sq Ft:</span>
                            <span>{formatCurrency(propertyData.rentalEstimates?.rentPerSqFt || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cap Rate:</span>
                            <span>{((propertyData.rentalEstimates?.capRate || 0) * 100).toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="tax" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Banknote className="w-4 h-4" />
                        County Tax Assessment
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>County:</span>
                          <span className="font-bold">{propertyData.countyTaxData.county}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Parcel Number:</span>
                          <span className="font-mono text-xs">{propertyData.countyTaxData.parcelNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax Year:</span>
                          <span>{propertyData.countyTaxData.taxYear}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Assessed Value:</span>
                          <span className="font-bold">{formatCurrency(propertyData.countyTaxData.assessedValue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Market Value:</span>
                          <span className="font-bold">{formatCurrency(propertyData.countyTaxData.marketValue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax Rate:</span>
                          <span className="font-bold">{propertyData.countyTaxData.taxRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Millage Rate:</span>
                          <span>{propertyData.countyTaxData.millageRate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Annual Tax:</span>
                          <span className="font-bold text-red-600">{formatCurrency(propertyData.countyTaxData.annualTax)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Tax Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Payment Due Dates:</span>
                          <div className="ml-2">
                            {propertyData.countyTaxData.paymentDueDates.map((date, index) => (
                              <div key={index}>• {date}</div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Exemptions:</span>
                          <div className="ml-2">
                            {propertyData.countyTaxData.exemptions.map((exemption, index) => (
                              <div key={index}>• {exemption}</div>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Assessment:</span>
                          <span>{propertyData.countyTaxData.lastAssessment}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Appeal Deadline:</span>
                          <span className="font-bold text-orange-600">{propertyData.countyTaxData.appealDeadline}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Property Sales History
                    </h4>
                    <div className="space-y-3">
                      {propertyData.salesHistory.map((sale, index) => (
                        <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{sale.date}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              {sale.type} • {sale.source}
                              {sale.type === 'Sale' && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Public Record</span>
                              )}
                              {sale.type === 'Current Estimate' && (
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Estimated</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">{formatCurrency(sale.price)}</div>
                            {index > 0 && (
                              <div className={`text-sm ${
                                sale.price > propertyData.salesHistory[index - 1].price 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {sale.price > propertyData.salesHistory[index - 1].price ? '+' : ''}
                                {(((sale.price - propertyData.salesHistory[index - 1].price) / propertyData.salesHistory[index - 1].price) * 100).toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="market" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getTrendColor(propertyData.marketTrends.priceChange30Days)}`}>
                        {propertyData.marketTrends.priceChange30Days > 0 ? '+' : ''}
                        {propertyData.marketTrends.priceChange30Days.toFixed(1)}%
                      </div>
                      <div className="text-sm text-text-secondary">30 Day Price Change</div>
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
                  
                  <div>
                    <h4 className="font-semibold mb-3">Market Inventory Level</h4>
                    <Badge variant={propertyData.marketTrends.inventoryLevel === 'Low' ? 'destructive' : 
                                 propertyData.marketTrends.inventoryLevel === 'High' ? 'default' : 'secondary'}>
                      {propertyData.marketTrends.inventoryLevel} Inventory
                    </Badge>
                  </div>
                </TabsContent>

                <TabsContent value="neighborhood" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Car className="w-4 h-4" />
                        Walkability & Transportation
                      </h4>
                      <div className="space-y-2 text-sm">
                        {propertyData.walkScore && (
                          <div className="flex justify-between">
                            <span>Walk Score:</span>
                            <span className="font-bold">{propertyData.walkScore}/100</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Neighborhood:</span>
                          <span>{propertyData.neighborhood}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <School className="w-4 h-4" />
                        School Ratings
                      </h4>
                      <div className="space-y-2 text-sm">
                        {propertyData.schoolRatings?.map((school, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{school.type}:</span>
                            <div className="flex items-center gap-1">
                              <span>{school.rating}/10</span>
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
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
                          {sale.squareFootage.toLocaleString()} sq ft • {sale.saleDate}
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

          {/* Property Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5" />
                View on Real Estate Sites
              </CardTitle>
              <CardDescription>
                Research this property on major real estate platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(() => {
                  const links = getPropertyLinks(propertyData);
                  const isCommercial = searchType === 'building' || propertyData.propertyType?.toLowerCase().includes('apartment') || propertyData.propertyType?.toLowerCase().includes('complex');
                  
                  return (
                    <>
                      {isCommercial && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(links.loopnet, '_blank')}
                          className="justify-start border-orange-200 hover:border-orange-300 hover:bg-orange-50"
                        >
                          <Building2 className="w-4 h-4 mr-2 text-orange-600" />
                          LoopNet
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(links.zillow, '_blank')}
                        className="justify-start"
                      >
                        <Home className="w-4 h-4 mr-2" />
                        Zillow
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(links.realtor, '_blank')}
                        className="justify-start"
                      >
                        <Home className="w-4 h-4 mr-2" />
                        Realtor.com
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(links.trulia, '_blank')}
                        className="justify-start"
                      >
                        <Home className="w-4 h-4 mr-2" />
                        Trulia
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(links.redfin, '_blank')}
                        className="justify-start"
                      >
                        <Home className="w-4 h-4 mr-2" />
                        Redfin
                      </Button>
                      {!isCommercial && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(links.loopnet, '_blank')}
                          className="justify-start"
                        >
                          <Building2 className="w-4 h-4 mr-2" />
                          LoopNet
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(links.googleMaps, '_blank')}
                        className="justify-start"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Google Maps
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(`${propertyData.address}, ${propertyData.city}, ${propertyData.state} ${propertyData.zipCode}`)}
                        className="justify-start"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Address
                      </Button>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Data Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Data Sources & Reliability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-wrap gap-2">
                  {propertyData.dataSource.map((source, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {source}
                    </Badge>
                  ))}
                </div>
                <Badge className={`${getConfidenceColor(propertyData.confidence)} px-2 py-1`}>
                  {propertyData.confidence}% Confidence
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Last updated: {propertyData.lastUpdated ? new Date(propertyData.lastUpdated).toLocaleDateString() : 'N/A'} • Data aggregated from {propertyData.dataSource.length} sources
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No data or API integration needed state */}
      {propertyData && propertyData.confidence === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Property Data Not Available</h3>
            <p className="text-text-secondary max-w-md mx-auto mb-4">
              This address requires real estate API integration to retrieve accurate property data. 
              Currently configured APIs are experiencing issues.
            </p>
            <p className="text-sm text-text-secondary">
              Address parsed: {propertyData.address}, {propertyData.city}, {propertyData.state} {propertyData.zipCode}
            </p>
          </CardContent>
        </Card>
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