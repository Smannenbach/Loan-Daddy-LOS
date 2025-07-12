import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import GamificationSystem from '@/components/gamification-system';
import OnboardingTour, { useOnboardingTour } from '@/components/onboarding-tour';
import { 
  DollarSign, Users, FileText, TrendingUp, 
  PlusCircle, Calculator, Heart, Upload, HelpCircle
} from 'lucide-react';

export default function LoanOfficerDashboard() {
  const { toast } = useToast();
  const { isActive, startTour } = useOnboardingTour();

  // Check if this is first time user
  useEffect(() => {
    const isFirstTime = !localStorage.getItem('onboardingTourCompleted');
    if (isFirstTime) {
      setTimeout(() => {
        startTour();
      }, 2000);
    }
  }, []);

  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats']
  });

  const { data: applications } = useQuery({
    queryKey: ['/api/loan-applications'],
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Onboarding Tour */}
      <OnboardingTour isActive={isActive} />

      {/* Header with Quick Actions */}
      <div className="flex items-center justify-between" data-tour="dashboard">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your business overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => startTour()} 
            variant="outline" 
            size="sm"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Take Tour
          </Button>
          <Link href="/new-application">
            <Button data-tour="create-loan">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Application
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/property-tax-calculator">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Property Tax Calculator
              </CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">AI-Powered</div>
              <p className="text-xs text-muted-foreground">
                Real-time tax analysis with predictions
              </p>
              <Badge variant="secondary" className="mt-2">New Feature</Badge>
            </CardContent>
          </Card>
        </Link>

        <Link href="/financial-health">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Financial Health
              </CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Score: 82</div>
              <Progress value={82} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                AI recommendations available
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/smart-document-upload">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" data-tour="documents">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Document Upload
              </CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Smart AI</div>
              <p className="text-xs text-muted-foreground">
                Auto-recognition & categorization
              </p>
              <Badge variant="secondary" className="mt-2">Enhanced</Badge>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.totalRevenue?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Loan Applications</CardTitle>
            <CardDescription>
              Your latest loan applications and their current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applications?.slice(0, 5).map((app: any) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {app.borrower?.firstName} {app.borrower?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ${app.loanAmount?.toLocaleString()} - {app.loanType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      app.status === 'approved' ? 'default' :
                      app.status === 'pending' ? 'secondary' :
                      app.status === 'review' ? 'outline' :
                      'destructive'
                    }>
                      {app.status}
                    </Badge>
                    <Link href={`/pipeline?id=${app.id}`}>
                      <Button size="sm" variant="ghost">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gamification System */}
        <div data-tour="gamification">
          <GamificationSystem />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Loans</p>
                <p className="text-2xl font-bold">{stats?.activeLoanCount || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Borrowers</p>
                <p className="text-2xl font-bold">{stats?.totalBorrowers || 0}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approval Rate</p>
                <p className="text-2xl font-bold">{stats?.approvalRate || 0}%</p>
              </div>
              <Badge variant="default" className="text-lg">Good</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Processing</p>
                <p className="text-2xl font-bold">{stats?.avgProcessingDays || 0} days</p>
              </div>
              <Badge variant="secondary" className="text-lg">Fast</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant Widget */}
      <div className="fixed bottom-6 right-6 z-50" data-tour="ai-assistant">
        <Button 
          size="lg" 
          className="rounded-full h-14 w-14 shadow-lg"
          onClick={() => toast({
            title: "AI Assistant",
            description: "How can I help you today?"
          })}
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}