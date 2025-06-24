import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator } from "lucide-react";

export default function Underwriting() {
  return (
    <>
      <Header 
        title="Underwriting" 
        subtitle="Review and analyze loan applications"
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calculator className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Underwriting Dashboard
            </h3>
            <p className="text-text-secondary text-center max-w-md">
              Underwriting tools and calculators will be available here. 
              Analyze DSCR ratios, LTV calculations, and risk assessments.
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
