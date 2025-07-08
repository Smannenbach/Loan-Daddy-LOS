import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Brain, User, Bot, Send, MessageSquare, Target, CheckCircle, AlertCircle, TrendingUp, Trophy, Calculator, FileText, Star, Shield, Clock, DollarSign, Award, Zap, Home, Building, Car, Users, CreditCard, Briefcase, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { GamifiedOnboarding } from '@/components/gamified-onboarding';

interface BorrowerProfile {
  // Required minimum fields
  firstName?: string;
  lastName?: string;
  homePhone?: string;
  dateOfBirth?: string;
  email?: string;
  address?: string;
  creditScore?: number;
  homeValue?: number;
  loanPurpose?: string;
  propertyType?: string;
  loanAmount?: number;
  
  // Additional fields
  experience?: string;
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
  const [recommendation, setRecommendation] = useState<LoanRecommendation | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  const updateProfile = (field: keyof BorrowerProfile, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value,
      // Auto-calculate LTV if we have both loan amount and home value
      ...(field === 'loanAmount' || field === 'homeValue' ? {
        ltv: prev.homeValue && (field === 'loanAmount' ? value : prev.loanAmount) 
          ? Math.round(((field === 'loanAmount' ? value : prev.loanAmount) / (field === 'homeValue' ? value : prev.homeValue)) * 100)
          : undefined
      } : {})
    }));
  };

  // Loan recommendation mutation
  const recommendationMutation = useMutation({
    mutationFn: async (borrowerProfile: BorrowerProfile) => {
      const response = await apiRequest('POST', '/api/ai/loan-recommendation', borrowerProfile);
      return await response.json();
    },
    onSuccess: (data: LoanRecommendation) => {
      setRecommendation(data);
      toast({
        title: "Recommendation Generated",
        description: `Found ${data.loanType} with ${data.estimatedRate}% rate`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate recommendation",
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
    // Check all required fields
    const requiredFields = [
      { field: 'firstName', name: 'First Name' },
      { field: 'lastName', name: 'Last Name' },
      { field: 'homePhone', name: 'Home Phone' },
      { field: 'dateOfBirth', name: 'Date of Birth' },
      { field: 'email', name: 'Email' },
      { field: 'address', name: 'Address' },
      { field: 'creditScore', name: 'Credit Score' },
      { field: 'homeValue', name: 'Home Value' },
      { field: 'loanPurpose', name: 'Loan Purpose' },
      { field: 'propertyType', name: 'Property Type' },
      { field: 'loanAmount', name: 'Loan Amount' },
    ];

    const missingFields = requiredFields.filter(({ field }) => !profile[field as keyof BorrowerProfile]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: `Please fill in: ${missingFields.map(f => f.name).join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    recommendationMutation.mutate(profile);
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Borrower Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Personal Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-3">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={profile.firstName || ''}
                        onChange={(e) => updateProfile('firstName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Smith"
                        value={profile.lastName || ''}
                        onChange={(e) => updateProfile('lastName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="homePhone">Home Phone *</Label>
                      <Input
                        id="homePhone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={profile.homePhone || ''}
                        onChange={(e) => updateProfile('homePhone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={profile.dateOfBirth || ''}
                        onChange={(e) => updateProfile('dateOfBirth', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.smith@example.com"
                        value={profile.email || ''}
                        onChange={(e) => updateProfile('email', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        type="text"
                        placeholder="123 Main St, City, State 12345"
                        value={profile.address || ''}
                        onChange={(e) => updateProfile('address', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Loan Details */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-3">Loan Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="loanAmount">Loan Amount *</Label>
                      <Input
                        id="loanAmount"
                        type="number"
                        placeholder="500000"
                        value={profile.loanAmount || ''}
                        onChange={(e) => updateProfile('loanAmount', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="homeValue">Home Value *</Label>
                      <Input
                        id="homeValue"
                        type="number"
                        placeholder="750000"
                        value={profile.homeValue || ''}
                        onChange={(e) => updateProfile('homeValue', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loanPurpose">Loan Purpose *</Label>
                  <Select value={profile.loanPurpose} onValueChange={(value) => updateProfile('loanPurpose', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select loan purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4" />
                          Purchase
                        </div>
                      </SelectItem>
                      <SelectItem value="cash_out_refinance">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Cash Out Refinance
                        </div>
                      </SelectItem>
                      <SelectItem value="refinance">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Refinance
                        </div>
                      </SelectItem>
                      <SelectItem value="bridge">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4" />
                          Bridge
                        </div>
                      </SelectItem>
                      <SelectItem value="construction">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Construction
                        </div>
                      </SelectItem>
                      <SelectItem value="fix_and_flip">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4" />
                          Fix and Flip
                        </div>
                      </SelectItem>
                      <SelectItem value="renovation">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4" />
                          Renovation
                        </div>
                      </SelectItem>
                      <SelectItem value="heloc">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4" />
                          HELOC
                        </div>
                      </SelectItem>
                      <SelectItem value="second_mortgage">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Second Mortgage
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyType">Property Type *</Label>
                  <Select value={profile.propertyType} onValueChange={(value) => updateProfile('propertyType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_family">Single Family</SelectItem>
                      <SelectItem value="multi_family">Multi-Family</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="mixed_use">Mixed Use</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                      <SelectItem value="manufactured">Manufactured</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Financial Information */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-3">Financial Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="creditScore">Credit Score (Decision Making: 740) *</Label>
                      <Input
                        id="creditScore"
                        type="number"
                        placeholder="740"
                        value={profile.creditScore || ''}
                        onChange={(e) => updateProfile('creditScore', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dscrRatio">DSCR Ratio (Optional)</Label>
                      <Input
                        id="dscrRatio"
                        type="number"
                        step="0.1"
                        placeholder="1.25"
                        value={profile.dscrRatio || ''}
                        onChange={(e) => updateProfile('dscrRatio', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prepaymentPenalty">Prepayment Penalty</Label>
                  <Select value={profile.prepaymentPenalty} onValueChange={(value) => updateProfile('prepaymentPenalty', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select prepayment penalty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Higher Rate)</SelectItem>
                      <SelectItem value="1_year">1 Year</SelectItem>
                      <SelectItem value="2_year">2 Years</SelectItem>
                      <SelectItem value="3_year">3 Years</SelectItem>
                      <SelectItem value="4_year">4 Years</SelectItem>
                      <SelectItem value="5_year">5 Years (Best Rate)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleGetRecommendation}
                  disabled={recommendationMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                >
                  {recommendationMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Get Loan Recommendation
                    </div>
                  )}
                </Button>

                {recommendation && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-green-900">{recommendation.loanType}</h3>
                    </div>
                    <p className="text-green-800 mb-2">{recommendation.reasoning}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Rate:</span> {recommendation.estimatedRate}%
                      </div>
                      <div>
                        <span className="text-gray-600">Max Amount:</span> ${recommendation.maxLoanAmount.toLocaleString()}
                      </div>
                      <div>
                        <span className="text-gray-600">LTV:</span> {recommendation.ltv}%
                      </div>
                      <div>
                        <span className="text-gray-600">Term:</span> {recommendation.termLength}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-gray-600">Confidence:</span>
                      <Badge className={getConfidenceColor(recommendation.confidence)}>
                        {getConfidenceIcon(recommendation.confidence)}
                        {recommendation.confidence}%
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Chat Assistant */}
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
        </div>

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