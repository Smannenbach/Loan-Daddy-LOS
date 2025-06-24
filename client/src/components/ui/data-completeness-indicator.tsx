import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { documentPreFill } from "@/lib/document-prefill";

interface DataCompletenessIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export default function DataCompletenessIndicator({ 
  className = "", 
  showDetails = false 
}: DataCompletenessIndicatorProps) {
  const completeness = documentPreFill.getDataCompleteness();
  
  const getCompletenessStatus = () => {
    if (completeness >= 80) return { color: 'text-green-600', icon: CheckCircle, label: 'Excellent', variant: 'default' as const };
    if (completeness >= 60) return { color: 'text-yellow-600', icon: Clock, label: 'Good', variant: 'secondary' as const };
    return { color: 'text-red-600', icon: AlertCircle, label: 'Needs Work', variant: 'destructive' as const };
  };

  const status = getCompletenessStatus();
  const StatusIcon = status.icon;

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <StatusIcon className={`w-4 h-4 ${status.color}`} />
        <span className="text-sm font-medium">Data Completeness: {completeness}%</span>
        <Badge variant={status.variant} className="text-xs">
          {status.label}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-base">
          <StatusIcon className={`w-5 h-5 ${status.color}`} />
          <span>Application Data Completeness</span>
          <Badge variant={status.variant}>
            {status.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Completeness</span>
              <span className="font-semibold">{completeness}%</span>
            </div>
            <Progress value={completeness} className="h-2" />
          </div>
          
          <div className="text-xs text-text-secondary">
            {completeness >= 80 && (
              <p>Your application data is comprehensive. Forms will be pre-filled with high accuracy.</p>
            )}
            {completeness >= 60 && completeness < 80 && (
              <p>Good data coverage. Most fields will be pre-filled, but some manual entry may be needed.</p>
            )}
            {completeness < 60 && (
              <p>Limited data available. Consider completing more forms to improve pre-filling accuracy.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}