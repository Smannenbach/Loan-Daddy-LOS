import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Upload, CheckCircle, Clock, AlertCircle, 
  User, Mail, Phone, Lock, ArrowRight, Home,
  DollarSign, Building, Calendar, Download,
  MessageSquare, HelpCircle, LogOut, Eye
} from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface BorrowerInfo {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
}

interface LoanApplication {
  id: number;
  loanType: string;
  loanAmount: number;
  status: string;
  propertyAddress: string;
  createdAt: string;
  updatedAt: string;
  progress: number;
  documents: Document[];
  nextSteps: string[];
}

interface Document {
  id: number;
  name: string;
  type: string;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  uploadedAt?: string;
  required: boolean;
  description: string;
}

export default function BorrowerPortalV2() {
  const [location, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const { toast } = useToast();

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('borrowerToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return await apiRequest('/api/borrower/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      localStorage.setItem('borrowerToken', data.token);
      setIsAuthenticated(true);
      toast({ title: "Welcome back!", description: "You've successfully logged in." });
    },
    onError: (error) => {
      toast({ 
        title: "Login failed", 
        description: error.message || "Please check your credentials.",
        variant: "destructive" 
      });
    },
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/borrower/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      localStorage.setItem('borrowerToken', data.token);
      setIsAuthenticated(true);
      toast({ title: "Account created!", description: "Welcome to LoanGenius." });
    },
    onError: (error) => {
      toast({ 
        title: "Signup failed", 
        description: error.message || "Please try again.",
        variant: "destructive" 
      });
    },
  });

  // Borrower info query
  const { data: borrowerInfo } = useQuery({
    queryKey: ['/api/borrower/profile'],
    enabled: isAuthenticated,
  });

  // Loan applications query
  const { data: applications = [] } = useQuery({
    queryKey: ['/api/borrower/applications'],
    enabled: isAuthenticated,
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ 
        title: "Passwords don't match", 
        description: "Please ensure both passwords are the same.",
        variant: "destructive" 
      });
      return;
    }
    signupMutation.mutate({ email, password, firstName, lastName, phone });
  };

  const handleLogout = () => {
    localStorage.removeItem('borrowerToken');
    setIsAuthenticated(false);
    setLocation('/');
  };

  // Login/Signup Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/logo-color.png" alt="LoanGenius" className="h-12 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Borrower Portal</h1>
            <p className="text-gray-600 mt-2">Access your loan applications and documents</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <Tabs value={showLogin ? 'login' : 'signup'} onValueChange={(v) => setShowLogin(v === 'login')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? 'Logging in...' : 'Login'}
                    </Button>
                    <div className="text-center text-sm text-gray-600">
                      <a href="#" className="hover:text-primary">Forgot password?</a>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="signupEmail">Email</Label>
                      <Input
                        id="signupEmail"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone (optional)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="signupPassword">Password</Label>
                      <Input
                        id="signupPassword"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={signupMutation.isPending}>
                      {signupMutation.isPending ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Need help? Call us at <a href="tel:1-800-LOAN-AI" className="text-primary hover:underline">1-800-LOAN-AI</a></p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/logo-color.png" alt="LoanGenius" className="h-8 mr-4" />
              <h2 className="text-lg font-semibold text-gray-900">Borrower Portal</h2>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {borrowerInfo?.firstName}!
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {borrowerInfo?.firstName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Track your loan applications and manage your documents in one place.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/apply')}>
            <CardContent className="p-6 text-center">
              <Home className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold">New Application</h3>
              <p className="text-sm text-gray-600 mt-1">Start a new loan</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Upload className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold">Upload Documents</h3>
              <p className="text-sm text-gray-600 mt-1">Submit required files</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold">Messages</h3>
              <p className="text-sm text-gray-600 mt-1">Chat with your officer</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <HelpCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold">Help Center</h3>
              <p className="text-sm text-gray-600 mt-1">Get support</p>
            </CardContent>
          </Card>
        </div>

        {/* Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Your Loan Applications</CardTitle>
            <CardDescription>
              Track the progress of your loan applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                <p className="text-gray-600 mb-4">Start your journey to homeownership today!</p>
                <Button onClick={() => setLocation('/apply')}>
                  <Home className="h-4 w-4 mr-2" />
                  Start New Application
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app: LoanApplication) => (
                  <div key={app.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{app.loanType} Loan</h3>
                        <p className="text-sm text-gray-600">{app.propertyAddress}</p>
                        <p className="text-2xl font-bold text-primary mt-2">
                          ${app.loanAmount.toLocaleString()}
                        </p>
                      </div>
                      <Badge 
                        variant={
                          app.status === 'approved' ? 'default' :
                          app.status === 'in_review' ? 'secondary' :
                          app.status === 'pending' ? 'outline' : 'destructive'
                        }
                      >
                        {app.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Application Progress</span>
                        <span>{app.progress}%</span>
                      </div>
                      <Progress value={app.progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-sm">
                        <span className="text-gray-600">Applied on:</span>
                        <p className="font-medium">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Last updated:</span>
                        <p className="font-medium">
                          {new Date(app.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Document Status */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Required Documents</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {app.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center text-sm">
                            {doc.status === 'verified' ? (
                              <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                            ) : doc.status === 'uploaded' ? (
                              <Clock className="h-4 w-4 text-yellow-600 mr-1" />
                            ) : doc.status === 'rejected' ? (
                              <AlertCircle className="h-4 w-4 text-red-600 mr-1" />
                            ) : (
                              <FileText className="h-4 w-4 text-gray-400 mr-1" />
                            )}
                            <span className={doc.status === 'verified' ? 'text-green-600' : ''}>
                              {doc.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Next Steps */}
                    {app.nextSteps.length > 0 && (
                      <Alert className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Next steps:</strong> {app.nextSteps.join(', ')}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-end mt-4 space-x-2">
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message Officer
                      </Button>
                      <Button size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}