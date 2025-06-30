import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Linkedin, 
  Twitter, 
  Github, 
  Building, 
  DollarSign,
  MapPin,
  Star,
  ExternalLink,
  Sparkles,
  TrendingUp,
  School,
  Briefcase,
  Network,
  Home,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface SocialProfile {
  platform: 'linkedin' | 'facebook' | 'twitter' | 'instagram' | 'github';
  profileUrl: string;
  username: string;
  displayName: string;
  bio?: string;
  followers?: number;
  location?: string;
  verified: boolean;
  profileImageUrl?: string;
  company?: string;
  jobTitle?: string;
  skills?: string[];
  connectionLevel?: 'first' | 'second' | 'third' | 'out-of-network';
}

interface EnrichedData {
  profiles: SocialProfile[];
  additionalInfo: {
    estimatedIncome?: string;
    propertyOwnership?: {
      owns: boolean;
      properties?: Array<{
        address: string;
        value: number;
        type: string;
      }>;
    };
    businessAffiliations?: string[];
    education?: Array<{
      institution: string;
      degree: string;
      graduationYear?: number;
    }>;
    professionalNetwork?: {
      connections: number;
      industries: string[];
      seniority: 'entry' | 'mid' | 'senior' | 'executive' | 'c-level';
    };
  };
  confidence: number;
  lastUpdated: Date;
}

interface SocialEnrichmentWidgetProps {
  contactId: number;
  contactName: string;
  contactEmail?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SocialEnrichmentWidget({ 
  contactId, 
  contactName, 
  contactEmail, 
  isOpen, 
  onClose 
}: SocialEnrichmentWidgetProps) {
  const [enrichedData, setEnrichedData] = useState<EnrichedData | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch enrichment suggestions
  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: ['/api/contacts', contactId, 'enrichment-suggestions'],
    queryFn: () => apiRequest('GET', `/api/contacts/${contactId}/enrichment-suggestions`),
    enabled: isOpen,
  });

  // Enrich contact mutation
  const enrichContactMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/contacts/${contactId}/enrich`),
    onSuccess: (data: EnrichedData) => {
      setEnrichedData(data);
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Profile Enriched",
        description: `Found ${data.profiles.length} social profiles with ${data.confidence}% confidence.`,
      });
    },
    onError: () => {
      toast({
        title: "Enrichment Failed",
        description: "Unable to enrich profile. Please try again later.",
        variant: "destructive"
      });
    }
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return Linkedin;
      case 'twitter': return Twitter;
      case 'github': return Github;
      default: return Users;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'linkedin': return 'text-blue-600';
      case 'twitter': return 'text-sky-500';
      case 'github': return 'text-gray-800';
      default: return 'text-gray-600';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeniorityIcon = (seniority: string) => {
    switch (seniority) {
      case 'c-level':
      case 'executive': return Star;
      case 'senior': return TrendingUp;
      default: return Briefcase;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl h-[80vh] m-4">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Social Profile Enrichment
              </CardTitle>
              <CardDescription>
                Enhance {contactName}'s profile with social media and professional data
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {!enrichedData ? (
            <div className="space-y-6">
              {/* Suggestions */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Available Enrichments
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {suggestions.suggestions?.map((suggestion: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Contact Information</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Name:</strong> {contactName}</div>
                  {contactEmail && <div><strong>Email:</strong> {contactEmail}</div>}
                </div>
              </div>

              {/* Enrich Button */}
              <div className="text-center">
                <Button
                  onClick={() => enrichContactMutation.mutate()}
                  disabled={enrichContactMutation.isPending}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {enrichContactMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enriching Profile...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Enrich Profile
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Confidence Score */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Enrichment Confidence</h3>
                  <span className={`font-bold ${getConfidenceColor(enrichedData.confidence)}`}>
                    {enrichedData.confidence}%
                  </span>
                </div>
                <Progress value={enrichedData.confidence} className="h-2" />
                <p className="text-sm text-gray-600 mt-2">
                  Last updated: {new Date(enrichedData.lastUpdated).toLocaleString()}
                </p>
              </div>

              <Tabs defaultValue="profiles" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="profiles">Social Profiles</TabsTrigger>
                  <TabsTrigger value="professional">Professional</TabsTrigger>
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                </TabsList>

                <TabsContent value="profiles" className="space-y-4">
                  <ScrollArea className="h-64">
                    {enrichedData.profiles.length > 0 ? (
                      <div className="space-y-4">
                        {enrichedData.profiles.map((profile, index) => {
                          const PlatformIcon = getPlatformIcon(profile.platform);
                          return (
                            <Card key={index} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <PlatformIcon className={`w-5 h-5 ${getPlatformColor(profile.platform)}`} />
                                    <div>
                                      <h4 className="font-medium">{profile.displayName}</h4>
                                      <p className="text-sm text-gray-600">@{profile.username}</p>
                                    </div>
                                  </div>
                                  {profile.verified && (
                                    <Badge className="bg-blue-100 text-blue-800">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Verified
                                    </Badge>
                                  )}
                                </div>

                                {profile.bio && (
                                  <p className="text-sm text-gray-700 mb-3">{profile.bio}</p>
                                )}

                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-4">
                                    {profile.followers && (
                                      <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {profile.followers.toLocaleString()}
                                      </span>
                                    )}
                                    {profile.location && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {profile.location}
                                      </span>
                                    )}
                                  </div>
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={profile.profileUrl} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      View
                                    </a>
                                  </Button>
                                </div>

                                {profile.skills && profile.skills.length > 0 && (
                                  <div className="mt-3">
                                    <div className="flex flex-wrap gap-1">
                                      {profile.skills.slice(0, 5).map((skill, skillIndex) => (
                                        <Badge key={skillIndex} variant="secondary" className="text-xs">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No social profiles found</p>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="professional" className="space-y-4">
                  <ScrollArea className="h-64">
                    <div className="space-y-4">
                      {enrichedData.additionalInfo.professionalNetwork && (
                        <Card>
                          <CardContent className="p-4">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <Network className="w-4 h-4" />
                              Professional Network
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Connections:</span>
                                <span className="ml-2 font-medium">
                                  {enrichedData.additionalInfo.professionalNetwork.connections.toLocaleString()}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Seniority:</span>
                                <Badge variant="secondary" className="ml-2">
                                  {enrichedData.additionalInfo.professionalNetwork.seniority}
                                </Badge>
                              </div>
                            </div>
                            <div className="mt-3">
                              <span className="text-gray-600 text-sm">Industries:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {enrichedData.additionalInfo.professionalNetwork.industries.map((industry, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {industry}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {enrichedData.additionalInfo.businessAffiliations && (
                        <Card>
                          <CardContent className="p-4">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <Building className="w-4 h-4" />
                              Business Affiliations
                            </h4>
                            <div className="space-y-2">
                              {enrichedData.additionalInfo.businessAffiliations.map((affiliation, index) => (
                                <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                                  {affiliation}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="financial" className="space-y-4">
                  <ScrollArea className="h-64">
                    <div className="space-y-4">
                      {enrichedData.additionalInfo.estimatedIncome && (
                        <Card>
                          <CardContent className="p-4">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              Estimated Income
                            </h4>
                            <div className="text-2xl font-bold text-green-600">
                              {enrichedData.additionalInfo.estimatedIncome}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Annual estimated income</p>
                          </CardContent>
                        </Card>
                      )}

                      {enrichedData.additionalInfo.propertyOwnership && (
                        <Card>
                          <CardContent className="p-4">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <Home className="w-4 h-4" />
                              Property Ownership
                            </h4>
                            {enrichedData.additionalInfo.propertyOwnership.owns ? (
                              <div className="space-y-3">
                                <Badge className="bg-green-100 text-green-800">Property Owner</Badge>
                                {enrichedData.additionalInfo.propertyOwnership.properties?.map((property, index) => (
                                  <div key={index} className="p-3 bg-gray-50 rounded">
                                    <div className="font-medium">{property.type}</div>
                                    <div className="text-sm text-gray-600">{property.address}</div>
                                    <div className="text-sm font-medium text-green-600">
                                      ${property.value.toLocaleString()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <Badge variant="secondary">No property ownership found</Badge>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="education" className="space-y-4">
                  <ScrollArea className="h-64">
                    {enrichedData.additionalInfo.education && enrichedData.additionalInfo.education.length > 0 ? (
                      <div className="space-y-4">
                        {enrichedData.additionalInfo.education.map((edu, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <School className="w-4 h-4 text-blue-600" />
                                <h4 className="font-medium">{edu.institution}</h4>
                              </div>
                              <div className="text-sm text-gray-600">
                                <div>{edu.degree}</div>
                                {edu.graduationYear && (
                                  <div>Graduated: {edu.graduationYear}</div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <School className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No education information found</p>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => setEnrichedData(null)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Again
                </Button>
                <Button onClick={onClose}>
                  Apply Changes
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}