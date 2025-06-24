import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Plus, 
  Building2, 
  MapPin, 
  ExternalLink,
  Users,
  Loader2
} from 'lucide-react';

interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  headline: string;
  summary: string;
  location: string;
  profilePicture: string;
  publicProfileUrl: string;
  experience: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate?: string;
    description: string;
    location: string;
  }>;
  skills: string[];
  connections: number;
  email?: string;
}

interface LinkedInSearchProps {
  onImportContact: (contact: any) => void;
}

export default function LinkedInSearch({ onImportContact }: LinkedInSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchTitle, setSearchTitle] = useState('');
  const [searchCompany, setSearchCompany] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<LinkedInProfile | null>(null);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // LinkedIn search query
  const { data: searchResults, isLoading: isSearching, refetch: searchProfiles } = useQuery({
    queryKey: ['/api/linkedin/search', { 
      query: searchQuery, 
      location: searchLocation, 
      title: searchTitle, 
      currentCompany: searchCompany 
    }],
    enabled: false // Manual trigger
  });

  // Import profile mutation
  const importProfileMutation = useMutation({
    mutationFn: (profileId: string) => apiRequest('POST', '/api/linkedin/import', { profileId }),
    onSuccess: (newContact) => {
      onImportContact(newContact);
      setShowProfileDetail(false);
      toast({
        title: "Contact Imported",
        description: "LinkedIn profile has been successfully imported as a contact.",
      });
    },
    onError: () => {
      toast({
        title: "Import Failed",
        description: "Failed to import LinkedIn profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a search query.",
        variant: "destructive"
      });
      return;
    }
    searchProfiles();
  };

  const handleImportProfile = (profile: LinkedInProfile) => {
    importProfileMutation.mutate(profile.id);
  };

  const getCurrentCompany = (experience: any[]) => {
    if (!experience || experience.length === 0) return null;
    return experience.find(exp => !exp.endDate) || experience[0];
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            LinkedIn Prospect Search
          </CardTitle>
          <CardDescription>
            Search and import LinkedIn profiles as contacts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search-query">Search Keywords *</Label>
              <Input
                id="search-query"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., real estate agent, loan officer"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <Label htmlFor="search-location">Location</Label>
              <Input
                id="search-location"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="e.g., Los Angeles, CA"
              />
            </div>
            <div>
              <Label htmlFor="search-title">Job Title</Label>
              <Input
                id="search-title"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                placeholder="e.g., Senior Agent, Loan Officer"
              />
            </div>
            <div>
              <Label htmlFor="search-company">Company</Label>
              <Input
                id="search-company"
                value={searchCompany}
                onChange={(e) => setSearchCompany(e.target.value)}
                placeholder="e.g., Century 21, Wells Fargo"
              />
            </div>
          </div>
          <Button onClick={handleSearch} disabled={isSearching} className="w-full">
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search LinkedIn
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found {searchResults.totalResults} profiles matching your criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            {searchResults.profiles?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No profiles found matching your search criteria.</p>
                <p className="text-sm">Try adjusting your search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.profiles?.map((profile: LinkedInProfile) => {
                  const currentJob = getCurrentCompany(profile.experience);
                  
                  return (
                    <Card 
                      key={profile.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setSelectedProfile(profile);
                        setShowProfileDetail(true);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            {profile.profilePicture ? (
                              <img 
                                src={profile.profilePicture} 
                                alt={`${profile.firstName} ${profile.lastName}`}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-blue-600 font-semibold">
                                {profile.firstName[0]}{profile.lastName[0]}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">
                              {profile.firstName} {profile.lastName}
                            </h3>
                            <p className="text-xs text-gray-600 truncate">
                              {profile.headline}
                            </p>
                            {currentJob && (
                              <div className="flex items-center gap-1 mt-1">
                                <Building2 className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500 truncate">
                                  {currentJob.company}
                                </span>
                              </div>
                            )}
                            {profile.location && (
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500 truncate">
                                  {profile.location}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <Badge variant="outline" className="text-xs">
                                {profile.connections}+ connections
                              </Badge>
                              <Button 
                                size="sm" 
                                className="h-6 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImportProfile(profile);
                                }}
                                disabled={importProfileMutation.isPending}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Import
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Profile Detail Dialog */}
      <Dialog open={showProfileDetail} onOpenChange={setShowProfileDetail}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedProfile && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedProfile.firstName} {selectedProfile.lastName}
                </DialogTitle>
                <DialogDescription>
                  {selectedProfile.headline}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Profile Summary */}
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    {selectedProfile.profilePicture ? (
                      <img 
                        src={selectedProfile.profilePicture} 
                        alt={`${selectedProfile.firstName} ${selectedProfile.lastName}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-blue-600 font-semibold text-lg">
                        {selectedProfile.firstName[0]}{selectedProfile.lastName[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {selectedProfile.firstName} {selectedProfile.lastName}
                    </h3>
                    <p className="text-gray-600">{selectedProfile.headline}</p>
                    {selectedProfile.location && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {selectedProfile.location}
                        </span>
                      </div>
                    )}
                    <Badge variant="outline" className="mt-2">
                      {selectedProfile.connections}+ connections
                    </Badge>
                  </div>
                </div>

                {/* Summary */}
                {selectedProfile.summary && (
                  <div>
                    <Label>Summary</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedProfile.summary}
                    </p>
                  </div>
                )}

                {/* Experience */}
                {selectedProfile.experience && selectedProfile.experience.length > 0 && (
                  <div>
                    <Label>Experience</Label>
                    <div className="space-y-3 mt-2">
                      {selectedProfile.experience.slice(0, 3).map((exp, index) => (
                        <div key={index} className="border-l-2 border-blue-200 pl-3">
                          <h4 className="font-medium text-sm">{exp.title}</h4>
                          <p className="text-sm text-gray-600">{exp.company}</p>
                          <p className="text-xs text-gray-500">
                            {exp.startDate} - {exp.endDate || 'Present'}
                          </p>
                          {exp.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {selectedProfile.skills && selectedProfile.skills.length > 0 && (
                  <div>
                    <Label>Skills</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedProfile.skills.slice(0, 10).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => handleImportProfile(selectedProfile)}
                    disabled={importProfileMutation.isPending}
                    className="flex-1"
                  >
                    {importProfileMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Import as Contact
                      </>
                    )}
                  </Button>
                  <Button variant="outline" asChild>
                    <a 
                      href={selectedProfile.publicProfileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Profile
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}