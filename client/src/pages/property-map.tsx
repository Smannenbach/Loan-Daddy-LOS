import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Home, DollarSign, TrendingUp, Search } from 'lucide-react';

interface PropertyMarker {
  lat: number;
  lng: number;
  address: string;
  estimatedValue: number;
  propertyType: string;
  confidence: number;
  walkScore: number;
  marketTrend: number;
}

interface HeatMapData {
  location: google.maps.LatLng;
  weight: number;
}

export default function PropertyMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [heatmap, setHeatmap] = useState<google.maps.visualization.HeatmapLayer | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<PropertyMarker | null>(null);
  const [heatmapType, setHeatmapType] = useState<'value' | 'walkability' | 'trends'>('value');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current || map) return;

    const initMap = () => {
      const mapInstance = new google.maps.Map(mapRef.current!, {
        center: { lat: 45.5152, lng: -122.6784 }, // Portland, OR
        zoom: 12,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      setMap(mapInstance);
      loadNeighborhoodData(mapInstance);
    };

    // Load Google Maps script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBBBEZc_XLQXrCOs4Y4VgpOQdhUqFo4lCE'}&libraries=visualization&callback=initMap`;
      script.async = true;
      script.defer = true;
      (window as any).initMap = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, [map]);

  const loadNeighborhoodData = async (mapInstance: google.maps.Map) => {
    setIsLoading(true);
    try {
      // Load sample neighborhood data for Portland area
      const neighborhoods = [
        { lat: 45.5152, lng: -122.6784, value: 450000, walkScore: 85 },
        { lat: 45.5272, lng: -122.6658, value: 520000, walkScore: 92 },
        { lat: 45.5051, lng: -122.6750, value: 380000, walkScore: 75 },
        { lat: 45.5230, lng: -122.6580, value: 620000, walkScore: 88 },
        { lat: 45.4951, lng: -122.6909, value: 320000, walkScore: 65 },
        { lat: 45.5372, lng: -122.6500, value: 580000, walkScore: 90 },
        { lat: 45.4850, lng: -122.7050, value: 290000, walkScore: 60 }
      ];

      const heatmapData: HeatMapData[] = neighborhoods.map(point => ({
        location: new google.maps.LatLng(point.lat, point.lng),
        weight: getHeatmapWeight(point)
      }));

      const heatmapLayer = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: mapInstance,
        radius: 50,
        opacity: 0.6
      });

      setHeatmap(heatmapLayer);
      updateHeatmapColors();
    } catch (error) {
      console.error('Error loading neighborhood data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHeatmapWeight = (point: any): number => {
    switch (heatmapType) {
      case 'value':
        return point.value / 100000; // Normalize property values
      case 'walkability':
        return point.walkScore / 10; // Normalize walk scores
      case 'trends':
        return Math.random() * 10; // Random trend data for demo
      default:
        return 1;
    }
  };

  const updateHeatmapColors = () => {
    if (!heatmap) return;

    const gradients = {
      value: [
        'rgba(0, 255, 255, 0)',
        'rgba(0, 255, 255, 1)',
        'rgba(0, 191, 255, 1)',
        'rgba(0, 127, 255, 1)',
        'rgba(0, 63, 255, 1)',
        'rgba(0, 0, 255, 1)',
        'rgba(0, 0, 223, 1)',
        'rgba(0, 0, 191, 1)',
        'rgba(0, 0, 159, 1)',
        'rgba(0, 0, 127, 1)',
        'rgba(63, 0, 91, 1)',
        'rgba(127, 0, 63, 1)',
        'rgba(191, 0, 31, 1)',
        'rgba(255, 0, 0, 1)'
      ],
      walkability: [
        'rgba(255, 0, 0, 0)',
        'rgba(255, 0, 0, 1)',
        'rgba(255, 165, 0, 1)',
        'rgba(255, 255, 0, 1)',
        'rgba(0, 255, 0, 1)'
      ],
      trends: [
        'rgba(255, 0, 0, 0)',
        'rgba(255, 255, 0, 1)',
        'rgba(0, 255, 0, 1)',
        'rgba(0, 0, 255, 1)'
      ]
    };

    heatmap.set('gradient', gradients[heatmapType]);
  };

  const searchProperty = async () => {
    if (!searchAddress.trim() || !map) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/property-data?address=${encodeURIComponent(searchAddress)}`);
      const propertyData = await response.json();

      if (propertyData.estimatedValue > 0) {
        // Geocode the address to get coordinates
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: searchAddress }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            const location = results[0].geometry.location;
            
            // Create marker for the property
            const marker = new google.maps.Marker({
              position: location,
              map: map,
              title: propertyData.address,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" fill="#3B82F6" stroke="#1E40AF" stroke-width="2"/>
                    <text x="20" y="25" text-anchor="middle" fill="white" font-size="12" font-weight="bold">$</text>
                  </svg>
                `),
                scaledSize: new google.maps.Size(40, 40)
              }
            });

            // Info window content
            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div class="p-4 min-w-80">
                  <h3 class="font-bold text-lg mb-2">${propertyData.address}</h3>
                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Value:</strong> $${propertyData.estimatedValue.toLocaleString()}</div>
                    <div><strong>Type:</strong> ${propertyData.propertyType}</div>
                    <div><strong>Beds/Baths:</strong> ${propertyData.bedrooms}/${propertyData.bathrooms}</div>
                    <div><strong>Sq Ft:</strong> ${propertyData.squareFootage.toLocaleString()}</div>
                    <div><strong>Walk Score:</strong> ${propertyData.walkScore}/100</div>
                    <div><strong>Confidence:</strong> ${propertyData.confidence}%</div>
                  </div>
                  <div class="mt-3 text-xs text-gray-600">
                    Data: ${propertyData.dataSource.join(', ')}
                  </div>
                </div>
              `
            });

            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });

            setMarkers(prev => [...prev, marker]);
            map.setCenter(location);
            map.setZoom(15);

            setSelectedProperty({
              lat: location.lat(),
              lng: location.lng(),
              address: propertyData.address,
              estimatedValue: propertyData.estimatedValue,
              propertyType: propertyData.propertyType,
              confidence: propertyData.confidence,
              walkScore: propertyData.walkScore,
              marketTrend: propertyData.marketTrends?.priceChangeYearly || 0
            });
          }
        });
      }
    } catch (error) {
      console.error('Error searching property:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeHeatmapType = (type: 'value' | 'walkability' | 'trends') => {
    setHeatmapType(type);
    if (heatmap && map) {
      // Reload heatmap data with new weights
      loadNeighborhoodData(map);
    }
  };

  const clearMarkers = () => {
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);
    setSelectedProperty(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Interactive Property Map</h1>
        <Button onClick={clearMarkers} variant="outline">
          Clear Markers
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Controls */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Address Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Property Address</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  placeholder="Enter address..."
                  onKeyPress={(e) => e.key === 'Enter' && searchProperty()}
                />
                <Button 
                  onClick={searchProperty} 
                  disabled={isLoading}
                  size="sm"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Heatmap Controls */}
            <div className="space-y-2">
              <Label>Heat Map Type</Label>
              <div className="space-y-2">
                <Button
                  variant={heatmapType === 'value' ? 'default' : 'outline'}
                  onClick={() => changeHeatmapType('value')}
                  className="w-full"
                  size="sm"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Property Values
                </Button>
                <Button
                  variant={heatmapType === 'walkability' ? 'default' : 'outline'}
                  onClick={() => changeHeatmapType('walkability')}
                  className="w-full"
                  size="sm"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Walkability
                </Button>
                <Button
                  variant={heatmapType === 'trends' ? 'default' : 'outline'}
                  onClick={() => changeHeatmapType('trends')}
                  className="w-full"
                  size="sm"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Market Trends
                </Button>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2">
              <Label>Heat Map Legend</Label>
              <div className="text-xs space-y-1">
                {heatmapType === 'value' && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-3 bg-blue-500"></div>
                      <span>High Value</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-3 bg-red-500"></div>
                      <span>Low Value</span>
                    </div>
                  </>
                )}
                {heatmapType === 'walkability' && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-3 bg-green-500"></div>
                      <span>Very Walkable</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-3 bg-red-500"></div>
                      <span>Car Dependent</span>
                    </div>
                  </>
                )}
                {heatmapType === 'trends' && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-3 bg-blue-500"></div>
                      <span>Strong Growth</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-3 bg-yellow-500"></div>
                      <span>Stable</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Property Heat Map
              {isLoading && <Badge variant="secondary">Loading...</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              ref={mapRef} 
              className="w-full h-96 bg-gray-200 rounded-lg"
            />
          </CardContent>
        </Card>
      </div>

      {/* Selected Property Details */}
      {selectedProperty && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Selected Property Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Address</Label>
                <p className="font-semibold">{selectedProperty.address}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Estimated Value</Label>
                <p className="font-semibold text-green-600">
                  ${selectedProperty.estimatedValue.toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Property Type</Label>
                <p className="font-semibold">{selectedProperty.propertyType}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Walk Score</Label>
                <p className="font-semibold">{selectedProperty.walkScore}/100</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}