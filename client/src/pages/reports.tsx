import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar, 
  FileText, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock, 
  Download,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Pie
} from "recharts";
import { addDays, format, startOfMonth, endOfMonth } from "date-fns";

interface AnalyticsData {
  overview: {
    totalApplications: number;
    approvalRate: number;
    averageAmount: number;
    portfolioValue: number;
    avgProcessingTime: number;
    conversionRate: number;
    activeLeads: number;
    monthlyGrowth: number;
  };
  trends: {
    applications: Array<{ date: string; count: number; approved: number; denied: number }>;
    volume: Array<{ date: string; amount: number }>;
    sources: Array<{ source: string; count: number; percentage: number }>;
  };
  performance: {
    loanTypes: Array<{ type: string; count: number; amount: number; avgTime: number }>;
    officers: Array<{ name: string; applications: number; approvals: number; revenue: number }>;
    pipeline: Array<{ stage: string; count: number; amount: number }>;
  };
  geographic: {
    states: Array<{ state: string; count: number; amount: number }>;
    cities: Array<{ city: string; state: string; count: number }>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date()
  });
  const [reportType, setReportType] = useState("overview");
  const [exportFormat, setExportFormat] = useState("pdf");

  const { data: analytics, isLoading, refetch } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics', selectedPeriod, dateRange],
    enabled: true,
  });

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const days = parseInt(period);
    setDateRange({
      from: addDays(new Date(), -days),
      to: new Date()
    });
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/analytics/export?format=${exportFormat}&period=${selectedPeriod}`, {
        method: 'GET',
        headers: {
          'Accept': exportFormat === 'pdf' ? 'application/pdf' : 'text/csv'
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `loan-analytics-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const overviewMetrics = [
    { 
      title: "Total Applications", 
      value: analytics?.overview.totalApplications?.toLocaleString() || "0", 
      change: `+${analytics?.overview.monthlyGrowth || 0}%`, 
      icon: FileText,
      trend: "up"
    },
    { 
      title: "Approval Rate", 
      value: `${analytics?.overview.approvalRate || 0}%`, 
      change: "+5%", 
      icon: TrendingUp,
      trend: "up"
    },
    { 
      title: "Active Leads", 
      value: analytics?.overview.activeLeads?.toLocaleString() || "0", 
      change: "+8%", 
      icon: Users,
      trend: "up"
    },
    { 
      title: "Portfolio Value", 
      value: `$${(analytics?.overview.portfolioValue || 0).toLocaleString()}`, 
      change: "+15%", 
      icon: DollarSign,
      trend: "up"
    },
    { 
      title: "Avg Processing Time", 
      value: `${analytics?.overview.avgProcessingTime || 0} days`, 
      change: "-2 days", 
      icon: Clock,
      trend: "down"
    },
    { 
      title: "Conversion Rate", 
      value: `${analytics?.overview.conversionRate || 0}%`, 
      change: "+3%", 
      icon: Target,
      trend: "up"
    },
  ];

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Advanced Analytics Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant={selectedPeriod === "7" ? "default" : "outline"}
            size="sm"
            onClick={() => handlePeriodChange("7")}
          >
            7 days
          </Button>
          <Button
            variant={selectedPeriod === "30" ? "default" : "outline"}
            size="sm"
            onClick={() => handlePeriodChange("30")}
          >
            30 days
          </Button>
          <Button
            variant={selectedPeriod === "90" ? "default" : "outline"}
            size="sm"
            onClick={() => handlePeriodChange("90")}
          >
            90 days
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => refetch()} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {overviewMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">
                  <Badge 
                    variant={metric.trend === 'up' ? 'default' : metric.trend === 'down' ? 'secondary' : 'outline'} 
                    className="text-xs"
                  >
                    {metric.change}
                  </Badge>
                  {' '}from last period
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends & Volume</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Application Volume Trends</CardTitle>
                <CardDescription>Daily application submissions over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics?.trends.applications || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="count" stackId="1" stroke="#8884d8" fill="#8884d8" name="Total" />
                    <Area type="monotone" dataKey="approved" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Approved" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Lead Sources</CardTitle>
                <CardDescription>Distribution of application sources</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={analytics?.trends.sources || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percentage}) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(analytics?.trends.sources || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Loan Volume by Amount</CardTitle>
              <CardDescription>Monthly loan amounts processed</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.trends.volume || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Loan Type Performance</CardTitle>
                <CardDescription>Performance metrics by loan product</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {(analytics?.performance.loanTypes || []).map((type, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{type.type}</div>
                          <div className="text-sm text-muted-foreground">
                            {type.count} applications • ${type.amount.toLocaleString()} total
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{type.avgTime} days</div>
                          <div className="text-sm text-muted-foreground">avg time</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Loan Officer Performance</CardTitle>
                <CardDescription>Individual performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {(analytics?.performance.officers || []).map((officer, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{officer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {officer.applications} apps • {officer.approvals} approvals
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${officer.revenue.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">revenue</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pipeline Analysis</CardTitle>
              <CardDescription>Applications by processing stage</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.performance.pipeline || []} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance by State</CardTitle>
                <CardDescription>Loan activity across states</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {(analytics?.geographic.states || []).map((state, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{state.state}</div>
                          <div className="text-sm text-muted-foreground">{state.count} applications</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${state.amount.toLocaleString()}</div>
                          <Progress value={(state.count / 100) * 100} className="w-16 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Cities</CardTitle>
                <CardDescription>Highest performing metropolitan areas</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {(analytics?.geographic.cities || []).map((city, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{city.city}</div>
                          <div className="text-sm text-muted-foreground">{city.state}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{city.count}</div>
                          <div className="text-sm text-muted-foreground">applications</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel Analysis</CardTitle>
              <CardDescription>Track leads through the entire loan process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { stage: 'Leads Generated', count: 1000, rate: 100 },
                  { stage: 'Applications Started', count: 750, rate: 75 },
                  { stage: 'Applications Completed', count: 600, rate: 60 },
                  { stage: 'Documents Submitted', count: 450, rate: 45 },
                  { stage: 'Underwriting Review', count: 400, rate: 40 },
                  { stage: 'Approved', count: 320, rate: 32 },
                  { stage: 'Funded', count: 300, rate: 30 }
                ].map((stage, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-32 text-sm font-medium">{stage.stage}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">{stage.count} applications</span>
                        <span className="text-sm font-medium">{stage.rate}%</span>
                      </div>
                      <Progress value={stage.rate} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
