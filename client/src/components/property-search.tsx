import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Search, MapPin, Building, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface PropertySearchProps {
  onPropertySelect: (property: any) => void;
  placeholder?: string;
  showFullDetails?: boolean;
}

interface PropertyData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  propertyType: string;
  estimatedValue: number;
  yearBuilt: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  lotSize: number;
  zoning: string;
  coordinates: { lat: number; lng: number };
  confidence: number;
  marketAnalysis: {
    pricePerSqft: number;
    medianNeighborhoodValue: number;
    yearOverYearChange: number;
    marketTrend: 'up' | 'down' | 'stable';
  };
  propertyTaxes: {
    annualAmount: number;
    monthlyAmount: number;
    effectiveRate: number;
    assessedValue: number;
    exemptions: number;
  };
}

export default function PropertySearch({ 
  onPropertySelect, 
  placeholder = "Enter property address...",
  showFullDetails = false
}: PropertySearchProps) {
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyData | null>(null);
  const { toast } = useToast();

  const searchMutation = useMutation({
    mutationFn: async (searchAddress: string) => {
      const response = await fetch(`/api/property-data?address=${encodeURIComponent(searchAddress)}&searchType=unit`);
      if (!response.ok) {
        throw new Error('Failed to fetch property data');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSelectedProperty(data);
      onPropertySelect(data);
      setShowSuggestions(false);
      toast({
        title: "Property Found",
        description: `Found data for ${data.address}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Address autocomplete
  useEffect(() => {
    if (address.length > 3) {
      const timeoutId = setTimeout(() => {
        fetchAddressSuggestions(address);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [address]);

  const fetchAddressSuggestions = async (query: string) => {
    try {
      const response = await fetch(`/api/address-autocomplete?input=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.suggestions) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
    }
  };

  const handleSearch = () => {
    if (!address.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter a property address to search",
        variant: "destructive",
      });
      return;
    }
    setShowSuggestions(false);
    searchMutation.mutate(address.trim());
  };

  const handleSuggestionClick = (suggestion: string) => {
    setAddress(suggestion);
    setShowSuggestions(false);
    searchMutation.mutate(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder={placeholder}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pr-10"
            />
            <MapPin className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          <Button 
            onClick={handleSearch}
            disabled={searchMutation.isPending}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            {searchMutation.isPending ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Address Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto">
            <CardContent className="p-0">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{suggestion}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Selected Property Display */}
      {selectedProperty && showFullDetails && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{selectedProperty.address}</h3>
                <p className="text-sm text-gray-600">
                  {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zipCode}
                </p>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                {selectedProperty.confidence}% confidence
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium mb-1">Estimated Value</div>
                <div className="text-lg font-bold">${selectedProperty.estimatedValue.toLocaleString()}</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-sm font-medium mb-1">Year Built</div>
                <div className="text-lg font-bold">{selectedProperty.yearBuilt}</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-sm font-medium mb-1">Square Footage</div>
                <div className="text-lg font-bold">{selectedProperty.squareFootage.toLocaleString()}</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-sm font-medium mb-1">Property Type</div>
                <div className="text-lg font-bold">{selectedProperty.propertyType}</div>
              </div>
            </div>

            {selectedProperty.propertyTaxes && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium mb-2">Property Tax Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Annual Tax: </span>
                    <span className="font-medium">${selectedProperty.propertyTaxes.annualAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Monthly Tax: </span>
                    <span className="font-medium">${selectedProperty.propertyTaxes.monthlyAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Effective Rate: </span>
                    <span className="font-medium">{selectedProperty.propertyTaxes.effectiveRate.toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Assessed Value: </span>
                    <span className="font-medium">${selectedProperty.propertyTaxes.assessedValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}