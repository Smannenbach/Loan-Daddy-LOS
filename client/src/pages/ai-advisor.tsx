import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  MessageCircle, 
  Calculator, 
  TrendingUp, 
  Building, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

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
  propertyAddress?: string;
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
  const { toast } = useToast();

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

  // AI chat
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      return await apiRequest('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message,
          profile,
          context: chatMessages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')
        })
      });
    },
    onSuccess: (data: { response: string }) => {
      setChatMessages(prev => [
        ...prev,
        { role: 'user', content: currentMessage, timestamp: new Date() },
        { role: 'assistant', content: data.response, timestamp: new Date() }
      ]);
      setCurrentMessage('');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleProfileChange = (key: keyof BorrowerProfile, value: any) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleGetRecommendation = () => {
    if (!profile.loanAmount || !profile.loanPurpose) {
      toast({
        title: "Missing Information",
        description: "Please provide at least loan amount and purpose to get a recommendation",
        variant: "destructive",
      });
      return;
    }
    recommendationMutation.mutate(profile);
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    chatMutation.mutate(currentMessage);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return "High Confidence";
    if (confidence >= 60) return "Medium Confidence";
    return "Low Confidence";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bot className="w-8 h-8 text-blue-600" />
          AI Loan Advisor
        </h1>
        <p className="text-text-secondary mt-2">
          Get personalized loan recommendations and expert guidance powered by artificial intelligence
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Borrower Profile Input */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Borrower Profile
              </CardTitle>
              <CardDescription>
                Tell us about your situation to get personalized recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="loanAmount">Loan Amount</Label>
                  <Input
                    id="loanAmount"
                    type="number"
                    placeholder="500000"
                    value={profile.loanAmount || ''}
                    onChange={(e) => handleProfileChange('loanAmount', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="propertyValue">Property Value</Label>
                  <Input
                    id="propertyValue"
                    type="number"
                    placeholder="750000"
                    value={profile.propertyValue || ''}
                    onChange={(e) => handleProfileChange('propertyValue', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="creditScore">Credit Score</Label>
                  <Input
                    id="creditScore"
                    type="number"
                    placeholder="720"
                    value={profile.creditScore || ''}
                    onChange={(e) => handleProfileChange('creditScore', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="loanPurpose">Loan Purpose</Label>
                  <Select onValueChange={(value) => handleProfileChange('loanPurpose', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="refinance">Refinance</SelectItem>
                      <SelectItem value="cash_out">Cash Out Refinance</SelectItem>
                      <SelectItem value="flip">Fix & Flip</SelectItem>
                      <SelectItem value="rental">DSCR Rental</SelectItem>
                      <SelectItem value="bridge">Bridge Loan</SelectItem>
                      <SelectItem value="construction">Construction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="experience">Experience Level</Label>
                  <Select onValueChange={(value) => handleProfileChange('experience', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_time">First Time</SelectItem>
                      <SelectItem value="beginner">Beginner (1-3 deals)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (4-10 deals)</SelectItem>
                      <SelectItem value="experienced">Experienced (10+ deals)</SelectItem>
                      <SelectItem value="expert">Expert (50+ deals)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timeline">Timeline to Fund</Label>
                  <Select onValueChange={(value) => handleProfileChange('timelineToFunding', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">ASAP (7-14 days)</SelectItem>
                      <SelectItem value="fast">Fast (2-3 weeks)</SelectItem>
                      <SelectItem value="normal">Normal (30-45 days)</SelectItem>
                      <SelectItem value="flexible">Flexible (60+ days)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="propertyAddress">Property Address (Optional)</Label>
                <Input
                  id="propertyAddress"
                  placeholder="123 Main St, City, State 12345"
                  value={profile.propertyAddress || ''}
                  onChange={(e) => handleProfileChange('propertyAddress', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="flipsCompleted">Flips Completed</Label>
                  <Input
                    id="flipsCompleted"
                    type="number"
                    placeholder="0"
                    value={profile.flipsCompleted || ''}
                    onChange={(e) => handleProfileChange('flipsCompleted', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="rentalsOwned">Rentals Owned</Label>
                  <Input
                    id="rentalsOwned"
                    type="number"
                    placeholder="0"
                    value={profile.rentalsOwned || ''}
                    onChange={(e) => handleProfileChange('rentalsOwned', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <Button 
                onClick={handleGetRecommendation}
                disabled={recommendationMutation.isPending}
                className="w-full"
              >
                {recommendationMutation.isPending ? "Analyzing..." : "Get Loan Recommendation"}
              </Button>
            </CardContent>
          </Card>

          {/* Loan Recommendation */}
          {recommendation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  AI Recommendation
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getConfidenceColor(recommendation.confidence)}>
                    {getConfidenceLabel(recommendation.confidence)}
                  </Badge>
                  <Progress value={recommendation.confidence} className="flex-1 h-2" />
                  <span className="text-sm text-text-secondary">{recommendation.confidence}%</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-semibold">{recommendation.loanProgram}</div>
                      <div className="text-sm text-text-secondary">{recommendation.loanType.toUpperCase()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="font-semibold">{(recommendation.estimatedRate * 100).toFixed(2)}%</div>
                      <div className="text-sm text-text-secondary">Interest Rate</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-semibold">${recommendation.maxLoanAmount.toLocaleString()}</div>
                    <div className="text-sm text-text-secondary">Max Loan Amount</div>
                  </div>
                  <div>
                    <div className="font-semibold">{(recommendation.ltv * 100)}% LTV</div>
                    <div className="text-sm text-text-secondary">{recommendation.termLength}</div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">AI Analysis</h4>
                  <p className="text-sm text-text-secondary">{recommendation.reasoning}</p>
                </div>

                {recommendation.alternativeOptions.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Alternative Options</h4>
                    <div className="space-y-2">
                      {recommendation.alternativeOptions.slice(0, 2).map((option, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{option.loanType.toUpperCase()}</span>
                            <span className="text-green-600 font-semibold">{(option.rate * 100).toFixed(2)}%</span>
                          </div>
                          <div className="text-xs text-text-secondary space-y-1">
                            <div><strong>Pros:</strong> {option.pros.join(', ')}</div>
                            <div><strong>Cons:</strong> {option.cons.join(', ')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* AI Chat Interface */}
        <div>
          <Card className="h-[800px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Chat with AI Advisor
              </CardTitle>
              <CardDescription>
                Ask questions and get instant expert guidance
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {chatMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="Ask about loan options, rates, requirements..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={chatMutation.isPending}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={chatMutation.isPending || !currentMessage.trim()}
                >
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}