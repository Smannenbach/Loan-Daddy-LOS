import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Workflow, 
  Plus, 
  Play, 
  Pause, 
  Edit, 
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  FileText,
  Users,
  Calendar,
  Zap,
  Settings,
  Filter,
  Copy,
  Activity
} from "lucide-react";

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay';
  name: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft';
  trigger: {
    type: 'application_created' | 'document_uploaded' | 'status_changed' | 'schedule';
    config: Record<string, any>;
  };
  steps: WorkflowStep[];
  executions: number;
  successRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const triggerTypes = [
  { value: 'application_created', label: 'New Application Created', icon: FileText },
  { value: 'document_uploaded', label: 'Document Uploaded', icon: FileText },
  { value: 'status_changed', label: 'Status Changed', icon: Activity },
  { value: 'schedule', label: 'Scheduled Time', icon: Clock },
  { value: 'contact_added', label: 'Contact Added', icon: Users },
  { value: 'email_received', label: 'Email Received', icon: Mail }
];

const actionTypes = [
  { value: 'send_email', label: 'Send Email', icon: Mail },
  { value: 'send_sms', label: 'Send SMS', icon: Phone },
  { value: 'create_task', label: 'Create Task', icon: CheckCircle2 },
  { value: 'update_status', label: 'Update Status', icon: Activity },
  { value: 'assign_user', label: 'Assign to User', icon: Users },
  { value: 'webhook', label: 'Send Webhook', icon: Zap },
  { value: 'ai_analysis', label: 'AI Analysis', icon: Zap }
];

export default function WorkflowAutomation() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Partial<Workflow>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch workflows
  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['/api/workflows'],
    queryFn: () => apiRequest('GET', '/api/workflows'),
  });

  // Fetch workflow executions
  const { data: executions = [] } = useQuery({
    queryKey: ['/api/workflow-executions'],
    queryFn: () => apiRequest('GET', '/api/workflow-executions'),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const createWorkflowMutation = useMutation({
    mutationFn: (workflow: Partial<Workflow>) => apiRequest('POST', '/api/workflows', workflow),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      setShowCreateDialog(false);
      setEditingWorkflow({});
      toast({
        title: "Workflow Created",
        description: "Your automation workflow has been created successfully.",
      });
    }
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: ({ id, ...workflow }: Partial<Workflow> & { id: string }) => 
      apiRequest('PUT', `/api/workflows/${id}`, workflow),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      toast({
        title: "Workflow Updated",
        description: "Workflow has been updated successfully.",
      });
    }
  });

  const toggleWorkflowMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'paused' }) =>
      apiRequest('PUT', `/api/workflows/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
    }
  });

  // Mock data for development
  const mockWorkflows: Workflow[] = [
    {
      id: '1',
      name: 'Welcome New Borrowers',
      description: 'Send welcome email and create initial tasks when new application is submitted',
      status: 'active',
      trigger: { type: 'application_created', config: {} },
      steps: [],
      executions: 127,
      successRate: 94.5,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20')
    },
    {
      id: '2',
      name: 'Document Follow-up',
      description: 'Automatically follow up on missing documents after 24 hours',
      status: 'active',
      trigger: { type: 'schedule', config: { interval: 'daily' } },
      steps: [],
      executions: 89,
      successRate: 87.2,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-18')
    },
    {
      id: '3',
      name: 'Approval Notifications',
      description: 'Notify all stakeholders when loan is approved',
      status: 'active',
      trigger: { type: 'status_changed', config: { status: 'approved' } },
      steps: [],
      executions: 45,
      successRate: 100,
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '4',
      name: 'AI Risk Assessment',
      description: 'Run AI analysis on new applications for risk scoring',
      status: 'paused',
      trigger: { type: 'application_created', config: {} },
      steps: [],
      executions: 23,
      successRate: 78.3,
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-16')
    }
  ];

  const mockExecutions = [
    { id: '1', workflowId: '1', status: 'completed', startTime: new Date(Date.now() - 300000), duration: 1200 },
    { id: '2', workflowId: '2', status: 'running', startTime: new Date(Date.now() - 60000), duration: null },
    { id: '3', workflowId: '1', status: 'completed', startTime: new Date(Date.now() - 900000), duration: 850 },
    { id: '4', workflowId: '3', status: 'failed', startTime: new Date(Date.now() - 1800000), duration: 300 }
  ];

  const workflowData = workflows.length > 0 ? workflows : mockWorkflows;
  const executionData = executions.length > 0 ? executions : mockExecutions;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getExecutionStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
                <Workflow className="w-8 h-8 text-purple-600" />
                Workflow Automation
              </h1>
              <p className="text-gray-600 mt-2">
                Automate repetitive tasks and streamline your loan processing workflow
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Active Workflows</p>
                  <p className="text-3xl font-bold">{workflowData.filter(w => w.status === 'active').length}</p>
                </div>
                <Workflow className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Executions</p>
                  <p className="text-3xl font-bold">{workflowData.reduce((sum, w) => sum + w.executions, 0)}</p>
                </div>
                <Activity className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Success Rate</p>
                  <p className="text-3xl font-bold">
                    {Math.round(workflowData.reduce((sum, w) => sum + w.successRate, 0) / workflowData.length)}%
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Time Saved</p>
                  <p className="text-3xl font-bold">124h</p>
                </div>
                <Clock className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="workflows" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="executions">Live Executions</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {workflowData.map((workflow) => (
                <Card key={workflow.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{workflow.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(workflow.status)}>
                          {workflow.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleWorkflowMutation.mutate({
                            id: workflow.id,
                            status: workflow.status === 'active' ? 'paused' : 'active'
                          })}
                        >
                          {workflow.status === 'active' ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <CardDescription>{workflow.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Activity className="w-4 h-4" />
                          {workflow.executions} runs
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          {workflow.successRate}% success
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="text-sm text-gray-600 mb-1">Trigger:</div>
                          <div className="text-sm font-medium">
                            {triggerTypes.find(t => t.value === workflow.trigger.type)?.label || workflow.trigger.type}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Live Executions Tab */}
          <TabsContent value="executions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Live Workflow Executions
                </CardTitle>
                <CardDescription>
                  Monitor real-time workflow execution status and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {executionData.map((execution: any) => {
                      const workflow = workflowData.find(w => w.id === execution.workflowId);
                      return (
                        <div key={execution.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className={getExecutionStatusColor(execution.status)}>
                                {execution.status}
                              </Badge>
                              <span className="font-medium">{workflow?.name}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {execution.status === 'running' ? (
                                <span className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  Running for {Math.floor((Date.now() - execution.startTime.getTime()) / 1000)}s
                                </span>
                              ) : (
                                <span>
                                  {execution.duration ? `${execution.duration}ms` : 'N/A'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            Started: {execution.startTime.toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-dashed border-2 hover:bg-gray-50 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-semibold mb-2">Email Sequences</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Automated email campaigns for borrower communication
                  </p>
                  <Button size="sm">Use Template</Button>
                </CardContent>
              </Card>

              <Card className="border-dashed border-2 hover:bg-gray-50 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-green-600" />
                  <h3 className="font-semibold mb-2">Document Workflows</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Automate document collection and review processes
                  </p>
                  <Button size="sm">Use Template</Button>
                </CardContent>
              </Card>

              <Card className="border-dashed border-2 hover:bg-gray-50 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="font-semibold mb-2">Approval Processes</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Streamline loan approval and notification workflows
                  </p>
                  <Button size="sm">Use Template</Button>
                </CardContent>
              </Card>

              <Card className="border-dashed border-2 hover:bg-gray-50 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Zap className="w-12 h-12 mx-auto mb-4 text-orange-600" />
                  <h3 className="font-semibold mb-2">AI Integration</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Leverage AI for automated analysis and scoring
                  </p>
                  <Button size="sm">Use Template</Button>
                </CardContent>
              </Card>

              <Card className="border-dashed border-2 hover:bg-gray-50 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-red-600" />
                  <h3 className="font-semibold mb-2">Team Coordination</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Coordinate tasks and assignments across team members
                  </p>
                  <Button size="sm">Use Template</Button>
                </CardContent>
              </Card>

              <Card className="border-dashed border-2 hover:bg-gray-50 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <h3 className="font-semibold mb-2">Custom Workflow</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Build a workflow from scratch with custom triggers
                  </p>
                  <Button size="sm">Create Custom</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Performance</CardTitle>
                  <CardDescription>Success rates and execution times</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <Activity className="w-16 h-16 opacity-50" />
                    <span className="ml-4">Performance charts will display here</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Time Savings</CardTitle>
                  <CardDescription>Automation impact and efficiency gains</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <Clock className="w-16 h-16 opacity-50" />
                    <span className="ml-4">Time savings charts will display here</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}