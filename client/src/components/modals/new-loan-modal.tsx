import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const loanApplicationSchema = z.object({
  loanType: z.enum(['dscr', 'fix-n-flip', 'hard-money', 'commercial-real-estate', 'private-money', 'bridge', 'construction', 'multifamily']),
  borrower: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(1, "Phone number is required"),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }),
  property: z.object({
    address: z.string().min(1, "Property address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().min(1, "ZIP code is required"),
    propertyType: z.string().min(1, "Property type is required"),
    propertyValue: z.string().optional(),
    purchasePrice: z.string().optional(),
    rehabCost: z.string().optional(),
    arv: z.string().optional(),
  }),
  requestedAmount: z.string().min(1, "Loan amount is required"),
  interestRate: z.string().optional(),
  termMonths: z.string().optional(),
  monthlyRent: z.string().optional(),
  monthlyExpenses: z.string().optional(),
  loanPurpose: z.string().optional(),
  exitStrategy: z.string().optional(),
  experienceLevel: z.string().optional(),
  notes: z.string().optional(),
});

type ShortLoanApplicationForm = ShortLoanApplicationFormType;

interface NewLoanModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewLoanModal({ open, onClose }: NewLoanModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LoanApplicationForm>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      loanType: 'dscr',
      borrower: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
      },
      property: {
        address: '',
        city: '',
        state: '',
        zipCode: '',
        propertyType: '',
        propertyValue: '',
        purchasePrice: '',
        rehabCost: '',
        arv: '',
      },
      requestedAmount: '',
      interestRate: '7.5',
      termMonths: '360',
      monthlyRent: '',
      monthlyExpenses: '',
      notes: '',
    },
  });

  const createApplicationMutation = useMutation({
    mutationFn: async (data: LoanApplicationForm) => {
      const response = await apiRequest('POST', '/api/loan-applications', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Loan application created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/loan-applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create loan application",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoanApplicationForm) => {
    createApplicationMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Loan Application</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Loan Type Selection */}
            <FormField
              control={form.control}
              name="loanType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
                    >
                      <div className="flex items-center p-3 border-2 border-gray-200 rounded-lg hover:border-primary">
                        <RadioGroupItem value="dscr" id="dscr" className="mr-2" />
                        <Label htmlFor="dscr" className="flex-1 cursor-pointer">
                          <div className="font-medium text-text-primary text-sm">DSCR</div>
                          <div className="text-xs text-text-secondary">Debt Service Coverage</div>
                        </Label>
                      </div>
                      <div className="flex items-center p-3 border-2 border-gray-200 rounded-lg hover:border-primary">
                        <RadioGroupItem value="fix-n-flip" id="fix-n-flip" className="mr-2" />
                        <Label htmlFor="fix-n-flip" className="flex-1 cursor-pointer">
                          <div className="font-medium text-text-primary text-sm">Fix-N-Flip</div>
                          <div className="text-xs text-text-secondary">Property renovation</div>
                        </Label>
                      </div>
                      <div className="flex items-center p-3 border-2 border-gray-200 rounded-lg hover:border-primary">
                        <RadioGroupItem value="hard-money" id="hard-money" className="mr-2" />
                        <Label htmlFor="hard-money" className="flex-1 cursor-pointer">
                          <div className="font-medium text-text-primary text-sm">Hard Money</div>
                          <div className="text-xs text-text-secondary">Asset-based lending</div>
                        </Label>
                      </div>
                      <div className="flex items-center p-3 border-2 border-gray-200 rounded-lg hover:border-primary">
                        <RadioGroupItem value="commercial-real-estate" id="commercial-real-estate" className="mr-2" />
                        <Label htmlFor="commercial-real-estate" className="flex-1 cursor-pointer">
                          <div className="font-medium text-text-primary text-sm">Commercial RE</div>
                          <div className="text-xs text-text-secondary">Commercial property</div>
                        </Label>
                      </div>
                      <div className="flex items-center p-3 border-2 border-gray-200 rounded-lg hover:border-primary">
                        <RadioGroupItem value="private-money" id="private-money" className="mr-2" />
                        <Label htmlFor="private-money" className="flex-1 cursor-pointer">
                          <div className="font-medium text-text-primary text-sm">Private Money</div>
                          <div className="text-xs text-text-secondary">Private lending</div>
                        </Label>
                      </div>
                      <div className="flex items-center p-3 border-2 border-gray-200 rounded-lg hover:border-primary">
                        <RadioGroupItem value="bridge" id="bridge" className="mr-2" />
                        <Label htmlFor="bridge" className="flex-1 cursor-pointer">
                          <div className="font-medium text-text-primary text-sm">Bridge Loan</div>
                          <div className="text-xs text-text-secondary">Short-term financing</div>
                        </Label>
                      </div>
                      <div className="flex items-center p-3 border-2 border-gray-200 rounded-lg hover:border-primary">
                        <RadioGroupItem value="construction" id="construction" className="mr-2" />
                        <Label htmlFor="construction" className="flex-1 cursor-pointer">
                          <div className="font-medium text-text-primary text-sm">Construction</div>
                          <div className="text-xs text-text-secondary">New construction</div>
                        </Label>
                      </div>
                      <div className="flex items-center p-3 border-2 border-gray-200 rounded-lg hover:border-primary">
                        <RadioGroupItem value="multifamily" id="multifamily" className="mr-2" />
                        <Label htmlFor="multifamily" className="flex-1 cursor-pointer">
                          <div className="font-medium text-text-primary text-sm">Multifamily</div>
                          <div className="text-xs text-text-secondary">Multi-unit property</div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Borrower Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">Borrower Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="borrower.firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="borrower.lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="borrower.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="borrower@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="borrower.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone *</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Loan Amount */}
            <FormField
              control={form.control}
              name="requestedAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requested Loan Amount *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-text-secondary">$</span>
                      <Input
                        type="number"
                        placeholder="0"
                        className="pl-8"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Property Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">Property Information</h3>
              <FormField
                control={form.control}
                name="property.address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="property.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="property.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State *</FormLabel>
                      <FormControl>
                        <Input placeholder="State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="property.zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="property.propertyValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Value</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-text-secondary">$</span>
                          <Input
                            type="number"
                            placeholder="0"
                            className="pl-8"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="property.propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select property type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single-family">Single Family</SelectItem>
                          <SelectItem value="multi-family">Multi-Family</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="condo">Condo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Loan Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">Loan Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="monthlyRent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Rent</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-text-secondary">$</span>
                          <Input
                            type="number"
                            placeholder="0"
                            className="pl-8"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="monthlyExpenses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Expenses</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-text-secondary">$</span>
                          <Input
                            type="number"
                            placeholder="0"
                            className="pl-8"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes or comments"
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createApplicationMutation.isPending}
                className="bg-primary text-white hover:bg-primary-dark"
              >
                {createApplicationMutation.isPending ? "Creating..." : "Create Application"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
