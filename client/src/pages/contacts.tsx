import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ContactImportWizard } from "@/components/ContactImportWizard";
import { AchievementPanel } from "@/components/AchievementPanel";
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Building2, 
  User, 
  UserCheck,
  Calendar,
  MessageSquare,
  ExternalLink,
  Tag,
  Filter,
  Star,
  Home,
  MapPin,
  Camera,
  Download,
  Upload,
  Trophy,
  Award,
  Target,
  Zap,
  Crown,
  Shield,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff,
  Import,
  Sparkles
} from "lucide-react";

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePhoto?: string;
  dateOfBirth?: string;
  ssn?: string;
  relationshipStatus?: string;
  company?: string;
  title?: string;
  contactType: string;
  notes?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  linkedInUrl?: string;
  website?: string;
  licenseNumber?: string;
  mlsId?: string;
  source: string;
  tags?: string[];
  linkedInProfile?: string;
  linkedInData?: any;
  emailGuesses?: any[];
  lastLinkedInSync?: string;
  socialMediaLinks?: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
  };
  status?: string;
  createdAt: string;
  updatedAt: string;
}

interface ContactInteraction {
  id: number;
  contactId: number;
  interactionType: string;
  subject?: string;
  description?: string;
  outcome?: string;
  scheduledAt?: string;
  completedAt?: string;
  createdAt: string;
}

const contactTypes = [
  { value: "borrower", label: "Borrower/Applicant", icon: User },
  { value: "real_estate_agent", label: "Real Estate Agent", icon: Home },
  { value: "loan_officer", label: "Loan Officer", icon: UserCheck },
  { value: "appraiser", label: "Appraiser", icon: Star },
  { value: "title_company", label: "Title Company", icon: Building2 },
  { value: "contractor", label: "Contractor", icon: Building2 },
  { value: "vendor", label: "Vendor", icon: Building2 },
  { value: "other", label: "Other", icon: Users }
];

// Gamification and Achievement System
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  points: number;
}

interface UserStats {
  totalContacts: number;
  contactsThisWeek: number;
  linkedInConnections: number;
  emailsSent: number;
  callsMade: number;
  level: number;
  totalPoints: number;
  achievements: Achievement[];
}

export default function Contacts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactDetail, setShowContactDetail] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [linkedInSearchQuery, setLinkedInSearchQuery] = useState("");
  const [linkedInResults, setLinkedInResults] = useState([]);
  const [selectedLinkedInProfiles, setSelectedLinkedInProfiles] = useState<number[]>([]);
  const [contactStatuses, setContactStatuses] = useState<Record<number, 'online' | 'offline' | 'busy'>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch contacts
  const { data: contacts = [], isLoading, error } = useQuery({
    queryKey: ['/api/contacts'],
    queryFn: () => apiRequest('GET', '/api/contacts'),
  });

  // Ensure contacts is always an array
  const contactsArray = Array.isArray(contacts) ? contacts : [];

  // Fetch user stats and achievements
  const { data: userStats } = useQuery({
    queryKey: ['/api/user-stats'],
    queryFn: () => apiRequest('GET', '/api/user-stats'),
  });

  // Real-time contact status simulation
  useEffect(() => {
    const updateContactStatuses = () => {
      const newStatuses: Record<number, 'online' | 'offline' | 'busy'> = {};
      contactsArray.forEach((contact: Contact) => {
        const statuses: ('online' | 'offline' | 'busy')[] = ['online', 'offline', 'busy'];
        newStatuses[contact.id] = statuses[Math.floor(Math.random() * statuses.length)];
      });
      setContactStatuses(newStatuses);
    };

    updateContactStatuses();
    const interval = setInterval(updateContactStatuses, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [contactsArray]);

  // LinkedIn search mutation
  const linkedInSearchMutation = useMutation({
    mutationFn: (query: string) => apiRequest('GET', `/api/linkedin/search?query=${encodeURIComponent(query)}&limit=10`),
    onSuccess: (data) => {
      setLinkedInResults(data || []);
    },
    onError: (error) => {
      console.error('LinkedIn search error:', error);
      toast({
        title: "LinkedIn Search Failed",
        description: "Using demo data for now. Contact search is still functional.",
        variant: "destructive",
      });
    },
  });

  // Import LinkedIn profiles mutation
  const importLinkedInMutation = useMutation({
    mutationFn: (profileIds: number[]) => apiRequest('POST', '/api/linkedin/import', { profileIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      setShowImportWizard(false);
      setImportStep(1);
      setSelectedLinkedInProfiles([]);
      toast({
        title: "LinkedIn Import Successful",
        description: `Successfully imported ${selectedLinkedInProfiles.length} contacts from LinkedIn.`,
      });
    }
  });

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: (contactData: any) => apiRequest('POST', '/api/contacts', contactData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      setShowAddDialog(false);
      // Reset form
      setNewContact({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        profilePhoto: '',
        dateOfBirth: '',
        ssn: '',
        relationshipStatus: '',
        company: '',
        title: '',
        contactType: '',
        notes: '',
        streetAddress: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States',
        linkedInUrl: '',
        website: '',
        licenseNumber: '',
        mlsId: '',
        source: '',
        tags: []
      });
      toast({
        title: "Contact Added",
        description: "New contact has been successfully added.",
      });
    },
    onError: (error) => {
      console.error('Contact creation error:', error);
      toast({
        title: "Error",
        description: "Failed to add contact. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Add interaction mutation
  const addInteractionMutation = useMutation({
    mutationFn: (interactionData: any) => apiRequest('POST', '/api/contact-interactions', interactionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Interaction Added",
        description: "Contact interaction has been logged.",
      });
    }
  });

  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    profilePhoto: '',
    dateOfBirth: '',
    ssn: '',
    relationshipStatus: '',
    company: '',
    title: '',
    contactType: '',
    notes: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    linkedInUrl: '',
    website: '',
    licenseNumber: '',
    mlsId: '',
    source: '',
    tags: []
  });

  const handleAddContact = () => {
    if (!newContact.firstName || !newContact.lastName || !newContact.contactType) {
      toast({
        title: "Missing Information",
        description: "Please fill in first name, last name, and contact type.",
        variant: "destructive"
      });
      return;
    }

    // Clean up the contact data before sending
    const contactData = {
      ...newContact,
      tags: newContact.tags || [],
      status: 'active'
    };

    addContactMutation.mutate(contactData);
  };

  const filteredContacts = contactsArray.filter((contact: Contact) => {
    const matchesSearch = 
      (contact.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.company || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || contact.contactType === filterType;
    
    return matchesSearch && matchesType;
  });

  const getContactTypeInfo = (type: string) => {
    return contactTypes.find(ct => ct.value === type) || contactTypes[contactTypes.length - 1];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "do_not_contact": return "bg-red-100 text-red-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const getContactStatusIndicator = (contactId: number) => {
    const status = contactStatuses[contactId] || 'offline';
    switch (status) {
      case 'online': return { color: 'bg-green-400', icon: Wifi, label: 'Online' };
      case 'busy': return { color: 'bg-yellow-400', icon: Clock, label: 'Busy' };
      case 'offline': return { color: 'bg-gray-400', icon: WifiOff, label: 'Offline' };
      default: return { color: 'bg-gray-400', icon: WifiOff, label: 'Unknown' };
    }
  };

  const getAchievements = (): Achievement[] => {
    const totalContacts = contactsArray.length;
    return [
      {
        id: 'first_10',
        title: 'Getting Started',
        description: 'Add your first 10 contacts',
        icon: Target,
        progress: Math.min(totalContacts, 10),
        maxProgress: 10,
        unlocked: totalContacts >= 10,
        points: 100,
      },
      {
        id: 'networking_pro',
        title: 'Networking Pro',
        description: 'Build a network of 50 contacts',
        icon: Crown,
        progress: Math.min(totalContacts, 50),
        maxProgress: 50,
        unlocked: totalContacts >= 50,
        points: 500,
      },
      {
        id: 'linkedin_master',
        title: 'LinkedIn Master',
        description: 'Import 25 contacts from LinkedIn',
        icon: ExternalLink,
        progress: 0, // Would track LinkedIn imports
        maxProgress: 25,
        unlocked: false,
        points: 300,
      },
      {
        id: 'communication_champion',
        title: 'Communication Champion',
        description: 'Send 100 emails to contacts',
        icon: Mail,
        progress: 0, // Would track email sends
        maxProgress: 100,
        unlocked: false,
        points: 250,
      },
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-600" />
            Contacts
          </h1>
          <p className="text-gray-600 mt-2">
            Manage borrowers, agents, loan officers, and other contacts
          </p>
        </div>

        {/* Header Actions */}
        {/* User Stats and Achievements Bar */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Contacts</p>
                  <p className="text-2xl font-bold">{contactsArray.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Level</p>
                  <p className="text-2xl font-bold">{Math.floor(contacts.length / 10) + 1}</p>
                </div>
                <Crown className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Points</p>
                  <p className="text-2xl font-bold">{contacts.length * 10}</p>
                </div>
                <Star className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Achievements</p>
                  <p className="text-2xl font-bold">{getAchievements().filter(a => a.unlocked).length}/{getAchievements().length}</p>
                </div>
                <Trophy className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contacts</SelectItem>
              {contactTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            onClick={() => setShowImportWizard(true)}
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Import className="w-4 h-4 mr-2" />
            Import from LinkedIn
          </Button>

          <Button 
            variant="outline" 
            onClick={() => setShowAchievements(true)}
            className="border-purple-200 text-purple-600 hover:bg-purple-50"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Achievements
          </Button>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
                <DialogDescription>
                  Create a new contact record for your CRM
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Profile Photo Section */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {newContact.profilePhoto ? (
                        <img 
                          src={newContact.profilePhoto} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      className="absolute -bottom-1 -right-1 rounded-full w-6 h-6 p-0"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            // Compress image before converting to base64
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            const img = new Image();
                            
                            img.onload = () => {
                              // Set max dimensions to reduce file size
                              const maxWidth = 200;
                              const maxHeight = 200;
                              let { width, height } = img;
                              
                              if (width > height) {
                                if (width > maxWidth) {
                                  height = (height * maxWidth) / width;
                                  width = maxWidth;
                                }
                              } else {
                                if (height > maxHeight) {
                                  width = (width * maxHeight) / height;
                                  height = maxHeight;
                                }
                              }
                              
                              canvas.width = width;
                              canvas.height = height;
                              
                              ctx?.drawImage(img, 0, 0, width, height);
                              
                              // Convert to base64 with compression
                              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                              setNewContact({...newContact, profilePhoto: compressedDataUrl});
                            };
                            
                            img.src = URL.createObjectURL(file);
                          }
                        };
                        input.click();
                      }}
                    >
                      <Camera className="w-3 h-3" />
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-semibold">Contact Photo</h3>
                    <p className="text-sm text-gray-600">Upload a profile photo for this contact</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={newContact.firstName}
                      onChange={(e) => setNewContact({...newContact, firstName: e.target.value})}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={newContact.lastName}
                      onChange={(e) => setNewContact({...newContact, lastName: e.target.value})}
                      placeholder="Smith"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={newContact.company}
                      onChange={(e) => setNewContact({...newContact, company: e.target.value})}
                      placeholder="ABC Realty"
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newContact.title}
                      onChange={(e) => setNewContact({...newContact, title: e.target.value})}
                      placeholder="Senior Agent"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="contactType">Contact Type *</Label>
                  <Select value={newContact.contactType} onValueChange={(value) => setNewContact({...newContact, contactType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select contact type" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={newContact.dateOfBirth}
                      onChange={(e) => setNewContact({...newContact, dateOfBirth: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ssn">SSN (Last 4 digits)</Label>
                    <Input
                      id="ssn"
                      value={newContact.ssn}
                      onChange={(e) => setNewContact({...newContact, ssn: e.target.value})}
                      placeholder="1234"
                      maxLength={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="relationshipStatus">Relationship Status</Label>
                    <Select 
                      value={newContact.relationshipStatus} 
                      onValueChange={(value) => setNewContact({...newContact, relationshipStatus: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Address Information</h4>
                  <div>
                    <Label htmlFor="streetAddress">Street Address</Label>
                    <Input
                      id="streetAddress"
                      value={newContact.streetAddress}
                      onChange={(e) => setNewContact({...newContact, streetAddress: e.target.value})}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={newContact.city}
                        onChange={(e) => setNewContact({...newContact, city: e.target.value})}
                        placeholder="Los Angeles"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={newContact.state}
                        onChange={(e) => setNewContact({...newContact, state: e.target.value})}
                        placeholder="CA"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={newContact.zipCode}
                        onChange={(e) => setNewContact({...newContact, zipCode: e.target.value})}
                        placeholder="90210"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Professional Links</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="linkedin">LinkedIn URL</Label>
                      <Input
                        id="linkedin"
                        value={newContact.linkedInUrl}
                        onChange={(e) => setNewContact({...newContact, linkedInUrl: e.target.value})}
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={newContact.website}
                        onChange={(e) => setNewContact({...newContact, website: e.target.value})}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newContact.notes}
                    onChange={(e) => setNewContact({...newContact, notes: e.target.value})}
                    placeholder="Additional notes about this contact..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddContact} disabled={addContactMutation.isPending}>
                    {addContactMutation.isPending ? "Adding..." : "Add Contact"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Contacts Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading contacts...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Contacts Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterType !== "all" 
                  ? "No contacts match your search criteria."
                  : "Get started by adding your first contact."
                }
              </p>
              {!searchTerm && filterType === "all" && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Contact
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.map((contact: Contact, index) => {
              const typeInfo = getContactTypeInfo(contact.contactType);
              const IconComponent = typeInfo.icon;
              const statusInfo = getContactStatusIndicator(contact.id);
              const StatusIcon = statusInfo.icon;
              
              return (
                <Card 
                  key={contact.id} 
                  className="hover:shadow-lg transition-all duration-300 cursor-pointer group relative animate-in slide-in-from-bottom-4"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: 'both'
                  }}
                  onClick={() => {
                    setSelectedContact(contact);
                    setShowContactDetail(true);
                  }}
                >
                  {/* Quick Action Menu */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:scale-100 scale-95">
                    <div className="flex gap-1 bg-white/95 shadow-xl border rounded-xl p-1.5 backdrop-blur-sm">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-blue-100 transition-all duration-150 hover:scale-110"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`mailto:${contact.email}`);
                        }}
                        title="Send Email"
                      >
                        <Mail className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-green-100 transition-all duration-150 hover:scale-110"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`tel:${contact.phone}`);
                        }}
                        title="Call"
                      >
                        <Phone className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-purple-100 transition-all duration-150 hover:scale-110"
                        onClick={(e) => {
                          e.stopPropagation();
                          // SMS functionality with Twilio integration
                          window.open(`sms:${contact.phone}?body=Hi ${contact.firstName}, this is regarding your loan inquiry.`);
                        }}
                        title="Send SMS"
                      >
                        <MessageSquare className="w-4 h-4 text-purple-600" />
                      </Button>
                      {(contact.linkedInUrl || contact.socialMediaLinks?.linkedin) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-blue-100 transition-all duration-150 hover:scale-110"
                          onClick={(e) => {
                            e.stopPropagation();
                            const linkedInUrl = contact.linkedInUrl || contact.socialMediaLinks?.linkedin;
                            if (linkedInUrl) {
                              window.open(linkedInUrl, '_blank');
                            }
                          }}
                          title="View LinkedIn"
                        >
                          <ExternalLink className="w-4 h-4 text-blue-700" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Real-time Contact Status Indicator */}
                  <div className="absolute top-2 left-2 opacity-100 transition-all duration-200">
                    <div className={`w-3 h-3 ${statusInfo.color} rounded-full border-2 border-white shadow-sm ${statusInfo.color === 'bg-green-400' ? 'animate-pulse' : ''}`} 
                         title={`${contact.firstName} is ${statusInfo.label}`}>
                      <StatusIcon className="w-2 h-2 text-white absolute top-0.5 left-0.5" style={{ fontSize: '8px' }} />
                    </div>
                  </div>
                  
                  {/* Contact Type Badge with Animation */}
                  <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-y-0 translate-y-2">
                    <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200 animate-in slide-in-from-bottom-2">
                      <IconComponent className="w-3 h-3 mr-1" />
                      {typeInfo.label}
                    </Badge>
                  </div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {contact.firstName} {contact.lastName}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {typeInfo.label}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={`text-xs bg-green-100 text-green-800`}>
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {contact.company && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Building2 className="w-4 h-4" />
                          {contact.company}
                          {contact.title && ` - ${contact.title}`}
                        </div>
                      )}

                      {(contact.streetAddress || contact.city) && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {contact.city}, {contact.state}
                        </div>
                      )}
                      
                      {contact.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {contact.email}
                        </div>
                      )}
                      
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {contact.phone}
                        </div>
                      )}

                      {contact.tags && contact.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {contact.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {contact.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{contact.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Contact Detail Dialog */}
        <Dialog open={showContactDetail} onOpenChange={setShowContactDetail}>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
            {selectedContact && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                      {selectedContact.profilePhoto ? (
                        <img 
                          src={selectedContact.profilePhoto} 
                          alt={`${selectedContact.firstName} ${selectedContact.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (() => {
                          const typeInfo = getContactTypeInfo(selectedContact.contactType);
                          const IconComponent = typeInfo.icon;
                          return <IconComponent className="w-8 h-8 text-blue-600" />;
                        })()
                      )}
                    </div>
                    <div>
                      <DialogTitle className="text-xl">
                        {selectedContact.firstName} {selectedContact.lastName}
                      </DialogTitle>
                      <DialogDescription>
                        {getContactTypeInfo(selectedContact.contactType).label}
                        {selectedContact.company && ` at ${selectedContact.company}`}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Contact Details</TabsTrigger>
                    <TabsTrigger value="interactions">Interactions</TabsTrigger>
                    <TabsTrigger value="notes">Notes & Links</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Email</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{selectedContact.email || 'Not provided'}</span>
                        </div>
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{selectedContact.phone || 'Not provided'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {selectedContact.dateOfBirth && (
                        <div>
                          <Label>Date of Birth</Label>
                          <p className="mt-1 text-sm">
                            {new Date(selectedContact.dateOfBirth).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {selectedContact.relationshipStatus && (
                        <div>
                          <Label>Relationship Status</Label>
                          <p className="mt-1 text-sm capitalize">{selectedContact.relationshipStatus}</p>
                        </div>
                      )}
                      {selectedContact.ssn && (
                        <div>
                          <Label>SSN (Last 4)</Label>
                          <p className="mt-1 text-sm font-mono">***-**-{selectedContact.ssn}</p>
                        </div>
                      )}
                    </div>
                    
                    {(selectedContact.streetAddress || selectedContact.city) && (
                      <div>
                        <Label>Address</Label>
                        <p className="mt-1 text-sm">
                          {selectedContact.streetAddress && `${selectedContact.streetAddress}\n`}
                          {selectedContact.city}, {selectedContact.state} {selectedContact.zipCode}
                          {selectedContact.country && selectedContact.country !== 'United States' && (
                            <>
                              <br />{selectedContact.country}
                            </>
                          )}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      {selectedContact.licenseNumber && (
                        <div>
                          <Label>License Number</Label>
                          <p className="mt-1 text-sm font-mono">{selectedContact.licenseNumber}</p>
                        </div>
                      )}
                      {selectedContact.mlsId && (
                        <div>
                          <Label>MLS ID</Label>
                          <p className="mt-1 text-sm font-mono">{selectedContact.mlsId}</p>
                        </div>
                      )}
                    </div>

                    {/* Social Media Links */}
                    {selectedContact.socialMediaLinks && Object.values(selectedContact.socialMediaLinks).some(link => link) && (
                      <div>
                        <Label>Social Media</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedContact.socialMediaLinks?.linkedin && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={selectedContact.socialMediaLinks.linkedin} target="_blank" rel="noopener noreferrer">
                                LinkedIn
                              </a>
                            </Button>
                          )}
                          {selectedContact.socialMediaLinks?.facebook && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={selectedContact.socialMediaLinks.facebook} target="_blank" rel="noopener noreferrer">
                                Facebook
                              </a>
                            </Button>
                          )}
                          {selectedContact.socialMediaLinks?.instagram && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={selectedContact.socialMediaLinks.instagram} target="_blank" rel="noopener noreferrer">
                                Instagram
                              </a>
                            </Button>
                          )}
                          {selectedContact.socialMediaLinks?.twitter && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={selectedContact.socialMediaLinks.twitter} target="_blank" rel="noopener noreferrer">
                                Twitter/X
                              </a>
                            </Button>
                          )}
                          {selectedContact.socialMediaLinks?.tiktok && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={selectedContact.socialMediaLinks.tiktok} target="_blank" rel="noopener noreferrer">
                                TikTok
                              </a>
                            </Button>
                          )}
                          {selectedContact.socialMediaLinks?.youtube && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={selectedContact.socialMediaLinks.youtube} target="_blank" rel="noopener noreferrer">
                                YouTube
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="interactions">
                    <div className="space-y-4">
                      <Button className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Log New Interaction
                      </Button>
                      <div className="text-center py-8 text-gray-500">
                        No interactions recorded yet
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="notes">
                    <div className="space-y-4">
                      {selectedContact.notes && (
                        <div>
                          <Label>Notes</Label>
                          <p className="mt-1 text-sm bg-gray-50 p-3 rounded">{selectedContact.notes}</p>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        {selectedContact.linkedInUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={selectedContact.linkedInUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              LinkedIn
                            </a>
                          </Button>
                        )}
                        {selectedContact.website && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={selectedContact.website} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Website
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Contact Import Wizard */}
        <ContactImportWizard
          open={showImportWizard}
          onOpenChange={setShowImportWizard}
          onSearch={(query) => linkedInSearchMutation.mutate(query)}
          onImport={(profileIds) => importLinkedInMutation.mutate(profileIds)}
          searchResults={linkedInResults}
          isSearching={linkedInSearchMutation.isPending}
          isImporting={importLinkedInMutation.isPending}
          step={importStep}
          onStepChange={setImportStep}
          selectedProfiles={selectedLinkedInProfiles}
          onProfileToggle={(profileId) => {
            setSelectedLinkedInProfiles(prev => 
              prev.includes(profileId) 
                ? prev.filter(id => id !== profileId)
                : [...prev, profileId]
            );
          }}
        />

        {/* Achievement Panel */}
        <AchievementPanel
          open={showAchievements}
          onOpenChange={setShowAchievements}
          achievements={getAchievements()}
          totalPoints={contactsArray.length * 10}
          level={Math.floor(contactsArray.length / 10) + 1}
        />
      </div>
    </div>
  );
}