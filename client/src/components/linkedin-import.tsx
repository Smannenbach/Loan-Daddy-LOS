import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Linkedin, Users, Mail, Phone, Building, 
  AlertCircle, CheckCircle, Search, Upload,
  UserPlus, Loader2, Filter, Download
} from 'lucide-react';

interface LinkedInContact {
  id: string;
  name: string;
  email: string;
  emailConfidence: number;
  phones: string[];
  phoneConfidence: number;
  company?: string;
  title?: string;
  profileUrl?: string;
  profileImage?: string;
  selected?: boolean;
}

interface ImportProgress {
  progress: number;
  message: string;
  complete?: boolean;
  results?: {
    imported: number;
    failed: number;
    duplicates: number;
  };
}

export default function LinkedInImport() {
  const [isConnected, setIsConnected] = useState(false);
  const [contacts, setContacts] = useState<LinkedInContact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const { toast } = useToast();
  
  // Demo data for testing
  const loadDemoContacts = () => {
    const demoContacts: LinkedInContact[] = [
      {
        id: '1',
        name: 'John Smith',
        email: 'john.smith@realestateinvest.com',
        emailConfidence: 0.92,
        phones: ['+1 (555) 123-4567'],
        phoneConfidence: 0.85,
        company: 'Smith Real Estate Investments',
        title: 'CEO & Real Estate Investor',
        profileUrl: 'https://linkedin.com/in/johnsmith',
        profileImage: 'https://ui-avatars.com/api/?name=John+Smith'
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        email: 'sarah@johnsonproperties.com',
        emailConfidence: 0.88,
        phones: [],
        phoneConfidence: 0,
        company: 'Johnson Properties LLC',
        title: 'Property Investment Manager',
        profileUrl: 'https://linkedin.com/in/sarahjohnson',
        profileImage: 'https://ui-avatars.com/api/?name=Sarah+Johnson'
      },
      {
        id: '3',
        name: 'Michael Chen',
        email: 'mchen@commercialrealty.net',
        emailConfidence: 0.75,
        phones: ['+1 (555) 987-6543', '+1 (555) 555-1234'],
        phoneConfidence: 0.90,
        company: 'Commercial Realty Partners',
        title: 'Senior Real Estate Broker',
        profileUrl: 'https://linkedin.com/in/michaelchen',
        profileImage: 'https://ui-avatars.com/api/?name=Michael+Chen'
      },
      {
        id: '4',
        name: 'Emily Davis',
        email: 'emily.davis@residentialinvest.com',
        emailConfidence: 0.65,
        phones: [],
        phoneConfidence: 0,
        company: 'Davis Residential Investments',
        title: 'Real Estate Development Director',
        profileUrl: 'https://linkedin.com/in/emilydavis',
        profileImage: 'https://ui-avatars.com/api/?name=Emily+Davis'
      },
      {
        id: '5',
        name: 'Robert Martinez',
        email: 'rmartinez@propertyflippers.com',
        emailConfidence: 0.82,
        phones: ['+1 (555) 246-8135'],
        phoneConfidence: 0.78,
        company: 'Property Flippers Inc.',
        title: 'Fix & Flip Specialist',
        profileUrl: 'https://linkedin.com/in/robertmartinez',
        profileImage: 'https://ui-avatars.com/api/?name=Robert+Martinez'
      }
    ];
    
    setContacts(demoContacts);
    setIsConnected(true);
    toast({
      title: "Demo contacts loaded",
      description: "Showing 5 sample LinkedIn contacts for testing"
    });
  };

  // Connect to LinkedIn
  const connectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/linkedin/connect');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: (error) => {
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect to LinkedIn",
        variant: "destructive"
      });
    }
  });

  // Extract contacts
  const extractMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/linkedin/extract-contacts', {
        accessToken: localStorage.getItem('linkedinToken') // Temporary storage
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.contacts) {
        setContacts(data.contacts.map((c: any) => ({
          ...c,
          id: Math.random().toString(36).substr(2, 9)
        })));
        toast({
          title: "Contacts extracted",
          description: `Found ${data.contacts.length} contacts with contact information`
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Extraction failed",
        description: error.message || "Failed to extract contacts",
        variant: "destructive"
      });
    }
  });

  // Import selected contacts
  const importMutation = useMutation({
    mutationFn: async () => {
      const contactsToImport = contacts.filter(c => selectedContacts.has(c.id));
      
      // Set up EventSource for progress updates
      const eventSource = new EventSource('/api/linkedin/import-contacts');
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setImportProgress(data);
        
        if (data.complete) {
          eventSource.close();
          queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        toast({
          title: "Import failed",
          description: "Failed to import contacts",
          variant: "destructive"
        });
      };

      return new Promise((resolve) => {
        eventSource.addEventListener('close', () => resolve(true));
      });
    }
  });

  // Toggle contact selection
  const toggleContactSelection = (contactId: string) => {
    const newSelection = new Set(selectedContacts);
    if (newSelection.has(contactId)) {
      newSelection.delete(contactId);
    } else {
      newSelection.add(contactId);
    }
    setSelectedContacts(newSelection);
  };

  // Select all contacts
  const selectAllContacts = () => {
    const filteredContacts = getFilteredContacts();
    const allIds = new Set(filteredContacts.map(c => c.id));
    setSelectedContacts(allIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedContacts(new Set());
  };

  // Filter contacts
  const getFilteredContacts = () => {
    let filtered = contacts;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    switch (filterBy) {
      case 'high-confidence':
        filtered = filtered.filter(c => c.emailConfidence >= 0.8);
        break;
      case 'has-phone':
        filtered = filtered.filter(c => c.phones.length > 0);
        break;
      case 'real-estate':
        filtered = filtered.filter(c => 
          c.title?.toLowerCase().includes('real estate') ||
          c.title?.toLowerCase().includes('realtor') ||
          c.title?.toLowerCase().includes('broker') ||
          c.company?.toLowerCase().includes('realty')
        );
        break;
    }

    return filtered;
  };

  const filteredContacts = getFilteredContacts();

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Linkedin className="h-6 w-6 text-blue-600" />
              LinkedIn Contact Import
            </CardTitle>
            <CardDescription>
              Extract and import contacts from LinkedIn with AI-powered email and phone discovery
            </CardDescription>
          </div>
          {!isConnected && (
            <div className="flex gap-2">
              <Button 
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
              >
                {connectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Linkedin className="h-4 w-4 mr-2" />
                )}
                Connect LinkedIn
              </Button>
              <Button 
                onClick={loadDemoContacts}
                variant="outline"
              >
                Load Demo Contacts
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!isConnected && !contacts.length ? (
          <div className="text-center py-12">
            <Linkedin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Connect your LinkedIn account</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Import your professional network and automatically discover contact information
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="text-center">
                <UserPlus className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-medium">Import Contacts</h4>
                <p className="text-sm text-gray-600">
                  Extract your LinkedIn connections
                </p>
              </div>
              <div className="text-center">
                <Mail className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h4 className="font-medium">Discover Emails</h4>
                <p className="text-sm text-gray-600">
                  AI-powered email address discovery
                </p>
              </div>
              <div className="text-center">
                <Phone className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <h4 className="font-medium">Find Phone Numbers</h4>
                <p className="text-sm text-gray-600">
                  Extract mobile and business phones
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="contacts" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="contacts">
                Contacts ({filteredContacts.length})
              </TabsTrigger>
              <TabsTrigger value="import">
                Import Progress
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contacts" className="space-y-4">
              {/* Search and filters */}
              <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="all">All Contacts</option>
                  <option value="high-confidence">High Confidence Email</option>
                  <option value="has-phone">Has Phone Number</option>
                  <option value="real-estate">Real Estate Professional</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllContacts}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                >
                  Clear
                </Button>
              </div>

              {/* Selected count */}
              {selectedContacts.size > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {selectedContacts.size} contacts selected for import
                  </AlertDescription>
                </Alert>
              )}

              {/* Contact list */}
              <ScrollArea className="h-[500px] border rounded-lg">
                <div className="p-4 space-y-3">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedContacts.has(contact.id)}
                        onCheckedChange={() => toggleContactSelection(contact.id)}
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{contact.name}</h4>
                            {contact.title && (
                              <p className="text-sm text-gray-600">{contact.title}</p>
                            )}
                            {contact.company && (
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {contact.company}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            {contact.emailConfidence >= 0.8 && (
                              <Badge variant="default" className="text-xs">
                                High Confidence
                              </Badge>
                            )}
                            {contact.phones.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                Has Phone
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 space-y-1">
                          {contact.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span>{contact.email}</span>
                              <span className="text-xs text-gray-500">
                                ({Math.round(contact.emailConfidence * 100)}% confidence)
                              </span>
                            </div>
                          )}
                          {contact.phones.map((phone, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span>{phone}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Import button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => importMutation.mutate()}
                  disabled={selectedContacts.size === 0 || importMutation.isPending}
                >
                  {importMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Import {selectedContacts.size} Contacts
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="import" className="space-y-4">
              {importProgress ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{importProgress.message}</span>
                      <span>{importProgress.progress}%</span>
                    </div>
                    <Progress value={importProgress.progress} />
                  </div>

                  {importProgress.complete && importProgress.results && (
                    <Alert>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription>
                        Import complete! {importProgress.results.imported} contacts imported, {importProgress.results.duplicates} duplicates skipped, {importProgress.results.failed} failed.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No import in progress</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}