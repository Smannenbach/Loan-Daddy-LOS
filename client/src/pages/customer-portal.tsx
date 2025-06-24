import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  CreditCard,
  Building,
  User,
  Mail,
  Phone
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FullApplicationModal from "@/components/forms/full-application-modal";
import DataCompletenessIndicator from "@/components/ui/data-completeness-indicator";
import { documentPreFill } from "@/lib/document-prefill";

interface CustomerPortalProps {
  token: string;
}

export default function CustomerPortal({ token }: CustomerPortalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showFullApplication, setShowFullApplication] = useState(false);

  const { data: applicationData, isLoading } = useQuery({
    queryKey: ['/api/customer-portal/application', token],
    queryFn: async () => {
      const response = await fetch(`/api/customer-portal/application?token=${token}`);
      if (!response.ok) throw new Error('Failed to fetch application data');
      const data = await response.json();
      
      // Store application data in pre-fill service for intelligent form filling
      if (data.initialIntakeData) {
        documentPreFill.storeFormData('shortApplication', data.initialIntakeData);
      }
      if (data.urlaData) {
        documentPreFill.storeFormData('urla', data.urlaData);
      }
      
      return data;
    },
  });

  const { data: documents } = useQuery({
    queryKey: ['/api/customer-portal/documents', token],
    queryFn: async () => {
      const response = await fetch(`/api/customer-portal/documents?token=${token}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
  });

  const { data: documentRequirements } = useQuery({
    queryKey: ['/api/customer-portal/document-requirements', token],
    queryFn: async () => {
      const response = await fetch(`/api/customer-portal/document-requirements?token=${token}`);
      if (!response.ok) throw new Error('Failed to fetch document requirements');
      return response.json();
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, category }: { file: File; category: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      formData.append('token', token);
      
      const response = await fetch('/api/customer-portal/upload-document', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload document');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customer-portal/documents', token] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const connectBankMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/customer-portal/connect-bank', { token });
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Plaid Link
      window.open(data.linkUrl, '_blank');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to initiate bank connection",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading your application...</p>
        </div>
      </div>
    );
  }

  if (!applicationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Invalid Access</h2>
              <p className="text-text-secondary">
                The link you used is invalid or has expired. Please contact your loan officer.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculateProgress = () => {
    if (!documentRequirements) return 0;
    
    const totalRequired = documentRequirements.filter((req: any) => req.isRequired).length;
    const uploaded = documents?.filter((doc: any) => doc.isReceived).length || 0;
    
    let baseProgress = (uploaded / totalRequired) * 100;
    
    // Add stages
    if (applicationData.stage === 'full_application') baseProgress += 20;
    if (applicationData.bankAccounts?.length > 0) baseProgress += 10;
    
    return Math.min(baseProgress, 100);
  };

  const getDocumentStatus = (category: string) => {
    const doc = documents?.find((d: any) => d.category === category);
    if (doc?.isReceived) return 'received';
    if (doc) return 'pending';
    return 'missing';
  };

  const handleFileUpload = (category: string, file: File) => {
    uploadDocumentMutation.mutate({ file, category });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Loan Application Portal</h1>
              <p className="text-text-secondary">
                Application #{applicationData.id} - {applicationData.loanType.toUpperCase()}
              </p>
            </div>
            <Badge variant={applicationData.status === 'approved' ? 'default' : 'secondary'}>
              {applicationData.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Application Progress</span>
              </div>
              <DataCompletenessIndicator />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>{Math.round(calculateProgress())}%</span>
                </div>
                <Progress value={calculateProgress()} className="h-2" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Initial Application</span>
                </div>
                <div className="flex items-center space-x-2">
                  {applicationData.stage === 'full_application' ? 
                    <CheckCircle className="w-4 h-4 text-green-500" /> :
                    <Clock className="w-4 h-4 text-yellow-500" />
                  }
                  <span className="text-sm">Full Application</span>
                </div>
                <div className="flex items-center space-x-2">
                  {documents?.some((d: any) => d.isReceived) ?
                    <CheckCircle className="w-4 h-4 text-green-500" /> :
                    <Clock className="w-4 h-4 text-yellow-500" />
                  }
                  <span className="text-sm">Document Upload</span>
                </div>
                <div className="flex items-center space-x-2">
                  {applicationData.bankAccounts?.length > 0 ?
                    <CheckCircle className="w-4 h-4 text-green-500" /> :
                    <Clock className="w-4 h-4 text-yellow-500" />
                  }
                  <span className="text-sm">Bank Verification</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="banking">Bank Verification</TabsTrigger>
            <TabsTrigger value="application">Application Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Next Steps */}
              <Card>
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {applicationData.stage === 'initial_intake' && (
                    <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Complete Full Application</h4>
                        <p className="text-sm text-blue-700 mb-3">
                          Complete the detailed URLA form to proceed with your loan.
                        </p>
                        <Button 
                          onClick={() => setShowFullApplication(true)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Start Full Application
                        </Button>
                      </div>
                    </div>
                  )}

                  {documentRequirements?.filter((req: any) => 
                    req.isRequired && getDocumentStatus(req.category) === 'missing'
                  ).slice(0, 3).map((req: any) => (
                    <div key={req.id} className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
                      <Upload className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900">{req.documentName}</h4>
                        <p className="text-sm text-yellow-700">{req.description}</p>
                      </div>
                    </div>
                  ))}

                  {!applicationData.bankAccounts?.length && (
                    <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                      <CreditCard className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900">Verify Bank Accounts</h4>
                        <p className="text-sm text-green-700 mb-3">
                          Connect your bank accounts for quick verification of funds.
                        </p>
                        <Button 
                          onClick={() => connectBankMutation.mutate()}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={connectBankMutation.isPending}
                        >
                          {connectBankMutation.isPending ? "Connecting..." : "Connect Bank Account"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Loan Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Loan Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Loan Type</label>
                      <p className="text-lg font-semibold">{applicationData.loanType.toUpperCase()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Requested Amount</label>
                      <p className="text-lg font-semibold">${parseFloat(applicationData.requestedAmount).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Property Address</label>
                      <p className="text-sm">{applicationData.property?.address}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Application Date</label>
                      <p className="text-sm">{formatDate(applicationData.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Required Documents</CardTitle>
                <p className="text-sm text-text-secondary">
                  Upload all required documents to proceed with your loan application.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documentRequirements?.map((req: any) => {
                    const status = getDocumentStatus(req.category);
                    return (
                      <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {status === 'received' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : status === 'pending' ? (
                            <Clock className="w-5 h-5 text-yellow-500" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                          <div>
                            <h4 className="font-medium">{req.documentName}</h4>
                            <p className="text-sm text-text-secondary">{req.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            status === 'received' ? 'default' : 
                            status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {status === 'received' ? 'Received' : 
                             status === 'pending' ? 'Pending Review' : 'Required'}
                          </Badge>
                          {status !== 'received' && (
                            <input
                              type="file"
                              id={`file-${req.id}`}
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(req.category, file);
                              }}
                            />
                          )}
                          {status !== 'received' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => document.getElementById(`file-${req.id}`)?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Upload
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banking">
            <Card>
              <CardHeader>
                <CardTitle>Bank Account Verification</CardTitle>
                <p className="text-sm text-text-secondary">
                  Connect your bank accounts to verify funds and streamline the approval process.
                </p>
              </CardHeader>
              <CardContent>
                {applicationData.bankAccounts?.length > 0 ? (
                  <div className="space-y-4">
                    {applicationData.bankAccounts.map((account: any) => (
                      <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Building className="w-5 h-5 text-text-secondary" />
                          <div>
                            <h4 className="font-medium">{account.institutionName}</h4>
                            <p className="text-sm text-text-secondary">
                              {account.accountType} ••••{account.lastFourDigits}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${parseFloat(account.currentBalance).toLocaleString()}</p>
                          <Badge variant={account.isVerified ? 'default' : 'secondary'}>
                            {account.isVerified ? 'Verified' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Bank Accounts Connected</h3>
                    <p className="text-text-secondary mb-6">
                      Connect your bank accounts to verify funds and speed up approval.
                    </p>
                    <Button 
                      onClick={() => connectBankMutation.mutate()}
                      disabled={connectBankMutation.isPending}
                    >
                      {connectBankMutation.isPending ? "Connecting..." : "Connect Bank Account"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="application">
            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Borrower Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-text-secondary" />
                        <span>{applicationData.borrower?.firstName} {applicationData.borrower?.lastName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-text-secondary" />
                        <span>{applicationData.borrower?.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-text-secondary" />
                        <span>{applicationData.borrower?.phone}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Property Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Address</label>
                        <p>{applicationData.property?.address}</p>
                        <p>{applicationData.property?.city}, {applicationData.property?.state} {applicationData.property?.zipCode}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Property Type</label>
                        <p>{applicationData.property?.propertyType}</p>
                      </div>
                      {applicationData.property?.propertyValue && (
                        <div>
                          <label className="text-sm font-medium text-text-secondary">Property Value</label>
                          <p>${parseFloat(applicationData.property.propertyValue).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <FullApplicationModal
        open={showFullApplication}
        onClose={() => setShowFullApplication(false)}
        initialData={applicationData.initialIntakeData}
        loanApplicationId={applicationData.id}
      />
    </div>
  );
}