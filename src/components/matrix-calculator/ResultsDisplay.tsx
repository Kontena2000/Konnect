import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Save, AlertTriangle, Download, Share2 } from "lucide-react";
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ResultsDisplayProps {
  results: any;
  onSave?: (results: any) => void;
  userId: string;
}

export function ResultsDisplay({ results, onSave, userId }: ResultsDisplayProps) {
  const [saving, setSaving] = useState(false);
  
  // Add debugging to see what results we're getting
  console.log('ResultsDisplay received results:', results);
  
  const handleSave = async () => {
    setSaving(true);
    try {
      const db = getFirestore();
      
      // Save to user's calculations collection
      await addDoc(collection(db, 'users', userId, 'calculations'), {
        results,
        timestamp: serverTimestamp(),
        name: `${results.rack.powerDensity}kW ${results.rack.coolingType} Configuration`,
      });
      
      if (onSave) {
        onSave(results);
      }
      
      alert('Configuration saved successfully');
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };
  
  const formatCurrency = (value: number) => {
    if (typeof value !== 'number') {
      console.warn('formatCurrency received non-number value:', value);
      return '$0';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Safety check for results
  if (!results || !results.rack) {
    console.error('Invalid results object:', results);
    return (
      <div className='p-4 border border-red-300 bg-red-50 rounded-md'>
        <h2 className='text-lg font-medium text-red-800'>Error: Invalid calculation results</h2>
        <p className='text-red-600'>The calculation did not return valid results. Please try again.</p>
      </div>
    );
  }

  // Ensure cost object exists
  if (!results.cost) {
    console.error('Missing cost data in results:', results);
    results.cost = {
      totalProjectCost: 0,
      costPerRack: 0,
      costPerKw: 0,
      electrical: { busbar: 0, tapOffBox: 0, rpdu: 0, total: 0 },
      cooling: 0,
      power: { ups: 0, battery: 0, generator: 0, total: 0 },
      infrastructure: 0,
      sustainability: 0,
      equipmentTotal: 0,
      installation: 0,
      engineering: 0,
      contingency: 0
    };
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
        <h2 className='text-2xl font-bold'>Configuration Results</h2>
        <div className='flex flex-wrap gap-2'>
          <Button size='sm' onClick={handleSave} disabled={saving}>
            <Save className='h-4 w-4 mr-2' />
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
      
      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
          <CardDescription>
            {results.rack?.powerDensity || 0}kW per rack, 
            {results.rack?.coolingType === 'dlc' ? ' Direct Liquid Cooling' : ' Air-Cooled'}, 
            {' ' + (results.rack?.totalRacks || 0)} racks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">