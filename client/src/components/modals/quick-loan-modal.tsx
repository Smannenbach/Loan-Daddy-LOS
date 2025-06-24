import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ShortLoanApplicationForm from "@/components/forms/short-loan-application-form";
import type { ShortLoanApplicationForm as ShortLoanApplicationFormType } from "@/components/forms/short-loan-application-form";

interface QuickLoanModalProps {
  open: boolean;
  onClose: () => void;
}

export default function QuickLoanModal({ open, onClose }: QuickLoanModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createLoanMutation = useMutation({
    mutationFn: async (data: ShortLoanApplicationFormType) => {
      const response = await apiRequest('POST', '/api/short-loan-applications', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Loan application submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/loan-applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit loan application",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ShortLoanApplicationFormType) => {
    createLoanMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Loan Application</DialogTitle>
        </DialogHeader>
        <ShortLoanApplicationForm 
          onSubmit={onSubmit}
          isLoading={createLoanMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}