import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, ArrowRight, CheckCircle, Home, DollarSign, 
  FileText, User, Building2, Calculator, Loader2 
} from 'lucide-react';

interface ApplicationData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ssn: string;
  dateOfBirth: string;
  
  // Property Information
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  propertyType: string;
  propertyUse: string;
  purchasePrice: string;
  downPayment: string;
  
  // Loan Information
  loanType: string;
  loanAmount: string;
  loanPurpose: string;
  creditScore: string;
  
  // Income Information
  employmentStatus: string;
  annualIncome: string;
  monthlyDebts: string;
  
  // Additional Information
  hasCoApplicant: boolean;
  additionalNotes: string;
}

const initialData: ApplicationData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  ssn: '',
  dateOfBirth: '',
  propertyAddress: '',
  propertyCity: '',
  propertyState: '',
  propertyZip: '',
  propertyType: '',
  propertyUse: '',
  purchasePrice: '',
  downPayment: '',
  loanType: '',
  loanAmount: '',
  loanPurpose: '',
  creditScore: '',
  employmentStatus: '',
  annualIncome: '',
  monthlyDebts: '',
  hasCoApplicant: false,
  additionalNotes: ''
};

const steps = [
  { id: 1, name: 'Personal Info', icon: User },
  { id: 2, name: 'Property Details', icon: Home },
  { id: 3, name: 'Loan Information', icon: DollarSign },
  { id: 4, name: 'Financial Info', icon: Calculator },
  { id: 5, name: 'Review & Submit', icon: CheckCircle }
];

export default function BorrowerApplication() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ApplicationData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const token = localStorage.getItem('borrowerToken');
  const borrowerData = JSON.parse(localStorage.getItem('borrowerData') || '{}');
  
  // Pre-fill email and name from borrower data
  if (borrowerData.email && !formData.email) {
    setFormData(prev => ({
      ...prev,
      email: borrowerData.email,
      firstName: borrowerData.firstName || '',
      lastName: borrowerData.lastName || ''
    }));
  }

  const submitMutation = useMutation({
    mutationFn: async (data: ApplicationData) => {
      const response = await fetch('/api/borrower/loan-applications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit application');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Success!',
        description: 'Your loan application has been submitted successfully.'
      });
      // Redirect to dashboard after successful submission
      setLocation('/borrower-dashboard');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application',
        variant: 'destructive'
      });
    }
  });

  const updateField = (field: keyof ApplicationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        if (!formData.firstName) newErrors.firstName = 'First name is required';
        if (!formData.lastName) newErrors.lastName = 'Last name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.phone) newErrors.phone = 'Phone number is required';
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        break;
      case 2:
        if (!formData.propertyAddress) newErrors.propertyAddress = 'Property address is required';
        if (!formData.propertyCity) newErrors.propertyCity = 'City is required';
        if (!formData.propertyState) newErrors.propertyState = 'State is required';
        if (!formData.propertyZip) newErrors.propertyZip = 'ZIP code is required';
        if (!formData.propertyType) newErrors.propertyType = 'Property type is required';
        if (!formData.propertyUse) newErrors.propertyUse = 'Property use is required';
        break;
      case 3:
        if (!formData.loanType) newErrors.loanType = 'Loan type is required';
        if (!formData.loanAmount) newErrors.loanAmount = 'Loan amount is required';
        if (!formData.loanPurpose) newErrors.loanPurpose = 'Loan purpose is required';
        if (!formData.creditScore) newErrors.creditScore = 'Credit score is required';
        break;
      case 4:
        if (!formData.employmentStatus) newErrors.employmentStatus = 'Employment status is required';
        if (!formData.annualIncome) newErrors.annualIncome = 'Annual income is required';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (validateStep(4)) {
      submitMutation.mutate(formData);
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/borrower-portal')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Portal
          </Button>
          
          <div className="flex items-center gap-4 mb-6">
            <Building2 className="h-10 w-10 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Loan Application</h1>
              <p className="text-gray-600">Complete your application in just a few steps</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center ${
                      step.id <= currentStep ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step.id <= currentStep ? 'bg-blue-100' : 'bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs mt-1 hidden sm:block">{step.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].name}</CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Please provide your personal information'}
              {currentStep === 2 && 'Tell us about the property you want to finance'}
              {currentStep === 3 && 'Specify your loan requirements'}
              {currentStep === 4 && 'Share your financial information'}
              {currentStep === 5 && 'Review your application before submitting'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                      className={errors.firstName ? 'border-red-500' : ''}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                      className={errors.lastName ? 'border-red-500' : ''}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="(123) 456-7890"
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ssn">Social Security Number</Label>
                    <Input
                      id="ssn"
                      type="password"
                      value={formData.ssn}
                      onChange={(e) => updateField('ssn', e.target.value)}
                      placeholder="XXX-XX-XXXX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => updateField('dateOfBirth', e.target.value)}
                      className={errors.dateOfBirth ? 'border-red-500' : ''}
                    />
                    {errors.dateOfBirth && (
                      <p className="text-sm text-red-500 mt-1">{errors.dateOfBirth}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Property Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="propertyAddress">Property Address *</Label>
                  <Input
                    id="propertyAddress"
                    value={formData.propertyAddress}
                    onChange={(e) => updateField('propertyAddress', e.target.value)}
                    placeholder="123 Main Street"
                    className={errors.propertyAddress ? 'border-red-500' : ''}
                  />
                  {errors.propertyAddress && (
                    <p className="text-sm text-red-500 mt-1">{errors.propertyAddress}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="propertyCity">City *</Label>
                    <Input
                      id="propertyCity"
                      value={formData.propertyCity}
                      onChange={(e) => updateField('propertyCity', e.target.value)}
                      className={errors.propertyCity ? 'border-red-500' : ''}
                    />
                    {errors.propertyCity && (
                      <p className="text-sm text-red-500 mt-1">{errors.propertyCity}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="propertyState">State *</Label>
                    <Select 
                      value={formData.propertyState} 
                      onValueChange={(value) => updateField('propertyState', value)}
                    >
                      <SelectTrigger className={errors.propertyState ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CA">California</SelectItem>
                        <SelectItem value="TX">Texas</SelectItem>
                        <SelectItem value="FL">Florida</SelectItem>
                        <SelectItem value="NY">New York</SelectItem>
                        {/* Add more states */}
                      </SelectContent>
                    </Select>
                    {errors.propertyState && (
                      <p className="text-sm text-red-500 mt-1">{errors.propertyState}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="propertyZip">ZIP Code *</Label>
                    <Input
                      id="propertyZip"
                      value={formData.propertyZip}
                      onChange={(e) => updateField('propertyZip', e.target.value)}
                      className={errors.propertyZip ? 'border-red-500' : ''}
                    />
                    {errors.propertyZip && (
                      <p className="text-sm text-red-500 mt-1">{errors.propertyZip}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="propertyType">Property Type *</Label>
                    <Select 
                      value={formData.propertyType} 
                      onValueChange={(value) => updateField('propertyType', value)}
                    >
                      <SelectTrigger className={errors.propertyType ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single_family">Single Family Home</SelectItem>
                        <SelectItem value="multi_family">Multi-Family</SelectItem>
                        <SelectItem value="condo">Condominium</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.propertyType && (
                      <p className="text-sm text-red-500 mt-1">{errors.propertyType}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="propertyUse">Property Use *</Label>
                    <Select 
                      value={formData.propertyUse} 
                      onValueChange={(value) => updateField('propertyUse', value)}
                    >
                      <SelectTrigger className={errors.propertyUse ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select property use" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary_residence">Primary Residence</SelectItem>
                        <SelectItem value="investment">Investment Property</SelectItem>
                        <SelectItem value="second_home">Second Home</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.propertyUse && (
                      <p className="text-sm text-red-500 mt-1">{errors.propertyUse}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchasePrice">Purchase Price</Label>
                    <Input
                      id="purchasePrice"
                      type="number"
                      value={formData.purchasePrice}
                      onChange={(e) => updateField('purchasePrice', e.target.value)}
                      placeholder="$500,000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="downPayment">Down Payment</Label>
                    <Input
                      id="downPayment"
                      type="number"
                      value={formData.downPayment}
                      onChange={(e) => updateField('downPayment', e.target.value)}
                      placeholder="$100,000"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Loan Information */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="loanType">Loan Type *</Label>
                  <Select 
                    value={formData.loanType} 
                    onValueChange={(value) => updateField('loanType', value)}
                  >
                    <SelectTrigger className={errors.loanType ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select loan type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dscr">DSCR Loan</SelectItem>
                      <SelectItem value="fix_flip">Fix & Flip</SelectItem>
                      <SelectItem value="bridge">Bridge Loan</SelectItem>
                      <SelectItem value="commercial">Commercial Loan</SelectItem>
                      <SelectItem value="conventional">Conventional</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.loanType && (
                    <p className="text-sm text-red-500 mt-1">{errors.loanType}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="loanPurpose">Loan Purpose *</Label>
                  <Select 
                    value={formData.loanPurpose} 
                    onValueChange={(value) => updateField('loanPurpose', value)}
                  >
                    <SelectTrigger className={errors.loanPurpose ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select loan purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="refinance">Refinance</SelectItem>
                      <SelectItem value="cash_out">Cash-Out Refinance</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.loanPurpose && (
                    <p className="text-sm text-red-500 mt-1">{errors.loanPurpose}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="loanAmount">Loan Amount *</Label>
                    <Input
                      id="loanAmount"
                      type="number"
                      value={formData.loanAmount}
                      onChange={(e) => updateField('loanAmount', e.target.value)}
                      placeholder="$400,000"
                      className={errors.loanAmount ? 'border-red-500' : ''}
                    />
                    {errors.loanAmount && (
                      <p className="text-sm text-red-500 mt-1">{errors.loanAmount}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="creditScore">Estimated Credit Score *</Label>
                    <Select 
                      value={formData.creditScore} 
                      onValueChange={(value) => updateField('creditScore', value)}
                    >
                      <SelectTrigger className={errors.creditScore ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select credit range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent (740+)</SelectItem>
                        <SelectItem value="good">Good (680-739)</SelectItem>
                        <SelectItem value="fair">Fair (620-679)</SelectItem>
                        <SelectItem value="poor">Poor (Below 620)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.creditScore && (
                      <p className="text-sm text-red-500 mt-1">{errors.creditScore}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Financial Information */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employmentStatus">Employment Status *</Label>
                  <Select 
                    value={formData.employmentStatus} 
                    onValueChange={(value) => updateField('employmentStatus', value)}
                  >
                    <SelectTrigger className={errors.employmentStatus ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select employment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employed">Employed</SelectItem>
                      <SelectItem value="self_employed">Self-Employed</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.employmentStatus && (
                    <p className="text-sm text-red-500 mt-1">{errors.employmentStatus}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="annualIncome">Annual Income *</Label>
                    <Input
                      id="annualIncome"
                      type="number"
                      value={formData.annualIncome}
                      onChange={(e) => updateField('annualIncome', e.target.value)}
                      placeholder="$100,000"
                      className={errors.annualIncome ? 'border-red-500' : ''}
                    />
                    {errors.annualIncome && (
                      <p className="text-sm text-red-500 mt-1">{errors.annualIncome}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="monthlyDebts">Monthly Debts</Label>
                    <Input
                      id="monthlyDebts"
                      type="number"
                      value={formData.monthlyDebts}
                      onChange={(e) => updateField('monthlyDebts', e.target.value)}
                      placeholder="$2,000"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="additionalNotes">Additional Information</Label>
                  <Textarea
                    id="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={(e) => updateField('additionalNotes', e.target.value)}
                    placeholder="Any additional information you'd like to share..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Step 5: Review & Submit */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Please review your information before submitting. You can go back to any section to make changes.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-600">Name:</p>
                      <p>{formData.firstName} {formData.lastName}</p>
                      <p className="text-gray-600">Email:</p>
                      <p>{formData.email}</p>
                      <p className="text-gray-600">Phone:</p>
                      <p>{formData.phone}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Property Details</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-600">Address:</p>
                      <p>{formData.propertyAddress}, {formData.propertyCity}, {formData.propertyState} {formData.propertyZip}</p>
                      <p className="text-gray-600">Type:</p>
                      <p>{formData.propertyType?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Loan Information</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-600">Loan Type:</p>
                      <p>{formData.loanType?.toUpperCase()}</p>
                      <p className="text-gray-600">Amount:</p>
                      <p>${formData.loanAmount}</p>
                      <p className="text-gray-600">Purpose:</p>
                      <p>{formData.loanPurpose?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              {currentStep < 5 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}