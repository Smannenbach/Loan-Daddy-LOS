import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Linkedin, 
  Twitter, 
  Facebook, 
  Globe, 
  MapPin, 
  Phone, 
  Mail, 
  Building, 
  Users, 
  Calendar, 
  DollarSign,
  TrendingUp,
  User,
  Search,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Star,
  Award,
  Target,
  Activity,
  Instagram,
  MessageSquare,
  Briefcase,
  GraduationCap,
  Heart,
  Eye,
  Share2,
  BookOpen,
  Camera,
  Music,
  Gamepad2,
  Palette
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SocialProfile {
  platform: string;
  url: string;
  username: string;
  verified: boolean;
  followers: number;
  following: number;
  posts: number;
  bio: string;
  profileImage: string;
  lastActivity: string;
  engagement: {
    rate: number;
    avgLikes: number;
    avgComments: number;
    avgShares: number;
  };
  interests: string[];
  location: string;
  company: string;
  jobTitle: string;
  connections: number;
  skills: string[];
  education: Array<{
    school: string;
    degree: string;
    year: string;
  }>;
  recentActivity: Array<{
    type: string;
    content: string;
    date: string;
    engagement: number;
  }>;
}

interface EnrichmentData {
  contactId: number;
  profiles: SocialProfile[];
  publicRecords: {
    businessOwnership: Array<{
      businessName: string;
      role: string;
      revenue: string;
      employees: number;
      industry: string;
    }>;
    propertyOwnership: Array<{
      address: string;
      value: number;
      purchaseDate: string;
      propertyType: string;
    }>;
    professionalLicenses: Array<{
      license: string;
      state: string;
      expirationDate: string;
      status: string;
    }>;
    courtRecords: Array<{
      type: string;
      date: string;
      status: string;
      description: string;
    }>;
  };
  insights: {
    wealthIndicators: {
      score: number;
      factors: string[];
      estimatedNetWorth: string;
    };
    riskFactors: {
      score: number;
      factors: string[];
      level: 'low' | 'medium' | 'high';
    };
    businessPotential: {
      score: number;
      factors: string[];
      likelihood: string;
    };
    personalityProfile: {
      traits: string[];
      communicationStyle: string;
      decisionMaking: string;
      motivations: string[];
    };
  };
  lastUpdated: string;
  confidence: number;
}

interface SocialProfileEnrichmentProps {
  contactId: number;
  initialData?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    jobTitle: string;
  };
  onDataUpdate?: (data: EnrichmentData) => void;
  className?: string;
}

export default function SocialProfileEnrichment({ 
  contactId, 
  initialData,
  onDataUpdate,
  className 
}: SocialProfileEnrichmentProps) {
  const [enrichmentData, setEnrichmentData] = useState<EnrichmentData | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<SocialProfile | null>(null);
  const { toast } = useToast();

  // Fetch existing enrichment data
  const { data: existingData, isLoading } = useQuery({
    queryKey: [`/api/social-enrichment/${contactId}`],
    enabled: !!contactId,
  });

  // Enrich contact mutation
  const enrichMutation = useMutation({
    mutationFn: async () => {
      setIsEnriching(true);
      return await apiRequest(`/api/social-enrichment/${contactId}/enrich`, {
        method: 'POST',
        body: JSON.stringify(initialData)
      });
    },
    onSuccess: (data: EnrichmentData) => {
      setEnrichmentData(data);
      onDataUpdate?.(data);
      toast({
        title: "Enrichment Complete",
        description: `Found ${data.profiles.length} social profiles and additional insights`,
      });
    },
    onError: (error) => {
      toast({
        title: "Enrichment Failed",
        description: "Unable to enrich contact data. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsEnriching(false);
    }
  });

  useEffect(() => {
    if (existingData) {
      setEnrichmentData(existingData);
    }
  }, [existingData]);

  const handleEnrich = () => {
    enrichMutation.mutate();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'instagram': return <Instagram className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin': return 'bg-blue-100 text-blue-600';
      case 'twitter': return 'bg-sky-100 text-sky-600';
      case 'facebook': return 'bg-indigo-100 text-indigo-600';
      case 'instagram': return 'bg-pink-100 text-pink-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getEngagementLevel = (rate: number) => {
    if (rate > 5) return { level: 'High', color: 'text-green-600' };
    if (rate > 2) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'Low', color: 'text-red-600' };
  };

  const getWealthScore = (score: number) => {
    if (score > 80) return { level: 'High', color: 'text-green-600', icon: <Award className="h-4 w-4" /> };
    if (score > 60) return { level: 'Medium-High', color: 'text-blue-600', icon: <Star className="h-4 w-4" /> };
    if (score > 40) return { level: 'Medium', color: 'text-yellow-600', icon: <Target className="h-4 w-4" /> };
    return { level: 'Low', color: 'text-red-600', icon: <Activity className="h-4 w-4" /> };
  };

  const getRiskLevel = (level: string) => {
    switch (level) {
      case 'low': return { color: 'text-green-600', bg: 'bg-green-100' };
      case 'medium': return { color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'high': return { color: 'text-red-600', bg: 'bg-red-100' };
      default: return { color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="h-64 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Social Profile Enrichment</h2>
          <p className="text-sm text-gray-600">
            {enrichmentData ? `Last updated: ${new Date(enrichmentData.lastUpdated).toLocaleDateString()}` : 'No enrichment data available'}
          </p>
        </div>
        <Button
          onClick={handleEnrich}
          disabled={isEnriching}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isEnriching ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Enriching...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {enrichmentData ? 'Refresh Data' : 'Enrich Contact'}
            </div>
          )}
        </Button>
      </div>

      {enrichmentData ? (
        <Tabs defaultValue="social" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="social">Social Profiles</TabsTrigger>
            <TabsTrigger value="business">Business Intel</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="records">Public Records</TabsTrigger>
          </TabsList>

          {/* Social Profiles Tab */}
          <TabsContent value="social" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrichmentData.profiles.map((profile, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedProfile(profile)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("p-2 rounded-full", getPlatformColor(profile.platform))}>
                          {getPlatformIcon(profile.platform)}
                        </div>
                        <div>
                          <h3 className="font-medium">{profile.platform}</h3>
                          <p className="text-sm text-gray-600">@{profile.username}</p>
                        </div>
                      </div>
                      {profile.verified && (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile.profileImage} />
                          <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{profile.company}</p>
                          <p className="text-xs text-gray-600">{profile.jobTitle}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-sm font-medium">{formatNumber(profile.followers)}</p>
                          <p className="text-xs text-gray-600">Followers</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{formatNumber(profile.following)}</p>
                          <p className="text-xs text-gray-600">Following</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{formatNumber(profile.posts)}</p>
                          <p className="text-xs text-gray-600">Posts</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-gray-400" />
                          <span className={cn("text-xs", getEngagementLevel(profile.engagement.rate).color)}>
                            {getEngagementLevel(profile.engagement.rate).level}
                          </span>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <a href={profile.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Business Intelligence Tab */}
          <TabsContent value="business" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Business Ownership
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {enrichmentData.publicRecords.businessOwnership.map((business, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{business.businessName}</h4>
                            <p className="text-sm text-gray-600">{business.role}</p>
                            <p className="text-xs text-gray-500">{business.industry}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{business.revenue}</p>
                            <p className="text-xs text-gray-600">{business.employees} employees</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Property Portfolio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {enrichmentData.publicRecords.propertyOwnership.map((property, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{property.address}</h4>
                            <p className="text-sm text-gray-600">{property.propertyType}</p>
                            <p className="text-xs text-gray-500">Purchased {property.purchaseDate}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">${property.value.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Wealth Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getWealthScore(enrichmentData.insights.wealthIndicators.score).icon}
                        <span className={cn("font-medium", getWealthScore(enrichmentData.insights.wealthIndicators.score).color)}>
                          {getWealthScore(enrichmentData.insights.wealthIndicators.score).level}
                        </span>
                      </div>
                      <Badge variant="secondary">{enrichmentData.insights.wealthIndicators.score}/100</Badge>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Estimated Net Worth</p>
                      <p className="text-2xl font-bold text-green-600">{enrichmentData.insights.wealthIndicators.estimatedNetWorth}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Wealth Factors</p>
                      <div className="space-y-1">
                        {enrichmentData.insights.wealthIndicators.factors.map((factor, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-sm">{factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Business Potential
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Loan Likelihood</span>
                      <Badge variant="secondary">{enrichmentData.insights.businessPotential.likelihood}</Badge>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Potential Factors</p>
                      <div className="space-y-1">
                        {enrichmentData.insights.businessPotential.factors.map((factor, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Star className="h-3 w-3 text-yellow-600" />
                            <span className="text-sm">{factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personality Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Communication Style</p>
                      <Badge className="bg-blue-100 text-blue-800">{enrichmentData.insights.personalityProfile.communicationStyle}</Badge>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Decision Making</p>
                      <Badge className="bg-green-100 text-green-800">{enrichmentData.insights.personalityProfile.decisionMaking}</Badge>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Key Motivations</p>
                      <div className="flex flex-wrap gap-1">
                        {enrichmentData.insights.personalityProfile.motivations.map((motivation, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{motivation}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Risk Level</span>
                      <Badge className={cn(getRiskLevel(enrichmentData.insights.riskFactors.level).bg, getRiskLevel(enrichmentData.insights.riskFactors.level).color)}>
                        {enrichmentData.insights.riskFactors.level.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Risk Factors</p>
                      <div className="space-y-1">
                        {enrichmentData.insights.riskFactors.factors.map((factor, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <AlertCircle className="h-3 w-3 text-orange-600" />
                            <span className="text-sm">{factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Public Records Tab */}
          <TabsContent value="records" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Professional Licenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {enrichmentData.publicRecords.professionalLicenses.map((license, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{license.license}</h4>
                            <p className="text-sm text-gray-600">{license.state}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={license.status === 'Active' ? 'default' : 'secondary'}>
                              {license.status}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">Expires: {license.expirationDate}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Legal Records
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {enrichmentData.publicRecords.courtRecords.map((record, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{record.type}</h4>
                            <p className="text-sm text-gray-600">{record.description}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={record.status === 'Resolved' ? 'default' : 'secondary'}>
                              {record.status}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">{record.date}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No Enrichment Data Available</h3>
            <p className="text-gray-600 mb-4">
              Click "Enrich Contact" to gather social media profiles, business intelligence, and public records.
            </p>
            <Button onClick={handleEnrich} disabled={isEnriching}>
              {isEnriching ? 'Enriching...' : 'Start Enrichment'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Confidence Indicator */}
      {enrichmentData && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Data Confidence</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${enrichmentData.confidence}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{enrichmentData.confidence}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}