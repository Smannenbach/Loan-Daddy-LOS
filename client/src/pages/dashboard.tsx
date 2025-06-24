import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  DollarSign,
  ArrowUp,
  ArrowDown,
  Plus,
  Hammer,
  Calculator,
  TrendingUp
} from "lucide-react";
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, getLoanTypeColor, getLoanTypeLabel } from "@/lib/utils";
import { useState } from "react";
import NewLoanModal from "@/components/modals/new-loan-modal";
import type { LoanApplicationWithDetails } from "@shared/schema";

interface DashboardStats {
  activeApplications: number;
  pendingReview: number;
  approvedThisMonth: number;
  totalFunded: string;
  pipelineStats: Record<string, number>;
}

export default function Dashboard() {
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery<LoanApplicationWithDetails[]>({
    queryKey: ['/api/loan-applications'],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/tasks?assignedTo=1'],
  });

  const recentApplications = applications?.slice(0, 3) || [];
  const urgentTasks = tasks?.filter((task: any) => task.status === 'pending').slice(0, 3) || [];

  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle="Welcome back, here's your loan portfolio overview"
        onNewLoan={() => setShowNewLoanModal(true)}
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm font-medium">Active Applications</p>
                  <p className="text-3xl font-bold text-text-primary mt-1">
                    {statsLoading ? '...' : stats?.activeApplications || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="text-primary text-xl" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <ArrowUp className="text-accent mr-1 w-4 h-4" />
                <span className="text-accent font-medium">12%</span>
                <span className="text-text-secondary ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm font-medium">Pending Review</p>
                  <p className="text-3xl font-bold text-text-primary mt-1">
                    {statsLoading ? '...' : stats?.pendingReview || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-warning text-xl" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <ArrowDown className="text-error mr-1 w-4 h-4" />
                <span className="text-error font-medium">3%</span>
                <span className="text-text-secondary ml-1">from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm font-medium">Approved This Month</p>
                  <p className="text-3xl font-bold text-text-primary mt-1">
                    {statsLoading ? '...' : stats?.approvedThisMonth || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-accent text-xl" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <ArrowUp className="text-accent mr-1 w-4 h-4" />
                <span className="text-accent font-medium">8%</span>
                <span className="text-text-secondary ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm font-medium">Total Funded</p>
                  <p className="text-3xl font-bold text-text-primary mt-1">
                    {statsLoading ? '...' : stats?.totalFunded || '$0'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-purple-600 text-xl" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <ArrowUp className="text-accent mr-1 w-4 h-4" />
                <span className="text-accent font-medium">22%</span>
                <span className="text-text-secondary ml-1">year over year</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Applications and Pipeline */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Recent Applications */}
          <Card className="xl:col-span-2">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">Recent Applications</h3>
              <Button variant="ghost" className="text-primary hover:text-primary-dark text-sm font-medium">
                View All
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Borrower
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Loan Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applicationsLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-text-secondary">
                        Loading applications...
                      </td>
                    </tr>
                  ) : recentApplications.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-text-secondary">
                        No applications found
                      </td>
                    </tr>
                  ) : (
                    recentApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                              <span className="text-sm font-medium text-gray-600">
                                {app.borrower.firstName[0]}{app.borrower.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-text-primary">
                                {app.borrower.firstName} {app.borrower.lastName}
                              </div>
                              <div className="text-sm text-text-secondary">
                                {app.borrower.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getLoanTypeColor(app.loanType)}>
                            {getLoanTypeLabel(app.loanType)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-medium">
                          {formatCurrency(app.requestedAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor(app.status)}>
                            {getStatusLabel(app.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                          {formatDate(app.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pipeline Summary */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-text-primary">Pipeline Status</h3>
            </div>
            <div className="p-6 space-y-4">
              {statsLoading ? (
                <div className="text-center text-text-secondary">Loading pipeline...</div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-text-primary">Application</span>
                    </div>
                    <span className="text-sm font-bold text-text-primary">
                      {stats?.pipelineStats.application || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium text-text-primary">Document Review</span>
                    </div>
                    <span className="text-sm font-bold text-text-primary">
                      {stats?.pipelineStats.document_review || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                      <span className="text-sm font-medium text-text-primary">Underwriting</span>
                    </div>
                    <span className="text-sm font-bold text-text-primary">
                      {stats?.pipelineStats.underwriting || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-text-primary">Approved</span>
                    </div>
                    <span className="text-sm font-bold text-text-primary">
                      {stats?.pipelineStats.approved || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium text-text-primary">Declined</span>
                    </div>
                    <span className="text-sm font-bold text-text-primary">
                      {stats?.pipelineStats.declined || 0}
                    </span>
                  </div>
                </>
              )}
              <div className="pt-4 border-t border-gray-200">
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => window.location.href = '/pipeline'}
                >
                  View Full Pipeline
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions and Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-text-primary">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowNewLoanModal(true)}
                  className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                >
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Plus className="text-white text-xl" />
                  </div>
                  <span className="text-sm font-medium text-text-primary text-center">
                    New DSCR Application
                  </span>
                </button>
                <button 
                  onClick={() => setShowNewLoanModal(true)}
                  className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                >
                  <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Hammer className="text-white text-xl" />
                  </div>
                  <span className="text-sm font-medium text-text-primary text-center">
                    New Fix-N-Flip Loan
                  </span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Calculator className="text-white text-xl" />
                  </div>
                  <span className="text-sm font-medium text-text-primary text-center">
                    Loan Calculator
                  </span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group">
                  <div className="w-12 h-12 bg-warning rounded-lg flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <TrendingUp className="text-white text-xl" />
                  </div>
                  <span className="text-sm font-medium text-text-primary text-center">
                    Generate Report
                  </span>
                </button>
              </div>
            </div>
          </Card>

          {/* Tasks & Notifications */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">Tasks & Notifications</h3>
              <Badge className="bg-error text-white">
                {urgentTasks.length}
              </Badge>
            </div>
            <div className="p-6 space-y-4">
              {tasksLoading ? (
                <div className="text-center text-text-secondary">Loading tasks...</div>
              ) : urgentTasks.length === 0 ? (
                <div className="text-center text-text-secondary py-8">
                  No pending tasks
                </div>
              ) : (
                urgentTasks.map((task: any) => (
                  <div key={task.id} className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="w-2 h-2 bg-error rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">{task.title}</p>
                      <p className="text-xs text-text-secondary mt-1">{task.description}</p>
                      {task.dueDate && (
                        <p className="text-xs text-error mt-1">
                          Due: {formatDate(task.dueDate)}
                        </p>
                      )}
                    </div>
                    <button className="text-text-secondary hover:text-text-primary">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
              <div className="pt-2">
                <Button variant="ghost" className="w-full text-primary hover:text-primary-dark text-sm font-medium">
                  View All Tasks
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <NewLoanModal 
        open={showNewLoanModal} 
        onClose={() => setShowNewLoanModal(false)} 
      />
    </>
  );
}
