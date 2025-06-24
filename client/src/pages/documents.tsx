import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function Documents() {
  return (
    <>
      <Header 
        title="Documents" 
        subtitle="Manage loan application documents"
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Document Management
            </h3>
            <p className="text-text-secondary text-center max-w-md">
              Document management system will be available here. 
              Upload, organize, and review loan application documents.
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
