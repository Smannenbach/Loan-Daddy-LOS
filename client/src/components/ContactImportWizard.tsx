import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  ExternalLink, 
  Building2, 
  MapPin, 
  Users, 
  CheckCircle,
  Import,
  Sparkles,
  ArrowRight,
  ArrowLeft
} from "lucide-react";

interface ContactImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (query: string) => void;
  onImport: (profileIds: number[]) => void;
  searchResults: any[];
  isSearching: boolean;
  isImporting: boolean;
  step: number;
  onStepChange: (step: number) => void;
  selectedProfiles: number[];
  onProfileToggle: (profileId: number) => void;
}

export function ContactImportWizard({
  open,
  onOpenChange,
  onSearch,
  onImport,
  searchResults,
  isSearching,
  isImporting,
  step,
  onStepChange,
  selectedProfiles,
  onProfileToggle,
}: ContactImportWizardProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      onStepChange(2);
    }
  };

  const handleImport = () => {
    if (selectedProfiles.length > 0) {
      onStepChange(3);
      onImport(selectedProfiles);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExternalLink className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Import from LinkedIn</h3>
        <p className="text-gray-600">Search for professionals and add them to your contact list</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="search">Search LinkedIn Profiles</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="search"
              placeholder="e.g., 'real estate agent Los Angeles' or 'loan officer'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={!searchQuery.trim() || isSearching}>
              <Search className="w-4 h-4 mr-2" />
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Search Tips:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Use job titles: "loan officer", "real estate agent", "mortgage broker"</li>
            <li>• Add locations: "San Francisco", "New York", "remote"</li>
            <li>• Include company names: "Wells Fargo", "RE/MAX", "Quicken Loans"</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Select Contacts to Import</h3>
        <Badge variant="secondary">{selectedProfiles.length} selected</Badge>
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-3">
          {searchResults.map((profile) => (
            <Card key={profile.id} className="p-4">
              <div className="flex items-start space-x-4">
                <Checkbox
                  checked={selectedProfiles.includes(profile.id)}
                  onCheckedChange={() => onProfileToggle(profile.id)}
                />
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{profile.firstName} {profile.lastName}</h4>
                      <p className="text-sm text-gray-600">{profile.headline}</p>
                      
                      {profile.currentPosition && (
                        <div className="flex items-center gap-1 mt-1">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {profile.currentPosition.title} at {profile.currentPosition.company}
                          </span>
                        </div>
                      )}
                      
                      {profile.location && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{profile.location}</span>
                        </div>
                      )}
                    </div>
                    
                    <Badge variant="outline" className="text-xs">
                      {profile.connectionLevel || 'Public'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => onStepChange(1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={handleImport} 
          disabled={selectedProfiles.length === 0 || isImporting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Import className="w-4 h-4 mr-2" />
          Import {selectedProfiles.length} Contact{selectedProfiles.length !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        {isImporting ? (
          <Sparkles className="w-8 h-8 text-green-600 animate-spin" />
        ) : (
          <CheckCircle className="w-8 h-8 text-green-600" />
        )}
      </div>
      
      <div>
        <h3 className="text-xl font-semibold mb-2">
          {isImporting ? 'Importing Contacts...' : 'Import Complete!'}
        </h3>
        <p className="text-gray-600">
          {isImporting 
            ? 'We\'re adding your selected contacts to your CRM.'
            : `Successfully imported ${selectedProfiles.length} contacts from LinkedIn.`
          }
        </p>
      </div>

      {isImporting && (
        <Progress value={65} className="w-full" />
      )}

      {!isImporting && (
        <Button onClick={() => onOpenChange(false)} className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="w-4 h-4 mr-2" />
          Done
        </Button>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-blue-600" />
            LinkedIn Contact Import
          </DialogTitle>
        </DialogHeader>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Step {step} of 3</span>
            <span className="text-sm text-gray-500">{Math.round((step / 3) * 100)}% Complete</span>
          </div>
          <Progress value={(step / 3) * 100} className="w-full" />
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </DialogContent>
    </Dialog>
  );
}