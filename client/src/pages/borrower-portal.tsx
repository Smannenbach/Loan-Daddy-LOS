import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, Upload, FileText, CheckCircle2, Clock, AlertCircle,
  Home, DollarSign, User, MessageSquare, Phone, Mail,
  Download, Eye, Camera, Mic, Calculator, LogOut
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: Array<{
    type: string;
    label: string;
    data: any;
  }>;
}

interface ApplicationStatus {
  stage: 'greeting' | 'qualification' | 'document_collection' | 'application' | 'underwriting' | 'closing';
  progress: number;
  dataCompleteness: number;
  requiredDocuments: string[];
  uploadedDocuments: string[];
  loanOptions?: Array<{
    type: string;
    rate: number;
    payment: number;
    recommended: boolean;
  }>;
}

export default function BorrowerPortal() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>({
    stage: 'greeting',
    progress: 0,
    dataCompleteness: 0,
    requiredDocuments: [],
    uploadedDocuments: []
  });
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if user is authenticated
  const borrowerToken = localStorage.getItem('borrowerToken');
  const borrowerData = JSON.parse(localStorage.getItem('borrowerData') || '{}');
  
  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (borrowerToken && borrowerData.id) {
      setLocation('/borrower-dashboard');
    }
  }, [borrowerToken, borrowerData, setLocation]);

  // Start conversation when component mounts
  useEffect(() => {
    startConversation();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startConversation = async () => {
    try {
      const response = await fetch('/api/autonomous/start-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'web' })
      });
      
      const data = await response.json();
      setSessionId(data.sessionId);
      
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      if (!sessionId) throw new Error('No active session');
      
      const response = await fetch('/api/autonomous/process-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message })
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onMutate: (message) => {
      // Add user message immediately
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date()
      }]);
      setInputMessage("");
      setIsTyping(true);
    },
    onSuccess: (data) => {
      setIsTyping(false);
      
      // Add AI response
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        actions: data.actions
      }]);
      
      // Update application status based on stage
      updateApplicationStatus(data);
    },
    onError: (error) => {
      setIsTyping(false);
      console.error('Message error:', error);
    }
  });

  const updateApplicationStatus = (data: any) => {
    // Update progress based on stage
    const stageProgress = {
      greeting: 10,
      qualification: 30,
      document_collection: 50,
      application: 70,
      underwriting: 90,
      closing: 100
    };
    
    setApplicationStatus(prev => ({
      ...prev,
      progress: stageProgress[data.stage] || prev.progress,
      dataCompleteness: data.dataCompleteness || prev.dataCompleteness,
      loanOptions: data.loanOptions || prev.loanOptions
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !sessionId) return;
    
    const formData = new FormData();
    formData.append('document', file);
    formData.append('sessionId', sessionId);
    formData.append('documentType', 'general');
    
    try {
      const response = await fetch('/api/autonomous/upload-document', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      // Add system message about upload
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      }]);
      
      // Update uploaded documents
      setApplicationStatus(prev => ({
        ...prev,
        uploadedDocuments: [...prev.uploadedDocuments, file.name]
      }));
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'greeting': return <User className="h-4 w-4" />;
      case 'qualification': return <Calculator className="h-4 w-4" />;
      case 'document_collection': return <FileText className="h-4 w-4" />;
      case 'application': return <Home className="h-4 w-4" />;
      case 'underwriting': return <Clock className="h-4 w-4" />;
      case 'closing': return <CheckCircle2 className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/assets/Color logo - no background_1752301573837.png" 
                alt="LoanGenius" 
                className="h-10"
              />
              <div>
                <h1 className="text-xl font-bold">LoanGenius Application Portal</h1>
                <p className="text-sm text-gray-600">Your AI-Powered Mortgage Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Call Support
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Email Us
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  localStorage.removeItem('borrowerToken');
                  localStorage.removeItem('borrowerData');
                  window.location.href = '/login';
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Application Status */}
          <div className="lg:col-span-1 space-y-6">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Application Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span className="font-medium">{applicationStatus.progress}%</span>
                  </div>
                  <Progress value={applicationStatus.progress} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    {getStageIcon(applicationStatus.stage)}
                    <span className="font-medium capitalize">
                      {applicationStatus.stage.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {applicationStatus.stage === 'greeting' && 'Getting to know you'}
                    {applicationStatus.stage === 'qualification' && 'Checking your eligibility'}
                    {applicationStatus.stage === 'document_collection' && 'Gathering your documents'}
                    {applicationStatus.stage === 'application' && 'Completing your application'}
                    {applicationStatus.stage === 'underwriting' && 'Reviewing your application'}
                    {applicationStatus.stage === 'closing' && 'Preparing for closing'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Documents Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                    variant="outline"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  
                  {applicationStatus.uploadedDocuments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Uploaded:</p>
                      {applicationStatus.uploadedDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-green-600" />
                          <span className="truncate">{doc}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Loan Options Card */}
            {applicationStatus.loanOptions && applicationStatus.loanOptions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Loan Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {applicationStatus.loanOptions.map((option, index) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg border ${
                          option.recommended ? 'border-green-500 bg-green-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{option.type}</p>
                            <p className="text-xs text-gray-600">
                              ${option.payment.toLocaleString()}/month
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{option.rate}%</p>
                            {option.recommended && (
                              <Badge variant="default" className="text-xs">
                                Recommended
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-200px)]">
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src="/assets/225124635_padded_logo_1752301613449.png" />
                    <AvatarFallback>LG</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">LoanGenius AI Assistant</CardTitle>
                    <p className="text-sm text-gray-600">
                      I'm here to help you with your mortgage application
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex flex-col h-full p-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    <AnimatePresence>
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`flex ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-4 ${
                              message.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className="text-xs opacity-70 mt-2">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="bg-gray-100 rounded-lg p-4">
                          <div className="flex gap-1">
                            <motion.div
                              animate={{ y: [0, -10, 0] }}
                              transition={{ repeat: Infinity, duration: 0.6 }}
                              className="w-2 h-2 bg-gray-400 rounded-full"
                            />
                            <motion.div
                              animate={{ y: [0, -10, 0] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                              className="w-2 h-2 bg-gray-400 rounded-full"
                            />
                            <motion.div
                              animate={{ y: [0, -10, 0] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                              className="w-2 h-2 bg-gray-400 rounded-full"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>
                
                {/* Input Area */}
                <div className="border-t p-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (inputMessage.trim()) {
                        sendMessage.mutate(inputMessage);
                      }
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Type your message..."
                      disabled={!sessionId || sendMessage.isPending}
                      className="flex-1"
                    />
                    <Button 
                      type="submit" 
                      disabled={!sessionId || !inputMessage.trim() || sendMessage.isPending}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </form>
                  
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="ghost" className="text-xs">
                      <Camera className="h-3 w-3 mr-1" />
                      Take Photo
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs">
                      <Mic className="h-3 w-3 mr-1" />
                      Voice Input
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}