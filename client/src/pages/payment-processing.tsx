import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, DollarSign, FileText, Calculator, TrendingUp,
  Clock, CheckCircle, AlertCircle, Download, Send, Shield,
  Wallet, Receipt, PieChart, BarChart3, History, Lock,
  RefreshCw, Plus, ArrowUpRight, ArrowDownLeft, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Line, Bar } from 'recharts';
import {
  LineChart,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface Transaction {
  id: string;
  type: 'payment' | 'fee' | 'disbursement' | 'refund';
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  date: string;
  description: string;
  loanApplicationId?: number;
  paymentMethod: string;
  processor: string;
  metadata?: {
    borrowerName?: string;
    propertyAddress?: string;
    processingFee?: number;
    netAmount?: number;
  };
}

interface FeeStructure {
  id: string;
  name: string;
  type: 'fixed' | 'percentage';
  amount: number;
  category: 'origination' | 'processing' | 'underwriting' | 'closing' | 'other';
  description: string;
  isActive: boolean;
}

interface PaymentStats {
  totalProcessed: number;
  pendingPayments: number;
  todayVolume: number;
  monthlyVolume: number;
  averageTransactionSize: number;
  successRate: number;
}

export default function PaymentProcessing() {
  const { toast } = useToast();
  const [showNewPayment, setShowNewPayment] = useState(false);
  const [showFeeCalculator, setShowFeeCalculator] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [loanAmount, setLoanAmount] = useState('');
  const [calculatedFees, setCalculatedFees] = useState<any[]>([]);
  
  // Fetch payment stats
  const { data: stats } = useQuery({
    queryKey: ['/api/payments/stats'],
    refetchInterval: 30000
  });
  
  // Fetch transactions
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['/api/payments/transactions'],
    refetchInterval: 10000
  });
  
  // Fetch fee structures
  const { data: feeStructures = [] } = useQuery({
    queryKey: ['/api/payments/fee-structures']
  });
  
  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(paymentData)
      });
      if (!response.ok) throw new Error('Payment processing failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Payment Processed',
        description: 'Payment has been processed successfully'
      });
      setShowNewPayment(false);
      queryClient.invalidateQueries({ queryKey: ['/api/payments/transactions'] });
    },
    onError: (error) => {
      toast({
        title: 'Payment Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Calculate fees
  const calculateFees = () => {
    if (!loanAmount) return;
    
    const amount = parseFloat(loanAmount);
    const fees = feeStructures
      .filter((fee: FeeStructure) => fee.isActive)
      .map((fee: FeeStructure) => ({
        name: fee.name,
        amount: fee.type === 'fixed' ? fee.amount : (amount * fee.amount / 100),
        type: fee.type,
        category: fee.category
      }));
    
    const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);
    setCalculatedFees([...fees, { name: 'Total Fees', amount: totalFees, type: 'total' }]);
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  // Get transaction type icon
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'fee':
        return <Receipt className="h-4 w-4 text-orange-600" />;
      case 'disbursement':
        return <ArrowUpRight className="h-4 w-4 text-blue-600" />;
      case 'refund':
        return <RefreshCw className="h-4 w-4 text-purple-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };
  
  // Mock chart data
  const volumeData = [
    { date: 'Mon', volume: 125000 },
    { date: 'Tue', volume: 185000 },
    { date: 'Wed', volume: 156000 },
    { date: 'Thu', volume: 198000 },
    { date: 'Fri', volume: 242000 },
    { date: 'Sat', volume: 89000 },
    { date: 'Sun', volume: 67000 }
  ];
  
  const feeBreakdown = [
    { category: 'Origination', amount: 45000 },
    { category: 'Processing', amount: 28000 },
    { category: 'Underwriting', amount: 18000 },
    { category: 'Closing', amount: 32000 },
    { category: 'Other', amount: 12000 }
  ];
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment Processing</h1>
          <p className="text-gray-600">
            Manage loan payments, fees, and disbursements
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => setShowFeeCalculator(true)}>
            <Calculator className="h-4 w-4 mr-2" />
            Fee Calculator
          </Button>
          <Button onClick={() => setShowNewPayment(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Payment
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats?.totalProcessed || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats?.todayVolume || 0).toLocaleString()}
            </div>
            <p className="text-xs text-green-600">+12% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.pendingPayments || 0}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.successRate || 98.5}%
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="fees">Fee Management</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                All payment activities across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </TableCell>
                      </TableRow>
                    ) : transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((transaction: Transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getTransactionIcon(transaction.type)}
                              <span className="capitalize">{transaction.type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              {transaction.metadata?.borrowerName && (
                                <p className="text-sm text-gray-500">
                                  {transaction.metadata.borrowerName}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              ${transaction.amount.toLocaleString()}
                            </div>
                            {transaction.metadata?.processingFee && (
                              <p className="text-xs text-gray-500">
                                Fee: ${transaction.metadata.processingFee}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(transaction.status)}>
                              {transaction.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(transaction.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <CreditCard className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{transaction.paymentMethod}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedTransaction(transaction)}
                            >
                              View
                            </Button>
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
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Line 
                      type="monotone" 
                      dataKey="volume" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Fee Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={feeBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Bar dataKey="amount" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">45%</p>
                  <p className="text-sm text-gray-600">ACH Transfer</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">30%</p>
                  <p className="text-sm text-gray-600">Wire Transfer</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">20%</p>
                  <p className="text-sm text-gray-600">Credit Card</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">5%</p>
                  <p className="text-sm text-gray-600">Check</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fee Structure Management</CardTitle>
              <CardDescription>
                Configure and manage loan processing fees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feeStructures.map((fee: FeeStructure) => (
                  <div key={fee.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{fee.name}</h4>
                        <Badge variant="outline">{fee.category}</Badge>
                        {fee.isActive ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{fee.description}</p>
                      <p className="text-sm font-medium mt-2">
                        {fee.type === 'fixed' ? 
                          `$${fee.amount}` : 
                          `${fee.amount}%`
                        }
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm" variant="outline">
                        {fee.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reconciliation">
          <Card>
            <CardHeader>
              <CardTitle>Payment Reconciliation</CardTitle>
              <CardDescription>
                Match payments with loan applications and resolve discrepancies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  All transactions are automatically reconciled. 
                  {' '}3 transactions require manual review.
                </AlertDescription>
              </Alert>
              
              <div className="mt-6 space-y-4">
                <div className="p-4 border rounded-lg bg-yellow-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Payment #TX-8934</p>
                      <p className="text-sm text-gray-600">
                        Amount mismatch: Expected $25,000, Received $24,500
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm">Investigate</Button>
                      <Button size="sm" variant="outline">Mark Resolved</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* New Payment Dialog */}
      <Dialog open={showNewPayment} onOpenChange={setShowNewPayment}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process New Payment</DialogTitle>
            <DialogDescription>
              Enter payment details to process a new transaction
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Payment Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payment">Loan Payment</SelectItem>
                    <SelectItem value="fee">Processing Fee</SelectItem>
                    <SelectItem value="disbursement">Disbursement</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Amount</Label>
                <Input type="number" placeholder="0.00" />
              </div>
            </div>
            
            <div>
              <Label>Loan Application</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select loan application" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">LA-1234 - John Doe</SelectItem>
                  <SelectItem value="2">LA-1235 - Jane Smith</SelectItem>
                  <SelectItem value="3">LA-1236 - Robert Johnson</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Payment Method</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ach">ACH Transfer</SelectItem>
                  <SelectItem value="wire">Wire Transfer</SelectItem>
                  <SelectItem value="card">Credit Card</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Description</Label>
              <Input placeholder="Payment description" />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowNewPayment(false)}>
                Cancel
              </Button>
              <Button onClick={() => processPaymentMutation.mutate({})}>
                Process Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Fee Calculator Dialog */}
      <Dialog open={showFeeCalculator} onOpenChange={setShowFeeCalculator}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fee Calculator</DialogTitle>
            <DialogDescription>
              Calculate total fees for a loan amount
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Loan Amount</Label>
              <Input
                type="number"
                placeholder="Enter loan amount"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
              />
            </div>
            
            <Button onClick={calculateFees} className="w-full">
              Calculate Fees
            </Button>
            
            {calculatedFees.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                {calculatedFees.map((fee, index) => (
                  <div key={index} className={`flex justify-between ${
                    fee.type === 'total' ? 'font-bold text-lg pt-2 border-t' : ''
                  }`}>
                    <span>{fee.name}</span>
                    <span>${fee.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Transaction Details Dialog */}
      {selectedTransaction && (
        <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
              <DialogDescription>
                Transaction ID: {selectedTransaction.id}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium capitalize">{selectedTransaction.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={getStatusColor(selectedTransaction.status)}>
                    {selectedTransaction.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-medium">${selectedTransaction.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">
                    {new Date(selectedTransaction.date).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium">{selectedTransaction.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Processor</p>
                  <p className="font-medium">{selectedTransaction.processor}</p>
                </div>
              </div>
              
              {selectedTransaction.metadata && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Additional Details</h4>
                  <div className="space-y-2 text-sm">
                    {selectedTransaction.metadata.borrowerName && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Borrower:</span>
                        <span>{selectedTransaction.metadata.borrowerName}</span>
                      </div>
                    )}
                    {selectedTransaction.metadata.propertyAddress && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Property:</span>
                        <span>{selectedTransaction.metadata.propertyAddress}</span>
                      </div>
                    )}
                    {selectedTransaction.metadata.processingFee && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Processing Fee:</span>
                        <span>${selectedTransaction.metadata.processingFee}</span>
                      </div>
                    )}
                    {selectedTransaction.metadata.netAmount && (
                      <div className="flex justify-between font-medium">
                        <span>Net Amount:</span>
                        <span>${selectedTransaction.metadata.netAmount}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Receipt
                </Button>
                {selectedTransaction.status === 'pending' && (
                  <Button>Process Now</Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}