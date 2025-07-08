import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  Phone, 
  MessageSquare, 
  TrendingUp, 
  Users, 
  Activity,
  Brain,
  Zap,
  Target,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  PauseCircle
} from "lucide-react";

interface AIMetrics {
  totalSessions: number;
  activeSessions: number;
  avgResponseTime: number;
  satisfactionScore: number;
  conversionsGenerated: number;
  callsHandled: number;
  leadsQualified: number;
  automationSavings: number;
}

interface AISession {
  id: string;
  type: 'chat' | 'voice';
  contactId: number;
  contactName: string;
  status: 'active' | 'completed' | 'escalated';
  startTime: Date;
  duration?: number;
  outcome?: string;
  confidence: number;
}

export default function AIDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTimeframe, setSelectedTimeframe] = useState('today');

  // Fetch AI metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/ai/metrics', selectedTimeframe],
    queryFn: () => apiRequest('GET', `/api/ai/metrics?timeframe=${selectedTimeframe}`),
  });

  // Fetch active AI sessions
  const { data: activeSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/ai/sessions'],
    queryFn: () => apiRequest('GET', '/api/ai/sessions?status=active'),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch AI performance data
  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ['/api/ai/performance', selectedTimeframe],
    queryFn: () => apiRequest('GET', `/api/ai/performance?timeframe=${selectedTimeframe}`),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'escalated': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (metricsLoading || sessionsLoading || performanceLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const aiMetrics: AIMetrics = metrics || {
    totalSessions: 0,
    activeSessions: 0,
    avgResponseTime: 0,
    satisfactionScore: 0,
    conversionsGenerated: 0,
    callsHandled: 0,
    leadsQualified: 0,
    automationSavings: 0
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-600" />
            AI Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage AI-powered chatbots, voicebots, and automation
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Active Sessions</p>
                  <p className="text-3xl font-bold">{aiMetrics.activeSessions}</p>
                </div>
                <Activity className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Satisfaction Score</p>
                  <p className="text-3xl font-bold">{aiMetrics.satisfactionScore}%</p>
                </div>
                <Target className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Leads Qualified</p>
                  <p className="text-3xl font-bold">{aiMetrics.leadsQualified}</p>
                </div>
                <Users className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Avg Response</p>
                  <p className="text-3xl font-bold">{aiMetrics.avgResponseTime}s</p>
                </div>
                <Zap className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="settings">AI Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Chatbot Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Response Accuracy</span>
                      <span className="text-sm text-gray-600">92%</span>
                    </div>
                    <Progress value={92} className="w-full" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">User Satisfaction</span>
                      <span className="text-sm text-gray-600">{aiMetrics.satisfactionScore}%</span>
                    </div>
                    <Progress value={aiMetrics.satisfactionScore} className="w-full" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Conversion Rate</span>
                      <span className="text-sm text-gray-600">18%</span>
                    </div>
                    <Progress value={18} className="w-full" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Voice Bot Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Call Success Rate</span>
                      <span className="text-sm text-gray-600">85%</span>
                    </div>
                    <Progress value={85} className="w-full" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Speech Recognition</span>
                      <span className="text-sm text-gray-600">94%</span>
                    </div>
                    <Progress value={94} className="w-full" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Avg Call Duration</span>
                      <span className="text-sm text-gray-600">4.2 min</span>
                    </div>
                    <Progress value={70} className="w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  AI Impact Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">${aiMetrics.automationSavings.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Cost Savings This Month</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{aiMetrics.conversionsGenerated}</div>
                    <div className="text-sm text-gray-600">Conversions Generated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{aiMetrics.totalSessions}</div>
                    <div className="text-sm text-gray-600">Total AI Interactions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Live AI Sessions
                </CardTitle>
                <CardDescription>
                  Monitor ongoing conversations and voice calls
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {activeSessions && activeSessions.length > 0 ? (
                      activeSessions.map((session: AISession) => (
                        <div key={session.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {session.type === 'chat' ? (
                                <MessageSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Phone className="w-4 h-4 text-green-600" />
                              )}
                              <span className="font-medium">{session.contactName}</span>
                              <Badge className={getStatusColor(session.status)}>
                                {session.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${getConfidenceColor(session.confidence)}`}>
                                {session.confidence}% confidence
                              </span>
                              <Button size="sm" variant="outline">
                                Monitor
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            Started: {new Date(session.startTime).toLocaleTimeString()}
                            {session.duration && (
                              <span className="ml-4">Duration: {formatDuration(session.duration)}</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No active AI sessions</p>
                        <p className="text-sm">Sessions will appear here when AI is engaged with customers</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Response Time Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <BarChart3 className="w-16 h-16 opacity-50" />
                    <span className="ml-4">Performance charts will appear here</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Satisfaction Scores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <TrendingUp className="w-16 h-16 opacity-50" />
                    <span className="ml-4">Satisfaction trends will appear here</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Chatbot Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Auto-response</span>
                    <Button variant="outline" size="sm">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Enabled
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Lead qualification</span>
                    <Button variant="outline" size="sm">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Enabled
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Escalation threshold</span>
                    <Badge variant="secondary">Low confidence (&lt; 60%)</Badge>
                  </div>
                  <Button className="w-full">Update Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Voice Bot Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Outbound calling</span>
                    <Button variant="outline" size="sm">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Enabled
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Voice recognition</span>
                    <Button variant="outline" size="sm">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Enhanced
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Call recording</span>
                    <Button variant="outline" size="sm">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Enabled
                    </Button>
                  </div>
                  <Button className="w-full">Update Settings</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}