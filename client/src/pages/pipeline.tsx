import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, getLoanTypeColor, getLoanTypeLabel } from "@/lib/utils";
import type { LoanApplicationWithDetails } from "@shared/schema";

interface PipelineData {
  application: LoanApplicationWithDetails[];
  document_review: LoanApplicationWithDetails[];
  underwriting: LoanApplicationWithDetails[];
  approved: LoanApplicationWithDetails[];
  declined: LoanApplicationWithDetails[];
}

export default function Pipeline() {
  const { data: pipeline, isLoading } = useQuery<PipelineData>({
    queryKey: ['/api/pipeline'],
  });

  const ApplicationCard = ({ app }: { app: LoanApplicationWithDetails }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-text-primary">
          {app.borrower.firstName} {app.borrower.lastName}
        </div>
        <Badge className={getLoanTypeColor(app.loanType)}>
          {getLoanTypeLabel(app.loanType)}
        </Badge>
      </div>
      <div className="text-sm text-text-secondary mb-2">
        {app.property.address}, {app.property.city}
      </div>
      <div className="flex items-center justify-between">
        <div className="font-semibold text-text-primary">
          {formatCurrency(app.requestedAmount)}
        </div>
        <div className="text-xs text-text-secondary">
          {formatDate(app.createdAt)}
        </div>
      </div>
      {app.ltv && (
        <div className="text-xs text-text-secondary mt-1">
          LTV: {parseFloat(app.ltv).toFixed(1)}%
        </div>
      )}
    </div>
  );

  const PipelineColumn = ({ 
    title, 
    applications, 
    color 
  }: { 
    title: string; 
    applications: LoanApplicationWithDetails[]; 
    color: string;
  }) => (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="text-text-primary">{title}</span>
          <Badge className={`${color} text-white`}>
            {applications.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {applications.length === 0 ? (
          <div className="text-center text-text-secondary py-8 text-sm">
            No applications in this stage
          </div>
        ) : (
          applications.map((app) => (
            <ApplicationCard key={app.id} app={app} />
          ))
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <Header 
        title="Loan Pipeline" 
        subtitle="Track applications through each stage of the process"
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-text-secondary">Loading pipeline...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <PipelineColumn
              title="Application"
              applications={pipeline?.application || []}
              color="bg-blue-500"
            />
            <PipelineColumn
              title="Document Review"
              applications={pipeline?.document_review || []}
              color="bg-yellow-500"
            />
            <PipelineColumn
              title="Underwriting"
              applications={pipeline?.underwriting || []}
              color="bg-orange-500"
            />
            <PipelineColumn
              title="Approved"
              applications={pipeline?.approved || []}
              color="bg-green-500"
            />
            <PipelineColumn
              title="Declined"
              applications={pipeline?.declined || []}
              color="bg-red-500"
            />
          </div>
        )}
      </main>
    </>
  );
}
