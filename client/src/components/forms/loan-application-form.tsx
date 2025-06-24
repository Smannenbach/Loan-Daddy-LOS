import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const loanApplicationSchema = z.object({
  loanType: z.enum(['dscr', 'fix-n-flip']),
  borrowerFirstName: z.string().min(1, "First name is required"),
  borrowerLastName: z.string().min(1, "Last name is required"),
  borrowerEmail: z.string().email("Valid email is required"),
  borrowerPhone: z.string().min(1, "Phone number is required"),
  requestedAmount: z.string().min(1, "Loan amount is required"),
  propertyAddress: z.string().min(1, "Property address is required"),
  propertyValue: z.string().optional(),
  propertyType: z.string().min(1, "Property type is required"),
  monthlyRent: z.string().optional(),
  monthlyExpenses: z.string().optional(),
  notes: z.string().optional(),
});

type LoanApplicationForm = z.infer<typeof loanApplicationSchema>;

interface LoanApplicationFormProps {
  onSubmit: (data: LoanApplicationForm) => void;
  isLoading?: boolean;
}

export default function LoanApplicationForm({ onSubmit, isLoading }: LoanApplicationFormProps) {
  const form = useForm<LoanApplicationForm>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      loanType: 'dscr',
      borrowerFirstName: '',
      borrowerLastName: '',
      borrowerEmail: '',
      borrowerPhone: '',
      requestedAmount: '',
      propertyAddress: '',
      propertyValue: '',
      propertyType: '',
      monthlyRent: '',
      monthlyExpenses: '',
      notes: '',
    },
  });

  return (
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
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="flex items-center p-4 border-2 border-gray-200 rounded-lg">
                    <RadioGroupItem value="dscr" id="dscr" className="mr-3" />
                    <Label htmlFor="dscr" className="flex-1">
                      <div className="font-medium">DSCR Loan</div>
                      <div className="text-sm text-gray-500">Debt Service Coverage Ratio</div>
                    </Label>
                  </div>
                  <div className="flex items-center p-4 border-2 border-gray-200 rounded-lg">
                    <RadioGroupItem value="fix-n-flip" id="fix-n-flip" className="mr-3" />
                    <Label htmlFor="fix-n-flip" className="flex-1">
                      <div className="font-medium">Fix-N-Flip</div>
                      <div className="text-sm text-gray-500">Property renovation loan</div>
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Borrower Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="borrowerFirstName"
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
            name="borrowerLastName"
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
            name="borrowerEmail"
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
            name="borrowerPhone"
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

        {/* Loan Amount */}
        <FormField
          control={form.control}
          name="requestedAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requested Loan Amount *</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
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
        <FormField
          control={form.control}
          name="propertyAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Address *</FormLabel>
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
            name="propertyValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Value</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
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
            name="propertyType"
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

        {/* Additional Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="monthlyRent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Rent</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
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
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
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

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-primary text-white hover:bg-primary-dark"
        >
          {isLoading ? "Creating Application..." : "Create Application"}
        </Button>
      </form>
    </Form>
  );
}
