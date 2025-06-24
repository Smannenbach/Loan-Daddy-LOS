import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import UrlaForm from "@/components/forms/urla-form";
import type { UrlaForm as UrlaFormType } from "@/components/forms/urla-form";
import DataCompletenessIndicator from "@/components/ui/data-completeness-indicator";
import { documentPreFill } from "@/lib/document-prefill";

interface FullApplicationModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: any; // Pre-filled data from short form
  loanApplicationId?: number;
}

export default function FullApplicationModal({ 
  open, 
  onClose, 
  initialData, 
  loanApplicationId 
}: FullApplicationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitFullApplicationMutation = useMutation({
    mutationFn: async (data: UrlaFormType) => {
      const payload = {
        ...data,
        loanApplicationId,
        stage: 'full_application'
      };
      
      const response = await apiRequest('POST', '/api/full-loan-applications', payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Full loan application submitted successfully. You'll receive an email with next steps.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/loan-applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit full loan application",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UrlaFormType) => {
    submitFullApplicationMutation.mutate(data);
  };

  // Pre-fill URLA form with data from initial intake
  const getDefaultValues = () => {
    // First store the initial data in the pre-fill service if available
    if (initialData) {
      documentPreFill.storeFormData('shortApplication', initialData);
    }
    
    // Then get the intelligently mapped data for URLA
    return documentPreFill.getPreFilledData('urla');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Full Loan Application (URLA)</DialogTitle>
          <p className="text-sm text-text-secondary mb-4">
            Please complete this comprehensive application to proceed with your loan request.
            Information has been intelligently pre-filled from your previous submissions.
          </p>
          <DataCompletenessIndicator showDetails={false} className="mb-4" />
        </DialogHeader>
        <UrlaForm 
          onSubmit={onSubmit}
          isLoading={submitFullApplicationMutation.isPending}
          defaultValues={getDefaultValues()}
        />
      </DialogContent>
    </Dialog>
  );
}