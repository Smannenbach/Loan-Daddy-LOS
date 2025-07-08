import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useDropzone } from 'react-dropzone';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Image, 
  File, 
  X,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useCustomerAuth, useCustomerDocuments, useUploadDocument, useDocumentRequirements } from '@/hooks/useCustomerAuth';
import { useToast } from '@/hooks/use-toast';

const DOCUMENT_CATEGORIES = [
  { value: 'income', label: 'Income Documentation' },
  { value: 'assets', label: 'Asset Documentation' },
  { value: 'credit', label: 'Credit Documentation' },
  { value: 'property', label: 'Property Documentation' },
  { value: 'legal', label: 'Legal Documentation' },
  { value: 'other', label: 'Other' },
];

const DOCUMENT_TYPES = {
  income: [
    'Pay Stubs',
    'Tax Returns',
    'Bank Statements',
    'Employment Verification',
    'Profit & Loss Statement',
    'W-2 Forms',
    '1099 Forms',
  ],
  assets: [
    'Bank Statements',
    'Investment Statements',
    'Retirement Account Statements',
    'Asset Verification',
    'Gift Letter',
  ],
  credit: [
    'Credit Report',
    'Explanation of Credit Issues',
    'Bankruptcy Documentation',
    'Payment History',
  ],
  property: [
    'Purchase Agreement',
    'Appraisal',
    'Property Insurance',
    'Property Tax Records',
    'Rent Roll',
    'Lease Agreements',
    'Property Photos',
  ],
  legal: [
    'Articles of Incorporation',
    'Operating Agreement',
    'Business License',
    'Legal Entity Documentation',
  ],
  other: [
    'Other Supporting Documents',
  ],
};

export default function DocumentUpload() {
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [pendingUploads, setPendingUploads] = useState<File[]>([]);
  
  const { customer, isLoading: authLoading } = useCustomerAuth();
  const { documents, isLoading: documentsLoading } = useCustomerDocuments();
  const uploadDocument = useUploadDocument();
  const { requirements } = useDocumentRequirements('dscr'); // Default loan type
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!selectedCategory || !selectedType) {
      toast({
        title: "Please select category and type",
        description: "You must select a document category and type before uploading files.",
        variant: "destructive",
      });
      return;
    }

    setPendingUploads(prev => [...prev, ...acceptedFiles]);
  }, [selectedCategory, selectedType, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
  });

  const handleUpload = async (file: File) => {
    if (!selectedCategory || !selectedType) {
      toast({
        title: "Missing information",
        description: "Please select document category and type.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[file.name] || 0;
          if (currentProgress < 90) {
            return { ...prev, [file.name]: currentProgress + 10 };
          }
          return prev;
        });
      }, 200);

      await uploadDocument.mutateAsync({
        file,
        category: selectedCategory,
        documentType: selectedType,
      });

      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      
      // Remove from pending uploads
      setPendingUploads(prev => prev.filter(f => f.name !== file.name));
      
      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }, 2000);

    } catch (error) {
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[file.name];
        return newProgress;
      });
    }
  };

  const removePendingFile = (fileName: string) => {
    setPendingUploads(prev => prev.filter(f => f.name !== fileName));
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="w-5 h-5 text-blue-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              onClick={() => navigate('/customer/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Document Upload</h1>
                <p className="text-sm text-gray-600">Upload and manage your loan documents</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Document Information</CardTitle>
                <CardDescription>
                  Select the category and type of document you're uploading
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Document Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="type">Document Type</Label>
                    <Select 
                      value={selectedType} 
                      onValueChange={setSelectedType}
                      disabled={!selectedCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedCategory && DOCUMENT_TYPES[selectedCategory as keyof typeof DOCUMENT_TYPES]?.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
                <CardDescription>
                  Drag and drop files here or click to browse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  {isDragActive ? (
                    <p className="text-blue-600">Drop the files here...</p>
                  ) : (
                    <div>
                      <p className="text-gray-600 mb-2">
                        Drag and drop files here, or click to select files
                      </p>
                      <p className="text-sm text-gray-500">
                        Supported formats: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX (max 10MB each)
                      </p>
                    </div>
                  )}
                </div>

                {/* Pending Files */}
                {pendingUploads.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-medium text-gray-900">Files ready to upload:</h4>
                    {pendingUploads.map((file) => (
                      <div key={file.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(file.name)}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpload(file)}
                            disabled={uploadDocument.isPending}
                          >
                            {uploadDocument.isPending ? 'Uploading...' : 'Upload'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removePendingFile(file.name)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Progress */}
                {Object.entries(uploadProgress).map(([fileName, progress]) => (
                  <div key={fileName} className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">{fileName}</span>
                      <span className="text-sm text-blue-600">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Document Requirements & History */}
          <div className="space-y-6">
            {/* Document Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Required Documents</CardTitle>
                <CardDescription>
                  Documents needed for your loan application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {requirements.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{req.documentType}</p>
                        <p className="text-xs text-gray-500">{req.description}</p>
                      </div>
                      <Badge variant={req.isRequired ? 'destructive' : 'secondary'}>
                        {req.isRequired ? 'Required' : 'Optional'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Uploaded Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents</CardTitle>
                <CardDescription>
                  Your uploaded documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documentsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : documents.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No documents uploaded yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(doc.fileName)}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                            <p className="text-xs text-gray-500">{doc.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={doc.isVerified ? 'default' : 'secondary'}>
                            {doc.isVerified ? (
                              <><CheckCircle className="w-3 h-3 mr-1" />Verified</>
                            ) : (
                              <><AlertCircle className="w-3 h-3 mr-1" />Pending</>
                            )}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}