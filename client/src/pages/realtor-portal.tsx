import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Home, Users, TrendingUp, DollarSign, Calendar, Award,
  PlusCircle, Send, Clock, CheckCircle2, AlertCircle,
  Building2, FileText, Phone, Mail, BarChart3, Target
} from "lucide-react";
import { motion } from "framer-motion";

interface ReferralClient {
  id: number;
  name: string;
  email: string;
  phone: string;
  propertyAddress: string;
  referralDate: Date;
  status: 'contacted' | 'pre-qualified' | 'application' | 'processing' | 'approved' | 'closed' | 'declined';
  loanAmount: number;
  commission?: number;
  loanOfficer: string;
  lastUpdate: Date;
}

export default function RealtorPortal() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [referrals] = useState<ReferralClient[]>([
    {
      id: 1,
      name: "John Smith",
      email: "john@example.com",
      phone: "(555) 123-4567",
      propertyAddress: "123 Main St, Austin, TX",
      referralDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: 'processing',
      loanAmount: 450000,
      commission: 1350,
      loanOfficer: "Sarah Johnson",
      lastUpdate: new Date()
    },
    {
      id: 2,
      name: "Emily Davis",
      email: "emily@example.com",
      phone: "(555) 987-6543",
      propertyAddress: "456 Oak Ave, Dallas, TX",
      referralDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'application',
      loanAmount: 325000,
      loanOfficer: "Mike Chen",
      lastUpdate: new Date()
    }
  ]);

  const stats = {
    activeReferrals: 12,
    closedThisMonth: 4,
    totalCommissions: 8450,
    conversionRate: 68
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'contacted': return 'bg-gray-100 text-gray-700';
      case 'pre-qualified': return 'bg-blue-100 text-blue-700';
      case 'application': return 'bg-yellow-100 text-yellow-700';
      case 'processing': return 'bg-orange-100 text-orange-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-green-600 text-white';
      case 'declined': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'contacted': return <Clock className="h-4 w-4" />;
      case 'pre-qualified': return <FileText className="h-4 w-4" />;
      case 'application': return <Home className="h-4 w-4" />;
      case 'processing': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle2 className="h-4 w-4" />;
      case 'closed': return <Award className="h-4 w-4" />;
      case 'declined': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/assets/Color logo - no background_1752301573837.png" 
                alt="LoanGenius" 
                className="h-10"
              />
              <div>
                <h1 className="text-xl font-bold">LoanGenius Realtor Portal</h1>
                <p className="text-sm text-gray-600">Partner Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-medium">Sarah Williams</p>
              </div>
              <Avatar>
                <AvatarFallback>SW</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="referrals">My Referrals</TabsTrigger>
            <TabsTrigger value="new-referral">New Referral</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Referrals</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.activeReferrals}</div>
                    <p className="text-xs text-muted-foreground">+3 from last month</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Closed This Month</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.closedThisMonth}</div>
                    <p className="text-xs text-muted-foreground">Great progress!</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${stats.totalCommissions.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">This quarter</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.conversionRate}%</div>
                    <Progress value={stats.conversionRate} className="mt-2 h-2" />
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Recent Referrals */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Referrals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {referrals.slice(0, 3).map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>{referral.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{referral.name}</p>
                          <p className="text-sm text-gray-600">{referral.propertyAddress}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">${referral.loanAmount.toLocaleString()}</p>
                          <p className="text-xs text-gray-600">Loan Amount</p>
                        </div>
                        <Badge className={getStatusColor(referral.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(referral.status)}
                            {referral.status}
                          </span>
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Referrals Tab */}
          <TabsContent value="referrals" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">All Referrals</h2>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Referral
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Property
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Loan Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Commission
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {referrals.map((referral) => (
                        <tr key={referral.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="font-medium">{referral.name}</p>
                              <p className="text-sm text-gray-600">{referral.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm">{referral.propertyAddress}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="font-medium">${referral.loanAmount.toLocaleString()}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusColor(referral.status)}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(referral.status)}
                                {referral.status}
                              </span>
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {referral.commission ? (
                              <p className="font-medium text-green-600">${referral.commission.toLocaleString()}</p>
                            ) : (
                              <p className="text-sm text-gray-400">Pending</p>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost">
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Mail className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* New Referral Tab */}
          <TabsContent value="new-referral">
            <Card>
              <CardHeader>
                <CardTitle>Refer a New Client</CardTitle>
                <p className="text-sm text-gray-600">
                  Submit a new client referral and earn commission when the loan closes
                </p>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Client Name</label>
                      <Input placeholder="John Smith" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input type="email" placeholder="john@example.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone</label>
                      <Input placeholder="(555) 123-4567" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Property Address</label>
                      <Input placeholder="123 Main St, City, State" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Estimated Loan Amount</label>
                      <Input type="number" placeholder="450000" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Loan Type</label>
                      <select className="w-full px-3 py-2 border rounded-md">
                        <option>Purchase</option>
                        <option>Refinance</option>
                        <option>Cash-Out Refinance</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Additional Notes</label>
                    <textarea 
                      className="w-full px-3 py-2 border rounded-md"
                      rows={4}
                      placeholder="Any additional information about the client or property..."
                    />
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button variant="outline">Cancel</Button>
                    <Button>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Referral
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <Building2 className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle>Loan Programs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Learn about our various loan programs including DSCR, Fix & Flip, Bridge, and Commercial loans.
                  </p>
                  <Button variant="outline" className="w-full">View Programs</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <FileText className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle>Marketing Materials</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Download flyers, brochures, and other materials to share with your clients.
                  </p>
                  <Button variant="outline" className="w-full">Download Materials</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Target className="h-8 w-8 text-purple-600 mb-2" />
                  <CardTitle>Commission Structure</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    View our competitive commission rates and payment schedule.
                  </p>
                  <Button variant="outline" className="w-full">View Details</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <CardTitle>Commission Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold">$3,250</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Paid This Month</p>
                    <p className="text-2xl font-bold text-green-600">$5,200</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">YTD Total</p>
                    <p className="text-2xl font-bold text-blue-600">$42,750</p>
                  </div>
                </div>

                <h3 className="font-medium mb-4">Recent Payments</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">Commission Payment</p>
                      <p className="text-sm text-gray-600">John Smith - 123 Main St</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">$1,350</p>
                      <p className="text-sm text-gray-600">Jan 5, 2025</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">Commission Payment</p>
                      <p className="text-sm text-gray-600">Sarah Johnson - 456 Oak Ave</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">$2,100</p>
                      <p className="text-sm text-gray-600">Dec 28, 2024</p>
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