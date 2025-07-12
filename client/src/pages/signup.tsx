import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Building2, Check, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import queryClient, { apiRequest } from "@/lib/queryClient";

const signupSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  companyName: z.string().min(2, "Company name is required"),
  nmls: z.string().optional(),
  website: z.string().optional(),
  subdomain: z.string()
    .min(3, "Subdomain must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens"),
  plan: z.enum(['starter', 'professional', 'enterprise'])
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function Signup() {
  const navigate = useNavigate();
  const [subdomainInput, setSubdomainInput] = useState("");
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      plan: 'professional',
      subdomain: ''
    }
  });

  const signupMutation = useMutation({
    mutationFn: (data: SignupForm) => 
      apiRequest("/api/loan-officer/signup", "POST", data),
    onSuccess: (response) => {
      // Redirect to success page or dashboard
      navigate(`/welcome?subdomain=${response.subdomain}`);
    }
  });

  const checkSubdomain = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainAvailable(null);
      return;
    }
    
    setCheckingSubdomain(true);
    try {
      const response = await fetch(`/api/loan-officer/check-subdomain/${subdomain}`);
      const data = await response.json();
      setSubdomainAvailable(data.available);
      if (data.available) {
        form.setValue('subdomain', subdomain);
      }
    } catch (error) {
      setSubdomainAvailable(null);
    }
    setCheckingSubdomain(false);
  };

  const onSubmit = (data: SignupForm) => {
    signupMutation.mutate(data);
  };

  const plans = {
    starter: { name: "Starter", price: "$39.99", color: "bg-gray-100" },
    professional: { name: "Professional", price: "$69.99", color: "bg-indigo-100" },
    enterprise: { name: "Enterprise", price: "$149.99", color: "bg-purple-100" }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/pricing")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Pricing
        </Button>

        <div className="text-center mb-8">
          <Building2 className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Start Your 14-Day Free Trial
          </h1>
          <p className="text-lg text-gray-600">
            Join thousands of loan officers growing their business with LoanGenius
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Your Account</CardTitle>
            <CardDescription>
              Set up your organization and choose your subdomain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
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
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Company Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Company Information</h3>
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nmls"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NMLS ID (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website (Optional)</FormLabel>
                          <FormControl>
                            <Input type="url" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Subdomain */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Choose Your Subdomain</h3>
                  <div>
                    <Label>Your LoanGenius URL</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="relative flex-1">
                        <Input
                          value={subdomainInput}
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                            setSubdomainInput(value);
                            checkSubdomain(value);
                          }}
                          placeholder="yourcompany"
                          className={`pr-10 ${
                            subdomainAvailable === true ? 'border-green-500' : 
                            subdomainAvailable === false ? 'border-red-500' : ''
                          }`}
                        />
                        {checkingSubdomain && (
                          <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-gray-400" />
                        )}
                        {!checkingSubdomain && subdomainAvailable === true && (
                          <Check className="absolute right-3 top-3 w-4 h-4 text-green-500" />
                        )}
                        {!checkingSubdomain && subdomainAvailable === false && (
                          <AlertCircle className="absolute right-3 top-3 w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <span className="text-gray-600">.loangenius.ai</span>
                    </div>
                    {subdomainAvailable === false && (
                      <p className="text-sm text-red-500 mt-1">
                        This subdomain is already taken. Please choose another.
                      </p>
                    )}
                    {subdomainAvailable === true && (
                      <p className="text-sm text-green-600 mt-1">
                        Great! This subdomain is available.
                      </p>
                    )}
                  </div>
                </div>

                {/* Plan Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Select Your Plan</h3>
                  <FormField
                    control={form.control}
                    name="plan"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="space-y-3"
                          >
                            {Object.entries(plans).map(([value, plan]) => (
                              <label
                                key={value}
                                className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                                  field.value === value ? 'border-indigo-600 bg-indigo-50' : ''
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <RadioGroupItem value={value} />
                                  <div>
                                    <div className="font-semibold">{plan.name}</div>
                                    <div className="text-sm text-gray-600">{plan.price}/user/month</div>
                                  </div>
                                </div>
                                {value === 'professional' && (
                                  <Badge variant="secondary">Recommended</Badge>
                                )}
                              </label>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Password */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Set Your Password</h3>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {signupMutation.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {(signupMutation.error as any)?.message || "An error occurred. Please try again."}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={signupMutation.isPending || !subdomainAvailable}
                >
                  {signupMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Start Free Trial"
                  )}
                </Button>

                <p className="text-center text-sm text-gray-600">
                  By signing up, you agree to our{" "}
                  <a href="/terms" className="text-indigo-600 hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-indigo-600 hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-indigo-600 hover:underline font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}