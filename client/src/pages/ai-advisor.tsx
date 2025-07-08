import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  MessageSquare, 
  Calculator, 
  TrendingUp, 
  DollarSign,
  Home,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
  Send,
  Bot,
  User,
  Lightbulb,
  Target,
  PieChart,
  BarChart3,
  FileText,
  Phone,
  Calendar,
  Zap,
  Award,
  Trophy,
  Sparkles
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import ContactHoverMenu from '@/components/contact-hover-menu';
import GamifiedOnboarding from '@/components/gamified-onboarding';

interface BorrowerProfile {
  creditScore?: number;
  experience?: string;
  loanAmount?: number;
  loanPurpose?: string;
  propertyType?: string;
  propertyValue?: number;
  timelineToFunding?: string;
  ltv?: number;
  dscrRatio?: number;
  liquidityPosition?: string;
  flipsCompleted?: number;
  rentalsOwned?: number;
  yearBuilt?: number;
  squareFootage?: number;
  propertyTaxes?: number;
  insurance?: number;
  grossIncome?: number;
  netIncome?: number;
  prepaymentPenalty?: string;
}

interface LoanRecommendation {
  loanType: string;
  loanProgram: string;
  estimatedRate: number;
  maxLoanAmount: number;
  ltv: number;
  termLength: string;
  prepaymentPenalty: boolean;
  reasoning: string;
  confidence: number;
  alternativeOptions: Array<{
    loanType: string;
    rate: number;
    pros: string[];
    cons: string[];
  }>;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIAdvisor() {
  const [profile, setProfile] = useState<BorrowerProfile>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI loan advisor. I can help you find the perfect loan product based on your specific situation. What type of loan are you looking for?",
      timestamp: new Date()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [recommendation, setRecommendation] = useState<LoanRecommendation | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get loan recommendation
  const recommendationMutation = useMutation({
    mutationFn: async (borrowerProfile: BorrowerProfile) => {
      return await apiRequest('/api/ai/loan-recommendation', {
        method: 'POST',
        body: JSON.stringify(borrowerProfile)
      });
    },
    onSuccess: (data: LoanRecommendation) => {
      setRecommendation(data);
      toast({
        title: "Recommendation Generated",
        description: `Found ${data.loanProgram} with ${(data.estimatedRate * 100).toFixed(2)}% rate`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate loan recommendation",
        variant: "destructive",
      });
    },
  });

  // AI chat mutation
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/ai/chat', { 
        message, 
        profile, 
        context: chatMessages 
      });
      return await response.json();
    },
    onSuccess: (data: { response: string }) => {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    
    const userMessage = {
      role: 'user' as const,
      content: currentMessage,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(currentMessage);
    setCurrentMessage('');
  };

  const handleGetRecommendation = () => {
    if (!profile.loanAmount || !profile.loanPurpose) {
      toast({
        title: "Missing Information",
        description: "Please provide at least loan amount and purpose",
        variant: "destructive",
      });
      return;
    }
    
    recommendationMutation.mutate(profile);
  };

  const handleNavigate = (route: string) => {
    window.location.href = route;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle className="h-4 w-4" />;
    if (confidence >= 60) return <AlertCircle className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Loan Advisor</h1>
              <p className="text-sm text-gray-600">Intelligent loan recommendations</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOnboarding(true)}
          >
            <Trophy className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Desktop Header */}
        {!isMobile && (
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">AI Loan Advisor</h1>
                <p className="text-gray-600">Get intelligent loan recommendations powered by advanced AI</p>
              </div>
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

        <Tabs defaultValue="recommendation" className="space-y-6">
          <TabsList className={cn("grid w-full", isMobile ? "grid-cols-2" : "grid-cols-3")}>
            <TabsTrigger value="recommendation" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Recommendation</span>
              <span className="sm:hidden">Rec</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">AI Chat</span>
              <span className="sm:hidden">Chat</span>
            </TabsTrigger>
            {!isMobile && (
              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analysis
              </TabsTrigger>
            )}
          </TabsList>

          {/* Loan Recommendation Tab */}
          <TabsContent value="recommendation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Borrower Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="loanAmount">Loan Amount</Label>
                      <Input
                        id="loanAmount"
                        type="number"
                        placeholder="500000"
                        value={profile.loanAmount || ''}
                        onChange={(e) => setProfile({...profile, loanAmount: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="creditScore">Credit Score</Label>
                      <Input
                        id="creditScore"
                        type="number"
                        placeholder="750"
                        value={profile.creditScore || ''}
                        onChange={(e) => setProfile({...profile, creditScore: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="loanPurpose">Loan Purpose</Label>
                    <Select value={profile.loanPurpose} onValueChange={(value) => setProfile({...profile, loanPurpose: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select loan purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="purchase">Purchase</SelectItem>
                        <SelectItem value="cash_out_refinance">Cash Out Refinance</SelectItem>
                        <SelectItem value="refinance">Refinance</SelectItem>
                        <SelectItem value="bridge">Bridge Loan</SelectItem>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="fix_flip">Fix & Flip</SelectItem>
                        <SelectItem value="heloc">HELOC</SelectItem>
                        <SelectItem value="second_mortgage">Second Mortgage</SelectItem>
                        <SelectItem value="renovation">Renovation</SelectItem>
                        <SelectItem value="rental_investment">Rental Investment</SelectItem>
                        <SelectItem value="commercial_purchase">Commercial Purchase</SelectItem>
                        <SelectItem value="land_acquisition">Land Acquisition</SelectItem>
                        <SelectItem value="ground_up_construction">Ground Up Construction</SelectItem>
                        <SelectItem value="business_purpose">Business Purpose</SelectItem>
                        <SelectItem value="debt_consolidation">Debt Consolidation</SelectItem>
                        <SelectItem value="equipment_financing">Equipment Financing</SelectItem>
                        <SelectItem value="working_capital">Working Capital</SelectItem>
                        <SelectItem value="investment_property">Investment Property</SelectItem>
                        <SelectItem value="portfolio_refinance">Portfolio Refinance</SelectItem>
                        <SelectItem value="multifamily_acquisition">Multifamily Acquisition</SelectItem>
                        <SelectItem value="mixed_use">Mixed Use Property</SelectItem>
                        <SelectItem value="owner_occupied">Owner Occupied</SelectItem>
                        <SelectItem value="non_owner_occupied">Non-Owner Occupied</SelectItem>
                        <SelectItem value="blanket_loan">Blanket Loan</SelectItem>
                        <SelectItem value="cross_collateral">Cross Collateral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="propertyType">Property Type</Label>
                    <Select value={profile.propertyType} onValueChange={(value) => setProfile({...profile, propertyType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single_family">Single Family</SelectItem>
                        <SelectItem value="duplex">Duplex</SelectItem>
                        <SelectItem value="triplex">Triplex</SelectItem>
                        <SelectItem value="fourplex">Fourplex</SelectItem>
                        <SelectItem value="apartment">Apartment Building</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="mixed_use">Mixed Use</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="propertyValue">Property Value</Label>
                      <Input
                        id="propertyValue"
                        type="number"
                        placeholder="600000"
                        value={profile.propertyValue || ''}
                        onChange={(e) => setProfile({...profile, propertyValue: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="experience">Experience Level</Label>
                      <Select value={profile.experience} onValueChange={(value) => setProfile({...profile, experience: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select experience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="experienced">Experienced</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="prepaymentPenalty">Prepayment Penalty (PPP)</Label>
                    <Select value={profile.prepaymentPenalty} onValueChange={(value) => setProfile({...profile, prepaymentPenalty: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select prepayment penalty term" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (Higher Rate)</SelectItem>
                        <SelectItem value="1_year">1 Year</SelectItem>
                        <SelectItem value="2_year">2 Year</SelectItem>
                        <SelectItem value="3_year">3 Year</SelectItem>
                        <SelectItem value="4_year">4 Year</SelectItem>
                        <SelectItem value="5_year">5 Year (Best Rate)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-600 mt-1">
                      Longer prepayment penalty periods typically result in lower interest rates
                    </p>
                  </div>

                  <Button 
                    onClick={handleGetRecommendation}
                    disabled={recommendationMutation.isPending}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {recommendationMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analyzing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Get AI Recommendation
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Recommendation Result */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    AI Recommendation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recommendation ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-blue-100 text-blue-800">
                          {recommendation.loanProgram}
                        </Badge>
                        <div className={cn("flex items-center gap-1", getConfidenceColor(recommendation.confidence))}>
                          {getConfidenceIcon(recommendation.confidence)}
                          <span className="text-sm font-medium">{recommendation.confidence}% confidence</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {(recommendation.estimatedRate * 100).toFixed(2)}%
                          </div>
                          <div className="text-sm text-gray-600">Est. Rate</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            ${(recommendation.maxLoanAmount / 1000000).toFixed(1)}M
                          </div>
                          <div className="text-sm text-gray-600">Max Loan</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">LTV:</span>
                          <span className="text-sm font-medium">{(recommendation.ltv * 100)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Term:</span>
                          <span className="text-sm font-medium">{recommendation.termLength}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Prepayment Penalty:</span>
                          <span className="text-sm font-medium">
                            {recommendation.prepaymentPenalty ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">AI Reasoning:</h4>
                        <p className="text-sm text-gray-700">{recommendation.reasoning}</p>
                      </div>

                      {recommendation.alternativeOptions.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Alternative Options:</h4>
                          <div className="space-y-2">
                            {recommendation.alternativeOptions.map((option, index) => (
                              <div key={index} className="p-2 border rounded-lg">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{option.loanType}</span>
                                  <span className="text-sm">{(option.rate * 100).toFixed(2)}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Complete the borrower profile to get personalized recommendations</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  AI Chat Assistant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ScrollArea className="h-96 border rounded-lg p-4">
                    <div className="space-y-4">
                      {chatMessages.map((message, index) => (
                        <div key={index} className={cn(
                          "flex gap-3",
                          message.role === 'user' ? 'flex-row-reverse' : ''
                        )}>
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            message.role === 'user' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-200 text-gray-600'
                          )}>
                            {message.role === 'user' ? (
                              <User className="h-4 w-4" />
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                          </div>
                          <div className={cn(
                            "max-w-[70%] p-3 rounded-lg",
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          )}>
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {chatMutation.isPending && (
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-gray-600" />
                          </div>
                          <div className="bg-gray-100 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask me about loan options..."
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={chatMutation.isPending || !currentMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Profile Completeness
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Overall Completeness</span>
                      <span className="text-sm font-medium">
                        {Math.round((Object.values(profile).filter(v => v !== undefined && v !== '').length / Object.keys(profile).length) * 100)}%
                      </span>
                    </div>
                    <Progress value={Math.round((Object.values(profile).filter(v => v !== undefined && v !== '').length / Object.keys(profile).length) * 100)} />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Basic Info</span>
                        <span className="text-sm">{profile.loanAmount && profile.loanPurpose ? '✓' : '○'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Credit Profile</span>
                        <span className="text-sm">{profile.creditScore ? '✓' : '○'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Property Details</span>
                        <span className="text-sm">{profile.propertyType && profile.propertyValue ? '✓' : '○'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-xl font-bold text-blue-600">
                          {profile.loanAmount ? `$${(profile.loanAmount / 1000000).toFixed(1)}M` : '--'}
                        </div>
                        <div className="text-xs text-gray-600">Loan Amount</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-xl font-bold text-green-600">
                          {profile.creditScore || '--'}
                        </div>
                        <div className="text-xs text-gray-600">Credit Score</div>
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">
                        {profile.loanPurpose ? profile.loanPurpose.replace('_', ' ').toUpperCase() : 'NOT SET'}
                      </div>
                      <div className="text-xs text-gray-600">Loan Purpose</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

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