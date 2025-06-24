import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// URLA Form Schema based on the 1003 Uniform Residential Loan Application
const urlaFormSchema = z.object({
  // Section 1a: Personal Information
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  suffix: z.string().optional(),
  ssn: z.string().min(9, "Social Security Number is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  citizenship: z.enum(['us_citizen', 'permanent_resident', 'non_permanent_resident']),
  
  // Alternate Names
  alternateNames: z.string().optional(),
  
  // Type of Credit
  creditType: z.enum(['individual', 'joint']),
  totalBorrowers: z.string().optional(),
  otherBorrowerNames: z.string().optional(),
  
  // Marital Status & Dependents
  maritalStatus: z.enum(['married', 'separated', 'unmarried']),
  dependentsNumber: z.string().optional(),
  dependentsAges: z.string().optional(),
  
  // Contact Information
  homePhone: z.string().optional(),
  cellPhone: z.string().min(1, "Cell phone is required"),
  workPhone: z.string().optional(),
  workPhoneExt: z.string().optional(),
  email: z.string().email("Valid email is required"),
  
  // Current Address
  currentStreet: z.string().min(1, "Current address is required"),
  currentUnit: z.string().optional(),
  currentCity: z.string().min(1, "City is required"),
  currentState: z.string().min(1, "State is required"),
  currentZip: z.string().min(1, "ZIP code is required"),
  currentCountry: z.string().default("US"),
  currentAddressYears: z.string().default("0"),
  currentAddressMonths: z.string().default("0"),
  currentHousing: z.enum(['own', 'rent', 'no_expense']),
  currentRentAmount: z.string().optional(),
  
  // Former Address (if less than 2 years at current)
  formerStreet: z.string().optional(),
  formerUnit: z.string().optional(),
  formerCity: z.string().optional(),
  formerState: z.string().optional(),
  formerZip: z.string().optional(),
  formerCountry: z.string().optional(),
  formerAddressYears: z.string().optional(),
  formerAddressMonths: z.string().optional(),
  formerHousing: z.enum(['own', 'rent', 'no_expense']).optional(),
  formerRentAmount: z.string().optional(),
  
  // Mailing Address
  differentMailingAddress: z.boolean().default(false),
  mailingStreet: z.string().optional(),
  mailingUnit: z.string().optional(),
  mailingCity: z.string().optional(),
  mailingState: z.string().optional(),
  mailingZip: z.string().optional(),
  mailingCountry: z.string().optional(),
  
  // Section 1b: Current Employment
  employerName: z.string().min(1, "Employer name is required"),
  employerPhone: z.string().optional(),
  employerStreet: z.string().optional(),
  employerUnit: z.string().optional(),
  employerCity: z.string().optional(),
  employerState: z.string().optional(),
  employerZip: z.string().optional(),
  employerCountry: z.string().optional(),
  
  position: z.string().min(1, "Position/Title is required"),
  startDate: z.string().min(1, "Start date is required"),
  workYears: z.string().default("0"),
  workMonths: z.string().default("0"),
  
  // Employment flags
  businessOwner: z.boolean().default(false),
  selfEmployed: z.boolean().default(false),
  familyEmployed: z.boolean().default(false),
  ownershipShare: z.enum(['less_than_25', '25_or_more']).optional(),
  
  // Income
  baseIncome: z.string().default("0"),
  overtimeIncome: z.string().default("0"),
  bonusIncome: z.string().default("0"),
  commissionIncome: z.string().default("0"),
  militaryIncome: z.string().default("0"),
  otherIncome: z.string().default("0"),
  
  // Additional Employment (if applicable)
  additionalEmployment: z.boolean().default(false),
  additionalEmployerName: z.string().optional(),
  additionalEmployerPhone: z.string().optional(),
  additionalPosition: z.string().optional(),
  additionalStartDate: z.string().optional(),
  additionalBaseIncome: z.string().optional(),
  
  // Previous Employment
  previousEmployment: z.boolean().default(false),
  previousEmployerName: z.string().optional(),
  previousPosition: z.string().optional(),
  previousStartDate: z.string().optional(),
  previousEndDate: z.string().optional(),
  previousIncome: z.string().optional(),
  
  // Other Income Sources
  otherIncomeSource1: z.string().optional(),
  otherIncomeAmount1: z.string().optional(),
  otherIncomeSource2: z.string().optional(),
  otherIncomeAmount2: z.string().optional(),
  otherIncomeSource3: z.string().optional(),
  otherIncomeAmount3: z.string().optional(),
  
  // Section 2a: Assets
  checkingAccount1: z.string().optional(),
  checkingInstitution1: z.string().optional(),
  checkingAccountNumber1: z.string().optional(),
  checkingValue1: z.string().optional(),
  
  savingsAccount1: z.string().optional(),
  savingsInstitution1: z.string().optional(),
  savingsAccountNumber1: z.string().optional(),
  savingsValue1: z.string().optional(),
  
  retirementAccount1: z.string().optional(),
  retirementInstitution1: z.string().optional(),
  retirementAccountNumber1: z.string().optional(),
  retirementValue1: z.string().optional(),
  
  // Additional Information
  notes: z.string().optional(),
});

type UrlaForm = z.infer<typeof urlaFormSchema>;

interface UrlaFormProps {
  onSubmit: (data: UrlaForm) => void;
  isLoading?: boolean;
}

export default function UrlaForm({ onSubmit, isLoading }: UrlaFormProps) {
  const form = useForm<UrlaForm>({
    resolver: zodResolver(urlaFormSchema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      ssn: '',
      dateOfBirth: '',
      citizenship: 'us_citizen',
      alternateNames: '',
      creditType: 'individual',
      totalBorrowers: '1',
      otherBorrowerNames: '',
      maritalStatus: 'unmarried',
      dependentsNumber: '0',
      dependentsAges: '',
      homePhone: '',
      cellPhone: '',
      workPhone: '',
      workPhoneExt: '',
      email: '',
      currentStreet: '',
      currentUnit: '',
      currentCity: '',
      currentState: '',
      currentZip: '',
      currentCountry: 'US',
      currentAddressYears: '0',
      currentAddressMonths: '0',
      currentHousing: 'own',
      currentRentAmount: '',
      differentMailingAddress: false,
      employerName: '',
      employerPhone: '',
      position: '',
      startDate: '',
      workYears: '0',
      workMonths: '0',
      businessOwner: false,
      selfEmployed: false,
      familyEmployed: false,
      baseIncome: '0',
      overtimeIncome: '0',
      bonusIncome: '0',
      commissionIncome: '0',
      militaryIncome: '0',
      otherIncome: '0',
      additionalEmployment: false,
      previousEmployment: false,
      notes: '',
    },
  });

  const watchCurrentAddressYears = form.watch('currentAddressYears');
  const needsFormerAddress = parseInt(watchCurrentAddressYears || '0') < 2;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1a: Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Section 1a: Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="middleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Michael" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="suffix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suffix</FormLabel>
                    <FormControl>
                      <Input placeholder="Jr." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* SSN, DOB, Citizenship */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="ssn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Social Security Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="123-45-6789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="citizenship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Citizenship *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select citizenship status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="us_citizen">U.S. Citizen</SelectItem>
                        <SelectItem value="permanent_resident">Permanent Resident Alien</SelectItem>
                        <SelectItem value="non_permanent_resident">Non-Permanent Resident Alien</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Credit Type */}
            <FormField
              control={form.control}
              name="creditType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of Credit *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="individual" id="individual" />
                        <Label htmlFor="individual">I am applying for individual credit</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="joint" id="joint" />
                        <Label htmlFor="joint">I am applying for joint credit</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Marital Status & Dependents */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="maritalStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marital Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select marital status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="separated">Separated</SelectItem>
                        <SelectItem value="unmarried">Unmarried (Single, Divorced, Widowed)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dependentsNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Dependents</FormLabel>
                    <FormControl>
                      <Input placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dependentsAges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dependents Ages</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 5, 8, 12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cellPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cell Phone *</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </div>
          </CardContent>
        </Card>

        {/* Current Address */}
        <Card>
          <CardHeader>
            <CardTitle>Current Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentStreet"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Street Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main Street" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentZip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="10001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentAddressYears"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years at Address</FormLabel>
                    <FormControl>
                      <Input placeholder="2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="currentHousing"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Housing Status *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-row space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="own" id="own" />
                        <Label htmlFor="own">Own</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="rent" id="rent" />
                        <Label htmlFor="rent">Rent</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no_expense" id="no_expense" />
                        <Label htmlFor="no_expense">No Primary Housing Expense</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section 1b: Current Employment */}
        <Card>
          <CardHeader>
            <CardTitle>Section 1b: Current Employment/Self-Employment and Income</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Employer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employer or Business Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC Company Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position or Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Senior Manager" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="workYears"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years in Line of Work</FormLabel>
                    <FormControl>
                      <Input placeholder="5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="workMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Months</FormLabel>
                    <FormControl>
                      <Input placeholder="6" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Employment Flags */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="selfEmployed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Check if you are the Business Owner or Self-Employed</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="familyEmployed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>I am employed by a family member, property seller, real estate agent, or other party to the transaction</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Gross Monthly Income */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Gross Monthly Income</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="baseIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Income</FormLabel>
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
                  name="overtimeIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overtime</FormLabel>
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
                  name="bonusIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bonus</FormLabel>
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
                  name="commissionIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission</FormLabel>
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
                  name="militaryIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Military Entitlements</FormLabel>
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
                  name="otherIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other</FormLabel>
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
          </CardContent>
        </Card>

        {/* Assets Section (Basic) */}
        <Card>
          <CardHeader>
            <CardTitle>Section 2a: Assets - Bank Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="checkingInstitution1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Checking Account - Financial Institution</FormLabel>
                    <FormControl>
                      <Input placeholder="Bank of America" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="checkingValue1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Checking Account Value</FormLabel>
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
                name="savingsInstitution1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Savings Account - Financial Institution</FormLabel>
                    <FormControl>
                      <Input placeholder="Chase Bank" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="savingsValue1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Savings Account Value</FormLabel>
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
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional information that might help with your loan application..."
                      rows={4}
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
            {isLoading ? "Submitting..." : "Submit URLA Application"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export { urlaFormSchema };
export type { UrlaForm };