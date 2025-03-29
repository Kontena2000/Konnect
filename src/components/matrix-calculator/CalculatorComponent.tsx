
import React, { useState } from 'react';
import { calculateConfiguration, calculateWithLocationFactors } from '@/services/matrixCalculatorService';
import { LocationSelector } from './LocationSelector';
import { ResultsDisplay } from './ResultsDisplay';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface CalculatorComponentProps {
  userId: string;
  userRole?: string;
  onSave?: (results: any) => void;
}

export function CalculatorComponent({ userId, userRole, onSave }: CalculatorComponentProps) {
  // State for inputs
  const [kwPerRack, setKwPerRack] = useState(75);
  const [coolingType, setCoolingType] = useState('dlc');
  const [location, setLocation] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Calculate function
  const generateResults = async () => {
    setLoading(true);
    try {
      if (location) {
        const config = await calculateWithLocationFactors(
          { kwPerRack, coolingType },
          location
        );
        setResults(config);
      } else {
        const config = await calculateConfiguration(kwPerRack, coolingType);
        setResults(config);
      }
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle location selection
  const handleLocationSelected = (locationData: any) => {
    setLocation(locationData);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuration Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="kwPerRack">Power Density (kW/rack)</Label>
              <Select 
                value={String(kwPerRack)} 
                onValueChange={(value) => setKwPerRack(Number(value))}
              >
                <SelectTrigger id="kwPerRack">
                  <SelectValue placeholder="Select power density" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 kW/rack</SelectItem>
                  <SelectItem value="75">75 kW/rack</SelectItem>
                  <SelectItem value="100">100 kW/rack</SelectItem>
                  <SelectItem value="150">150 kW/rack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="coolingType">Cooling Type</Label>
              <Select 
                value={coolingType} 
                onValueChange={setCoolingType}
              >
                <SelectTrigger id="coolingType">
                  <SelectValue placeholder="Select cooling type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="air-cooled">Air-cooled</SelectItem>
                  <SelectItem value="dlc">Direct Liquid Cooling (DLC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <LocationSelector onLocationSelected={handleLocationSelected} />
          
          <Button 
            onClick={generateResults}
            disabled={loading}
            className="w-full md:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              'Generate Results'
            )}
          </Button>
        </CardContent>
      </Card>
      
      {results && <ResultsDisplay results={results} onSave={onSave} userId={userId} />}
    </div>
  );
}
