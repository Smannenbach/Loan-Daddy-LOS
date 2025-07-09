import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  UserPlus, 
  Download, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Users,
  Star,
  DollarSign,
  TrendingUp,
  Brain,
  Sparkles,
  Plus,
  X,
  Globe,
  Linkedin,
  Twitter,
  Github,
  Instagram,
  Facebook
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface LinkedInProfile {
  id: string;
  name: string;
  headline: string;
  company: string;
  location: string;
  profileUrl: string;
  imageUrl: string;
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    years: string;
  }>;
  skills: string[];
  connections: number;
  verified: boolean;
  premium: boolean;
}

interface EnrichedContactData {
  linkedinProfile: LinkedInProfile;
  contactInfo: {
    email: string;
    phone: string;
    alternateEmails: string[];
    socialMediaProfiles: {
      twitter: string;
      facebook: string;
      instagram: string;
      github: string;
      website: string;
    };
  };
  professionalInfo: {
    industry: string;
    seniority: string;
    companySize: string;
    estimatedIncome: string;
    networkValue: string;
    influenceScore: number;
  };
  realEstateInfo: {
    propertyOwnership: Array<{
      address: string;
      estimatedValue: number;
      propertyType: string;
      ownershipType: string;
    }>;
    investmentCapacity: string;
    loanEligibility: string;
  };
  confidence: number;
  lastUpdated: Date;
}

interface LinkedInSearchResult {
  profiles: LinkedInProfile[];
  totalResults: number;
  searchQuery: string;
  confidence: number;
}

export default function LinkedInIntegration() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<LinkedInProfile | null>(null);
  const [enrichedData, setEnrichedData] = useState<EnrichedContactData | null>(null);
  const [searchResults, setSearchResults] = useState<LinkedInProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'enrich' | 'import'>('search');
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search LinkedIn profiles
  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest('POST', '/api/linkedin/search', { 
        query,
        filters: {
          location: 'United States',
          industry: 'Real Estate,Financial Services,Construction,Investment'
        }
      });
      return response.json();
    },
    onSuccess: (data) => {
      setSearchResults(data.data.profiles);
      toast({
        title: "LinkedIn Search Complete",
        description: `Found ${data.data.profiles.length} profiles`,
      });
    },
    onError: (error) => {
      toast({
        title: "Search Failed",
        description: "Failed to search LinkedIn profiles. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Enrich contact data
  const enrichMutation = useMutation({
    mutationFn: async (profileUrl: string) => {
      const response = await apiRequest('POST', '/api/linkedin/enrich', { 
        linkedinUrl: profileUrl 
      });
      return response.json();
    },
    onSuccess: (data) => {
      setEnrichedData(data.data);
      setActiveTab('enrich');
      toast({
        title: "Contact Enriched",
        description: `Successfully enriched with ${data.data.confidence}% confidence`,
      });
    },
    onError: (error) => {
      toast({
        title: "Enrichment Failed",
        description: "Failed to enrich contact data. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Import contact to system
  const importMutation = useMutation({
    mutationFn: async (enrichedData: EnrichedContactData) => {
      const response = await apiRequest('POST', '/api/linkedin/import', { 
        enrichedData 
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      setActiveTab('import');
      toast({
        title: "Contact Imported",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: "Failed to import contact. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Quick import (enrich + import in one step)
  const quickImportMutation = useMutation({
    mutationFn: async (profileUrl: string) => {
      const response = await apiRequest('POST', '/api/linkedin/quick-import', { 
        linkedinUrl: profileUrl,
        autoImport: true
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Contact Added",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Quick Import Failed",
        description: "Failed to add contact. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Query Required",
        description: "Please enter a search query",
        variant: "destructive"
      });
      return;
    }
    searchMutation.mutate(searchQuery);
  };

  const handleEnrich = (profile: LinkedInProfile) => {
    setSelectedProfile(profile);
    enrichMutation.mutate(profile.profileUrl);
  };

  const handleImport = () => {
    if (!enrichedData) return;
    importMutation.mutate(enrichedData);
  };

  const handleQuickImport = (profile: LinkedInProfile) => {
    quickImportMutation.mutate(profile.profileUrl);
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'github': return <Github className="h-4 w-4" />;
      case 'website': return <Globe className="h-4 w-4" />;
      default: return <ExternalLink className="h-4 w-4" />;
    }
  };

  const getInvestmentCapacityColor = (capacity: string) => {
    switch (capacity.toLowerCase()) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">LinkedIn Integration</h2>
          <p className="text-gray-600">Search, enrich, and import contacts from LinkedIn</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Linkedin className="h-4 w-4" />
          AI-Powered Contact Enrichment
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">Search LinkedIn</TabsTrigger>
          <TabsTrigger value="enrich">Enrich Data</TabsTrigger>
          <TabsTrigger value="import">Import Status</TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                LinkedIn Profile Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Search for professionals (e.g., 'real estate investor Chicago')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
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
                  Search
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">Search Results ({searchResults.length})</h3>
                  {searchResults.map((profile) => (
                    <Card key={profile.id} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{profile.name}</h4>
                              <p className="text-sm text-gray-600">{profile.headline}</p>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {profile.company}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {profile.location}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {profile.connections} connections
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedProfile(profile);
                                  setIsDetailDialogOpen(true);
                                }}
                              >
                                View Details
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEnrich(profile)}
                                disabled={enrichMutation.isPending}
                              >
                                {enrichMutation.isPending ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Brain className="h-3 w-3" />
                                )}
                                Enrich
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleQuickImport(profile)}
                                disabled={quickImportMutation.isPending}
                              >
                                {quickImportMutation.isPending ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <UserPlus className="h-3 w-3" />
                                )}
                                Quick Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && !searchMutation.isPending && (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Search for LinkedIn profiles to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enrich Tab */}
        <TabsContent value="enrich" className="space-y-4">
          {enrichedData ? (
            <div className="space-y-4">
              {/* Profile Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Enriched Contact Data
                    <Badge variant="outline" className="ml-2">
                      {enrichedData.confidence}% Confidence
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{enrichedData.linkedinProfile.name}</h3>
                      <p className="text-gray-600">{enrichedData.linkedinProfile.headline}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {enrichedData.linkedinProfile.company}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {enrichedData.linkedinProfile.location}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Email</Label>
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {enrichedData.contactInfo.email || 'Not found'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Phone</Label>
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {enrichedData.contactInfo.phone || 'Not found'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Social Media</Label>
                        <div className="flex gap-2 mt-1">
                          {Object.entries(enrichedData.contactInfo.socialMediaProfiles).map(([platform, url]) => 
                            url && (
                              <Button
                                key={platform}
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(url, '_blank')}
                                className="flex items-center gap-1"
                              >
                                {getSocialIcon(platform)}
                                {platform}
                              </Button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Professional Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Industry</Label>
                        <p className="font-medium">{enrichedData.professionalInfo.industry}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Seniority</Label>
                        <Badge variant="outline">{enrichedData.professionalInfo.seniority}</Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Estimated Income</Label>
                        <p className="font-medium">{enrichedData.professionalInfo.estimatedIncome}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Influence Score</Label>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${enrichedData.professionalInfo.influenceScore}%` }}
                            />
                          </div>
                          <span className="text-sm">{enrichedData.professionalInfo.influenceScore}/100</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Real Estate Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Real Estate Investment Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <Badge className={getInvestmentCapacityColor(enrichedData.realEstateInfo.investmentCapacity)}>
                          {enrichedData.realEstateInfo.investmentCapacity}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">Investment Capacity</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium">Loan Eligibility</p>
                      <p className="text-xs text-gray-600 mt-1">{enrichedData.realEstateInfo.loanEligibility}</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Star className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm font-medium">Lead Quality</p>
                      <p className="text-xs text-gray-600 mt-1">High potential borrower</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Import Button */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Ready to Import</h3>
                      <p className="text-sm text-gray-600">Add this enriched contact to your system</p>
                    </div>
                    <Button 
                      onClick={handleImport}
                      disabled={importMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {importMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                      Import Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Enriched Data</h3>
                <p className="text-gray-600">Search and enrich a LinkedIn profile to view detailed information</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Import Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Contact Successfully Imported</h3>
                <p className="text-gray-600 mb-4">The contact has been added to your system with all enriched data</p>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('search')}
                  className="mr-2"
                >
                  Search More Profiles
                </Button>
                <Button onClick={() => window.location.href = '/contacts'}>
                  View All Contacts
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Profile Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Profile Details</DialogTitle>
          </DialogHeader>
          {selectedProfile && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedProfile.name}</h3>
                  <p className="text-gray-600">{selectedProfile.headline}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {selectedProfile.company}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedProfile.location}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Professional Summary</h4>
                <p className="text-sm text-gray-600">{selectedProfile.summary}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Recent Experience</h4>
                <div className="space-y-2">
                  {selectedProfile.experience.slice(0, 2).map((exp, index) => (
                    <div key={index} className="border-l-2 border-blue-200 pl-4">
                      <h5 className="font-medium text-sm">{exp.title}</h5>
                      <p className="text-xs text-gray-600">{exp.company} • {exp.duration}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedProfile.skills.slice(0, 6).map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsDetailDialogOpen(false);
                  handleEnrich(selectedProfile);
                }}>
                  Enrich & Import
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}