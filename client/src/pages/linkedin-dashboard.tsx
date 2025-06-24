import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  LinkedinIcon, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Search, 
  Download, 
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  Star
} from 'lucide-react';

interface ScrapedProfileData {
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    headline: string;
    summary: string;
    location: string;
    publicProfileUrl: string;
    experience: Array<{
      title: string;
      company: string;
      duration: string;
      location: string;
    }>;
    education: Array<{
      school: string;
      degree: string;
      fieldOfStudy: string;
    }>;
    skills: string[];
    connections: number;
  };
  emails: Array<{
    email: string;
    confidence: number;
    source: string;
    isValid?: boolean;
  }>;
  phoneNumbers: string[];
  companyEmails: Array<{
    email: string;
    confidence: number;
    source: string;
    isValid?: boolean;
  }>;
  socialLinks: Record<string, string>;
}

export default function LinkedInDashboard() {
  const [profileUrl, setProfileUrl] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [scrapedData, setScrapedData] = useState<ScrapedProfileData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [bulkResults, setBulkResults] = useState<ScrapedProfileData[]>([]);
  const [processingStatus, setProcessingStatus] = useState({ current: 0, total: 0 });
  const { toast } = useToast();

  // Get LinkedIn auth URL
  const connectLinkedIn = useMutation({
    mutationFn: () => apiRequest('GET', '/api/linkedin/auth-url'),
    onSuccess: (data) => {
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to LinkedIn. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Scrape single profile
  const scrapeProfile = useMutation({
    mutationFn: (profileUrl: string) => apiRequest('POST', '/api/linkedin/scrape-profile', { profileUrl }),
    onSuccess: (data) => {
      setScrapedData(data);
      toast({
        title: "Profile Scraped",
        description: `Successfully scraped ${data.profile.firstName} ${data.profile.lastName}'s profile`,
      });
    },
    onError: (error) => {
      toast({
        title: "Scraping Failed",
        description: "Failed to scrape LinkedIn profile. Please check the URL.",
        variant: "destructive"
      });
    }
  });

  // Bulk process profiles
  const bulkProcess = useMutation({
    mutationFn: (profileUrls: string[]) => apiRequest('POST', '/api/linkedin/bulk-process', { profileUrls }),
    onSuccess: (data) => {
      setBulkResults(data.results);
      setProcessingStatus({ current: data.processed, total: data.total });
      toast({
        title: "Bulk Processing Complete",
        description: `Successfully processed ${data.processed} out of ${data.total} profiles`,
      });
    },
    onError: (error) => {
      toast({
        title: "Bulk Processing Failed",
        description: "Failed to process LinkedIn profiles in bulk.",
        variant: "destructive"
      });
    }
  });

  // Import to contacts
  const importToContacts = useMutation({
    mutationFn: (scrapedData: ScrapedProfileData) => apiRequest('POST', '/api/linkedin/import-to-contact', { scrapedData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Contact Imported",
        description: "Successfully imported LinkedIn profile to contacts",
      });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: "Failed to import profile to contacts",
        variant: "destructive"
      });
    }
  });

  const handleScrapeProfile = () => {
    if (!profileUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a LinkedIn profile URL",
        variant: "destructive"
      });
      return;
    }
    scrapeProfile.mutate(profileUrl);
  };

  const handleBulkProcess = () => {
    const urls = bulkUrls.split('\n').filter(url => url.trim()).map(url => url.trim());
    if (urls.length === 0) {
      toast({
        title: "URLs Required",
        description: "Please enter LinkedIn profile URLs (one per line)",
        variant: "destructive"
      });
      return;
    }
    setProcessingStatus({ current: 0, total: urls.length });
    bulkProcess.mutate(urls);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">LinkedIn Lead Generation</h1>
          <p className="text-gray-600">Scrape LinkedIn profiles and discover email addresses</p>
        </div>
        
        <Button
          onClick={() => connectLinkedIn.mutate()}
          disabled={connectLinkedIn.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <LinkedinIcon className="w-4 h-4 mr-2" />
          {isConnected ? 'Connected' : 'Connect LinkedIn'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single Profile Scraping */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Single Profile Scraper
            </CardTitle>
            <CardDescription>
              Scrape individual LinkedIn profiles to discover contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">LinkedIn Profile URL</label>
              <Input
                placeholder="https://linkedin.com/in/john-smith"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleScrapeProfile}
              disabled={scrapeProfile.isPending}
              className="w-full"
            >
              {scrapeProfile.isPending ? 'Scraping...' : 'Scrape Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* Bulk Processing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Bulk Profile Processor
            </CardTitle>
            <CardDescription>
              Process multiple LinkedIn profiles at once
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">LinkedIn Profile URLs (one per line)</label>
              <Textarea
                placeholder="https://linkedin.com/in/john-smith&#10;https://linkedin.com/in/jane-doe"
                value={bulkUrls}
                onChange={(e) => setBulkUrls(e.target.value)}
                rows={4}
              />
            </div>
            {processingStatus.total > 0 && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Processing Progress</span>
                  <span>{processingStatus.current}/{processingStatus.total}</span>
                </div>
                <Progress value={(processingStatus.current / processingStatus.total) * 100} />
              </div>
            )}
            <Button 
              onClick={handleBulkProcess}
              disabled={bulkProcess.isPending}
              className="w-full"
            >
              {bulkProcess.isPending ? 'Processing...' : 'Process Profiles'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Scraped Profile Display */}
      {scrapedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Scraped Profile: {scrapedData.profile.firstName} {scrapedData.profile.lastName}</span>
              <Button
                onClick={() => importToContacts.mutate(scrapedData)}
                disabled={importToContacts.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Import to Contacts
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Information */}
              <div>
                <h3 className="font-semibold mb-3">Profile Information</h3>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {scrapedData.profile.firstName} {scrapedData.profile.lastName}</p>
                  <p><strong>Headline:</strong> {scrapedData.profile.headline}</p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {scrapedData.profile.location}
                  </p>
                  {scrapedData.profile.experience.length > 0 && (
                    <p className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {scrapedData.profile.experience[0].title} at {scrapedData.profile.experience[0].company}
                    </p>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="font-semibold mb-3">Discovered Contact Info</h3>
                
                {/* Email Addresses */}
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-medium text-gray-700">Email Addresses</h4>
                  {scrapedData.emails.map((email, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{email.email}</span>
                        {email.isValid ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : email.isValid === false ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getConfidenceColor(email.confidence)}`}></div>
                        <span className="text-xs text-gray-500">
                          {getConfidenceText(email.confidence)} ({Math.round(email.confidence * 100)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Phone Numbers */}
                {scrapedData.phoneNumbers.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Phone Numbers</h4>
                    {scrapedData.phoneNumbers.map((phone, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">{phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Experience */}
            {scrapedData.profile.experience.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Experience</h3>
                <div className="space-y-3">
                  {scrapedData.profile.experience.slice(0, 3).map((exp, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <h4 className="font-medium">{exp.title}</h4>
                      <p className="text-gray-600">{exp.company}</p>
                      <p className="text-sm text-gray-500">{exp.duration}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {scrapedData.profile.skills.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {scrapedData.profile.skills.slice(0, 10).map((skill, index) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  ))}
                  {scrapedData.profile.skills.length > 10 && (
                    <Badge variant="outline">+{scrapedData.profile.skills.length - 10} more</Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bulk Results */}
      {bulkResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Processing Results ({bulkResults.length} profiles)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bulkResults.map((result, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">
                      {result.profile.firstName} {result.profile.lastName}
                    </h4>
                    <Button
                      size="sm"
                      onClick={() => importToContacts.mutate(result)}
                      disabled={importToContacts.isPending}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Import
                    </Button>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{result.profile.headline}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {result.emails.filter(e => e.isValid).length} verified emails
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {result.phoneNumbers.length} phone numbers
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {result.profile.experience[0]?.company || 'No company'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}