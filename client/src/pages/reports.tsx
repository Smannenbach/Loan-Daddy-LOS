import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { ChartBar } from "lucide-react";

export default function Reports() {
  return (
    <>
      <Header 
        title="Reports" 
        subtitle="Generate and view loan portfolio reports"
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ChartBar className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Reporting Dashboard
            </h3>
            <p className="text-text-secondary text-center max-w-md">
              Comprehensive reporting tools will be available here. 
              Generate loan summaries, performance metrics, and export data.
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
