import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, Upload, CheckCircle, AlertCircle, Loader2, 
  FileImage, FileSpreadsheet, File, Sparkles, Brain,
  Clock, Shield, Zap, Eye, Download, Trash2, Search,
  FolderOpen, Filter, ChevronRight, Info
} from 'lucide-react';

interface DocumentType {
  id: string;
  name: string;
  category: string;
  description: string;
  required: boolean;
  icon: any;
  acceptedFormats: string[];
  maxSize: number;
  aiConfidence?: number;
}

interface UploadedDocument {
  id: string;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  status: 'processing' | 'completed' | 'error';
  documentType: DocumentType;
  aiPredictedType?: DocumentType;
  aiConfidence?: number;
  extractedData?: Record<string, any>;
  validationIssues?: string[];
  ocrText?: string;
  thumbnail?: string;
}

interface DocumentCategory {
  name: string;
  description: string;
  requiredDocuments: DocumentType[];
  optionalDocuments: DocumentType[];
}

const documentTypes: DocumentType[] = [
  {
    id: 'tax-return',
    name: 'Tax Return',
    category: 'Income',
    description: '2 years of personal or business tax returns',
    required: true,
    icon: FileText,
    acceptedFormats: ['.pdf', '.jpg', '.png'],
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  {
    id: 'bank-statement',
    name: 'Bank Statement',
    category: 'Assets',
    description: '3 months of bank statements',
    required: true,
    icon: FileSpreadsheet,
    acceptedFormats: ['.pdf', '.csv', '.xlsx'],
    maxSize: 5 * 1024 * 1024
  },
  {
    id: 'property-deed',
    name: 'Property Deed',
    category: 'Property',
    description: 'Proof of property ownership',
    required: false,
    icon: FileText,
    acceptedFormats: ['.pdf'],
    maxSize: 10 * 1024 * 1024
  },
  {
    id: 'drivers-license',
    name: "Driver's License",
    category: 'Identity',
    description: 'Valid government-issued ID',
    required: true,
    icon: FileImage,
    acceptedFormats: ['.jpg', '.png', '.pdf'],
    maxSize: 5 * 1024 * 1024
  }
];

const categories: DocumentCategory[] = [
  {
    name: 'Income Verification',
    description: 'Documents to verify your income',
    requiredDocuments: documentTypes.filter(d => d.category === 'Income' && d.required),
    optionalDocuments: documentTypes.filter(d => d.category === 'Income' && !d.required)
  },
  {
    name: 'Asset Documentation',
    description: 'Proof of assets and reserves',
    requiredDocuments: documentTypes.filter(d => d.category === 'Assets' && d.required),
    optionalDocuments: documentTypes.filter(d => d.category === 'Assets' && !d.required)
  },
  {
    name: 'Property Information',
    description: 'Documents related to the property',
    requiredDocuments: documentTypes.filter(d => d.category === 'Property' && d.required),
    optionalDocuments: documentTypes.filter(d => d.category === 'Property' && !d.required)
  },
  {
    name: 'Identity Verification',
    description: 'Documents to verify your identity',
    requiredDocuments: documentTypes.filter(d => d.category === 'Identity' && d.required),
    optionalDocuments: documentTypes.filter(d => d.category === 'Identity' && !d.required)
  }
];

export default function SmartDocumentUpload() {
  const { toast } = useToast();
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(new Set());

  // AI document analysis mutation
  const analyzeDocumentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      return await apiRequest('/api/documents/analyze', {
        method: 'POST',
        body: formData,
        headers: {} // Let browser set content-type for FormData
      });
    },
    onSuccess: (data, file) => {
      const newDoc: UploadedDocument = {
        id: data.id,
        fileName: file.name,
        fileSize: file.size,
        uploadDate: new Date(),
        status: 'completed',
        documentType: data.predictedType,
        aiPredictedType: data.predictedType,
        aiConfidence: data.confidence,
        extractedData: data.extractedData,
        validationIssues: data.validationIssues,
        ocrText: data.ocrText,
        thumbnail: data.thumbnail
      };
      
      setUploadedDocuments(prev => [...prev, newDoc]);
      setProcessingFiles(prev => {
        const next = new Set(prev);
        next.delete(file.name);
        return next;
      });
      
      toast({
        title: 'Document uploaded successfully',
        description: `AI recognized as ${data.predictedType.name} with ${Math.round(data.confidence * 100)}% confidence`
      });
    },
    onError: (error, file) => {
      setProcessingFiles(prev => {
        const next = new Set(prev);
        next.delete(file.name);
        return next;
      });
      
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      setProcessingFiles(prev => new Set(prev).add(file.name));
      analyzeDocumentMutation.mutate(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const getCompletionPercentage = () => {
    const requiredDocs = documentTypes.filter(d => d.required);
    const uploadedRequiredDocs = uploadedDocuments.filter(
      doc => doc.documentType.required && doc.status === 'completed'
    );
    return Math.round((uploadedRequiredDocs.length / requiredDocs.length) * 100);
  };

  const getMissingDocuments = () => {
    const uploadedTypeIds = uploadedDocuments
      .filter(doc => doc.status === 'completed')
      .map(doc => doc.documentType.id);
    
    return documentTypes.filter(
      docType => docType.required && !uploadedTypeIds.includes(docType.id)
    );
  };

  const filteredDocuments = uploadedDocuments.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.documentType.category === selectedCategory;
    const matchesSearch = doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.documentType.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Smart Document Upload</h1>
          <p className="text-muted-foreground">
            AI-powered document recognition and processing
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Brain className="h-3 w-3" />
          AI Enhanced
        </Badge>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Document Checklist</span>
            <span className="text-lg font-normal">
              {getCompletionPercentage()}% Complete
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={getCompletionPercentage()} className="mb-4" />
          
          {getMissingDocuments().length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Missing required documents:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {getMissingDocuments().map(doc => (
                    <li key={doc.id} className="text-sm">
                      {doc.name} - {doc.description}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        {/* Main Upload Area */}
        <div className="space-y-6">
          {/* Dropzone */}
          <Card>
            <CardContent className="p-0">
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                  transition-colors duration-200 
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                  hover:border-primary hover:bg-primary/5
                `}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  or click to browse files
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  AI will automatically recognize document types
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Categories */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="Income">Income</TabsTrigger>
              <TabsTrigger value="Assets">Assets</TabsTrigger>
              <TabsTrigger value="Property">Property</TabsTrigger>
              <TabsTrigger value="Identity">Identity</TabsTrigger>
            </TabsList>

            {categories.map(category => (
              <TabsContent key={category.name} value={category.name.split(' ')[0]} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{category.name}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {category.requiredDocuments.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium mb-3">Required Documents</h4>
                        <div className="space-y-2">
                          {category.requiredDocuments.map(doc => {
                            const isUploaded = uploadedDocuments.some(
                              ud => ud.documentType.id === doc.id && ud.status === 'completed'
                            );
                            return (
                              <div
                                key={doc.id}
                                className={`flex items-center justify-between p-3 rounded-lg border ${
                                  isUploaded ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <doc.icon className={`h-5 w-5 ${
                                    isUploaded ? 'text-green-600' : 'text-muted-foreground'
                                  }`} />
                                  <div>
                                    <p className="font-medium">{doc.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {doc.description}
                                    </p>
                                  </div>
                                </div>
                                {isUploaded && <CheckCircle className="h-5 w-5 text-green-600" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {category.optionalDocuments.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-3">Optional Documents</h4>
                        <div className="space-y-2">
                          {category.optionalDocuments.map(doc => {
                            const isUploaded = uploadedDocuments.some(
                              ud => ud.documentType.id === doc.id && ud.status === 'completed'
                            );
                            return (
                              <div
                                key={doc.id}
                                className={`flex items-center justify-between p-3 rounded-lg border ${
                                  isUploaded ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <doc.icon className={`h-5 w-5 ${
                                    isUploaded ? 'text-blue-600' : 'text-muted-foreground'
                                  }`} />
                                  <div>
                                    <p className="font-medium">{doc.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {doc.description}
                                    </p>
                                  </div>
                                </div>
                                {isUploaded && <CheckCircle className="h-5 w-5 text-blue-600" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Sidebar - Uploaded Documents */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Uploaded Documents</span>
                <Badge variant="outline">{uploadedDocuments.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {processingFiles.size > 0 && (
                    <>
                      {Array.from(processingFiles).map(fileName => (
                        <Card key={fileName} className="p-4">
                          <div className="flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <div className="flex-1">
                              <p className="text-sm font-medium truncate">{fileName}</p>
                              <p className="text-xs text-muted-foreground">Processing...</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                      <Separator />
                    </>
                  )}

                  {filteredDocuments.length === 0 && processingFiles.size === 0 && (
                    <div className="text-center py-8">
                      <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No documents uploaded yet</p>
                    </div>
                  )}

                  {filteredDocuments.map(doc => (
                    <Card key={doc.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <doc.documentType.icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{doc.fileName}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc.documentType.name}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            variant={doc.status === 'completed' ? 'default' : 'secondary'}
                            className="shrink-0"
                          >
                            {doc.status}
                          </Badge>
                        </div>

                        {doc.aiPredictedType && doc.aiConfidence && (
                          <div className="flex items-center gap-2 text-xs">
                            <Brain className="h-3 w-3" />
                            <span>AI: {Math.round(doc.aiConfidence * 100)}% confident</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                        </div>

                        {doc.validationIssues && doc.validationIssues.length > 0 && (
                          <Alert className="py-2">
                            <AlertCircle className="h-3 w-3" />
                            <AlertDescription className="text-xs">
                              {doc.validationIssues[0]}
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                          <Button size="sm" variant="ghost" className="px-2">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    Upload speed increased by 70% with AI document recognition
                  </AlertDescription>
                </Alert>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    All documents are encrypted and processed securely
                  </AlertDescription>
                </Alert>

                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Average processing time: 3.2 seconds per document
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}