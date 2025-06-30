import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  FileText,
  Eye,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Building,
  Scale,
  Lock,
  AlertCircle,
  BookOpen,
  Settings
} from "lucide-react";

interface ComplianceItem {
  id: string;
  title: string;
  category: 'lending' | 'privacy' | 'disclosure' | 'reporting' | 'audit';
  status: 'compliant' | 'warning' | 'violation' | 'pending';
  description: string;
  dueDate?: Date;
  lastUpdated: Date;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requirements: string[];
  evidence: string[];
}

interface AuditTrail {
  id: string;
  action: string;
  user: string;
  timestamp: Date;
  details: string;
  entityType: 'application' | 'document' | 'user' | 'system';
  entityId: string;
}

const complianceCategories = [
  { 
    value: 'lending', 
    label: 'Lending Regulations', 
    icon: Scale, 
    count: 12,
    description: 'TRID, QM, ATR compliance' 
  },
  { 
    value: 'privacy', 
    label: 'Privacy Protection', 
    icon: Lock, 
    count: 8,
    description: 'GLBA, data protection compliance' 
  },
  { 
    value: 'disclosure', 
    label: 'Required Disclosures', 
    icon: FileText, 
    count: 15,
    description: 'Truth in lending, fair lending' 
  },
  { 
    value: 'reporting', 
    label: 'Regulatory Reporting', 
    icon: TrendingUp, 
    count: 6,
    description: 'HMDA, CRA, regulatory filings' 
  },
  { 
    value: 'audit', 
    label: 'Audit & Documentation', 
    icon: BookOpen, 
    count: 9,
    description: 'Record keeping, audit trails' 
  }
];

export default function ComplianceCenter() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  // Fetch compliance data
  const { data: complianceItems = [], isLoading } = useQuery({
    queryKey: ['/api/compliance', selectedCategory],
    queryFn: () => apiRequest('GET', `/api/compliance?category=${selectedCategory}`),
  });

  // Fetch audit trail
  const { data: auditTrail = [] } = useQuery({
    queryKey: ['/api/audit-trail', selectedTimeframe],
    queryFn: () => apiRequest('GET', `/api/audit-trail?timeframe=${selectedTimeframe}`),
  });

  // Fetch compliance metrics
  const { data: metrics } = useQuery({
    queryKey: ['/api/compliance/metrics'],
    queryFn: () => apiRequest('GET', '/api/compliance/metrics'),
  });

  // Mock data for development
  const mockComplianceItems: ComplianceItem[] = [
    {
      id: '1',
      title: 'TRID Disclosure Timing',
      category: 'lending',
      status: 'compliant',
      description: 'Loan estimate delivered within 3 business days',
      dueDate: new Date('2024-02-15'),
      lastUpdated: new Date('2024-01-20'),
      assignedTo: 'Sarah Johnson',
      priority: 'high',
      requirements: ['3-day delivery rule', 'Proper format', 'Accurate calculations'],
      evidence: ['Delivery receipts', 'Email confirmations', 'Audit logs']
    },
    {
      id: '2',
      title: 'Ability to Repay Verification',
      category: 'lending',
      status: 'warning',
      description: 'ATR documentation incomplete for recent applications',
      lastUpdated: new Date('2024-01-22'),
      assignedTo: 'Mike Chen',
      priority: 'critical',
      requirements: ['Income verification', 'Debt-to-income calculation', 'Employment verification'],
      evidence: ['Income docs pending', 'DTI calculations', 'Employment letters']
    },
    {
      id: '3',
      title: 'GLBA Privacy Notices',
      category: 'privacy',
      status: 'compliant',
      description: 'Annual privacy notices sent to all customers',
      lastUpdated: new Date('2024-01-18'),
      assignedTo: 'Lisa Rodriguez',
      priority: 'medium',
      requirements: ['Annual delivery', 'Proper content', 'Opt-out procedures'],
      evidence: ['Mailing records', 'Email delivery', 'Opt-out tracking']
    },
    {
      id: '4',
      title: 'HMDA Data Collection',
      category: 'reporting',
      status: 'pending',
      description: 'Q4 2023 HMDA data compilation in progress',
      dueDate: new Date('2024-03-01'),
      lastUpdated: new Date('2024-01-25'),
      assignedTo: 'John Smith',
      priority: 'high',
      requirements: ['Complete loan data', 'Geocoding verification', 'Data validation'],
      evidence: ['Loan registers', 'System reports', 'Validation checks']
    }
  ];

  const mockAuditTrail: AuditTrail[] = [
    {
      id: '1',
      action: 'Document Access',
      user: 'Sarah Johnson',
      timestamp: new Date(Date.now() - 300000),
      details: 'Accessed bank statement for APP-001',
      entityType: 'document',
      entityId: 'DOC-123'
    },
    {
      id: '2',
      action: 'Status Change',
      user: 'Mike Chen',
      timestamp: new Date(Date.now() - 600000),
      details: 'Changed application status from "Review" to "Approved"',
      entityType: 'application',
      entityId: 'APP-002'
    },
    {
      id: '3',
      action: 'Data Export',
      user: 'System Admin',
      timestamp: new Date(Date.now() - 900000),
      details: 'Exported HMDA data for Q4 2023',
      entityType: 'system',
      entityId: 'EXPORT-001'
    }
  ];

  const mockMetrics = {
    overallScore: 87,
    complianceRate: 94.2,
    pendingItems: 8,
    criticalIssues: 2,
    auditReadiness: 91,
    lastAudit: new Date('2023-10-15'),
    nextAudit: new Date('2024-04-15')
  };

  const data = complianceItems.length > 0 ? complianceItems : mockComplianceItems;
  const auditData = auditTrail.length > 0 ? auditTrail : mockAuditTrail;
  const metricsData = metrics || mockMetrics;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'violation': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return CheckCircle2;
      case 'warning': return AlertTriangle;
      case 'violation': return AlertCircle;
      case 'pending': return Clock;
      default: return Clock;
    }
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
                <Shield className="w-8 h-8 text-green-600" />
                Compliance Center
              </h1>
              <p className="text-gray-600 mt-2">
                Comprehensive regulatory compliance monitoring and audit management
              </p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button>
                <Eye className="w-4 h-4 mr-2" />
                Run Audit
              </Button>
            </div>
          </div>
        </div>

        {/* Compliance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Compliance Score</p>
                  <p className="text-3xl font-bold">{metricsData.overallScore}</p>
                </div>
                <Shield className="w-8 h-8 text-green-200" />
              </div>
              <Progress value={metricsData.overallScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Compliance Rate</p>
                  <p className="text-3xl font-bold">{metricsData.complianceRate}%</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Pending Items</p>
                  <p className="text-3xl font-bold">{metricsData.pendingItems}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Critical Issues</p>
                  <p className="text-3xl font-bold">{metricsData.criticalIssues}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="items">Compliance Items</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    Compliance Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {complianceCategories.map((category) => {
                      const IconComponent = category.icon;
                      return (
                        <div key={category.value} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <IconComponent className="w-5 h-5 text-blue-600" />
                            <div>
                              <div className="font-medium">{category.label}</div>
                              <div className="text-sm text-gray-600">{category.description}</div>
                            </div>
                          </div>
                          <Badge variant="secondary">{category.count} items</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Upcoming Deadlines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.filter((item: ComplianceItem) => item.dueDate).map((item: ComplianceItem) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-sm text-gray-600">
                            Due: {item.dueDate?.toLocaleDateString()}
                          </div>
                        </div>
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Audit Readiness</CardTitle>
                <CardDescription>
                  Last audit: {metricsData.lastAudit.toLocaleDateString()} • 
                  Next audit: {metricsData.nextAudit.toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Documentation Complete</span>
                    <span className="text-sm text-gray-600">95%</span>
                  </div>
                  <Progress value={95} className="w-full" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Policy Compliance</span>
                    <span className="text-sm text-gray-600">{metricsData.auditReadiness}%</span>
                  </div>
                  <Progress value={metricsData.auditReadiness} className="w-full" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Training Current</span>
                    <span className="text-sm text-gray-600">88%</span>
                  </div>
                  <Progress value={88} className="w-full" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Items Tab */}
          <TabsContent value="items" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {data.map((item: ComplianceItem) => {
                const StatusIcon = getStatusIcon(item.status);
                return (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(item.status)}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span>Priority:</span>
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-600">
                        <div>Assigned to: {item.assignedTo}</div>
                        <div>Updated: {item.lastUpdated.toLocaleDateString()}</div>
                        {item.dueDate && (
                          <div>Due: {item.dueDate.toLocaleDateString()}</div>
                        )}
                      </div>

                      <div>
                        <div className="text-sm font-medium mb-2">Requirements:</div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {item.requirements.slice(0, 2).map((req, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3 text-green-600" />
                              {req}
                            </div>
                          ))}
                          {item.requirements.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{item.requirements.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                        <Button size="sm" variant="outline">
                          <FileText className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Audit Trail Tab */}
          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  System Audit Trail
                </CardTitle>
                <CardDescription>
                  Complete log of all system activities and compliance-related actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {auditData.map((entry: AuditTrail) => (
                      <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{entry.entityType}</Badge>
                            <span className="font-medium">{entry.action}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {entry.timestamp.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>User: {entry.user}</div>
                          <div>Details: {entry.details}</div>
                          <div>Entity ID: {entry.entityId}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-dashed border-2 hover:bg-gray-50 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-green-600" />
                  <h3 className="font-semibold mb-2">Compliance Summary</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Comprehensive compliance status across all categories
                  </p>
                  <Button size="sm">Generate Report</Button>
                </CardContent>
              </Card>

              <Card className="border-dashed border-2 hover:bg-gray-50 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-semibold mb-2">Audit Trail Report</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Detailed audit trail for regulatory examination
                  </p>
                  <Button size="sm">Generate Report</Button>
                </CardContent>
              </Card>

              <Card className="border-dashed border-2 hover:bg-gray-50 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="font-semibold mb-2">Regulatory Filings</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    HMDA, CRA, and other required regulatory reports
                  </p>
                  <Button size="sm">Generate Report</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Compliance Settings
                </CardTitle>
                <CardDescription>
                  Configure compliance monitoring and notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3">Notification Settings</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Critical compliance alerts</span>
                        <Button variant="outline" size="sm">Enabled</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Weekly compliance summary</span>
                        <Button variant="outline" size="sm">Enabled</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Audit deadline reminders</span>
                        <Button variant="outline" size="sm">Enabled</Button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Monitoring Frequency</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Automated compliance checks</span>
                        <Badge variant="secondary">Daily</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Audit trail backup</span>
                        <Badge variant="secondary">Weekly</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}