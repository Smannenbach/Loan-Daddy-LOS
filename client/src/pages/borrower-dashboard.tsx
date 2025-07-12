import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Home, FileText, Upload, DollarSign, Clock, CheckCircle, 
  AlertCircle, Plus, Eye, Download, MessageSquare, Phone,
  Mail, Calendar, TrendingUp, Building2, Calculator,
  User, LogOut, Bell, Settings
} from 'lucide-react';
import AIChatWidget from '@/components/borrower/ai-chat-widget';

interface LoanApplication {
  id: number;
  applicationNumber: string;
  loanType: string;
  loanAmount: number;
  status: string;
  statusDisplay: string;
  submittedDate: string;
  property?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  documents?: any[];
  tasks?: any[];
}

interface BorrowerProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export default function BorrowerDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null);
  
  const token = localStorage.getItem('borrowerToken');
  const borrowerData = JSON.parse(localStorage.getItem('borrowerData') || '{}');
  
  // Check authentication
  useEffect(() => {
    if (!token) {
      setLocation('/borrower-login');
    }
  }, [token, setLocation]);
  
  // Fetch loan applications
  const { data: applications = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/borrower/loan-applications'],
    queryFn: async () => {
      const response = await fetch('/api/borrower/loan-applications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      
      const data = await response.json();
      return data.applications || [];
    },
    enabled: !!token
  });
  
  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('borrowerToken');
    localStorage.removeItem('borrowerData');
    setLocation('/borrower-login');
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'application':
        return 'bg-blue-100 text-blue-800';
      case 'document_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'underwriting':
        return 'bg-purple-100 text-purple-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'funded':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get progress based on status
  const getProgress = (status: string) => {
    switch (status) {
      case 'application':
        return 20;
      case 'document_review':
        return 40;
      case 'underwriting':
        return 60;
      case 'approved':
        return 80;
      case 'funded':
        return 100;
      default:
        return 0;
    }
  };
  
  // Calculate dashboard stats
  const stats = {
    totalApplications: applications.length,
    activeApplications: applications.filter((app: LoanApplication) => 
      ['application', 'document_review', 'underwriting'].includes(app.status)
    ).length,
    approvedApplications: applications.filter((app: LoanApplication) => 
      ['approved', 'funded'].includes(app.status)
    ).length,
    totalLoanAmount: applications.reduce((sum: number, app: LoanApplication) => 
      sum + (app.loanAmount || 0), 0
    )
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">LoanGenius</h1>
                <p className="text-sm text-gray-600">Borrower Portal</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="text-sm font-medium">{borrowerData.firstName} {borrowerData.lastName}</p>
                  <p className="text-xs text-gray-600">{borrowerData.email}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {borrowerData.firstName}!
          </h2>
          <p className="text-gray-600">
            Track your loan applications and manage your documents all in one place.
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApplications}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeApplications}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedApplications}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalLoanAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Requested</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Tabs */}
        <Tabs defaultValue="applications" className="space-y-4">
          <TabsList>
            <TabsTrigger value="applications">My Applications</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="applications" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Loan Applications</h3>
              <Button onClick={() => setLocation('/borrower-application')}>
                <Plus className="h-4 w-4 mr-2" />
                New Application
              </Button>
            </div>
            
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading applications...</p>
                  </div>
                </CardContent>
              </Card>
            ) : applications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
                  <p className="text-gray-600 mb-4">Start your journey by creating your first loan application.</p>
                  <Button onClick={() => setLocation('/borrower-application')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Application
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {applications.map((app: LoanApplication) => (
                  <Card key={app.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold">{app.applicationNumber}</h4>
                            <Badge className={getStatusColor(app.status)}>
                              {app.statusDisplay}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Loan Type:</span> {app.loanType}
                            </div>
                            <div>
                              <span className="font-medium">Amount:</span> ${app.loanAmount?.toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">Submitted:</span> {new Date(app.submittedDate).toLocaleDateString()}
                            </div>
                          </div>
                          
                          {app.property && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Property:</span> {app.property.address}, {app.property.city}, {app.property.state} {app.property.zipCode}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedApplication(app)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-1" />
                            Upload
                          </Button>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{getProgress(app.status)}%</span>
                        </div>
                        <Progress value={getProgress(app.status)} className="h-2" />
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="flex gap-4 mt-4 pt-4 border-t">
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Calendar className="h-4 w-4 mr-1" />
                          Schedule
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Document Center</CardTitle>
                <CardDescription>Upload and manage your loan documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Upload documents for your applications</p>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Documents
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
                <CardDescription>Communication with your loan officer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No messages yet</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>First Name</Label>
                      <Input value={borrowerData.firstName} readOnly />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input value={borrowerData.lastName} readOnly />
                    </div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={borrowerData.email} readOnly />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={borrowerData.phone || ''} placeholder="Add phone number" />
                  </div>
                  <Button>Update Profile</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Application Details Dialog */}
      {selectedApplication && (
        <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedApplication.applicationNumber}</DialogTitle>
              <DialogDescription>
                Application details and current status
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(selectedApplication.status)}>
                  {selectedApplication.statusDisplay}
                </Badge>
                <span className="text-sm text-gray-600">
                  Submitted: {new Date(selectedApplication.submittedDate).toLocaleDateString()}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Loan Type</Label>
                  <p className="font-medium">{selectedApplication.loanType}</p>
                </div>
                <div>
                  <Label>Loan Amount</Label>
                  <p className="font-medium">${selectedApplication.loanAmount?.toLocaleString()}</p>
                </div>
              </div>
              
              {selectedApplication.property && (
                <div>
                  <Label>Property Address</Label>
                  <p className="font-medium">
                    {selectedApplication.property.address}<br />
                    {selectedApplication.property.city}, {selectedApplication.property.state} {selectedApplication.property.zipCode}
                  </p>
                </div>
              )}
              
              <div>
                <Label>Progress</Label>
                <Progress value={getProgress(selectedApplication.status)} className="h-2 mt-2" />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedApplication(null)}>
                  Close
                </Button>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documents
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* AI Chat Widget */}
      <AIChatWidget 
        borrowerId={borrowerData.id} 
        loanApplicationId={selectedApplication?.id}
        onActionClick={(action) => {
          // Handle AI assistant actions
          if (action.type === 'create_task') {
            toast({
              title: 'Task Created',
              description: action.description
            });
          } else if (action.type === 'schedule_call') {
            toast({
              title: 'Call Scheduled',
              description: action.description
            });
          }
        }}
      />
    </div>
  );
}