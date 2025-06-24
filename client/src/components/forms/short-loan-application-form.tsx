import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { documentPreFill } from "@/lib/document-prefill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Shorter loan application schema based on the intake forms
const shortLoanApplicationSchema = z.object({
  // Loan Request
  loanType: z.enum(['purchase', 'refinance', 'cash_out_refi', 'fix_flip', 'rehab', 'construction']),
  loanAmount: z.string().min(1, "Loan amount is required"),
  propertyAddress: z.string().min(1, "Property address is required"),
  purchasePrice: z.string().optional(),
  estimatedValue: z.string().min(1, "Estimated value is required"),
  exitStrategy: z.string().min(1, "Exit strategy is required"),
  
  // Borrower Info
  borrowerName: z.string().min(1, "Borrower name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  
  // Experience
  creditScore: z.string().min(1, "Credit score is required"),
  flipsCompleted: z.string().default("0"),
  rentalsOwned: z.string().default("0"),
  isExperienced: z.enum(['yes', 'no']),
  
  // Property Details
  propertyType: z.enum(['sfr', 'duplex', 'triplex_quad', 'commercial', 'land', 'other']),
  numUnits: z.string().default("1"),
  
  // Financial Info
  grossIncome: z.string().optional(),
  netIncome: z.string().optional(),
  liquidityPosition: z.string().optional(),
  
  // Additional Info
  additionalInfo: z.string().optional(),
});

type ShortLoanApplicationForm = z.infer<typeof shortLoanApplicationSchema>;

interface ShortLoanApplicationFormProps {
  onSubmit: (data: ShortLoanApplicationForm) => void;
  isLoading?: boolean;
  loanApplicationId?: number;
}

export default function ShortLoanApplicationForm({ onSubmit, isLoading, loanApplicationId }: ShortLoanApplicationFormProps) {
  // Get pre-filled data if available
  const preFilledData = documentPreFill.getPreFilledData('shortApplication');
  
  const form = useForm<ShortLoanApplicationForm>({
    resolver: zodResolver(shortLoanApplicationSchema),
    defaultValues: {
      // Merge pre-filled data with defaults
      ...{
      loanType: 'purchase',
      loanAmount: '',
      propertyAddress: '',
      purchasePrice: '',
      estimatedValue: '',
      exitStrategy: '',
      borrowerName: '',
      email: '',
      phone: '',
      creditScore: '',
      flipsCompleted: '0',
      rentalsOwned: '0',
      isExperienced: 'no',
      propertyType: 'sfr',
      numUnits: '1',
      grossIncome: '',
      netIncome: '',
      liquidityPosition: '',
      additionalInfo: '',
      },
      ...preFilledData, // Override with pre-filled data
    },
  });

  const handleFormSubmit = (data: ShortLoanApplicationForm) => {
    // Store form data for intelligent pre-filling
    documentPreFill.storeFormData('shortApplication', data);
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Loan Request Section */}
        <Card>
          <CardHeader>
            <CardTitle>Loan Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="loanType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select loan type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="purchase">Purchase</SelectItem>
                        <SelectItem value="refinance">Refinance</SelectItem>
                        <SelectItem value="cash_out_refi">Cash-Out Refinance</SelectItem>
                        <SelectItem value="fix_flip">Fix & Flip</SelectItem>
                        <SelectItem value="rehab">Rehab</SelectItem>
                        <SelectItem value="construction">Construction</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="loanAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Amount Requested *</FormLabel>
                    <FormControl>
                      <Input placeholder="$500,000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="propertyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject Property Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, City, State 12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Price (if applicable)</FormLabel>
                    <FormControl>
                      <Input placeholder="$450,000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Current Value *</FormLabel>
                    <FormControl>
                      <Input placeholder="$500,000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="exitStrategy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exit Strategy - How will loan be repaid? *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g., Refinance with conventional loan, Sale of property, etc."
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Borrower Information */}
        <Card>
          <CardHeader>
            <CardTitle>Borrower Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="borrowerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Borrower/Entity Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe or ABC Investments LLC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Experience & Credit */}
        <Card>
          <CardHeader>
            <CardTitle>Experience & Credit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="creditScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Credit Score *</FormLabel>
                    <FormControl>
                      <Input placeholder="720" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="flipsCompleted"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flips Completed (Last 3 Years)</FormLabel>
                    <FormControl>
                      <Input placeholder="5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rentalsOwned"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rentals Owned (Last 3 Years)</FormLabel>
                    <FormControl>
                      <Input placeholder="3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isExperienced"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Are you an experienced real estate investor? *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="yes">Yes - Experienced</SelectItem>
                      <SelectItem value="no">No - New to investing</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sfr">Single Family Residence</SelectItem>
                        <SelectItem value="duplex">Duplex (2 units)</SelectItem>
                        <SelectItem value="triplex_quad">Triplex/Quadruplex (3-4 units)</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numUnits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Units</FormLabel>
                    <FormControl>
                      <Input placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="grossIncome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gross Monthly Income (if rental)</FormLabel>
                    <FormControl>
                      <Input placeholder="$3,500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="netIncome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Net Monthly Income (if rental)</FormLabel>
                    <FormControl>
                      <Input placeholder="$2,800" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="liquidityPosition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Liquidity Position & Net Worth (Estimate)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g., $500K liquid assets, $2M net worth"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Information</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional details that might help with your loan request..."
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? "Submitting..." : "Submit Application"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export { shortLoanApplicationSchema };
export type { ShortLoanApplicationForm };