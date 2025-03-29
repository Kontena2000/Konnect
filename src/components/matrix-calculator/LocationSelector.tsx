import React, { useState, useEffect } from 'react';
import { fetchClimateData } from '@/services/climateDataService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

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
  const [error, setError] = useState<string | null>(null);
  
  // When coordinates change, fetch climate data
  useEffect(() => {
    async function getClimateData() {
      setLoading(true);
      setError(null);
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
        setError('Unable to fetch climate data. Calculations will proceed without location adjustments.');
        // Still pass basic location data without climate info
        onLocationSelected({
          ...location,
          climateData: null
        });
      } finally {
        setLoading(false);
      }
    }
    
    getClimateData();
  }, [location, onLocationSelected]); // Include location and onLocationSelected in dependencies
  
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
        <CardTitle className='flex items-center gap-2'>
          <MapPin className='h-5 w-5' />
          Installation Location
          <Badge variant='outline' className='ml-2 bg-yellow-100 text-yellow-800 border-yellow-300'>
            BETA
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {error && (
          <div className='p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2 text-yellow-800'>
            <AlertTriangle className='h-5 w-5 flex-shrink-0 mt-0.5' />
            <div>
              <p className='text-sm'>{error}</p>
              <p className='text-xs mt-1'>The calculator will still work without location data.</p>
            </div>
          </div>
        )}
        
        <div className='flex flex-col sm:flex-row gap-2'>
          <Input
            type='text'
            placeholder='Enter address or city'
            value={location.address}
            onChange={(e) => setLocation({...location, address: e.target.value})}
            className='flex-1'
          />
          <Button onClick={handleAddressSearch}>Search</Button>
        </div>
        
        <div className='border rounded-lg h-[200px] bg-muted flex items-center justify-center'>
          <div className='text-center text-muted-foreground'>
            <MapPin className='h-12 w-12 mx-auto mb-2 opacity-50' />
            <p>Map functionality coming soon</p>
            <p className='text-xs mt-1'>Click to select location</p>
          </div>
        </div>
        
        <div className='text-xs text-muted-foreground italic'>
          Note: Location data is optional. The calculator will work without it, but climate-specific adjustments won't be applied.
        </div>
        
        {loading ? (
          <div className='space-y-2'>
            <Skeleton className='h-4 w-32' />
            <div className='grid grid-cols-2 gap-4'>
              <Skeleton className='h-16 w-full' />
              <Skeleton className='h-16 w-full' />
              <Skeleton className='h-16 w-full' />
              <Skeleton className='h-16 w-full' />
            </div>
          </div>
        ) : climateData ? (
          <div className='space-y-2'>
            <h3 className='text-lg font-medium'>Climate Data</h3>
            <div className='grid grid-cols-2 gap-4'>
              <div className='bg-background p-3 rounded-lg border'>
                <div className='text-sm text-muted-foreground'>Climate Zone</div>
                <div className='text-lg font-medium'>{climateData.zone}</div>
              </div>
              <div className='bg-background p-3 rounded-lg border'>
                <div className='text-sm text-muted-foreground'>Avg. Temperature</div>
                <div className='text-lg font-medium'>{climateData.avgTemperature.toFixed(1)}°C</div>
              </div>
              <div className='bg-background p-3 rounded-lg border'>
                <div className='text-sm text-muted-foreground'>Humidity</div>
                <div className='text-lg font-medium'>{climateData.humidity.toFixed(0)}%</div>
              </div>
              <div className='bg-background p-3 rounded-lg border'>
                <div className='text-sm text-muted-foreground'>Altitude</div>
                <div className='text-lg font-medium'>{location.altitude} m</div>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}