import React, { useState } from "react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  Home
} from "lucide-react";

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  profilePhoto?: string;
  dateOfBirth?: string;
  ssn?: string;
  relationshipStatus?: string;
  company?: string;
  title?: string;
  contactType: string;
  status: string;
  notes?: string;
  tags?: string[];
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  socialMediaLinks?: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
  };
  linkedInUrl?: string;
  website?: string;
  licenseNumber?: string;
  mlsId?: string;
  lenderId?: string;
  brokerageId?: string;
  lastContactDate?: string;
  source?: string;
  referredBy?: number;
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

export default function Contacts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactDetail, setShowContactDetail] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch contacts
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['/api/contacts'],
  });

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: (contactData: any) => apiRequest('/api/contacts', 'POST', contactData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      setShowAddDialog(false);
      toast({
        title: "Contact Added",
        description: "New contact has been successfully added.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add contact. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Add interaction mutation
  const addInteractionMutation = useMutation({
    mutationFn: (interactionData: any) => apiRequest('/api/contact-interactions', 'POST', interactionData),
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
    socialMediaLinks: {
      linkedin: '',
      facebook: '',
      instagram: '',
      twitter: '',
      tiktok: '',
      youtube: ''
    },
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

  const filteredContacts = contacts.filter((contact: Contact) => {
    const matchesSearch = 
      contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              setNewContact({...newContact, profilePhoto: e.target?.result as string});
                            };
                            reader.readAsDataURL(file);
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
                  <h4 className="font-semibold">Social Media Links</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        value={newContact.socialMediaLinks.linkedin}
                        onChange={(e) => setNewContact({
                          ...newContact, 
                          socialMediaLinks: {
                            ...newContact.socialMediaLinks,
                            linkedin: e.target.value
                          }
                        })}
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="facebook">Facebook</Label>
                      <Input
                        id="facebook"
                        value={newContact.socialMediaLinks.facebook}
                        onChange={(e) => setNewContact({
                          ...newContact, 
                          socialMediaLinks: {
                            ...newContact.socialMediaLinks,
                            facebook: e.target.value
                          }
                        })}
                        placeholder="https://facebook.com/username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        value={newContact.socialMediaLinks.instagram}
                        onChange={(e) => setNewContact({
                          ...newContact, 
                          socialMediaLinks: {
                            ...newContact.socialMediaLinks,
                            instagram: e.target.value
                          }
                        })}
                        placeholder="https://instagram.com/username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="twitter">Twitter/X</Label>
                      <Input
                        id="twitter"
                        value={newContact.socialMediaLinks.twitter}
                        onChange={(e) => setNewContact({
                          ...newContact, 
                          socialMediaLinks: {
                            ...newContact.socialMediaLinks,
                            twitter: e.target.value
                          }
                        })}
                        placeholder="https://twitter.com/username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tiktok">TikTok</Label>
                      <Input
                        id="tiktok"
                        value={newContact.socialMediaLinks.tiktok}
                        onChange={(e) => setNewContact({
                          ...newContact, 
                          socialMediaLinks: {
                            ...newContact.socialMediaLinks,
                            tiktok: e.target.value
                          }
                        })}
                        placeholder="https://tiktok.com/@username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="youtube">YouTube</Label>
                      <Input
                        id="youtube"
                        value={newContact.socialMediaLinks.youtube}
                        onChange={(e) => setNewContact({
                          ...newContact, 
                          socialMediaLinks: {
                            ...newContact.socialMediaLinks,
                            youtube: e.target.value
                          }
                        })}
                        placeholder="https://youtube.com/@username"
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
            {filteredContacts.map((contact: Contact) => {
              const typeInfo = getContactTypeInfo(contact.contactType);
              const IconComponent = typeInfo.icon;
              
              return (
                <Card 
                  key={contact.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedContact(contact);
                    setShowContactDetail(true);
                  }}
                >
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
                      <Badge className={`text-xs ${getStatusColor(contact.status)}`}>
                        {contact.status}
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
                          {selectedContact.socialMediaLinks.linkedin && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={selectedContact.socialMediaLinks.linkedin} target="_blank" rel="noopener noreferrer">
                                LinkedIn
                              </a>
                            </Button>
                          )}
                          {selectedContact.socialMediaLinks.facebook && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={selectedContact.socialMediaLinks.facebook} target="_blank" rel="noopener noreferrer">
                                Facebook
                              </a>
                            </Button>
                          )}
                          {selectedContact.socialMediaLinks.instagram && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={selectedContact.socialMediaLinks.instagram} target="_blank" rel="noopener noreferrer">
                                Instagram
                              </a>
                            </Button>
                          )}
                          {selectedContact.socialMediaLinks.twitter && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={selectedContact.socialMediaLinks.twitter} target="_blank" rel="noopener noreferrer">
                                Twitter/X
                              </a>
                            </Button>
                          )}
                          {selectedContact.socialMediaLinks.tiktok && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={selectedContact.socialMediaLinks.tiktok} target="_blank" rel="noopener noreferrer">
                                TikTok
                              </a>
                            </Button>
                          )}
                          {selectedContact.socialMediaLinks.youtube && (
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
      </div>
    </div>
  );
}