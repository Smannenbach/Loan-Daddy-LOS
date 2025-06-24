import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Phone, 
  Camera, 
  Save, 
  Eye, 
  Calendar, 
  Globe, 
  Palette, 
  Settings,
  Clock,
  MapPin,
  Link,
  Award,
  FileText,
  Share2,
  Copy,
  ExternalLink,
  Linkedin,
  Facebook,
  Instagram,
  Twitter
} from "lucide-react";

interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profilePicture?: string;
  nmlsId?: string;
  realEstateLicense?: string;
  licenseState?: string;
  bio?: string;
  emailSignature?: string;
  socialMediaLinks?: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  customDomain?: string;
  websiteEnabled: boolean;
  websiteTheme: string;
  websiteContent?: any;
  calendarSettings?: any;
  timeZone: string;
  workingHours?: any;
  permissions: string[];
}

const websiteThemes = [
  { value: "professional", label: "Professional", preview: "Clean and corporate design" },
  { value: "modern", label: "Modern", preview: "Sleek contemporary layout" },
  { value: "classic", label: "Classic", preview: "Traditional and trustworthy" },
  { value: "creative", label: "Creative", preview: "Unique and eye-catching" }
];

const timeZones = [
  "America/New_York",
  "America/Chicago", 
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "Pacific/Honolulu"
];

export default function Profile() {
  const [activeTab, setActiveTab] = useState("profile");
  const [showWebsitePreview, setShowWebsitePreview] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['/api/profile'],
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (profileData: any) => apiRequest('/api/profile', 'PUT', profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  React.useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const generateWebsiteUrl = () => {
    const domain = formData.customDomain || `${formData.firstName?.toLowerCase()}-${formData.lastName?.toLowerCase()}`;
    return `https://${domain}.loandaddy.com`;
  };

  const copyWebsiteUrl = () => {
    navigator.clipboard.writeText(generateWebsiteUrl());
    toast({
      title: "Copied",
      description: "Website URL copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="w-8 h-8 text-blue-600" />
            My Profile
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your personal information, calendar, and professional website
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="website">Website</TabsTrigger>
            <TabsTrigger value="signature">Email Signature</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal and professional information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {formData.profilePicture ? (
                          <img 
                            src={formData.profilePicture} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                        onClick={() => {
                          // File upload logic would go here
                          toast({
                            title: "Coming Soon",
                            description: "Photo upload feature will be available soon.",
                          });
                        }}
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    </div>
                    <div>
                      <h3 className="font-semibold">Profile Picture</h3>
                      <p className="text-sm text-gray-600">Upload a professional headshot</p>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName || ''}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName || ''}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Professional Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nmlsId">NMLS ID</Label>
                      <Input
                        id="nmlsId"
                        value={formData.nmlsId || ''}
                        onChange={(e) => setFormData({...formData, nmlsId: e.target.value})}
                        placeholder="123456"
                      />
                    </div>
                    <div>
                      <Label htmlFor="realEstateLicense">Real Estate License</Label>
                      <Input
                        id="realEstateLicense"
                        value={formData.realEstateLicense || ''}
                        onChange={(e) => setFormData({...formData, realEstateLicense: e.target.value})}
                        placeholder="License number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="licenseState">License State</Label>
                      <Input
                        id="licenseState"
                        value={formData.licenseState || ''}
                        onChange={(e) => setFormData({...formData, licenseState: e.target.value})}
                        placeholder="CA"
                      />
                    </div>
                    <div>
                      <Label htmlFor="timeZone">Time Zone</Label>
                      <Select 
                        value={formData.timeZone || 'America/New_York'} 
                        onValueChange={(value) => setFormData({...formData, timeZone: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeZones.map(tz => (
                            <SelectItem key={tz} value={tz}>
                              {tz.replace('America/', '').replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Professional Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio || ''}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      placeholder="Tell potential clients about your experience and expertise..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Calendar Settings
                  </CardTitle>
                  <CardDescription>
                    Configure your availability and booking preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-7 gap-4">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <div key={day} className="space-y-2">
                        <Label className="text-sm font-medium">{day.slice(0, 3)}</Label>
                        <div className="space-y-1">
                          <Input
                            type="time"
                            defaultValue="09:00"
                            className="text-xs"
                          />
                          <Input
                            type="time"
                            defaultValue="17:00"
                            className="text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Default Meeting Duration</Label>
                      <Select defaultValue="30">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Buffer Time Between Meetings</Label>
                      <Select defaultValue="15">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">No buffer</SelectItem>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="public-calendar" />
                    <Label htmlFor="public-calendar">Make calendar publicly bookable</Label>
                  </div>

                  <div>
                    <Label>Booking Page URL</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={`https://loandaddy.com/book/${formData.firstName?.toLowerCase()}-${formData.lastName?.toLowerCase()}`}
                        readOnly
                        className="bg-gray-50"
                      />
                      <Button variant="outline" size="sm" onClick={() => {
                        navigator.clipboard.writeText(`https://loandaddy.com/book/${formData.firstName?.toLowerCase()}-${formData.lastName?.toLowerCase()}`);
                        toast({ title: "Copied", description: "Booking URL copied to clipboard" });
                      }}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="website" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Personal Website
                  </CardTitle>
                  <CardDescription>
                    Create a professional website to showcase your services
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Enable Personal Website</h3>
                      <p className="text-sm text-gray-600">
                        Create a professional website with your profile and services
                      </p>
                    </div>
                    <Switch 
                      checked={formData.websiteEnabled || false}
                      onCheckedChange={(checked) => setFormData({...formData, websiteEnabled: checked})}
                    />
                  </div>

                  {formData.websiteEnabled && (
                    <>
                      <div>
                        <Label htmlFor="customDomain">Custom Domain</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            id="customDomain"
                            value={formData.customDomain || ''}
                            onChange={(e) => setFormData({...formData, customDomain: e.target.value})}
                            placeholder="john-smith"
                          />
                          <span className="text-sm text-gray-500">.loandaddy.com</span>
                          <Button variant="outline" size="sm" onClick={copyWebsiteUrl}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Your website will be available at: {generateWebsiteUrl()}
                        </p>
                      </div>

                      <div>
                        <Label>Website Theme</Label>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          {websiteThemes.map(theme => (
                            <div 
                              key={theme.value}
                              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                formData.websiteTheme === theme.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                              }`}
                              onClick={() => setFormData({...formData, websiteTheme: theme.value})}
                            >
                              <h4 className="font-medium">{theme.label}</h4>
                              <p className="text-sm text-gray-600">{theme.preview}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Dialog open={showWebsitePreview} onOpenChange={setShowWebsitePreview}>
                          <DialogTrigger asChild>
                            <Button variant="outline">
                              <Eye className="w-4 h-4 mr-2" />
                              Preview Website
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh]">
                            <DialogHeader>
                              <DialogTitle>Website Preview</DialogTitle>
                              <DialogDescription>
                                Preview of your personal loan officer website
                              </DialogDescription>
                            </DialogHeader>
                            <div className="bg-gray-100 p-8 rounded-lg">
                              <div className="bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
                                <div className="p-8 text-center">
                                  <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <User className="w-12 h-12 text-blue-600" />
                                  </div>
                                  <h1 className="text-2xl font-bold mb-2">
                                    {formData.firstName} {formData.lastName}
                                  </h1>
                                  <p className="text-gray-600 mb-4">Licensed Loan Officer</p>
                                  {formData.nmlsId && (
                                    <p className="text-sm text-gray-500 mb-4">NMLS ID: {formData.nmlsId}</p>
                                  )}
                                  {formData.bio && (
                                    <p className="text-gray-700 mb-6">{formData.bio}</p>
                                  )}
                                  <div className="flex justify-center gap-4">
                                    <Button>Get a Quote</Button>
                                    <Button variant="outline">Schedule Consultation</Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button variant="outline" asChild>
                          <a href={generateWebsiteUrl()} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Visit Website
                          </a>
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signature" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Email Signature
                  </CardTitle>
                  <CardDescription>
                    Create a professional email signature
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="emailSignature">Email Signature HTML</Label>
                    <Textarea
                      id="emailSignature"
                      value={formData.emailSignature || ''}
                      onChange={(e) => setFormData({...formData, emailSignature: e.target.value})}
                      placeholder={`<div style="font-family: Arial, sans-serif;">
  <strong>${formData.firstName} ${formData.lastName}</strong><br>
  Licensed Loan Officer<br>
  Phone: ${formData.phone || '(555) 123-4567'}<br>
  Email: ${formData.email}<br>
  ${formData.nmlsId ? `NMLS ID: ${formData.nmlsId}<br>` : ''}
  <a href="${generateWebsiteUrl()}">Visit my website</a>
</div>`}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label>Preview</Label>
                    <div 
                      className="border rounded-lg p-4 bg-gray-50 mt-2"
                      dangerouslySetInnerHTML={{ 
                        __html: formData.emailSignature || `
                          <div style="font-family: Arial, sans-serif;">
                            <strong>${formData.firstName} ${formData.lastName}</strong><br>
                            Licensed Loan Officer<br>
                            Phone: ${formData.phone || '(555) 123-4567'}<br>
                            Email: ${formData.email}<br>
                            ${formData.nmlsId ? `NMLS ID: ${formData.nmlsId}<br>` : ''}
                            <a href="${generateWebsiteUrl()}">Visit my website</a>
                          </div>
                        `
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5" />
                    Social Media Links
                  </CardTitle>
                  <CardDescription>
                    Connect your social media profiles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Linkedin className="w-5 h-5 text-blue-600" />
                      <div className="flex-1">
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          value={formData.socialMediaLinks?.linkedin || ''}
                          onChange={(e) => setFormData({
                            ...formData, 
                            socialMediaLinks: {
                              ...formData.socialMediaLinks,
                              linkedin: e.target.value
                            }
                          })}
                          placeholder="https://linkedin.com/in/your-profile"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Facebook className="w-5 h-5 text-blue-700" />
                      <div className="flex-1">
                        <Label htmlFor="facebook">Facebook</Label>
                        <Input
                          id="facebook"
                          value={formData.socialMediaLinks?.facebook || ''}
                          onChange={(e) => setFormData({
                            ...formData, 
                            socialMediaLinks: {
                              ...formData.socialMediaLinks,
                              facebook: e.target.value
                            }
                          })}
                          placeholder="https://facebook.com/your-profile"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Instagram className="w-5 h-5 text-pink-600" />
                      <div className="flex-1">
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          value={formData.socialMediaLinks?.instagram || ''}
                          onChange={(e) => setFormData({
                            ...formData, 
                            socialMediaLinks: {
                              ...formData.socialMediaLinks,
                              instagram: e.target.value
                            }
                          })}
                          placeholder="https://instagram.com/your-profile"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Twitter className="w-5 h-5 text-blue-400" />
                      <div className="flex-1">
                        <Label htmlFor="twitter">Twitter</Label>
                        <Input
                          id="twitter"
                          value={formData.socialMediaLinks?.twitter || ''}
                          onChange={(e) => setFormData({
                            ...formData, 
                            socialMediaLinks: {
                              ...formData.socialMediaLinks,
                              twitter: e.target.value
                            }
                          })}
                          placeholder="https://twitter.com/your-handle"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-600" />
                      <div className="flex-1">
                        <Label htmlFor="website">Personal Website</Label>
                        <Input
                          id="website"
                          value={formData.socialMediaLinks?.website || ''}
                          onChange={(e) => setFormData({
                            ...formData, 
                            socialMediaLinks: {
                              ...formData.socialMediaLinks,
                              website: e.target.value
                            }
                          })}
                          placeholder="https://your-website.com"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={updateProfileMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}