import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  CreditCard, 
  FileText, 
  Upload, 
  User, 
  LogOut, 
  Plus, 
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Home,
  CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomerAuth, useCustomerLogout, useCustomerLoanApplications } from '@/hooks/useCustomerAuth';

export default function CustomerDashboard() {
  const [, navigate] = useLocation();
  const { customer, isLoading: authLoading } = useCustomerAuth();
  const { applications, isLoading: appsLoading } = useCustomerLoanApplications();
  const logoutMutation = useCustomerLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate('/customer/login');
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!customer?.customer) {
    navigate('/customer/login');
    return null;
  }

  const user = customer.customer;

  // Sample data for demonstration
  const sampleApplications = [
    {
      id: 1,
      applicationNumber: 'LA-2025-001',
      loanType: 'DSCR',
      requestedAmount: 750000,
      status: 'under_review',
      propertyAddress: '123 Main St, Dallas, TX 75201',
      createdAt: new Date('2025-01-08'),
      submittedAt: new Date('2025-01-08'),
    },
    {
      id: 2,
      applicationNumber: 'LA-2025-002',
      loanType: 'Fix-and-Flip',
      requestedAmount: 350000,
      status: 'draft',
      propertyAddress: '456 Oak Ave, Houston, TX 77001',
      createdAt: new Date('2025-01-07'),
      submittedAt: null,
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'submitted': return <Clock className="w-4 h-4" />;
      case 'under_review': return <AlertCircle className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'declined': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">LoanDaddy</h1>
                <p className="text-sm text-gray-600">Commercial Loan Portal</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              
              <div className="flex sm:hidden items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="text-xs sm:text-sm"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user.firstName}!
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your loan applications and track your progress
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{sampleApplications.length}</p>
                </div>
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Active Applications</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {sampleApplications.filter(app => app.status !== 'declined').length}
                  </p>
                </div>
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 md:col-span-1">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Requested</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    ${sampleApplications.reduce((sum, app) => sum + app.requestedAmount, 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {sampleApplications.filter(app => app.status === 'approved').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Loan Applications</h3>
              <Button
                onClick={() => navigate('/customer/loan-application')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Application
              </Button>
            </div>

            {sampleApplications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                  <p className="text-gray-600 mb-6">Get started by creating your first loan application</p>
                  <Button
                    onClick={() => navigate('/customer/loan-application')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Application
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {sampleApplications.map((application) => (
                  <Card key={application.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">
                            {application.applicationNumber}
                          </h4>
                          <p className="text-sm text-gray-600">{application.loanType} Loan</p>
                        </div>
                        <Badge className={getStatusColor(application.status)}>
                          {getStatusIcon(application.status)}
                          <span className="ml-1 capitalize">{application.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Requested Amount</p>
                          <p className="text-lg font-semibold text-gray-900">
                            ${application.requestedAmount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Property</p>
                          <p className="text-sm text-gray-900">{application.propertyAddress}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Created</p>
                          <p className="text-sm text-gray-900">
                            {application.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <CalendarDays className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {application.submittedAt ? 
                                `Submitted ${application.submittedAt.toLocaleDateString()}` : 
                                'Draft'
                              }
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/customer/loan-application/${application.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/customer/documents?applicationId=${application.id}`)}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Documents
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
              <Button
                onClick={() => navigate('/customer/documents')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Documents
              </Button>
            </div>

            <Card>
              <CardContent className="p-12 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Document Management</h3>
                <p className="text-gray-600 mb-6">
                  Upload and manage all your loan application documents in one place
                </p>
                <Button
                  onClick={() => navigate('/customer/documents')}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Manage Documents
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Profile Settings</h3>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Manage your account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">First Name</label>
                    <p className="text-sm text-gray-900">{user.firstName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Name</label>
                    <p className="text-sm text-gray-900">{user.lastName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-sm text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-sm text-gray-900">{user.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline">
                    <User className="w-4 h-4 mr-2" />
                    Edit Profile
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