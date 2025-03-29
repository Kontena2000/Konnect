import React, { useState, useEffect } from 'react';
import { fetchClimateData } from '@/services/climateDataService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LocationSelectorProps {
  onLocationSelected: (locationData: any) => void;
}

export function LocationSelector({ onLocationSelected }: LocationSelectorProps) {
  const [location, setLocation] = useState({
    coordinates: { lat: 37.7749, lng: -122.4194 }, // Default - San Francisco
    address: '',
    altitude: 0
  });
  const [climateData, setClimateData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // When coordinates change, fetch climate data
  useEffect(() => {
    async function getClimateData() {
      setLoading(true);
      try {
        const data = await fetchClimateData(
          location.coordinates.lat,
          location.coordinates.lng
        );
        setClimateData(data);
        
        // Pass complete location data to parent
        onLocationSelected({
          ...location,
          climateData: data
        });
      } catch (error) {
        console.error('Error fetching climate data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    getClimateData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.coordinates]); // Only depend on coordinates changing
  
  // Handle address input
  const handleAddressSearch = async () => {
    // Geocoding logic would go here
    // For now, just an example updating coordinates
    setLocation({
      ...location,
      coordinates: { lat: 40.7128, lng: -74.0060 } // New York
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Installation Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="text"
            placeholder="Enter address or city"
            value={location.address}
            onChange={(e) => setLocation({...location, address: e.target.value})}
            className="flex-1"
          />
          <Button onClick={handleAddressSearch}>Search</Button>
        </div>
        
        <div className="border rounded-lg h-[300px] bg-muted flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Map functionality coming soon</p>
            <p className="text-xs mt-1">Click to select location</p>
          </div>
        </div>
        
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ) : climateData ? (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Climate Data</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background p-3 rounded-lg border">
                <div className="text-sm text-muted-foreground">Climate Zone</div>
                <div className="text-lg font-medium">{climateData.zone}</div>
              </div>
              <div className="bg-background p-3 rounded-lg border">
                <div className="text-sm text-muted-foreground">Avg. Temperature</div>
                <div className="text-lg font-medium">{climateData.avgTemperature.toFixed(1)}°C</div>
              </div>
              <div className="bg-background p-3 rounded-lg border">
                <div className="text-sm text-muted-foreground">Humidity</div>
                <div className="text-lg font-medium">{climateData.humidity.toFixed(0)}%</div>
              </div>
              <div className="bg-background p-3 rounded-lg border">
                <div className="text-sm text-muted-foreground">Altitude</div>
                <div className="text-lg font-medium">{location.altitude} m</div>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}