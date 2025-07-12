import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import { 
  FileText, Upload, CheckCircle, AlertCircle, Clock, 
  Eye, Download, Trash2, RefreshCw, Brain, Search,
  FileSearch, FileCheck, AlertTriangle, Loader2,
  ZoomIn, ZoomOut, RotateCw, Copy, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProcessedDocument {
  id: number;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  analysis?: {
    documentType: string;
    confidence: number;
    extractedData: Record<string, any>;
    requiredFields: string[];
    missingFields: string[];
    complianceChecks: {
      passed: boolean;
      issues: string[];
    };
  };
  ocrResult?: {
    text: string;
    confidence: number;
    pages: number;
  };
}

export default function DocumentProcessor() {
  const { toast } = useToast();
  const [selectedDocument, setSelectedDocument] = useState<ProcessedDocument | null>(null);
  const [processingQueue, setProcessingQueue] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  // Fetch processed documents
  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/documents/processed'],
    refetchInterval: 5000 // Refresh every 5 seconds for processing status
  });
  
  // Process document mutation
  const processDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await fetch(`/api/ai/documents/process/${documentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to process document');
      return response.json();
    },
    onSuccess: (data, documentId) => {
      toast({
        title: 'Document Processing Started',
        description: 'AI is analyzing your document...'
      });
      setProcessingQueue(prev => [...prev, documentId.toString()]);
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Processing Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Batch process mutation
  const batchProcessMutation = useMutation({
    mutationFn: async (documentIds: number[]) => {
      const response = await fetch('/api/ai/documents/batch-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ documentIds })
      });
      if (!response.ok) throw new Error('Failed to batch process documents');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Batch Processing Started',
        description: 'AI is processing multiple documents...'
      });
      refetch();
    }
  });
  
  // File upload dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const formData = new FormData();
    acceptedFiles.forEach(file => {
      formData.append('files', file);
    });
    
    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      toast({
        title: 'Upload Successful',
        description: `${acceptedFiles.length} file(s) uploaded successfully`
      });
      
      // Auto-process uploaded documents
      if (data.documentIds && data.documentIds.length > 0) {
        batchProcessMutation.mutate(data.documentIds);
      }
      
      refetch();
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload documents',
        variant: 'destructive'
      });
    }
  }, [refetch, toast]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });
  
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
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get document type icon
  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'loan_application':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'income_verification':
        return <FileCheck className="h-5 w-5 text-green-600" />;
      case 'property_appraisal':
        return <FileSearch className="h-5 w-5 text-purple-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };
  
  // Calculate overall stats
  const stats = {
    total: documents.length,
    completed: documents.filter((d: ProcessedDocument) => d.status === 'completed').length,
    processing: documents.filter((d: ProcessedDocument) => d.status === 'processing').length,
    failed: documents.filter((d: ProcessedDocument) => d.status === 'failed').length,
    compliancePassed: documents.filter((d: ProcessedDocument) => 
      d.analysis?.complianceChecks?.passed
    ).length
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Document Processor</h1>
          <p className="text-gray-600">
            Intelligent document analysis with OCR and compliance checking
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Brain className="h-4 w-4 mr-2" />
            Train Model
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compliance Pass</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.total > 0 ? Math.round((stats.compliancePassed / stats.total) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Upload Area */}
      <Card>
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">
              {isDragActive ? 'Drop documents here' : 'Drag & drop documents'}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              or click to browse (PDF, Images, Word documents)
            </p>
            <Button variant="outline">Browse Files</Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Main Content */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Issues</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Library</CardTitle>
              <CardDescription>
                All uploaded documents with AI analysis results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p className="text-gray-600">Loading documents...</p>
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No documents uploaded yet</p>
                    </div>
                  ) : (
                    documents.map((doc: ProcessedDocument) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            {doc.analysis ? 
                              getDocumentIcon(doc.analysis.documentType) : 
                              <FileText className="h-5 w-5 text-gray-600" />
                            }
                            <div className="flex-1">
                              <h4 className="font-medium">{doc.fileName}</h4>
                              <p className="text-sm text-gray-600">
                                Uploaded {new Date(doc.uploadedAt).toLocaleString()}
                              </p>
                              
                              {doc.analysis && (
                                <div className="mt-2 space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium">Type:</span>
                                    <Badge variant="outline">
                                      {doc.analysis.documentType.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                    <span className="text-sm text-gray-600">
                                      ({Math.round(doc.analysis.confidence * 100)}% confidence)
                                    </span>
                                  </div>
                                  
                                  {doc.analysis.complianceChecks && (
                                    <div className="flex items-center space-x-2">
                                      {doc.analysis.complianceChecks.passed ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <AlertTriangle className="h-4 w-4 text-red-600" />
                                      )}
                                      <span className="text-sm">
                                        Compliance: {doc.analysis.complianceChecks.passed ? 'Passed' : 'Issues Found'}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {doc.analysis.missingFields && doc.analysis.missingFields.length > 0 && (
                                    <Alert className="mt-2">
                                      <AlertCircle className="h-4 w-4" />
                                      <AlertDescription>
                                        Missing fields: {doc.analysis.missingFields.join(', ')}
                                      </AlertDescription>
                                    </Alert>
                                  )}
                                </div>
                              )}
                              
                              {doc.ocrResult && (
                                <div className="mt-2 text-sm text-gray-600">
                                  OCR: {doc.ocrResult.pages} page(s) • {Math.round(doc.ocrResult.confidence * 100)}% accuracy
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(doc.status)}>
                              {doc.status === 'processing' && (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              )}
                              {doc.status.toUpperCase()}
                            </Badge>
                            
                            {doc.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => processDocumentMutation.mutate(doc.id)}
                                disabled={processDocumentMutation.isPending}
                              >
                                <Brain className="h-4 w-4 mr-1" />
                                Process
                              </Button>
                            )}
                            
                            {doc.status === 'completed' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedDocument(doc)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {doc.status === 'processing' && (
                          <Progress value={50} className="mt-3" />
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="processing">
          <Card>
            <CardHeader>
              <CardTitle>Currently Processing</CardTitle>
              <CardDescription>
                Documents being analyzed by AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.filter((d: ProcessedDocument) => d.status === 'processing').map((doc: ProcessedDocument) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <div>
                        <p className="font-medium">{doc.fileName}</p>
                        <p className="text-sm text-gray-600">Processing started...</p>
                      </div>
                    </div>
                    <Progress value={65} className="w-32" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Processed Documents</CardTitle>
              <CardDescription>
                Successfully analyzed documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.filter((d: ProcessedDocument) => d.status === 'completed').map((doc: ProcessedDocument) => (
                  <Card key={doc.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedDocument(doc)}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        {getDocumentIcon(doc.analysis?.documentType || '')}
                        <Badge variant="outline" className="text-xs">
                          {Math.round((doc.analysis?.confidence || 0) * 100)}%
                        </Badge>
                      </div>
                      <CardTitle className="text-sm mt-2">{doc.fileName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium">
                            {doc.analysis?.documentType.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fields:</span>
                          <span className="font-medium">
                            {Object.keys(doc.analysis?.extractedData || {}).length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Compliance:</span>
                          <span className={`font-medium ${
                            doc.analysis?.complianceChecks?.passed ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {doc.analysis?.complianceChecks?.passed ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Issues</CardTitle>
              <CardDescription>
                Documents with compliance failures or missing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.filter((d: ProcessedDocument) => 
                  d.analysis && !d.analysis.complianceChecks?.passed
                ).map((doc: ProcessedDocument) => (
                  <Alert key={doc.id} variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium mb-1">{doc.fileName}</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {doc.analysis?.complianceChecks?.issues.map((issue: string, index: number) => (
                              <li key={index}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setSelectedDocument(doc)}>
                          Review
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Document Details Dialog */}
      {selectedDocument && (
        <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedDocument.fileName}</DialogTitle>
              <DialogDescription>
                AI Analysis Results
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Document Info */}
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(selectedDocument.status)}>
                  {selectedDocument.status.toUpperCase()}
                </Badge>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
              
              {selectedDocument.analysis && (
                <>
                  {/* Analysis Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Document Type</h3>
                      <p>{selectedDocument.analysis.documentType.replace('_', ' ').toUpperCase()}</p>
                      <p className="text-sm text-gray-600">
                        Confidence: {Math.round(selectedDocument.analysis.confidence * 100)}%
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Compliance Status</h3>
                      <div className="flex items-center space-x-2">
                        {selectedDocument.analysis.complianceChecks.passed ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-green-600">Passed</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <span className="text-red-600">Failed</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Extracted Data */}
                  <div>
                    <h3 className="font-semibold mb-2">Extracted Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(selectedDocument.analysis.extractedData, null, 2)}
                      </pre>
                    </div>
                  </div>
                  
                  {/* Missing Fields */}
                  {selectedDocument.analysis.missingFields.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-medium mb-2">Missing Required Fields:</p>
                        <ul className="list-disc list-inside">
                          {selectedDocument.analysis.missingFields.map((field: string) => (
                            <li key={field}>{field}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Compliance Issues */}
                  {!selectedDocument.analysis.complianceChecks.passed && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-medium mb-2">Compliance Issues:</p>
                        <ul className="list-disc list-inside">
                          {selectedDocument.analysis.complianceChecks.issues.map((issue: string, index: number) => (
                            <li key={index}>{issue}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
              
              {/* OCR Result */}
              {selectedDocument.ocrResult && (
                <div>
                  <h3 className="font-semibold mb-2">OCR Text Extract</h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">
                      {selectedDocument.ocrResult.text}
                    </pre>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Pages: {selectedDocument.ocrResult.pages} • 
                    Accuracy: {Math.round(selectedDocument.ocrResult.confidence * 100)}%
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}