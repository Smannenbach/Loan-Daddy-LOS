import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Share2, 
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Archive,
  Tag,
  Pen,
  Trash2,
  Copy,
  FolderOpen,
  FileImage,
  FileSpreadsheet,
  FileType,
  Camera,
  Scan
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: string;
  category: 'income' | 'assets' | 'property' | 'legal' | 'other';
  status: 'pending' | 'received' | 'verified' | 'rejected';
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
  applicationId?: string;
  borrowerName?: string;
  url: string;
  tags: string[];
  version: number;
  aiAnalysis?: {
    confidence: number;
    extractedData: Record<string, any>;
    issues: string[];
  };
}

const documentCategories = [
  { value: 'income', label: 'Income Documents', icon: FileSpreadsheet, count: 45 },
  { value: 'assets', label: 'Asset Verification', icon: FileText, count: 32 },
  { value: 'property', label: 'Property Documents', icon: FolderOpen, count: 28 },
  { value: 'legal', label: 'Legal Documents', icon: FileType, count: 19 },
  { value: 'other', label: 'Other Documents', icon: FileText, count: 12 }
];

const documentTypes = [
  'Bank Statements', 'Tax Returns', 'Pay Stubs', 'W2/1099', 'P&L Statement',
  'Purchase Agreement', 'Appraisal', 'Insurance', 'Title Report', 'Rent Roll',
  'Operating Statements', 'Lease Agreements', 'Articles of Incorporation',
  'Other'
];

export default function DocumentCenter() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['/api/documents', selectedCategory, searchTerm],
    queryFn: () => apiRequest('GET', `/api/documents?category=${selectedCategory}&search=${searchTerm}`),
  });

  // Fetch document analytics
  const { data: analytics } = useQuery({
    queryKey: ['/api/documents/analytics'],
    queryFn: () => apiRequest('GET', '/api/documents/analytics'),
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: (formData: FormData) => apiRequest('POST', '/api/documents/upload', formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setShowUploadDialog(false);
      toast({
        title: "Document Uploaded",
        description: "Document has been uploaded and is being processed.",
      });
    }
  });

  // Mock documents for development
  const mockDocuments: Document[] = [
    {
      id: '1',
      name: 'Bank_Statement_Jan_2024.pdf',
      type: 'Bank Statements',
      category: 'income',
      status: 'verified',
      size: 2048576,
      uploadedAt: new Date('2024-01-15'),
      uploadedBy: 'John Smith',
      applicationId: 'APP-001',
      borrowerName: 'John Smith',
      url: '/documents/bank-statement-jan.pdf',
      tags: ['verified', 'business-account'],
      version: 1,
      aiAnalysis: {
        confidence: 94,
        extractedData: {
          averageBalance: 125000,
          deposits: 15,
          withdrawals: 8
        },
        issues: []
      }
    },
    {
      id: '2',
      name: 'Property_Appraisal_123_Main_St.pdf',
      type: 'Appraisal',
      category: 'property',
      status: 'received',
      size: 5242880,
      uploadedAt: new Date('2024-01-20'),
      uploadedBy: 'Sarah Johnson',
      applicationId: 'APP-002',
      borrowerName: 'Sarah Johnson',
      url: '/documents/appraisal-123-main.pdf',
      tags: ['appraisal', 'commercial'],
      version: 1,
      aiAnalysis: {
        confidence: 87,
        extractedData: {
          propertyValue: 450000,
          loanToValue: 75,
          propertyType: 'Commercial'
        },
        issues: ['Date older than 6 months']
      }
    },
    {
      id: '3',
      name: 'Tax_Return_2023.pdf',
      type: 'Tax Returns',
      category: 'income',
      status: 'pending',
      size: 1572864,
      uploadedAt: new Date('2024-01-22'),
      uploadedBy: 'Mike Wilson',
      applicationId: 'APP-003',
      borrowerName: 'Mike Wilson',
      url: '/documents/tax-return-2023.pdf',
      tags: ['tax-return', '2023'],
      version: 2,
      aiAnalysis: {
        confidence: 76,
        extractedData: {
          grossIncome: 89000,
          netIncome: 67000,
          filingStatus: 'Single'
        },
        issues: ['Missing Schedule E', 'Signature required']
      }
    }
  ];

  const mockAnalytics = {
    totalDocuments: 136,
    pendingReview: 23,
    verifiedDocuments: 89,
    rejectedDocuments: 8,
    averageProcessingTime: 1.8,
    aiAccuracy: 91.2,
    storageUsed: 2.1,
    storageLimit: 10
  };

  const documentData = documents.length > 0 ? documents : mockDocuments;
  const analyticsData = analytics || mockAnalytics;

  const filteredDocuments = documentData.filter((doc: Document) => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.borrowerName && doc.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'received': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('Image') || type.includes('image')) return FileImage;
    if (type.includes('Spreadsheet') || type.includes('excel')) return FileSpreadsheet;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                <FileText className="w-8 h-8 text-blue-600" />
                Document Center
              </h1>
              <p className="text-gray-600 mt-2">
                Intelligent document management with AI-powered analysis and verification
              </p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline">
                <Scan className="w-4 h-4 mr-2" />
                OCR Scan
              </Button>
              <Button onClick={() => setShowUploadDialog(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Documents
              </Button>
            </div>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Documents</p>
                  <p className="text-3xl font-bold">{analyticsData.totalDocuments}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Pending Review</p>
                  <p className="text-3xl font-bold">{analyticsData.pendingReview}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">AI Accuracy</p>
                  <p className="text-3xl font-bold">{analyticsData.aiAccuracy}%</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Storage Used</p>
                  <p className="text-3xl font-bold">{analyticsData.storageUsed}GB</p>
                  <Progress 
                    value={(analyticsData.storageUsed / analyticsData.storageLimit) * 100} 
                    className="mt-2"
                  />
                </div>
                <Archive className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {documentCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Document Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredDocuments.map((document: Document) => {
                const FileIcon = getFileIcon(document.type);
                return (
                  <Card key={document.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <FileIcon className="w-8 h-8 text-blue-600" />
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm truncate">{document.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {document.type} • {formatFileSize(document.size)}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge className={getStatusColor(document.status)}>
                          {document.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm text-gray-600">
                        <div>Borrower: {document.borrowerName}</div>
                        <div>Uploaded: {document.uploadedAt.toLocaleDateString()}</div>
                        {document.version > 1 && (
                          <div>Version: {document.version}</div>
                        )}
                      </div>

                      {document.aiAnalysis && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>AI Confidence:</span>
                            <span className="font-medium">{document.aiAnalysis.confidence}%</span>
                          </div>
                          <Progress value={document.aiAnalysis.confidence} className="h-2" />
                          {document.aiAnalysis.issues.length > 0 && (
                            <div className="flex items-center gap-1 text-sm text-orange-600">
                              <AlertCircle className="w-4 h-4" />
                              {document.aiAnalysis.issues.length} issue(s) found
                            </div>
                          )}
                        </div>
                      )}

                      {document.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {document.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documentCategories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Card key={category.value} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <IconComponent className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{category.label}</h3>
                          <p className="text-sm text-gray-600">{category.count} documents</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* AI Analysis Tab */}
          <TabsContent value="ai-analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Processing Performance</CardTitle>
                  <CardDescription>Document analysis accuracy and speed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Overall Accuracy</span>
                      <span className="text-sm text-gray-600">{analyticsData.aiAccuracy}%</span>
                    </div>
                    <Progress value={analyticsData.aiAccuracy} className="w-full" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Avg Processing Time</span>
                      <span className="text-sm text-gray-600">{analyticsData.averageProcessingTime}s</span>
                    </div>
                    <Progress value={75} className="w-full" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Auto-verification Rate</span>
                      <span className="text-sm text-gray-600">83%</span>
                    </div>
                    <Progress value={83} className="w-full" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Document Issues Detected</CardTitle>
                  <CardDescription>Common issues found by AI analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Missing signatures</span>
                      <Badge variant="secondary">12 docs</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Outdated documents</span>
                      <Badge variant="secondary">8 docs</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Poor image quality</span>
                      <Badge variant="secondary">5 docs</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Incomplete forms</span>
                      <Badge variant="secondary">3 docs</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-dashed border-2 hover:bg-gray-50 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-semibold mb-2">Income Verification Package</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Complete set of income documentation requirements
                  </p>
                  <Button size="sm">Use Template</Button>
                </CardContent>
              </Card>

              <Card className="border-dashed border-2 hover:bg-gray-50 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 text-green-600" />
                  <h3 className="font-semibold mb-2">Property Documentation</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Essential property documents for loan processing
                  </p>
                  <Button size="sm">Use Template</Button>
                </CardContent>
              </Card>

              <Card className="border-dashed border-2 hover:bg-gray-50 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Archive className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="font-semibold mb-2">Legal Document Set</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Corporate and legal documentation package
                  </p>
                  <Button size="sm">Use Template</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}