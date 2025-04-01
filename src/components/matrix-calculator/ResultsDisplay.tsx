import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Save, AlertTriangle, Download, Share2 } from "lucide-react";
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { GeneratePdfButton } from './GeneratePdfButton';

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
        <div className='flex flex-wrap gap-2 mb-4'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleSave}
            disabled={!results || saving}
            className='flex items-center gap-2'
          >
            <Save className='h-4 w-4' />
            {saving ? 'Saving...' : 'Save Calculation'}
          </Button>
          
          <GeneratePdfButton
            config={{
              kwPerRack: results?.rack?.powerDensity || 0,
              coolingType: results?.rack?.coolingType || 'air',
              totalRacks: results?.rack?.totalRacks || 0
            }}
            results={results}
            options={calculationOptions}
            projectName={projectName}
            clientName={clientName}
          />
          
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowComparisonModal(true)}
            disabled={!results}
            className='flex items-center gap-2'
          >
            <BarChart2 className='h-4 w-4' />
            Compare
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
            <div className="space-y-2">
              <h3 className="font-medium">Total Project Cost</h3>
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(results.cost?.totalProjectCost || 0)}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatCurrency(results.cost?.costPerRack || 0)} per rack
              </div>
              <div className="text-sm text-muted-foreground">
                {formatCurrency(results.cost?.costPerKw || 0)} per kW
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Power Requirements</h3>
              <div className="text-xl font-medium">
                {results.power?.ups?.requiredCapacity || 0} kW UPS Capacity
              </div>
              <div className="text-sm text-muted-foreground">
                {results.power?.ups?.redundantModules || 0} x {results.power?.ups?.moduleSize || 0}kW UPS Modules
              </div>
              <div className="text-sm text-muted-foreground">
                {results.power?.ups?.redundancyMode || 'N+1'} Redundancy
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Cooling Solution</h3>
              <div className="text-xl font-medium">
                {results.cooling?.type === 'dlc' ? 
                  `${results.cooling?.dlcCoolingCapacity || 0} kW DLC + ${results.cooling?.residualCoolingCapacity || 0} kW Air` : 
                  `${results.cooling?.totalCapacity || 0} kW Air Cooling`}
              </div>
              <div className="text-sm text-muted-foreground">
                {results.cooling?.type === 'dlc' ? 
                  `${results.cooling?.dlcFlowRate || 0} L/min Flow Rate` : 
                  `${results.cooling?.rdhxUnits || 0} RDHX Units`}
              </div>
            </div>
          </div>
          
          {/* Warnings */}
          {(results.electrical?.multiplicityWarning || results.cooling?.warning) && (
            <Alert variant='destructive' className='mt-6'>
              <AlertTriangle className='h-4 w-4' />
              <AlertTitle>Configuration Warnings</AlertTitle>
              <AlertDescription>
                <ul className='list-disc pl-5 mt-2'>
                  {results.electrical?.multiplicityWarning && (
                    <li>{results.electrical.multiplicityWarning}</li>
                  )}
                  {results.cooling?.warning && (
                    <li>{results.cooling.warning}</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Detailed Results */}
      <Tabs defaultValue="electrical">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="electrical">Electrical</TabsTrigger>
          <TabsTrigger value="cooling">Cooling</TabsTrigger>
          <TabsTrigger value="power">Power Systems</TabsTrigger>
          <TabsTrigger value="costs">Cost Breakdown</TabsTrigger>
          {results.energy && <TabsTrigger value="energy">Energy Analysis</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="electrical">
          <Card>
            <CardHeader>
              <CardTitle>Electrical System Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Power Distribution</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span>Current per Row:</span>
                        <span className="font-medium">{results.electrical?.currentPerRow || 0} A</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Busbar Size:</span>
                        <span className="font-medium">{results.electrical?.busbarSize || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current per Rack:</span>
                        <span className="font-medium">{results.electrical?.currentPerRack || 0} A</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Tap-Off Boxes</h3>
                    <div className="mt-2">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="font-medium">
                          {results.electrical?.tapOffBox ? 
                            results.electrical.tapOffBox.replace(/([A-Z])/g, ' $1').trim() : 
                            'Standard'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quantity:</span>
                        <span className="font-medium">{results.rack?.totalRacks || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Rack PDUs</h3>
                    <div className="mt-2">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="font-medium">
                          {results.electrical?.rpdu ? 
                            results.electrical.rpdu.replace(/([A-Z])/g, ' $1').trim() : 
                            'Standard'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quantity:</span>
                        <span className="font-medium">{results.rack?.totalRacks || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Costs</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span>Busbars:</span>
                        <span className="font-medium">{formatCurrency(results.cost?.electrical?.busbar || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tap-Off Boxes:</span>
                        <span className="font-medium">{formatCurrency(results.cost?.electrical?.tapOffBox || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rack PDUs:</span>
                        <span className="font-medium">{formatCurrency(results.cost?.electrical?.rpdu || 0)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total Electrical:</span>
                        <span>{formatCurrency(results.cost?.electrical?.total || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cooling">
          <Card>
            <CardHeader>
              <CardTitle>Cooling System Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Cooling Requirements</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="font-medium">
                          {results.cooling?.type === 'dlc' ? 'Direct Liquid Cooling' : 'Air Cooling'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Cooling Capacity:</span>
                        <span className="font-medium">{results.cooling?.totalCapacity || 0} kW</span>
                      </div>
                      
                      {results.cooling?.type === 'dlc' ? (
                        <>
                          <div className="flex justify-between">
                            <span>DLC Cooling Capacity:</span>
                            <span className="font-medium">{results.cooling?.dlcCoolingCapacity || 0} kW</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Residual Air Cooling:</span>
                            <span className="font-medium">{results.cooling?.residualCoolingCapacity || 0} kW</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between">
                          <span>RDHX Units:</span>
                          <span className="font-medium">{results.cooling?.rdhxUnits || 0}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {results.cooling?.type === 'dlc' && (
                    <div>
                      <h3 className="font-medium">Liquid Cooling Details</h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span>Flow Rate:</span>
                          <span className="font-medium">{results.cooling?.dlcFlowRate || 0} L/min</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Piping Size:</span>
                          <span className="font-medium">
                            {results.cooling?.pipingSize ? 
                              results.cooling.pipingSize.toUpperCase() : 
                              'NONE'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cooler Model:</span>
                          <span className="font-medium">{results.cooling?.coolerModel || 'Standard'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {results.cooling?.climateAdjustment && (
                    <div>
                      <h3 className="font-medium">Climate Adjustments</h3>
                      <div className="mt-2 p-3 bg-muted rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span>Climate Factor:</span>
                          <span className="font-medium">{results.cooling.climateAdjustment.factor || 1}x</span>
                        </div>
                        <p className="text-sm">{results.cooling.climateAdjustment.note || 'Standard climate conditions'}</p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-medium">Cooling Costs</h3>
                    <div className="mt-2">
                      <div className="flex justify-between font-medium">
                        <span>Total Cooling:</span>
                        <span>{formatCurrency(results.cost?.cooling || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="power">
          <Card>
            <CardHeader>
              <CardTitle>Power Systems Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">UPS System</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span>Total IT Load:</span>
                        <span className="font-medium">{results.power?.ups?.totalITLoad || 0} kW</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Required UPS Capacity:</span>
                        <span className="font-medium">{results.power?.ups?.requiredCapacity || 0} kW</span>
                      </div>
                      <div className="flex justify-between">
                        <span>UPS Module Size:</span>
                        <span className="font-medium">{results.power?.ups?.moduleSize || 0} kW</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Number of Modules:</span>
                        <span className="font-medium">{results.power?.ups?.redundantModules || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Redundancy Mode:</span>
                        <span className="font-medium">{results.power?.ups?.redundancyMode || 'N+1'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>UPS Frames:</span>
                        <span className="font-medium">{results.power?.ups?.framesNeeded || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Battery System</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span>Runtime:</span>
                        <span className="font-medium">{results.power?.battery?.runtime || 0} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Energy Required:</span>
                        <span className="font-medium">{results.power?.battery?.energyNeeded || 0} kWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Battery Cabinets:</span>
                        <span className="font-medium">{results.power?.battery?.cabinetsNeeded || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Power System Costs</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span>UPS System:</span>
                        <span className="font-medium">{formatCurrency(results.cost?.power?.ups || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Battery System:</span>
                        <span className="font-medium">{formatCurrency(results.cost?.power?.battery || 0)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total Power Systems:</span>
                        <span>{formatCurrency(results.cost?.power?.total || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Equipment Costs</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span>Electrical Distribution:</span>
                        <span className="font-medium">{formatCurrency(results.cost?.electrical?.total || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cooling Systems:</span>
                        <span className="font-medium">{formatCurrency(results.cost?.cooling || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Power Systems:</span>
                        <span className="font-medium">{formatCurrency(results.cost?.power?.total || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Infrastructure:</span>
                        <span className="font-medium">{formatCurrency(results.cost?.infrastructure || 0)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total Equipment:</span>
                        <span>{formatCurrency(results.cost?.equipmentTotal || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Additional Costs</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span>Installation:</span>
                        <span className="font-medium">{formatCurrency(results.cost?.installation || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Engineering:</span>
                        <span className="font-medium">{formatCurrency(results.cost?.engineering || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Contingency:</span>
                        <span className="font-medium">{formatCurrency(results.cost?.contingency || 0)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Total Project</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between font-medium">
                        <span>Total Project Cost:</span>
                        <span>{formatCurrency(results.cost?.totalProjectCost || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cost per Rack:</span>
                        <span className="font-medium">{formatCurrency(results.cost?.costPerRack || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cost per kW:</span>
                        <span className="font-medium">{formatCurrency(results.cost?.costPerKw || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {results.energy && (
          <TabsContent value="energy">
            <Card>
              <CardHeader>
                <CardTitle>Energy Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Efficiency Metrics</h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span>Power Usage Effectiveness (PUE):</span>
                          <span className="font-medium">{results.energy.pue || 1.4}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total IT Load:</span>
                          <span className="font-medium">{results.energy.totalITLoad || 0} kW</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Facility Power:</span>
                          <span className="font-medium">{results.energy.totalFacilityPower || 0} kW</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Annual Energy</h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span>Annual Consumption:</span>
                          <span className="font-medium">
                            {(results.energy.annualEnergyConsumption || 0).toLocaleString()} kWh
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Renewable Energy:</span>
                          <span className="font-medium">
                            {(results.energy.renewableEnergy || 0).toLocaleString()} kWh
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Carbon Emissions:</span>
                          <span className="font-medium">
                            {(results.energy.annualCarbonEmissions || 0).toLocaleString()} kg CO₂
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Energy Costs</h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span>Energy Rate:</span>
                          <span className="font-medium">
                            ${results.energy.energyRates?.costPerKWh?.toFixed(2) || '0.10'} per kWh
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Annual Energy Cost:</span>
                          <span className="font-medium">
                            {formatCurrency(results.energy.annualEnergyCost || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {results.location && (
                      <div>
                        <h3 className="font-medium">Location Impact</h3>
                        <div className="mt-2 p-3 bg-muted rounded-lg">
                          <p className="text-sm">
                            The {results.location.climateZone || 'temperate'} climate in this location 
                            {parseFloat(results.cooling?.climateAdjustment?.factor || '1') > 1 ? 
                              ' increases cooling requirements and operational costs.' : 
                              ' reduces cooling requirements and operational costs.'}
                          </p>
                          <div className="mt-2 text-sm">
                            <div className="flex justify-between">
                              <span>Avg. Temperature:</span>
                              <span>{(results.location.avgTemperature || 20).toFixed(1)}°C</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Humidity:</span>
                              <span>{results.location.humidity || 50}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}