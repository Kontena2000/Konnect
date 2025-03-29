
import React, { useState, useEffect, useCallback } from "react";
import { CalculationParams } from "@/types/calculationParams";
import { DEFAULT_CALCULATION_PARAMS } from "@/constants/calculatorConstants";
import { loadCalculationParams, saveCalculationParams } from "@/services/calculationParamsService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Save, RotateCcw, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface CalculationSettingsProps {
  readOnly?: boolean;
  onSave?: ((params: CalculationParams) => void) | null;
}

export function CalculationSettings({ readOnly = false, onSave = null }: CalculationSettingsProps) {
  const [params, setParams] = useState<CalculationParams | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Load calculation parameters
  const fetchParams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedParams = await loadCalculationParams();
      setParams(loadedParams);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to load parameters: ${errorMessage}`);
      console.error("Error loading calculation parameters:", err);
      
      // Set default parameters as fallback
      setParams({ ...DEFAULT_CALCULATION_PARAMS });
      
      toast({
        variant: "destructive",
        title: "Error Loading Parameters",
        description: "Using default values as fallback. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchParams();
  }, [fetchParams]);
  
  // Safe update function for nested state
  const updateParams = useCallback((section: keyof CalculationParams, field: string, value: any) => {
    setParams((currentParams) => {
      if (!currentParams) return null;
      
      return {
        ...currentParams,
        [section]: {
          ...currentParams[section],
          [field]: value
        }
      };
    });
  }, []);
  
  // Save calculation parameters
  const handleSave = async () => {
    if (readOnly || !params) return;
    
    try {
      setSaving(true);
      setError(null);
      
      await saveCalculationParams(params);
      
      if (onSave) {
        onSave(params);
      }
      
      toast({
        title: "Success",
        description: "Calculation parameters saved successfully",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to save parameters: ${errorMessage}`);
      console.error("Error saving calculation parameters:", err);
      
      toast({
        variant: "destructive",
        title: "Error Saving Parameters",
        description: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Reset to defaults
  const handleReset = () => {
    setParams({ ...DEFAULT_CALCULATION_PARAMS });
    toast({
      title: "Reset to Defaults",
      description: "Parameters have been reset to default values. Click Save to apply changes.",
    });
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
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              No calculation parameters available. Please try again later.
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-end">
            <Button onClick={fetchParams}>
              Retry
            </Button>
          </div>
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
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
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
                    onValueChange={(value) => updateParams("electrical", "voltageFactor", parseInt(value))}
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
                      onValueChange={(value) => updateParams("electrical", "powerFactor", value[0] / 100)}
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
                    onValueChange={(value) => updateParams("electrical", "busbarsPerRow", parseInt(value))}
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
                    onValueChange={(value) => updateParams("electrical", "redundancyMode", value as "N" | "N+1" | "2N")}
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
                    onValueChange={(value) => updateParams("cooling", "deltaT", parseInt(value))}
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
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value > 0) {
                        updateParams("cooling", "flowRateFactor", value);
                      }
                    }}
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
                      onValueChange={(value) => updateParams("cooling", "dlcResidualHeatFraction", value[0] / 100)}
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
                      onValueChange={(value) => updateParams("cooling", "chillerEfficiencyFactor", value[0] / 100)}
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
                    onValueChange={(value) => updateParams("power", "upsModuleSize", parseInt(value))}
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
                    onValueChange={(value) => updateParams("power", "upsFrameMaxModules", parseInt(value))}
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
                    onValueChange={(value) => updateParams("power", "batteryRuntime", parseInt(value))}
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
                      onValueChange={(value) => updateParams("power", "batteryEfficiency", value[0] / 100)}
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
                      onValueChange={(value) => updateParams("costFactors", "installationPercentage", value[0] / 100)}
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
                      onValueChange={(value) => updateParams("costFactors", "engineeringPercentage", value[0] / 100)}
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
                      onValueChange={(value) => updateParams("costFactors", "contingencyPercentage", value[0] / 100)}
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
            onClick={handleReset}
            disabled={readOnly || saving}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button 
            onClick={handleSave}
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
