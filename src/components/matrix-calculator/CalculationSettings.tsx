
import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { DEFAULT_CALCULATION_PARAMS } from '@/constants/calculatorConstants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CalculationSettingsProps {
  readOnly?: boolean;
  onSave?: (params: any) => void;
}

export function CalculationSettings({ readOnly = false, onSave = null }: CalculationSettingsProps) {
  const [params, setParams] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Load calculation parameters
  useEffect(() => {
    async function loadParams() {
      try {
        setLoading(true);
        const db = getFirestore();
        const paramsDoc = await getDoc(doc(db, 'matrix_calculator', 'calculation_params'));
        
        if (paramsDoc.exists()) {
          setParams(paramsDoc.data());
        } else {
          setParams(DEFAULT_CALCULATION_PARAMS);
        }
      } catch (error) {
        console.error('Error loading calculation parameters:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadParams();
  }, []);
  
  // Save calculation parameters
  const saveParams = async () => {
    if (readOnly) return;
    
    try {
      setSaving(true);
      const db = getFirestore();
      
      // Save to calculation parameters document
      await setDoc(doc(db, 'matrix_calculator', 'calculation_params'), params);
      
      if (onSave) {
        onSave(params);
      }
      
      alert('Calculation parameters saved successfully');
    } catch (error) {
      console.error('Error saving calculation parameters:', error);
      alert('Error saving calculation parameters');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-6">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading calculation parameters...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!params) {
    return (
      <Card className="w-full">
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertDescription>
              No calculation parameters available. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Calculation Parameters</CardTitle>
        <CardDescription>
          Configure the technical parameters used in matrix calculations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {readOnly && (
          <Alert className="mb-6">
            <AlertDescription>
              You are in view-only mode. Contact an administrator to make changes.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="electrical">
          <TabsList className="w-full">
            <TabsTrigger value="electrical">Electrical</TabsTrigger>
            <TabsTrigger value="cooling">Cooling</TabsTrigger>
            <TabsTrigger value="power">Power Systems</TabsTrigger>
            <TabsTrigger value="cost">Cost Factors</TabsTrigger>
          </TabsList>
          
          <TabsContent value="electrical" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Voltage Factor (V)</Label>
                  <Select
                    value={String(params.electrical.voltageFactor)}
                    onValueChange={(value) => setParams({
                      ...params,
                      electrical: {
                        ...params.electrical,
                        voltageFactor: parseInt(value)
                      }
                    })}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="208">208V</SelectItem>
                      <SelectItem value="230">230V</SelectItem>
                      <SelectItem value="400">400V</SelectItem>
                      <SelectItem value="480">480V</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Power Factor</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[params.electrical.powerFactor * 100]}
                      min={80}
                      max={100}
                      step={1}
                      onValueChange={(value) => setParams({
                        ...params,
                        electrical: {
                          ...params.electrical,
                          powerFactor: value[0] / 100
                        }
                      })}
                      disabled={readOnly}
                      className="flex-1"
                    />
                    <span className="w-12 text-center">{params.electrical.powerFactor.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Busbars Per Row</Label>
                  <Select
                    value={String(params.electrical.busbarsPerRow)}
                    onValueChange={(value) => setParams({
                      ...params,
                      electrical: {
                        ...params.electrical,
                        busbarsPerRow: parseInt(value)
                      }
                    })}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Redundancy Mode</Label>
                  <Select
                    value={params.electrical.redundancyMode}
                    onValueChange={(value) => setParams({
                      ...params,
                      electrical: {
                        ...params.electrical,
                        redundancyMode: value
                      }
                    })}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N">N (No Redundancy)</SelectItem>
                      <SelectItem value="N+1">N+1</SelectItem>
                      <SelectItem value="2N">2N</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="cooling" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Temperature Delta (°C)</Label>
                  <Select
                    value={String(params.cooling.deltaT)}
                    onValueChange={(value) => setParams({
                      ...params,
                      cooling: {
                        ...params.cooling,
                        deltaT: parseInt(value)
                      }
                    })}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5°C</SelectItem>
                      <SelectItem value="7">7°C</SelectItem>
                      <SelectItem value="10">10°C</SelectItem>
                      <SelectItem value="15">15°C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Flow Rate Factor (L/min/kW)</Label>
                  <Input
                    type="number"
                    value={params.cooling.flowRateFactor}
                    onChange={(e) => setParams({
                      ...params,
                      cooling: {
                        ...params.cooling,
                        flowRateFactor: parseFloat(e.target.value)
                      }
                    })}
                    step="0.01"
                    min="0.5"
                    disabled={readOnly}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>DLC Residual Heat Fraction</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[params.cooling.dlcResidualHeatFraction * 100]}
                      min={10}
                      max={50}
                      step={1}
                      onValueChange={(value) => setParams({
                        ...params,
                        cooling: {
                          ...params.cooling,
                          dlcResidualHeatFraction: value[0] / 100
                        }
                      })}
                      disabled={readOnly}
                      className="flex-1"
                    />
                    <span className="w-12 text-center">{(params.cooling.dlcResidualHeatFraction * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Chiller Efficiency Factor</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[params.cooling.chillerEfficiencyFactor * 100]}
                      min={80}
                      max={120}
                      step={1}
                      onValueChange={(value) => setParams({
                        ...params,
                        cooling: {
                          ...params.cooling,
                          chillerEfficiencyFactor: value[0] / 100
                        }
                      })}
                      disabled={readOnly}
                      className="flex-1"
                    />
                    <span className="w-12 text-center">{params.cooling.chillerEfficiencyFactor.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="power" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>UPS Module Size (kW)</Label>
                  <Select
                    value={String(params.power.upsModuleSize)}
                    onValueChange={(value) => setParams({
                      ...params,
                      power: {
                        ...params.power,
                        upsModuleSize: parseInt(value)
                      }
                    })}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100 kW</SelectItem>
                      <SelectItem value="250">250 kW</SelectItem>
                      <SelectItem value="500">500 kW</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Max Modules per UPS Frame</Label>
                  <Select
                    value={String(params.power.upsFrameMaxModules)}
                    onValueChange={(value) => setParams({
                      ...params,
                      power: {
                        ...params.power,
                        upsFrameMaxModules: parseInt(value)
                      }
                    })}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Battery Runtime (minutes)</Label>
                  <Select
                    value={String(params.power.batteryRuntime)}
                    onValueChange={(value) => setParams({
                      ...params,
                      power: {
                        ...params.power,
                        batteryRuntime: parseInt(value)
                      }
                    })}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 minutes</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Battery Efficiency</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[params.power.batteryEfficiency * 100]}
                      min={85}
                      max={100}
                      step={1}
                      onValueChange={(value) => setParams({
                        ...params,
                        power: {
                          ...params.power,
                          batteryEfficiency: value[0] / 100
                        }
                      })}
                      disabled={readOnly}
                      className="flex-1"
                    />
                    <span className="w-12 text-center">{(params.power.batteryEfficiency * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="cost" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Installation Percentage</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[params.costFactors.installationPercentage * 100]}
                      min={5}
                      max={30}
                      step={1}
                      onValueChange={(value) => setParams({
                        ...params,
                        costFactors: {
                          ...params.costFactors,
                          installationPercentage: value[0] / 100
                        }
                      })}
                      disabled={readOnly}
                      className="flex-1"
                    />
                    <span className="w-12 text-center">{(params.costFactors.installationPercentage * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Engineering Percentage</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[params.costFactors.engineeringPercentage * 100]}
                      min={5}
                      max={20}
                      step={1}
                      onValueChange={(value) => setParams({
                        ...params,
                        costFactors: {
                          ...params.costFactors,
                          engineeringPercentage: value[0] / 100
                        }
                      })}
                      disabled={readOnly}
                      className="flex-1"
                    />
                    <span className="w-12 text-center">{(params.costFactors.engineeringPercentage * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Contingency Percentage</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[params.costFactors.contingencyPercentage * 100]}
                      min={0}
                      max={15}
                      step={1}
                      onValueChange={(value) => setParams({
                        ...params,
                        costFactors: {
                          ...params.costFactors,
                          contingencyPercentage: value[0] / 100
                        }
                      })}
                      disabled={readOnly}
                      className="flex-1"
                    />
                    <span className="w-12 text-center">{(params.costFactors.contingencyPercentage * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button 
            variant="outline" 
            onClick={() => setParams(DEFAULT_CALCULATION_PARAMS)}
            disabled={readOnly || saving}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button 
            onClick={saveParams}
            disabled={readOnly || saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Parameters
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
