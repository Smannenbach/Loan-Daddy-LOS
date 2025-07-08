import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { CustomerUser } from '@shared/schema';

export function useCustomerAuth() {
  const { data: customer, isLoading } = useQuery({
    queryKey: ['/api/customer/profile'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    customer,
    isLoading,
    isAuthenticated: !!customer?.customer,
  };
}

export function useCustomerLogin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/customer/login', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/customer/profile'], data);
      toast({
        title: "Welcome!",
        description: data.message || "Logged in successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });
}

export function useCustomerSignup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { 
      email: string; 
      password: string; 
      firstName: string; 
      lastName: string; 
      phone?: string; 
    }) => {
      const response = await apiRequest('POST', '/api/customer/signup', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/customer/profile'], data);
      toast({
        title: "Account Created!",
        description: data.message || "Your account has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });
}

export function useCustomerLogout() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/customer/logout');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/customer/profile'], null);
      queryClient.invalidateQueries({ queryKey: ['/api/customer'] });
      toast({
        title: "Logged Out",
        description: data.message || "You have been logged out successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Logout Failed",
        description: error.message || "Failed to log out",
        variant: "destructive",
      });
    },
  });
}

export function useCustomerLoanApplications() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/customer/loan-applications'],
    retry: false,
  });

  return {
    applications: data?.applications || [],
    isLoading,
  };
}

export function useCreateLoanApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/customer/loan-applications', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/customer/loan-applications'] });
      toast({
        title: "Application Created!",
        description: data.message || "Your loan application has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Application Failed",
        description: error.message || "Failed to create loan application",
        variant: "destructive",
      });
    },
  });
}

export function useCustomerDocuments(applicationId?: number) {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/customer/documents', applicationId],
    retry: false,
  });

  return {
    documents: data?.documents || [],
    isLoading,
  };
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { 
      file: File; 
      category: string; 
      documentType: string; 
      applicationId?: number; 
    }) => {
      const formData = new FormData();
      formData.append('document', data.file);
      formData.append('category', data.category);
      formData.append('documentType', data.documentType);
      if (data.applicationId) {
        formData.append('applicationId', data.applicationId.toString());
      }

      const response = await fetch('/api/customer/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/customer/documents'] });
      toast({
        title: "Document Uploaded!",
        description: data.message || "Your document has been uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });
}

export function useDocumentRequirements(loanType: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/customer/document-requirements', loanType],
    enabled: !!loanType,
    retry: false,
  });

  return {
    requirements: data?.requirements || [],
    isLoading,
  };
}