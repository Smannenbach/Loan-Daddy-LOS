import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, FileText, DollarSign, TrendingUp, Clock, CheckCircle,
  AlertCircle, Phone, Mail, MessageSquare, Calendar, Search,
  Filter, Download, Upload, Eye, Edit, Trash2, Plus,
  Home, Calculator, Building2, PieChart, BarChart3, Bot
} from 'lucide-react';
import { motion } from 'framer-motion';

interface LoanApplication {
  id: number;
  borrower: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    creditScore?: number;
  };
  property: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    propertyType: string;
    estimatedValue: number;
  };
  loanType: string;
  loanAmount: number;
  status: string;
  submittedDate: string;
  updatedAt: string;
  assignedTo?: {
    id: number;
    name: string;
  };
  tasks: Array<{
    id: number;
    title: string;
    status: string;
    dueDate: string;
  }>;
  documents: Array<{
    id: number;
    fileName: string;
    uploadedAt: string;
  }>;
}

export default function LoanOfficerDashboard() {
  const { toast } = useToast();
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  
  // Fetch dashboard stats
  const { data: dashboardStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });
  
  // Fetch loan applications
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['/api/loan-applications'],
    refetchInterval: 10000 // Refresh every 10 seconds
  });
  
  // Update application status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/loan-applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/loan-applications'] });
      toast({
        title: 'Status Updated',
        description: 'Application status has been updated successfully.'
      });
    }
  });
  
  // Filter applications
  const filteredApplications = applications.filter((app: LoanApplication) => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      `${app.borrower.firstName} ${app.borrower.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.property.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });
  
  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      application: 'bg-blue-100 text-blue-800',
      document_review: 'bg-yellow-100 text-yellow-800',
      underwriting: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      funded: 'bg-emerald-100 text-emerald-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  
  // Stats cards data
  const stats = [
    {
      title: 'Active Pipeline',
      value: dashboardStats?.activeApplications || 0,
      change: '+12%',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      title: 'This Month',
      value: dashboardStats?.approvedThisMonth || 0,
      change: '+23%',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Total Volume',
      value: `$${dashboardStats?.totalFunded || '0'}`,
      change: '+18%',
      icon: DollarSign,
      color: 'text-purple-600'
    },
    {
      title: 'Avg. Close Time',
      value: '21 days',
      change: '-15%',
      icon: Clock,
      color: 'text-orange-600'
    }
  ];
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Loan Officer Dashboard</h1>
          <p className="text-gray-600">Manage your pipeline and track loan applications</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                    {stat.change}
                  </span> from last month
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Main Content Tabs */}
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="borrowers">Borrowers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pipeline" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by borrower name or property..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Applications</SelectItem>
                    <SelectItem value="application">New Applications</SelectItem>
                    <SelectItem value="document_review">Document Review</SelectItem>
                    <SelectItem value="underwriting">Underwriting</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="funded">Funded</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Applications Table */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Applications</CardTitle>
              <CardDescription>
                {filteredApplications.length} applications found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Borrower</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Loan Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </TableCell>
                      </TableRow>
                    ) : filteredApplications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No applications found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredApplications.map((app: LoanApplication) => (
                        <TableRow key={app.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>
                                  {app.borrower.firstName[0]}{app.borrower.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {app.borrower.firstName} {app.borrower.lastName}
                                </p>
                                <p className="text-sm text-gray-500">{app.borrower.email}</p>
                                {app.borrower.creditScore && (
                                  <Badge variant="outline" className="mt-1">
                                    FICO: {app.borrower.creditScore}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{app.property.address}</p>
                              <p className="text-sm text-gray-500">
                                {app.property.city}, {app.property.state} {app.property.zipCode}
                              </p>
                              <p className="text-sm text-gray-500">
                                {app.property.propertyType} • ${app.property.estimatedValue.toLocaleString()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{app.loanType}</p>
                              <p className="text-sm text-gray-500">
                                ${app.loanAmount.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-400">
                                Submitted: {new Date(app.submittedDate).toLocaleDateString()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(app.status)}>
                              {app.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="w-32">
                              <Progress 
                                value={
                                  app.status === 'application' ? 20 :
                                  app.status === 'document_review' ? 40 :
                                  app.status === 'underwriting' ? 60 :
                                  app.status === 'approved' ? 80 :
                                  app.status === 'funded' ? 100 : 0
                                } 
                                className="h-2"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {app.tasks.filter(t => t.status === 'completed').length}/{app.tasks.length} tasks
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedApplication(app)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Mail className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Task Management</CardTitle>
              <CardDescription>Manage and track your daily tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={() => setShowNewTaskDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
                <div className="text-center py-12 text-gray-500">
                  Task management interface coming soon...
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="borrowers">
          <Card>
            <CardHeader>
              <CardTitle>Borrower Management</CardTitle>
              <CardDescription>View and manage all borrowers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                Borrower management interface coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <BarChart3 className="h-12 w-12" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Loan Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <PieChart className="h-12 w-12" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="ai-insights">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Insights</CardTitle>
              <CardDescription>Intelligent recommendations to optimize your pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Bot className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">High Priority Alert</p>
                    <p className="text-sm text-gray-600">
                      3 applications have been in document review for over 5 days. Consider following up with borrowers.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Bot className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Approval Prediction</p>
                    <p className="text-sm text-gray-600">
                      Based on historical data, application LA-1234 has a 85% chance of approval. Consider fast-tracking.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Bot className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Market Opportunity</p>
                    <p className="text-sm text-gray-600">
                      Interest rates are projected to increase next month. Recommend expediting closings for rate-sensitive borrowers.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Application Details Dialog */}
      {selectedApplication && (
        <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Application Details - {selectedApplication.borrower.firstName} {selectedApplication.borrower.lastName}
              </DialogTitle>
              <DialogDescription>
                Application ID: LA-{selectedApplication.id}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="flex space-x-3">
                <Button>
                  <Phone className="h-4 w-4 mr-2" />
                  Call Borrower
                </Button>
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send SMS
                </Button>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
              </div>
              
              {/* Status Update */}
              <div className="space-y-2">
                <Label>Application Status</Label>
                <Select
                  value={selectedApplication.status}
                  onValueChange={(value) => {
                    updateStatusMutation.mutate({
                      id: selectedApplication.id,
                      status: value
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="application">New Application</SelectItem>
                    <SelectItem value="document_review">Document Review</SelectItem>
                    <SelectItem value="underwriting">Underwriting</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="funded">Funded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Borrower Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span>{selectedApplication.borrower.firstName} {selectedApplication.borrower.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span>{selectedApplication.borrower.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span>{selectedApplication.borrower.phone}</span>
                    </div>
                    {selectedApplication.borrower.creditScore && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Credit Score:</span>
                        <span>{selectedApplication.borrower.creditScore}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Property Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Address:</span>
                      <span>{selectedApplication.property.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span>{selectedApplication.property.city}, {selectedApplication.property.state}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span>{selectedApplication.property.propertyType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Est. Value:</span>
                      <span>${selectedApplication.property.estimatedValue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tasks */}
              <div>
                <h3 className="font-semibold mb-3">Tasks ({selectedApplication.tasks.length})</h3>
                <div className="space-y-2">
                  {selectedApplication.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" checked={task.status === 'completed'} />
                        <span className={task.status === 'completed' ? 'line-through text-gray-500' : ''}>
                          {task.title}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Documents */}
              <div>
                <h3 className="font-semibold mb-3">Documents ({selectedApplication.documents.length})</h3>
                <div className="space-y-2">
                  {selectedApplication.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span>{doc.fileName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Notes */}
              <div>
                <Label>Internal Notes</Label>
                <Textarea
                  placeholder="Add notes about this application..."
                  className="mt-2"
                  rows={4}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}