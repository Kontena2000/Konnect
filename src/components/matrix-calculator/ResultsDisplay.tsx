
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Configuration Results</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
      
      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
          <CardDescription>
            {results.rack.powerDensity}kW per rack, {results.rack.coolingType === 'dlc' ? 'Direct Liquid Cooling' : 'Air-Cooled'}, {results.rack.totalRacks} racks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-medium">Total Project Cost</h3>
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(results.cost.totalProjectCost)}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatCurrency(results.cost.costPerRack)} per rack
              </div>
              <div className="text-sm text-muted-foreground">
                {formatCurrency(results.cost.costPerKw)} per kW
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Power Requirements</h3>
              <div className="text-xl font-medium">
                {results.power.ups.requiredCapacity} kW UPS Capacity
              </div>
              <div className="text-sm text-muted-foreground">
                {results.power.ups.redundantModules} x {results.power.ups.moduleSize}kW UPS Modules
              </div>
              <div className="text-sm text-muted-foreground">
                {results.power.ups.redundancyMode} Redundancy
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Cooling Solution</h3>
              <div className="text-xl font-medium">
                {results.cooling.type === 'dlc' ? 
                  `${results.cooling.dlcCoolingCapacity} kW DLC + ${results.cooling.residualCoolingCapacity} kW Air` : 
                  `${results.cooling.totalCoolingCapacity} kW Air Cooling`}
              </div>
              <div className="text-sm text-muted-foreground">
                {results.cooling.type === 'dlc' ? 
                  `${results.cooling.dlcFlowRate} L/min Flow Rate` : 
                  `${results.cooling.rdhxUnits} RDHX Units`}
              </div>
            </div>
          </div>
          
          {/* Warnings */}
          {(results.electrical.multiplicityWarning || results.cooling.warning) && (
            <Alert variant="warning" className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Configuration Warnings</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 mt-2">
                  {results.electrical.multiplicityWarning && (
                    <li>{results.electrical.multiplicityWarning}</li>
                  )}
                  {results.cooling.warning && (
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
                        <span className="font-medium">{results.electrical.currentPerRow} A</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Busbar Size:</span>
                        <span className="font-medium">{results.electrical.busbarSize} A</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current per Rack:</span>
                        <span className="font-medium">{results.electrical.currentPerRack} A</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Tap-Off Boxes</h3>
                    <div className="mt-2">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="font-medium">{results.electrical.tapOffBox.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quantity:</span>
                        <span className="font-medium">{results.rack.totalRacks}</span>
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
                        <span className="font-medium">{results.electrical.rpdu.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quantity:</span>
                        <span className="font-medium">{results.rack.totalRacks}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Costs</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span>Busbars:</span>
                        <span className="font-medium">{formatCurrency(results.cost.electrical.busbar)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tap-Off Boxes:</span>
                        <span className="font-medium">{formatCurrency(results.cost.electrical.tapOffBox)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rack PDUs:</span>
                        <span className="font-medium">{formatCurrency(results.cost.electrical.rpdu)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total Electrical:</span>
                        <span>{formatCurrency(results.cost.electrical.total)}</span>
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
                          {results.cooling.type === 'dlc' ? 'Direct Liquid Cooling' : 'Air Cooling'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Cooling Capacity:</span>
                        <span className="font-medium">{results.cooling.totalCoolingCapacity} kW</span>
                      </div>
                      
                      {results.cooling.type === 'dlc' ? (
                        <>
                          <div className="flex justify-between">
                            <span>DLC Cooling Capacity:</span>
                            <span className="font-medium">{results.cooling.dlcCoolingCapacity} kW</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Residual Air Cooling:</span>
                            <span className="font-medium">{results.cooling.residualCoolingCapacity} kW</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between">
                          <span>RDHX Units:</span>
                          <span className="font-medium">{results.cooling.rdhxUnits}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {results.cooling.type === 'dlc' && (
                    <div>
                      <h3 className="font-medium">Liquid Cooling Details</h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span>Flow Rate:</span>
                          <span className="font-medium">{results.cooling.dlcFlowRate} L/min</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Piping Size:</span>
                          <span className="font-medium">{results.cooling.pipingSize.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cooler Model:</span>
                          <span className="font-medium">{results.cooling.coolerModel}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {results.cooling.climateAdjustment && (
                    <div>
                      <h3 className="font-medium">Climate Adjustments</h3>
                      <div className="mt-2 p-3 bg-muted rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span>Climate Factor:</span>
                          <span className="font-medium">{results.cooling.climateAdjustment.factor}x</span>
                        </div>
                        <p className="text-sm">{results.cooling.climateAdjustment.note}</p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-medium">Cooling Costs</h3>
                    <div className="mt-2">
                      <div className="flex justify-between font-medium">
                        <span>Total Cooling:</span>
                        <span>{formatCurrency(results.cost.cooling)}</span>
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
                        <span className="font-medium">{results.power.ups.totalITLoad} kW</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Required UPS Capacity:</span>
                        <span className="font-medium">{results.power.ups.requiredCapacity} kW</span>
                      </div>
                      <div className="flex justify-between">
                        <span>UPS Module Size:</span>
                        <span className="font-medium">{results.power.ups.moduleSize} kW</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Number of Modules:</span>
                        <span className="font-medium">{results.power.ups.redundantModules}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Redundancy Mode:</span>
                        <span className="font-medium">{results.power.ups.redundancyMode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>UPS Frames:</span>
                        <span className="font-medium">{results.power.ups.framesNeeded}</span>
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
                        <span className="font-medium">{results.power.battery.runtimeMinutes} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Energy Required:</span>
                        <span className="font-medium">{results.power.battery.energyRequired} kWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Battery Cabinets:</span>
                        <span className="font-medium">{results.power.battery.cabinetsNeeded}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Power System Costs</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span>UPS System:</span>
                        <span className="font-medium">{formatCurrency(results.cost.power.ups)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Battery System:</span>
                        <span className="font-medium">{formatCurrency(results.cost.power.battery)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total Power Systems:</span>
                        <span>{formatCurrency(results.cost.power.total)}</span>
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
                        <span className="font-medium">{formatCurrency(results.cost.electrical.total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cooling Systems:</span>
                        <span className="font-medium">{formatCurrency(results.cost.cooling)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Power Systems:</span>
                        <span className="font-medium">{formatCurrency(results.cost.power.total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Infrastructure:</span>
                        <span className="font-medium">{formatCurrency(results.cost.infrastructure)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total Equipment:</span>
                        <span>{formatCurrency(results.cost.equipmentTotal)}</span>
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
                        <span className="font-medium">{formatCurrency(results.cost.installation)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Engineering:</span>
                        <span className="font-medium">{formatCurrency(results.cost.engineering)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Contingency:</span>
                        <span className="font-medium">{formatCurrency(results.cost.contingency)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Total Project</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between font-medium">
                        <span>Total Project Cost:</span>
                        <span>{formatCurrency(results.cost.totalProjectCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cost per Rack:</span>
                        <span className="font-medium">{formatCurrency(results.cost.costPerRack)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cost per kW:</span>
                        <span className="font-medium">{formatCurrency(results.cost.costPerKw)}</span>
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
                          <span className="font-medium">{results.energy.pue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total IT Load:</span>
                          <span className="font-medium">{results.energy.totalITLoad} kW</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Facility Power:</span>
                          <span className="font-medium">{results.energy.totalFacilityPower} kW</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Annual Energy</h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span>Annual Consumption:</span>
                          <span className="font-medium">{results.energy.annualEnergyConsumption.toLocaleString()} kWh</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Renewable Energy:</span>
                          <span className="font-medium">{results.energy.renewableEnergy.toLocaleString()} kWh</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Carbon Emissions:</span>
                          <span className="font-medium">{results.energy.annualCarbonEmissions.toLocaleString()} kg CO₂</span>
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
                          <span className="font-medium">${results.energy.energyRates.costPerKWh.toFixed(2)} per kWh</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Annual Energy Cost:</span>
                          <span className="font-medium">{formatCurrency(results.energy.annualEnergyCost)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Location Impact</h3>
                      <div className="mt-2 p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          The {results.location.climateZone} climate in this location 
                          {parseFloat(results.cooling.climateAdjustment.factor) > 1 ? 
                            ' increases cooling requirements and operational costs.' : 
                            ' reduces cooling requirements and operational costs.'}
                        </p>
                        <div className="mt-2 text-sm">
                          <div className="flex justify-between">
                            <span>Avg. Temperature:</span>
                            <span>{results.location.avgTemperature.toFixed(1)}°C</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Humidity:</span>
                            <span>{results.location.humidity}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
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
