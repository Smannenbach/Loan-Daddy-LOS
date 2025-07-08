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
import GamifiedOnboarding from '@/components/gamified-onboarding';

interface BorrowerProfile {
  // Personal Information
  firstName?: string;
  lastName?: string;
  mobilePhone?: string;
  email?: string;
  dateOfBirth?: string;
  ssn?: string;
  ficoScore?: number;
  
  // Property Information
  propertyStreetAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  propertyZip?: string;
  propertyType?: string;
  estimatedValue?: number;
  appraisedValue?: number;
  monthlyPropertyTaxes?: number;
  monthlyPropertyInsurance?: number;
  monthlyHOA?: number;
  
  // Entity Information
  entityName?: string;
  entityType?: string;
  
  // Loan Details
  loanPurpose?: string;
  loanType?: string;
  cashOutAmount?: number;
  loanAmount?: number;
  currentBalance?: number;
  currentRate?: number;
  monthsRemaining?: number;
  currentMonthlyPI?: number;
  currentMonthlyTIA?: number;
  currentTotalMonthlyPayment?: number;
  downPaymentPercent?: number;
  downPaymentAmount?: number;
  reserves?: string;
  prepaymentPenalty?: string;
  
  // Additional fields for calculations
  ltv?: number;
  dscrRatio?: number;
  experience?: string;
  timelineToFunding?: string;
  liquidityPosition?: string;
  flipsCompleted?: number;
  rentalsOwned?: number;
  yearBuilt?: number;
  squareFootage?: number;
  grossIncome?: number;
  netIncome?: number;
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
      // Auto-calculate LTV if we have both loan amount and estimated value
      ...(field === 'loanAmount' || field === 'estimatedValue' ? {
        ltv: prev.estimatedValue && (field === 'loanAmount' ? value : prev.loanAmount) 
          ? Math.round(((field === 'loanAmount' ? value : prev.loanAmount) / (field === 'estimatedValue' ? value : prev.estimatedValue)) * 100)
          : undefined
      } : {})
    }));
  };

  const getRecommendationMutation = useMutation({
    mutationFn: async (profileData: BorrowerProfile) => {
      const response = await apiRequest('/api/ai/loan-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      return response;
    },
    onSuccess: (data) => {
      setRecommendation(data);
      toast({
        title: "AI Recommendation Generated",
        description: `Found ${data.loanType} with ${data.confidence}% confidence`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate recommendation. Please try again.",
        variant: "destructive"
      });
    }
  });

  const chatMutation = useMutation({
    mutationFn: async ({ message, profile }: { message: string; profile: BorrowerProfile }) => {
      const response = await apiRequest('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, profile, messages: chatMessages })
      });
      return response;
    },
    onSuccess: (data) => {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      }]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    chatMutation.mutate({ message: currentMessage, profile });
    setCurrentMessage('');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle className="h-4 w-4 mr-1" />;
    if (confidence >= 60) return <AlertCircle className="h-4 w-4 mr-1" />;
    return <AlertCircle className="h-4 w-4 mr-1" />;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        {!isMobile && (
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
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
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={profile.firstName || ''}
                        onChange={(e) => updateProfile('firstName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={profile.lastName || ''}
                        onChange={(e) => updateProfile('lastName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={profile.email || ''}
                        onChange={(e) => updateProfile('email', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobilePhone">Phone</Label>
                      <Input
                        id="mobilePhone"
                        placeholder="(555) 123-4567"
                        value={profile.mobilePhone || ''}
                        onChange={(e) => updateProfile('mobilePhone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ficoScore">FICO Score</Label>
                      <Input
                        id="ficoScore"
                        type="number"
                        placeholder="720"
                        value={profile.ficoScore || ''}
                        onChange={(e) => updateProfile('ficoScore', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* Property Information */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-3">Property Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="propertyStreetAddress">Property Address *</Label>
                      <Input
                        id="propertyStreetAddress"
                        placeholder="123 Main St"
                        value={profile.propertyStreetAddress || ''}
                        onChange={(e) => updateProfile('propertyStreetAddress', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="propertyCity">Property City *</Label>
                      <Input
                        id="propertyCity"
                        placeholder="Phoenix"
                        value={profile.propertyCity || ''}
                        onChange={(e) => updateProfile('propertyCity', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="propertyState">Property State *</Label>
                      <Input
                        id="propertyState"
                        type="text"
                        placeholder="AZ"
                        value={profile.propertyState || ''}
                        onChange={(e) => updateProfile('propertyState', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="propertyZip">Property Zip *</Label>
                      <Input
                        id="propertyZip"
                        type="text"
                        placeholder="85001"
                        value={profile.propertyZip || ''}
                        onChange={(e) => updateProfile('propertyZip', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="propertyType">Property Type *</Label>
                      <Select value={profile.propertyType || ''} onValueChange={(value) => updateProfile('propertyType', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single_family">Single Family</SelectItem>
                          <SelectItem value="condo">Condo</SelectItem>
                          <SelectItem value="townhome">Townhome</SelectItem>
                          <SelectItem value="2_unit">2 Unit</SelectItem>
                          <SelectItem value="3_unit">3 Unit</SelectItem>
                          <SelectItem value="4_unit">4 Unit</SelectItem>
                          <SelectItem value="multifamily_5_8">Multifamily 5-8 Unit</SelectItem>
                          <SelectItem value="multifamily_9_10">Multifamily 9-10 Unit</SelectItem>
                          <SelectItem value="multifamily_10_plus">Multifamily 10+ Unit</SelectItem>
                          <SelectItem value="mixed_use">Mixed-use</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="office">Office</SelectItem>
                          <SelectItem value="industrial">Industrial</SelectItem>
                          <SelectItem value="warehouse">Warehouse</SelectItem>
                          <SelectItem value="storage">Storage</SelectItem>
                          <SelectItem value="senior_living">Senior Living</SelectItem>
                          <SelectItem value="student_housing">Student Housing</SelectItem>
                          <SelectItem value="hotel_motel">Hotel / Motel</SelectItem>
                          <SelectItem value="condotel">Condotel</SelectItem>
                          <SelectItem value="restaurant">Restaurant</SelectItem>
                          <SelectItem value="bar">Bar</SelectItem>
                          <SelectItem value="cannabis">Cannabis</SelectItem>
                          <SelectItem value="strip_club">Strip Club</SelectItem>
                          <SelectItem value="automotive">Automotive</SelectItem>
                          <SelectItem value="special_use">Special Use Property</SelectItem>
                          <SelectItem value="land_lot">Land Lot</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estimatedValue">Estimated Value *</Label>
                      <Input
                        id="estimatedValue"
                        type="number"
                        placeholder="750000"
                        value={profile.estimatedValue || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          updateProfile('estimatedValue', value);
                          updateProfile('appraisedValue', value); // Auto-fill appraised value
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="appraisedValue">Appraised Value</Label>
                      <Input
                        id="appraisedValue"
                        type="number"
                        placeholder="750000"
                        value={profile.appraisedValue || ''}
                        onChange={(e) => updateProfile('appraisedValue', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthlyPropertyTaxes">Monthly Property Taxes ($)</Label>
                      <Input
                        id="monthlyPropertyTaxes"
                        type="number"
                        placeholder="800"
                        value={profile.monthlyPropertyTaxes || ''}
                        onChange={(e) => updateProfile('monthlyPropertyTaxes', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthlyPropertyInsurance">Monthly Property Insurance ($)</Label>
                      <Input
                        id="monthlyPropertyInsurance"
                        type="number"
                        placeholder="200"
                        value={profile.monthlyPropertyInsurance || ''}
                        onChange={(e) => updateProfile('monthlyPropertyInsurance', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthlyHOA">Monthly HOA ($)</Label>
                      <Input
                        id="monthlyHOA"
                        type="number"
                        placeholder="100"
                        value={profile.monthlyHOA || ''}
                        onChange={(e) => updateProfile('monthlyHOA', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearBuilt">Year Built</Label>
                      <Input
                        id="yearBuilt"
                        type="number"
                        placeholder="1985"
                        value={profile.yearBuilt || ''}
                        onChange={(e) => updateProfile('yearBuilt', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="squareFootage">Square Footage</Label>
                      <Input
                        id="squareFootage"
                        type="number"
                        placeholder="2500"
                        value={profile.squareFootage || ''}
                        onChange={(e) => updateProfile('squareFootage', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* Loan Information */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-3">Loan Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="loanPurpose">Loan Purpose</Label>
                      <Select value={profile.loanPurpose || ''} onValueChange={(value) => updateProfile('loanPurpose', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="purchase">Purchase</SelectItem>
                          <SelectItem value="refinance">Refinance</SelectItem>
                          <SelectItem value="cash_out">Cash Out</SelectItem>
                          <SelectItem value="bridge">Bridge</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="loanType">Loan Type</Label>
                      <Select value={profile.loanType || ''} onValueChange={(value) => updateProfile('loanType', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dscr">DSCR</SelectItem>
                          <SelectItem value="fix_flip">Fix & Flip</SelectItem>
                          <SelectItem value="bridge">Bridge</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="loanAmount">Loan Amount ($)</Label>
                      <Input
                        id="loanAmount"
                        type="number"
                        placeholder="400000"
                        value={profile.loanAmount || ''}
                        onChange={(e) => updateProfile('loanAmount', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="downPaymentPercent">Down Payment (%)</Label>
                      <Input
                        id="downPaymentPercent"
                        type="number"
                        placeholder="20"
                        value={profile.downPaymentPercent || ''}
                        onChange={(e) => updateProfile('downPaymentPercent', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* Generate Recommendation Button */}
                <Button
                  onClick={() => getRecommendationMutation.mutate(profile)}
                  disabled={getRecommendationMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                >
                  {getRecommendationMutation.isPending ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Get AI Recommendation
                    </>
                  )}
                </Button>

                {/* Recommendation Display */}
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
                          message.role === 'user' ? 'bg-blue-100' : 'bg-green-100'
                        )}>
                          {message.role === 'user' ? (
                            <User className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Bot className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div className={cn(
                          "max-w-xs p-3 rounded-lg",
                          message.role === 'user' 
                            ? 'bg-blue-100 text-blue-900' 
                            : 'bg-green-100 text-green-900'
                        )}>
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Input
                    placeholder="Ask about loans, rates, or requirements..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={chatMutation.isPending || !currentMessage.trim()}
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