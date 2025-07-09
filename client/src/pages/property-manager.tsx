import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Upload, 
  Download, 
  FileText, 
  Building, 
  DollarSign,
  Calendar,
  User,
  Users,
  MapPin,
  Eye,
  RefreshCw,
  Star,
  Shield,
  Brain,
  Home,
  Calculator,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  Plus,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Property Tax Interfaces
interface PropertyTaxInfo {
  year: number;
  assessedValue: number;
  marketValue: number;
  taxRate: number;
  annualTaxAmount: number;
  taxBillNumber: string;
  taxAuthority: string;
  dueDate: string;
  paidStatus: 'paid' | 'unpaid' | 'delinquent';
  exemptions: Array<{
    type: string;
    amount: number;
    description: string;
  }>;
}

interface PropertyOwnershipInfo {
  ownerName: string;
  ownerAddress: string;
  ownershipType: 'individual' | 'corporation' | 'llc' | 'partnership' | 'trust';
  ownershipPercentage: number;
  acquisitionDate: string;
  acquisitionPrice: number;
  legalDescription: string;
  deedType: string;
  titleCompany: string;
}

interface PropertyTaxSearchResult {
  propertyAddress: string;
  parcelNumber: string;
  ownershipInfo: PropertyOwnershipInfo;
  taxInfo: PropertyTaxInfo[];
  documents: any[];
  searchConfidence: number;
  lastUpdated: string;
}

// Property Search Interfaces
interface PropertySearchResult {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  propertyType: string;
  estimatedValue: number;
  yearBuilt: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  lotSize: number;
  zoning: string;
  coordinates: { lat: number; lng: number };
  confidence: number;
  marketAnalysis: {
    pricePerSqft: number;
    medianNeighborhoodValue: number;
    yearOverYearChange: number;
    marketTrend: 'up' | 'down' | 'stable';
  };
  links: {
    zillow: string;
    realtor: string;
    trulia: string;
    redfin: string;
    loopnet: string;
  };
}

export default function PropertyManager() {
  const [activeTab, setActiveTab] = useState<'search' | 'tax' | 'insights'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [taxSearchQuery, setTaxSearchQuery] = useState({
    propertyAddress: '',
    parcelNumber: '',
    ownerName: ''
  });
  const [propertyResults, setPropertyResults] = useState<PropertySearchResult[]>([]);
  const [taxResults, setTaxResults] = useState<PropertyTaxSearchResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadParams, setUploadParams] = useState({
    propertyId: '',
    loanApplicationId: '',
    documentType: 'tax_bill' as const
  });
  const { toast } = useToast();

  // Property Search Mutation
  const propertySearchMutation = useMutation({
    mutationFn: async (address: string) => {
      const response = await apiRequest('POST', '/api/property/search', { address });
      return response.json();
    },
    onSuccess: (data) => {
      setPropertyResults(data.results || []);
      toast({
        title: "Property Search Complete",
        description: `Found ${data.results?.length || 0} properties`,
      });
    },
    onError: (error) => {
      toast({
        title: "Search Failed",
        description: "Failed to search properties. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Tax Search Mutation
  const taxSearchMutation = useMutation({
    mutationFn: async (query: typeof taxSearchQuery) => {
      const response = await apiRequest('POST', '/ai/property-tax/search', query);
      return response.json();
    },
    onSuccess: (data) => {
      setTaxResults(data.result);
      toast({
        title: "Tax Search Complete",
        description: `Found information with ${data.result.searchConfidence}% confidence`,
      });
    },
    onError: (error) => {
      toast({
        title: "Tax Search Failed",
        description: "Failed to search tax information. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Document Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, params }: { file: File; params: typeof uploadParams }) => {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('propertyId', params.propertyId);
      formData.append('loanApplicationId', params.loanApplicationId);
      formData.append('documentType', params.documentType);

      const response = await fetch('/ai/property-tax/process-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Document Processed",
        description: `Document processed with ${data.document.confidence}% confidence`,
      });
      setSelectedFile(null);
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: "Failed to process document. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handlePropertySearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter a property address to search",
        variant: "destructive"
      });
      return;
    }
    propertySearchMutation.mutate(searchQuery);
  };

  const handleTaxSearch = () => {
    if (!taxSearchQuery.propertyAddress) {
      toast({
        title: "Property Address Required",
        description: "Please enter a property address to search",
        variant: "destructive"
      });
      return;
    }
    taxSearchMutation.mutate(taxSearchQuery);
  };

  const handleFileUpload = () => {
    if (!selectedFile || !uploadParams.propertyId || !uploadParams.loanApplicationId) {
      toast({
        title: "Missing Information",
        description: "Please select a file and enter required IDs",
        variant: "destructive"
      });
      return;
    }
    uploadMutation.mutate({ file: selectedFile, params: uploadParams });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'unpaid': return 'bg-yellow-100 text-yellow-800';
      case 'delinquent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOwnershipTypeIcon = (type: string) => {
    switch (type) {
      case 'corporation': return <Building className="h-4 w-4" />;
      case 'llc': return <Shield className="h-4 w-4" />;
      case 'partnership': return <Users className="h-4 w-4" />;
      case 'trust': return <FileText className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getMarketTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <TrendingUp className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Property & Real Estate Manager</h1>
        <p className="text-gray-600">Comprehensive property search, tax analysis, and insights</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">Property Search</TabsTrigger>
          <TabsTrigger value="tax">Tax & Ownership</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Property Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Search Input */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Property Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter property address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handlePropertySearch}
                    disabled={propertySearchMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {propertySearchMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {propertyResults.length > 0 && (
              <div className="lg:col-span-3 space-y-4">
                {propertyResults.map((property, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{property.address}</CardTitle>
                          <p className="text-sm text-gray-600">{property.city}, {property.state} {property.zipCode}</p>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Brain className="h-3 w-3" />
                          {property.confidence}% confidence
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                          <p className="text-sm font-medium">Estimated Value</p>
                          <p className="text-lg font-bold">${property.estimatedValue.toLocaleString()}</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <Home className="h-6 w-6 text-green-600 mx-auto mb-1" />
                          <p className="text-sm font-medium">Type</p>
                          <p className="text-lg font-bold">{property.propertyType}</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <Building className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                          <p className="text-sm font-medium">Year Built</p>
                          <p className="text-lg font-bold">{property.yearBuilt}</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <Calculator className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                          <p className="text-sm font-medium">Square Feet</p>
                          <p className="text-lg font-bold">{property.squareFootage.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Property Details</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Bedrooms:</span> {property.bedrooms}</p>
                            <p><span className="font-medium">Bathrooms:</span> {property.bathrooms}</p>
                            <p><span className="font-medium">Lot Size:</span> {property.lotSize.toLocaleString()} sq ft</p>
                            <p><span className="font-medium">Zoning:</span> {property.zoning}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Market Analysis</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Price/Sq Ft:</span> ${property.marketAnalysis.pricePerSqft}</p>
                            <p><span className="font-medium">Neighborhood Median:</span> ${property.marketAnalysis.medianNeighborhoodValue.toLocaleString()}</p>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Market Trend:</span>
                              {getMarketTrendIcon(property.marketAnalysis.marketTrend)}
                              <span className="capitalize">{property.marketAnalysis.marketTrend}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium mb-2">View on Real Estate Sites</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(property.links).map(([site, url]) => (
                            <Button
                              key={site}
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(url, '_blank')}
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {site.charAt(0).toUpperCase() + site.slice(1)}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tax & Ownership Tab */}
        <TabsContent value="tax" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tax Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Tax Information Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxPropertyAddress">Property Address *</Label>
                    <Input
                      id="taxPropertyAddress"
                      placeholder="123 Main St, City, State"
                      value={taxSearchQuery.propertyAddress}
                      onChange={(e) => setTaxSearchQuery(prev => ({ ...prev, propertyAddress: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="parcelNumber">Parcel Number</Label>
                      <Input
                        id="parcelNumber"
                        placeholder="123-456-789"
                        value={taxSearchQuery.parcelNumber}
                        onChange={(e) => setTaxSearchQuery(prev => ({ ...prev, parcelNumber: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ownerName">Owner Name</Label>
                      <Input
                        id="ownerName"
                        placeholder="John Doe"
                        value={taxSearchQuery.ownerName}
                        onChange={(e) => setTaxSearchQuery(prev => ({ ...prev, ownerName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleTaxSearch}
                    disabled={taxSearchMutation.isPending}
                    className="w-full flex items-center gap-2"
                  >
                    {taxSearchMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Search Tax Information
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Document Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="propertyId">Property ID</Label>
                      <Input
                        id="propertyId"
                        placeholder="123"
                        value={uploadParams.propertyId}
                        onChange={(e) => setUploadParams(prev => ({ ...prev, propertyId: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="loanApplicationId">Loan ID</Label>
                      <Input
                        id="loanApplicationId"
                        placeholder="456"
                        value={uploadParams.loanApplicationId}
                        onChange={(e) => setUploadParams(prev => ({ ...prev, loanApplicationId: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="documentType">Document Type</Label>
                    <select
                      id="documentType"
                      value={uploadParams.documentType}
                      onChange={(e) => setUploadParams(prev => ({ ...prev, documentType: e.target.value as any }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="tax_bill">Tax Bill</option>
                      <option value="assessment_notice">Assessment Notice</option>
                      <option value="tax_certificate">Tax Certificate</option>
                      <option value="ownership_deed">Ownership Deed</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="file">Select Document</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  
                  {selectedFile && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-sm">{selectedFile.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleFileUpload}
                    disabled={!selectedFile || uploadMutation.isPending}
                    className="w-full flex items-center gap-2"
                  >
                    {uploadMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4" />
                    )}
                    Process with AI
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tax Results */}
          {taxResults && (
            <div className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600 truncate">Assessment</p>
                        <p className="text-lg font-bold">${(485000).toLocaleString()}</p>
                      </div>
                      <Home className="h-6 w-6 text-blue-600 flex-shrink-0" />
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600">+12%</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600 truncate">Annual Tax</p>
                        <p className="text-lg font-bold">${(5820).toLocaleString()}</p>
                      </div>
                      <DollarSign className="h-6 w-6 text-green-600 flex-shrink-0" />
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600">+8%</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600 truncate">Tax Rate</p>
                        <p className="text-lg font-bold">1.20%</p>
                      </div>
                      <Calculator className="h-6 w-6 text-purple-600 flex-shrink-0" />
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingDown className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600">Below avg</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600 truncate">AI Score</p>
                        <p className="text-lg font-bold">{taxResults.searchConfidence}%</p>
                      </div>
                      <Brain className="h-6 w-6 text-indigo-600 flex-shrink-0" />
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-gray-600">High</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Property Overview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5" />
                    Property Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Property Address</Label>
                      <p className="font-semibold">{taxResults.propertyAddress}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Parcel Number</Label>
                      <p className="font-semibold">{taxResults.parcelNumber}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ownership & Tax Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {getOwnershipTypeIcon(taxResults.ownershipInfo.ownershipType)}
                      Owner Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Owner Name</Label>
                        <p className="font-semibold">{taxResults.ownershipInfo.ownerName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Ownership Type</Label>
                        <Badge className="text-sm">
                          {taxResults.ownershipInfo.ownershipType.toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Acquisition Price</Label>
                        <p className="font-semibold">
                          ${taxResults.ownershipInfo.acquisitionPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <DollarSign className="h-5 w-5" />
                      Tax Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {taxResults.taxInfo.slice(0, 1).map((tax, index) => (
                        <div key={index} className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span className="font-semibold">Tax Year {tax.year}</span>
                            </div>
                            <Badge className={getStatusColor(tax.paidStatus)}>
                              {tax.paidStatus.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <Label className="text-gray-500">Assessed Value</Label>
                              <p className="font-semibold">${tax.assessedValue.toLocaleString()}</p>
                            </div>
                            <div>
                              <Label className="text-gray-500">Annual Tax</Label>
                              <p className="font-semibold">${tax.annualTaxAmount.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Property Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <Badge className="bg-blue-100 text-blue-800">
                        Market Trend
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-blue-900">Property Value Growth</p>
                    <p className="text-xs text-blue-700">15% increase over 3 years, above market average</p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-green-600" />
                      <Badge className="bg-green-100 text-green-800">
                        Investment Opportunity
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-green-900">Tax Efficiency</p>
                    <p className="text-xs text-green-700">Tax rate 8% below county average - excellent value</p>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Risk Alert
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-yellow-900">Potential Assessment Increase</p>
                    <p className="text-xs text-yellow-700">Market growth suggests 12% increase next year</p>
                  </div>
                </div>

                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced AI Analysis</h3>
                  <p className="text-gray-600 mb-4">Search for properties to unlock detailed AI insights and predictions</p>
                  <Button variant="outline" onClick={() => setActiveTab('search')}>
                    <Search className="h-4 w-4 mr-2" />
                    Start Property Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}