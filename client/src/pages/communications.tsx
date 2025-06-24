import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  PhoneCall,
  Send, 
  Users, 
  Clock,
  CheckCircle,
  AlertCircle,
  Linkedin,
  User,
  Building
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { LoanApplicationWithDetails } from "@shared/schema";

export default function Communications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("email");
  const [selectedBorrower, setSelectedBorrower] = useState<number | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [smsMessage, setSmsMessage] = useState("");

  const { data: applications } = useQuery<LoanApplicationWithDetails[]>({
    queryKey: ['/api/loan-applications'],
  });

  const { data: templates } = useQuery({
    queryKey: ['/api/templates'],
  });

  const { data: notifications } = useQuery({
    queryKey: ['/api/notifications'],
  });

  const { data: callLogs } = useQuery({
    queryKey: ['/api/call-logs'],
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/notifications', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Email has been sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      setEmailSubject("");
      setEmailMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    },
  });

  const sendSmsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/notifications', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "SMS Sent",
        description: "SMS has been sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      setSmsMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send SMS",
        variant: "destructive",
      });
    },
  });

  const logCallMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/call-logs', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Call Logged",
        description: "Call has been logged successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/call-logs'] });
    },
  });

  const handleSendEmail = () => {
    if (!selectedBorrower || !emailSubject || !emailMessage) {
      toast({
        title: "Missing Information",
        description: "Please select a borrower and fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const borrower = applications?.find(app => app.borrower.id === selectedBorrower)?.borrower;
    if (!borrower) return;

    sendEmailMutation.mutate({
      loanApplicationId: applications?.find(app => app.borrower.id === selectedBorrower)?.id,
      borrowerId: selectedBorrower,
      type: 'email',
      recipient: borrower.email,
      subject: emailSubject,
      message: emailMessage,
      status: 'sent'
    });
  };

  const handleSendSms = () => {
    if (!selectedBorrower || !smsMessage) {
      toast({
        title: "Missing Information",
        description: "Please select a borrower and enter a message",
        variant: "destructive",
      });
      return;
    }

    const borrower = applications?.find(app => app.borrower.id === selectedBorrower)?.borrower;
    if (!borrower) return;

    sendSmsMutation.mutate({
      loanApplicationId: applications?.find(app => app.borrower.id === selectedBorrower)?.id,
      borrowerId: selectedBorrower,
      type: 'sms',
      recipient: borrower.phone,
      message: smsMessage,
      status: 'sent'
    });
  };

  const handleLogCall = (type: 'inbound' | 'outbound', status: string, duration?: number) => {
    if (!selectedBorrower) {
      toast({
        title: "No Borrower Selected",
        description: "Please select a borrower first",
        variant: "destructive",
      });
      return;
    }

    const borrower = applications?.find(app => app.borrower.id === selectedBorrower)?.borrower;
    if (!borrower) return;

    logCallMutation.mutate({
      loanApplicationId: applications?.find(app => app.borrower.id === selectedBorrower)?.id,
      borrowerId: selectedBorrower,
      userId: 1,
      phoneNumber: borrower.phone,
      duration: duration || 0,
      callType: type,
      status: status,
      notes: `${type === 'outbound' ? 'Outbound' : 'Inbound'} call - ${status}`
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <>
      <Header 
        title="Communications" 
        subtitle="Manage email, SMS, and phone communications with borrowers"
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Communication Panel */}
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Send className="w-5 h-5" />
                  <span>Send Communication</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Borrower Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Select Borrower
                  </label>
                  <Select value={selectedBorrower?.toString() || ""} onValueChange={(value) => setSelectedBorrower(Number(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a borrower to contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {applications?.map((app) => (
                        <SelectItem key={app.borrower.id} value={app.borrower.id.toString()}>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>{app.borrower.firstName} {app.borrower.lastName}</span>
                            <span className="text-text-secondary">({app.borrower.email})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="email" className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>Email</span>
                    </TabsTrigger>
                    <TabsTrigger value="sms" className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>SMS</span>
                    </TabsTrigger>
                    <TabsTrigger value="call" className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>Call</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="email" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Subject</label>
                      <Input
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Enter email subject"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Message</label>
                      <Textarea
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        placeholder="Enter your email message"
                        rows={6}
                      />
                    </div>
                    <Button 
                      onClick={handleSendEmail}
                      disabled={sendEmailMutation.isPending}
                      className="w-full"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
                    </Button>
                  </TabsContent>

                  <TabsContent value="sms" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Message</label>
                      <Textarea
                        value={smsMessage}
                        onChange={(e) => setSmsMessage(e.target.value)}
                        placeholder="Enter your SMS message (160 characters max)"
                        rows={4}
                        maxLength={160}
                      />
                      <div className="text-sm text-text-secondary mt-1">
                        {smsMessage.length}/160 characters
                      </div>
                    </div>
                    <Button 
                      onClick={handleSendSms}
                      disabled={sendSmsMutation.isPending}
                      className="w-full"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {sendSmsMutation.isPending ? "Sending..." : "Send SMS"}
                    </Button>
                  </TabsContent>

                  <TabsContent value="call" className="space-y-4">
                    <div className="text-center py-6">
                      <PhoneCall className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-text-primary mb-2">Phone Communication</h3>
                      <p className="text-text-secondary mb-6">
                        Log calls or initiate phone communication with the selected borrower
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Button 
                          onClick={() => handleLogCall('outbound', 'completed', 300)}
                          variant="outline"
                          className="flex items-center space-x-2"
                        >
                          <Phone className="w-4 h-4" />
                          <span>Make Call</span>
                        </Button>
                        <Button 
                          onClick={() => handleLogCall('inbound', 'completed', 180)}
                          variant="outline"
                          className="flex items-center space-x-2"
                        >
                          <PhoneCall className="w-4 h-4" />
                          <span>Log Incoming</span>
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Borrower Info & LinkedIn */}
          <div className="space-y-6">
            {/* Selected Borrower Info */}
            {selectedBorrower && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Borrower Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const borrower = applications?.find(app => app.borrower.id === selectedBorrower)?.borrower;
                    if (!borrower) return null;
                    
                    return (
                      <div className="space-y-3">
                        <div>
                          <div className="font-medium text-text-primary">
                            {borrower.firstName} {borrower.lastName}
                          </div>
                          <div className="text-sm text-text-secondary">{borrower.email}</div>
                          <div className="text-sm text-text-secondary">{borrower.phone}</div>
                        </div>
                        
                        {borrower.company && (
                          <div className="flex items-center space-x-2">
                            <Building className="w-4 h-4 text-text-secondary" />
                            <span className="text-sm">{borrower.company}</span>
                          </div>
                        )}
                        
                        {borrower.linkedinProfile && (
                          <div className="pt-2 border-t">
                            <a 
                              href={borrower.linkedinProfile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                            >
                              <Linkedin className="w-4 h-4" />
                              <span className="text-sm">View LinkedIn Profile</span>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Communication History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Recent Communications</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notifications?.slice(0, 5).map((notification: any) => (
                    <div key={notification.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        {notification.type === 'email' ? 
                          <Mail className="w-4 h-4 text-blue-500" /> : 
                          <MessageSquare className="w-4 h-4 text-green-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-text-primary">
                            {notification.type.toUpperCase()}
                          </span>
                          {getStatusIcon(notification.status)}
                        </div>
                        <div className="text-sm text-text-secondary truncate">
                          {notification.subject || notification.message}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {formatDate(notification.createdAt)}
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-text-secondary py-6">
                      No communications yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* LinkedIn Prospect Integration */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Linkedin className="w-5 h-5 text-blue-600" />
              <span>LinkedIn Prospect Integration</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">Find Real Estate Investor Prospects</h3>
              <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
                Connect with LinkedIn to identify potential real estate investors and borrowers. 
                Import their profiles and convert them into leads for your loan origination pipeline.
              </p>
              <div className="flex justify-center space-x-4">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Linkedin className="w-4 h-4 mr-2" />
                  Connect LinkedIn
                </Button>
                <Button variant="outline">
                  Import Prospects
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}