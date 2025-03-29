import React, { useState, useEffect } from 'react';
import { calculateConfiguration, calculateWithLocationFactors } from '@/services/matrixCalculatorService';
import { LocationSelector } from './LocationSelector';
import { ResultsDisplay } from './ResultsDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface CalculatorComponentProps {
  userId: string;
  userRole?: string;
  onSave?: (results: any) => void;
  initialResults?: any;
}

export function CalculatorComponent({ userId, userRole, onSave, initialResults }: CalculatorComponentProps) {
  // State for inputs
  const [kwPerRack, setKwPerRack] = useState(75);
  const [coolingType, setCoolingType] = useState('dlc');
  const [totalRacks, setTotalRacks] = useState(28); // Default: 2 rows x 14 racks
  const [location, setLocation] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Load initial results if provided
  useEffect(() => {
    if (initialResults) {
      setResults(initialResults);
      
      // Set form values based on loaded results
      if (initialResults.rack) {
        setKwPerRack(initialResults.rack.powerDensity);
        setCoolingType(initialResults.rack.coolingType);
        if (initialResults.rack.totalRacks) {
          setTotalRacks(initialResults.rack.totalRacks);
        }
      }
    }
  }, [initialResults]);
  
  // Calculate function
  const generateResults = async () => {
    setLoading(true);
    try {
      if (location) {
        const config = await calculateWithLocationFactors(
          { kwPerRack, coolingType, totalRacks },
          location
        );
        setResults(config);
      } else {
        const config = await calculateConfiguration(kwPerRack, coolingType, totalRacks);
        setResults(config);
      }
    } catch (error) {
      console.error('Calculation error:', error);
      toast({
        title: 'Calculation Error',
        description: 'There was an error generating the results. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle location selection
  const handleLocationSelected = (locationData: any) => {
    setLocation(locationData);
  };
  
  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Configuration Parameters</CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='kwPerRack'>Power Density (kW/rack)</Label>
              <Select 
                value={String(kwPerRack)} 
                onValueChange={(value) => setKwPerRack(Number(value))}
              >
                <SelectTrigger id='kwPerRack'>
                  <SelectValue placeholder='Select power density' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='50'>50 kW/rack</SelectItem>
                  <SelectItem value='75'>75 kW/rack</SelectItem>
                  <SelectItem value='100'>100 kW/rack</SelectItem>
                  <SelectItem value='150'>150 kW/rack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className='space-y-2'>
              <Label htmlFor='coolingType'>Cooling Type</Label>
              <Select 
                value={coolingType} 
                onValueChange={setCoolingType}
              >
                <SelectTrigger id='coolingType'>
                  <SelectValue placeholder='Select cooling type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='air-cooled'>Air-cooled</SelectItem>
                  <SelectItem value='dlc'>Direct Liquid Cooling (DLC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className='space-y-2'>
            <Label htmlFor='totalRacks'>Total Number of Racks</Label>
            <Input
              id='totalRacks'
              type='number'
              value={totalRacks}
              onChange={(e) => setTotalRacks(Number(e.target.value))}
              min={1}
              max={100}
            />
            <p className='text-sm text-muted-foreground'>
              (Default: 28 racks - 2 rows × 14 racks per row)
            </p>
          </div>
          
          <LocationSelector onLocationSelected={handleLocationSelected} />
          
          <Button 
            onClick={generateResults}
            disabled={loading}
            className='w-full md:w-auto bg-primary hover:bg-primary/90'
            type='button'
          >
            {loading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Calculating...
              </>
            ) : (
              'Generate Pricing Estimate'
            )}
          </Button>
        </CardContent>
      </Card>
      
      {results && <ResultsDisplay results={results} onSave={onSave} userId={userId} />}
    </div>
  );
}