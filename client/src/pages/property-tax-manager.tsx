import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Upload, 
  Download, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
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
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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

interface PropertyTaxDocument {
  id: string;
  propertyId: number;
  loanApplicationId: number;
  documentType: 'tax_bill' | 'assessment_notice' | 'tax_certificate' | 'ownership_deed';
  year: number;
  filePath: string;
  extractedData: any;
  confidence: number;
  aiProvider: 'gemini' | 'openai';
  createdAt: string;
  verified: boolean;
}

interface PropertyTaxSearchResult {
  propertyAddress: string;
  parcelNumber: string;
  ownershipInfo: PropertyOwnershipInfo;
  taxInfo: PropertyTaxInfo[];
  documents: PropertyTaxDocument[];
  searchConfidence: number;
  lastUpdated: string;
}

export default function PropertyTaxManager() {
  const [searchQuery, setSearchQuery] = useState({
    propertyAddress: '',
    parcelNumber: '',
    ownerName: ''
  });
  const [searchResults, setSearchResults] = useState<PropertyTaxSearchResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadParams, setUploadParams] = useState({
    propertyId: '',
    loanApplicationId: '',
    documentType: 'tax_bill' as const
  });
  const { toast } = useToast();

  const searchMutation = useMutation({
    mutationFn: async (query: typeof searchQuery) => {
      const response = await apiRequest('POST', '/ai/property-tax/search', query);
      return response.json();
    },
    onSuccess: (data) => {
      setSearchResults(data.result);
      toast({
        title: "Property Tax Search Complete",
        description: `Found information with ${data.result.searchConfidence}% confidence`,
      });
    },
    onError: (error) => {
      toast({
        title: "Search Failed",
        description: "Failed to search property tax information. Please try again.",
        variant: "destructive"
      });
    }
  });

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
        description: `Tax document processed with ${data.document.confidence}% confidence`,
      });
      setSelectedFile(null);
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: "Failed to process tax document. Please try again.",
        variant: "destructive"
      });
    }
  });

  const autoDownloadMutation = useMutation({
    mutationFn: async ({ address, parcel, years }: { address: string; parcel: string; years: number[] }) => {
      const response = await apiRequest('POST', '/ai/property-tax/auto-download', {
        propertyAddress: address,
        parcelNumber: parcel,
        years
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Auto-Download Complete",
        description: `Downloaded ${data.downloadedFiles.length} tax documents`,
      });
    },
    onError: (error) => {
      toast({
        title: "Auto-Download Failed",
        description: "Failed to download tax bills automatically. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSearch = () => {
    if (!searchQuery.propertyAddress) {
      toast({
        title: "Property Address Required",
        description: "Please enter a property address to search",
        variant: "destructive"
      });
      return;
    }
    searchMutation.mutate(searchQuery);
  };

  const handleFileUpload = () => {
    if (!selectedFile || !uploadParams.propertyId || !uploadParams.loanApplicationId) {
      toast({
        title: "Missing Information",
        description: "Please select a file and enter property/loan application IDs",
        variant: "destructive"
      });
      return;
    }
    uploadMutation.mutate({ file: selectedFile, params: uploadParams });
  };

  const handleAutoDownload = () => {
    if (!searchResults) {
      toast({
        title: "No Search Results",
        description: "Please search for a property first",
        variant: "destructive"
      });
      return;
    }

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear - 2, currentYear - 3]; // Last 3 years
    
    autoDownloadMutation.mutate({
      address: searchResults.propertyAddress,
      parcel: searchResults.parcelNumber,
      years
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'unpaid': return 'bg-yellow-100 text-yellow-800';
      case 'delinquent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Property Tax & Ownership Manager</h1>
        <p className="text-gray-600">AI-powered property tax information and document management</p>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">Search Property</TabsTrigger>
          <TabsTrigger value="upload">Upload Documents</TabsTrigger>
          <TabsTrigger value="results">Search Results</TabsTrigger>
          <TabsTrigger value="management">Document Management</TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Property Tax Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyAddress">Property Address *</Label>
                  <Input
                    id="propertyAddress"
                    placeholder="123 Main St, City, State"
                    value={searchQuery.propertyAddress}
                    onChange={(e) => setSearchQuery(prev => ({ ...prev, propertyAddress: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parcelNumber">Parcel Number</Label>
                  <Input
                    id="parcelNumber"
                    placeholder="123-456-789"
                    value={searchQuery.parcelNumber}
                    onChange={(e) => setSearchQuery(prev => ({ ...prev, parcelNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name</Label>
                  <Input
                    id="ownerName"
                    placeholder="John Doe"
                    value={searchQuery.ownerName}
                    onChange={(e) => setSearchQuery(prev => ({ ...prev, ownerName: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button 
                  onClick={handleSearch} 
                  disabled={searchMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {searchMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Search Property Tax Info
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAutoDownload}
                  disabled={!searchResults || autoDownloadMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {autoDownloadMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Auto-Download Tax Bills
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Tax Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="propertyId">Property ID *</Label>
                  <Input
                    id="propertyId"
                    placeholder="123"
                    value={uploadParams.propertyId}
                    onChange={(e) => setUploadParams(prev => ({ ...prev, propertyId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loanApplicationId">Loan Application ID *</Label>
                  <Input
                    id="loanApplicationId"
                    placeholder="456"
                    value={uploadParams.loanApplicationId}
                    onChange={(e) => setUploadParams(prev => ({ ...prev, loanApplicationId: e.target.value }))}
                  />
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
              </div>
              
              <div className="space-y-4">
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
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">{selectedFile.name}</span>
                      <Badge variant="outline">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</Badge>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={handleFileUpload}
                  disabled={!selectedFile || uploadMutation.isPending}
                  className="flex items-center gap-2"
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
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {searchResults ? (
            <div className="space-y-6">
              {/* Property Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Property Overview
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Star className={`h-4 w-4 ${getConfidenceColor(searchResults.searchConfidence)}`} />
                    <span className={`text-sm font-medium ${getConfidenceColor(searchResults.searchConfidence)}`}>
                      {searchResults.searchConfidence}% Confidence
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Property Address</Label>
                        <p className="text-lg font-semibold">{searchResults.propertyAddress}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Parcel Number</Label>
                        <p className="text-lg font-semibold">{searchResults.parcelNumber}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                        <p className="text-lg font-semibold">
                          {new Date(searchResults.lastUpdated).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">AI Provider</Label>
                        <Badge variant="outline" className="text-sm">
                          <Brain className="h-3 w-3 mr-1" />
                          Gemini + OpenAI
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ownership Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getOwnershipTypeIcon(searchResults.ownershipInfo.ownershipType)}
                    Ownership Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Owner Name</Label>
                        <p className="text-lg font-semibold">{searchResults.ownershipInfo.ownerName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Owner Address</Label>
                        <p className="text-lg font-semibold">{searchResults.ownershipInfo.ownerAddress}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Ownership Type</Label>
                        <Badge className="text-sm">
                          {searchResults.ownershipInfo.ownershipType.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Ownership Percentage</Label>
                        <p className="text-lg font-semibold">{searchResults.ownershipInfo.ownershipPercentage}%</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Acquisition Date</Label>
                        <p className="text-lg font-semibold">{searchResults.ownershipInfo.acquisitionDate}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Acquisition Price</Label>
                        <p className="text-lg font-semibold">
                          ${searchResults.ownershipInfo.acquisitionPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tax Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Tax Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {searchResults.taxInfo.map((tax, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className="font-semibold">Tax Year {tax.year}</span>
                          </div>
                          <Badge className={getStatusColor(tax.paidStatus)}>
                            {tax.paidStatus.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <Label className="text-gray-500">Assessed Value</Label>
                            <p className="font-semibold">${tax.assessedValue.toLocaleString()}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Market Value</Label>
                            <p className="font-semibold">${tax.marketValue.toLocaleString()}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Tax Rate</Label>
                            <p className="font-semibold">{tax.taxRate}%</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Annual Tax</Label>
                            <p className="font-semibold">${tax.annualTaxAmount.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label className="text-gray-500">Tax Bill Number</Label>
                            <p className="font-semibold">{tax.taxBillNumber}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Due Date</Label>
                            <p className="font-semibold">{new Date(tax.dueDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Search Results</h3>
                <p className="text-gray-600">Search for a property to view tax and ownership information</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Document Management Tab */}
        <TabsContent value="management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Document Management</h3>
                <p className="text-gray-600">View and manage uploaded tax documents</p>
                <Button variant="outline" className="mt-4">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Documents
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}