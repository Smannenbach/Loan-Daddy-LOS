import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  DollarSign,
  Clock,
  Target,
  FileText,
  Phone,
  Mail,
  Calendar,
  Activity,
  Zap,
  Award,
  AlertCircle
} from "lucide-react";

export default function AnalyticsDashboard() {
  const [timeframe, setTimeframe] = useState('30d');
  const [metricType, setMetricType] = useState('overview');

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/analytics', timeframe, metricType],
    queryFn: () => apiRequest('GET', `/api/analytics?timeframe=${timeframe}&type=${metricType}`),
  });

  const { data: realTimeStats } = useQuery({
    queryKey: ['/api/analytics/realtime'],
    queryFn: () => apiRequest('GET', '/api/analytics/realtime'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const mockAnalytics = {
    overview: {
      totalLoans: 1247,
      totalVolume: 145600000,
      avgLoanSize: 116812,
      conversionRate: 18.4,
      avgProcessingTime: 12.5,
      customerSatisfaction: 94.2
    },
    trends: {
      loansByMonth: [
        { month: 'Jan', loans: 89, volume: 10200000 },
        { month: 'Feb', loans: 102, volume: 11800000 },
        { month: 'Mar', loans: 118, volume: 13200000 },
        { month: 'Apr', loans: 134, volume: 15600000 },
        { month: 'May', loans: 156, volume: 18200000 },
        { month: 'Jun', loans: 171, volume: 20100000 }
      ],
      conversionFunnel: [
        { stage: 'Leads', count: 2847, conversion: 100 },
        { stage: 'Applications', count: 1423, conversion: 50 },
        { stage: 'Pre-Approved', count: 967, conversion: 68 },
        { stage: 'Underwriting', count: 734, conversion: 76 },
        { stage: 'Approved', count: 542, conversion: 74 },
        { stage: 'Funded', count: 489, conversion: 90 }
      ]
    },
    performance: {
      teamStats: [
        { name: 'Sarah Johnson', loans: 47, volume: 5200000, conversion: 22.1 },
        { name: 'Mike Chen', loans: 39, volume: 4100000, conversion: 19.8 },
        { name: 'Lisa Rodriguez', loans: 34, volume: 3800000, conversion: 18.9 },
        { name: 'John Smith', loans: 31, volume: 3200000, conversion: 17.2 }
      ],
      loanTypes: [
        { type: 'DSCR', count: 156, percentage: 32 },
        { type: 'Fix & Flip', count: 134, percentage: 28 },
        { type: 'Bridge', count: 98, percentage: 20 },
        { type: 'Commercial', count: 67, percentage: 14 },
        { type: 'Other', count: 32, percentage: 6 }
      ]
    }
  };

  const data = analytics || mockAnalytics;
  const stats = realTimeStats || {
    activeUsers: 23,
    activeSessions: 8,
    currentApplications: 12,
    systemLoad: 67
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Comprehensive business intelligence and performance metrics
              </p>
            </div>
            <div className="flex gap-4">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Real-time Status Bar */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Active Users</p>
                  <p className="text-2xl font-bold">{stats.activeUsers}</p>
                </div>
                <Users className="w-6 h-6 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Active Sessions</p>
                  <p className="text-2xl font-bold">{stats.activeSessions}</p>
                </div>
                <Activity className="w-6 h-6 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Current Apps</p>
                  <p className="text-2xl font-bold">{stats.currentApplications}</p>
                </div>
                <FileText className="w-6 h-6 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">System Load</p>
                  <p className="text-2xl font-bold">{stats.systemLoad}%</p>
                </div>
                <Zap className="w-6 h-6 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Total Loans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{data.overview.totalLoans.toLocaleString()}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">+12% vs last period</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Total Volume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    ${(data.overview.totalVolume / 1000000).toFixed(1)}M
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">+18% vs last period</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Avg Loan Size
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    ${data.overview.avgLoanSize.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">+5% vs last period</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Conversion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{data.overview.conversionRate}%</div>
                  <div className="flex items-center gap-2 mt-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">+2.1% vs last period</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Avg Processing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{data.overview.avgProcessingTime} days</div>
                  <div className="flex items-center gap-2 mt-2">
                    <TrendingDown className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">-1.2 days improvement</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Customer Satisfaction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{data.overview.customerSatisfaction}%</div>
                  <div className="flex items-center gap-2 mt-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">+0.8% vs last period</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Performance</CardTitle>
                  <CardDescription>Individual loan officer statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.performance.teamStats.map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-gray-600">
                            {member.loans} loans • ${(member.volume / 1000000).toFixed(1)}M
                          </div>
                        </div>
                        <Badge variant={member.conversion >= 20 ? "default" : "secondary"}>
                          {member.conversion}% conversion
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Loan Type Distribution</CardTitle>
                  <CardDescription>Breakdown by loan product</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.performance.loanTypes.map((type, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{type.type}</span>
                          <span>{type.count} loans ({type.percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${type.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Loan Volume</CardTitle>
                  <CardDescription>Loans and volume trends over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <BarChart3 className="w-16 h-16 opacity-50" />
                    <span className="ml-4">Interactive charts will display here</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                  <CardDescription>Lead to funded loan conversion</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.trends.conversionFunnel.map((stage, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{stage.stage}</span>
                          <span>{stage.count.toLocaleString()} ({stage.conversion}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full" 
                            style={{ width: `${stage.conversion}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Reports</CardTitle>
                <CardDescription>Export detailed analytics and performance data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                    <FileText className="w-6 h-6" />
                    Loan Performance Report
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                    <Users className="w-6 h-6" />
                    Team Performance Report
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    Monthly Trends Report
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                    <DollarSign className="w-6 h-6" />
                    Revenue Analysis Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}