import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import ContactHoverMenu from '@/components/contact-hover-menu';
import GamifiedOnboarding from '@/components/gamified-onboarding';
import { 
  Phone, 
  Mail, 
  Calendar, 
  TrendingUp, 
  Users, 
  Target, 
  Filter,
  Search,
  Star,
  Clock,
  DollarSign,
  Building,
  MapPin,
  User,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Activity,
  Menu,
  X,
  Sparkles,
  Trophy
} from 'lucide-react';

interface ContactRecommendation {
  contact: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    jobTitle: string;
    source: string;
    lastContactDate: string;
    createdAt: string;
  };
  score: number;
  reasons: string[];
  category: 'hot_lead' | 'warm_lead' | 'referral_source' | 'past_client' | 'network_connection';
  suggestedActions: Array<{
    type: 'call' | 'email' | 'text' | 'meeting' | 'follow_up';
    description: string;
    priority: 'high' | 'medium' | 'low';
    timeframe: string;
  }>;
  metadata: {
    lastInteraction?: string;
    relationshipStrength: number;
    responseRate: number;
    averageCallDuration: number;
    preferredContactMethod: string;
    bestContactTime: string;
  };
}

interface ContactInsight {
  contactId: number;
  totalLoans: number;
  totalLoanValue: number;
  averageLoanSize: number;
  conversionRate: number;
  referralCount: number;
  lastActivityDate: string;
  activityScore: number;
  communicationPattern: {
    preferredMethod: string;
    bestDays: string[];
    bestTimeOfDay: string;
    averageResponseTime: number;
  };
  riskProfile: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    creditScore?: number;
  };
  opportunityScore: number;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'hot_lead': return 'bg-red-100 text-red-800';
    case 'warm_lead': return 'bg-yellow-100 text-yellow-800';
    case 'referral_source': return 'bg-blue-100 text-blue-800';
    case 'past_client': return 'bg-green-100 text-green-800';
    case 'network_connection': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getActionIcon = (type: string) => {
  switch (type) {
    case 'call': return <Phone className="h-4 w-4" />;
    case 'email': return <Mail className="h-4 w-4" />;
    case 'text': return <MessageSquare className="h-4 w-4" />;
    case 'meeting': return <Calendar className="h-4 w-4" />;
    case 'follow_up': return <Clock className="h-4 w-4" />;
    default: return <Activity className="h-4 w-4" />;
  }
};

export default function ContactRecommendations() {
  const [filters, setFilters] = useState({
    category: '',
    minScore: 0,
    maxResults: 50,
    priorityLevel: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<ContactRecommendation | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [hoveredContact, setHoveredContact] = useState<ContactRecommendation | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Show onboarding for new users
    const hasSeenOnboarding = localStorage.getItem('contact_recommendations_onboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
      localStorage.setItem('contact_recommendations_onboarding', 'true');
    }
  }, []);

  const { data: recommendationsData, isLoading, refetch } = useQuery<{ recommendations: ContactRecommendation[] }>({
    queryKey: ['/api/contacts/recommendations', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.minScore > 0) params.append('minScore', filters.minScore.toString());
      if (filters.maxResults !== 50) params.append('maxResults', filters.maxResults.toString());
      if (filters.priorityLevel) params.append('priorityLevel', filters.priorityLevel);
      
      const response = await fetch(`/api/contacts/recommendations?${params}`);
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      return response.json();
    }
  });

  const { data: insightsData } = useQuery<{ insights: ContactInsight }>({
    queryKey: ['/api/contacts/insights', selectedContact?.contact.id],
    queryFn: async () => {
      if (!selectedContact) return null;
      const response = await fetch(`/api/contacts/${selectedContact.contact.id}/insights`);
      if (!response.ok) throw new Error('Failed to fetch insights');
      return response.json();
    },
    enabled: !!selectedContact
  });

  const recommendations = recommendationsData?.recommendations || [];
  const insights = insightsData?.insights;

  const filteredRecommendations = recommendations.filter(rec =>
    searchTerm === '' || 
    rec.contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.contact.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categoryStats = recommendations.reduce((acc, rec) => {
    acc[rec.category] = (acc[rec.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleContactHover = (contact: ContactRecommendation, event: React.MouseEvent) => {
    if (!isMobile) {
      setHoveredContact(contact);
      setHoverPosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleContactAction = (action: string, contactId: number) => {
    console.log(`Performing ${action} on contact ${contactId}`);
    // Implement action logic here
  };

  const handleNavigate = (route: string) => {
    window.location.href = route;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Contact Recommendations</h1>
            <p className="text-sm text-gray-600">AI-powered suggestions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOnboarding(true)}
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            >
              {mobileFiltersOpen ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Desktop Header */}
        {!isMobile && (
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Intelligent Contact Recommendations</h1>
              <p className="text-gray-600">AI-powered contact suggestions and insights to optimize your outreach strategy</p>
            </div>
            <Button
              onClick={() => setShowOnboarding(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
            >
              <Trophy className="h-4 w-4 mr-2" />
              View Progress
            </Button>
          </div>
        )}

        {/* Mobile Filters */}
        {isMobile && mobileFiltersOpen && (
          <Card className="mb-6 bg-white border-gray-200">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search contacts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                  <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      <SelectItem value="hot_lead">Hot Leads</SelectItem>
                      <SelectItem value="warm_lead">Warm Leads</SelectItem>
                      <SelectItem value="referral_source">Referral Sources</SelectItem>
                      <SelectItem value="past_client">Past Clients</SelectItem>
                      <SelectItem value="network_connection">Network Connections</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Priority</label>
                  <Select value={filters.priorityLevel} onValueChange={(value) => setFilters({...filters, priorityLevel: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Priorities</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Total Contacts</p>
                  <p className="text-lg md:text-2xl font-bold">{recommendations.length}</p>
                </div>
                <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Hot Leads</p>
                  <p className="text-lg md:text-2xl font-bold">{categoryStats.hot_lead || 0}</p>
                </div>
                <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Warm Leads</p>
                  <p className="text-lg md:text-2xl font-bold">{categoryStats.warm_lead || 0}</p>
                </div>
                <Target className="h-6 w-6 md:h-8 md:w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Past Clients</p>
                  <p className="text-lg md:text-2xl font-bold">{categoryStats.past_client || 0}</p>
                </div>
                <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Recommendations List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Filter className="h-5 w-5" />
                    Contact Recommendations
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Desktop Filters */}
                {!isMobile && (
                  <div className="mb-6 space-y-4">
                    <div className="flex gap-4 items-center">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search contacts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Categories</SelectItem>
                          <SelectItem value="hot_lead">Hot Leads</SelectItem>
                          <SelectItem value="warm_lead">Warm Leads</SelectItem>
                          <SelectItem value="referral_source">Referral Sources</SelectItem>
                          <SelectItem value="past_client">Past Clients</SelectItem>
                          <SelectItem value="network_connection">Network Connections</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={filters.priorityLevel} onValueChange={(value) => setFilters({...filters, priorityLevel: value})}>
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Priorities</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

              {/* Recommendations List */}
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {filteredRecommendations.map((recommendation) => (
                    <Card 
                      key={recommendation.contact.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedContact?.contact.id === recommendation.contact.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedContact(recommendation)}
                      onMouseEnter={(e) => handleContactHover(recommendation, e)}
                      onMouseLeave={() => setHoveredContact(null)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">
                                {recommendation.contact.firstName} {recommendation.contact.lastName}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {recommendation.contact.jobTitle} at {recommendation.contact.company}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getCategoryColor(recommendation.category)}>
                              <span className="hidden sm:inline">{recommendation.category.replace('_', ' ')}</span>
                              <span className="sm:hidden">{recommendation.category.charAt(0).toUpperCase()}</span>
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium">{recommendation.score.toFixed(0)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span>{recommendation.contact.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{recommendation.contact.phone}</span>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm font-medium mb-1">Reasons for Recommendation:</p>
                          <div className="flex flex-wrap gap-1">
                            {recommendation.reasons.slice(0, 2).map((reason, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {reason}
                              </Badge>
                            ))}
                            {recommendation.reasons.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{recommendation.reasons.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Activity className="h-4 w-4 text-green-500" />
                              <span className="text-sm">
                                {recommendation.metadata.relationshipStrength.toFixed(0)}% relationship
                              </span>
                            </div>
                            <Separator orientation="vertical" className="h-4" />
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4 text-blue-500" />
                              <span className="text-sm">
                                {recommendation.metadata.preferredContactMethod}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {recommendation.suggestedActions.slice(0, 2).map((action, index) => (
                              <Badge key={index} className={getPriorityColor(action.priority)}>
                                {getActionIcon(action.type)}
                                <span className="ml-1 text-xs">{action.type}</span>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Contact Details */}
        <div className="lg:col-span-1">
          {selectedContact ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Contact Information</p>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>{selectedContact.contact.firstName} {selectedContact.contact.lastName}</p>
                          <p>{selectedContact.contact.email}</p>
                          <p>{selectedContact.contact.phone}</p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <p className="text-sm font-medium mb-2">Recommendation Score</p>
                        <div className="flex items-center gap-2">
                          <Progress value={selectedContact.score} className="flex-1" />
                          <span className="text-sm font-medium">{selectedContact.score.toFixed(0)}</span>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <p className="text-sm font-medium mb-2">Suggested Actions</p>
                        <div className="space-y-2">
                          {selectedContact.suggestedActions.map((action, index) => (
                            <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                              {getActionIcon(action.type)}
                              <div className="flex-1">
                                <p className="text-sm font-medium">{action.description}</p>
                                <div className="flex gap-2 mt-1">
                                  <Badge size="sm" className={getPriorityColor(action.priority)}>
                                    {action.priority}
                                  </Badge>
                                  <Badge size="sm" variant="outline">
                                    {action.timeframe}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="insights" className="space-y-4">
                    {insights ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-blue-50 rounded">
                            <p className="text-2xl font-bold text-blue-600">{insights.totalLoans}</p>
                            <p className="text-sm text-gray-600">Total Loans</p>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded">
                            <p className="text-2xl font-bold text-green-600">
                              {(insights.conversionRate * 100).toFixed(0)}%
                            </p>
                            <p className="text-sm text-gray-600">Conversion Rate</p>
                          </div>
                        </div>

                        <div className="text-center p-3 bg-purple-50 rounded">
                          <p className="text-lg font-bold text-purple-600">
                            ${insights.totalLoanValue.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">Total Loan Value</p>
                        </div>

                        <Separator />

                        <div>
                          <p className="text-sm font-medium mb-2">Activity Score</p>
                          <div className="flex items-center gap-2">
                            <Progress value={insights.activityScore} className="flex-1" />
                            <span className="text-sm font-medium">{insights.activityScore.toFixed(0)}</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-2">Opportunity Score</p>
                          <div className="flex items-center gap-2">
                            <Progress value={insights.opportunityScore} className="flex-1" />
                            <span className="text-sm font-medium">{insights.opportunityScore.toFixed(0)}</span>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <p className="text-sm font-medium mb-2">Communication Pattern</p>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Preferred: {insights.communicationPattern.preferredMethod}</p>
                            <p>Best time: {insights.communicationPattern.bestTimeOfDay}</p>
                            <p>Best days: {insights.communicationPattern.bestDays.join(', ')}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-2">Risk Profile</p>
                          <Badge className={
                            insights.riskProfile.level === 'low' ? 'bg-green-100 text-green-800' :
                            insights.riskProfile.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {insights.riskProfile.level} risk
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Loading insights...</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Select a contact to view detailed insights and recommendations</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
        {/* Hover Menu for Desktop */}
        {hoveredContact && !isMobile && (
          <div 
            className="fixed z-50 pointer-events-none"
            style={{
              left: `${Math.min(hoverPosition.x + 20, window.innerWidth - 320)}px`,
              top: `${Math.min(hoverPosition.y - 100, window.innerHeight - 400)}px`
            }}
          >
            <ContactHoverMenu
              contact={hoveredContact.contact}
              recommendation={{
                score: hoveredContact.score,
                category: hoveredContact.category,
                metadata: hoveredContact.metadata
              }}
              insights={insightsData?.insights}
              socialProfiles={{
                linkedin: `https://linkedin.com/in/${hoveredContact.contact.firstName.toLowerCase()}${hoveredContact.contact.lastName.toLowerCase()}`,
                twitter: `https://twitter.com/${hoveredContact.contact.firstName.toLowerCase()}${hoveredContact.contact.lastName.toLowerCase()}`,
                website: `https://${hoveredContact.contact.company.toLowerCase().replace(/\s+/g, '')}.com`
              }}
              onAction={handleContactAction}
              className="animate-in fade-in-0 zoom-in-95 duration-200"
            />
          </div>
        )}

        {/* Gamified Onboarding */}
        <GamifiedOnboarding
          isVisible={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  );
}