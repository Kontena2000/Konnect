import React, { useState, useEffect } from 'react';
import { calculateConfiguration, CalculationOptions } from '@/services/matrixCalculatorService';
import { findOptimalConfiguration } from '@/services/optimizationService';
import { generateConfigurationReport } from '@/services/calculatorReportService';
import { calculatorDebug } from '@/services/calculatorDebug';
import calculatorFallback from '@/services/calculatorFallback';
import { LocationSelector } from './LocationSelector';
import { ResultsDisplay } from './ResultsDisplay';
import { CalculatorDebugPanel } from './CalculatorDebugPanel';
import { SaveCalculationDialog } from './SaveCalculationDialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Fix the location-based calculation
const calculateWithLocationFactors = async (
  kwPerRack: number,
  coolingType: string,
  totalRacks: number,
  location: any,
  options: CalculationOptions
) => {
  // For now, just use the standard calculation
  // This is a temporary fix until we properly implement location-based calculations
  return calculateConfiguration(kwPerRack, coolingType, totalRacks, {
    ...options,
    location
  });
};

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
  const [error, setError] = useState<string | null>(null);
  const [useLocationData, setUseLocationData] = useState(false);
  const [calculationMode, setCalculationMode] = useState<'standard' | 'optimize' | 'report'>('standard');
  
  // Advanced options
  const [redundancyMode, setRedundancyMode] = useState('N+1');
  const [includeGenerator, setIncludeGenerator] = useState(false);
  const [batteryRuntime, setBatteryRuntime] = useState(10);
  const [enableWasteHeatRecovery, setEnableWasteHeatRecovery] = useState(false);
  const [enableWaterRecycling, setEnableWaterRecycling] = useState(false);
  const [renewablePercentage, setRenewablePercentage] = useState(20);
  
  // Optimization options
  const [optimizationGoal, setOptimizationGoal] = useState<'cost' | 'efficiency' | 'reliability' | 'sustainability'>('cost');
  const [minPowerDensity, setMinPowerDensity] = useState(50);
  const [maxPowerDensity, setMaxPowerDensity] = useState(200);
  const [preferredCoolingTypes, setPreferredCoolingTypes] = useState<string[]>(['air', 'dlc', 'hybrid', 'immersion']);
  
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
      
      // Set advanced options if available
      if (initialResults.reliability && initialResults.reliability.redundancyImpact) {
        // Extract redundancy mode from description
        const redundancyDesc = initialResults.reliability.redundancyImpact;
        if (redundancyDesc.includes('N+1')) setRedundancyMode('N+1');
        else if (redundancyDesc.includes('2N')) setRedundancyMode('2N');
        else if (redundancyDesc.includes('3N')) setRedundancyMode('3N');
        else setRedundancyMode('N');
      }
      
      if (initialResults.power && initialResults.power.generator) {
        setIncludeGenerator(initialResults.power.generator.included || false);
      }
      
      if (initialResults.power && initialResults.power.battery) {
        setBatteryRuntime(initialResults.power.battery.runtime || 10);
      }
      
      if (initialResults.sustainability) {
        if (initialResults.sustainability.wasteHeatRecovery) {
          setEnableWasteHeatRecovery(initialResults.sustainability.wasteHeatRecovery.enabled || false);
        }
        
        if (initialResults.sustainability.waterUsage) {
          setEnableWaterRecycling(initialResults.sustainability.waterUsage.recyclingEnabled || false);
        }
        
        if (initialResults.sustainability.carbonFootprint) {
          setRenewablePercentage(initialResults.sustainability.carbonFootprint.renewablePercentage || 20);
        }
      }
    }
  }, [initialResults]);
  
  // Calculate function
  const generateResults = async () => {
    setLoading(true);
    setError(null);
    
    try {
      calculatorDebug.log('Starting calculation with config:', {
        kwPerRack,
        coolingType,
        totalRacks
      });
      
      calculatorDebug.log('Options:', {
        redundancyMode,
        includeGenerator,
        batteryRuntime,
        sustainabilityOptions: {
          enableWasteHeatRecovery,
          enableWaterRecycling,
          renewableEnergyPercentage: renewablePercentage
        },
        location: useLocationData && location ? location : undefined
      });
      
      // Prepare calculation options
      const options: CalculationOptions = {
        redundancyMode,
        includeGenerator,
        batteryRuntime,
        sustainabilityOptions: {
          enableWasteHeatRecovery,
          enableWaterRecycling,
          renewableEnergyPercentage: renewablePercentage
        },
        location: useLocationData && location ? location : undefined,
      };
      
      let calculationResults;
      
      // Log which calculation mode we're using
      calculatorDebug.log(`Using calculation mode: ${calculationMode}`);
      
      try {
        switch (calculationMode) {
          case 'optimize':
            // Run optimization to find best configuration
            calculationResults = await findOptimalConfiguration(
              {
                minPowerDensity,
                maxPowerDensity,
                preferredCoolingTypes,
                rackCountRange: [Math.max(14, totalRacks - 14), totalRacks + 14]
              },
              optimizationGoal
            );
            break;
            
          case 'report':
            // Generate comprehensive report
            calculationResults = await generateConfigurationReport(
              userId,
              {
                kwPerRack,
                coolingType,
                totalRacks
              },
              options
            );
            break;
            
          case 'standard':
          default:
            // Standard calculation - this is the most direct path
            calculationResults = await calculateConfiguration(
              kwPerRack,
              coolingType,
              totalRacks,
              options
            );
            
            // Log the results for debugging
            calculatorDebug.log('Standard calculation results:', calculationResults);
            break;
        }
      } catch (calculationError) {
        // If the calculation fails, use fallback data
        calculatorDebug.error('Calculation failed, using fallback data', calculationError);
        calculationResults = calculatorFallback.getResults({
          kwPerRack,
          coolingType,
          totalRacks,
          options
        });
      }
      
      // Ensure we have valid results before setting state
      if (calculationResults) {
        setResults(calculationResults);
        calculatorDebug.log('Calculation completed successfully', calculationResults);
        
        toast({
          title: 'Calculation Complete',
          description: 'Your configuration has been calculated successfully.',
        });
      } else {
        throw new Error('Calculation returned no results');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      calculatorDebug.error('Calculation failed', error);
      setError(errorMessage);
      
      // Use fallback data as a last resort
      const fallbackResults = calculatorFallback.getResults({
        kwPerRack,
        coolingType,
        totalRacks
      });
      
      if (fallbackResults) {
        setResults(fallbackResults);
        toast({
          title: 'Using Estimated Data',
          description: 'We encountered an issue with the calculation service. Showing estimated results instead.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Calculation Error',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle location selection
  const handleLocationSelected = (locationData: any) => {
    setLocation(locationData);
  };
  
  // Handle rack count change
  const handleRackCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0 && value <= 100) {
      setTotalRacks(value);
    }
  };
  
  // Handle battery runtime change
  const handleBatteryRuntimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0 && value <= 60) {
      setBatteryRuntime(value);
    }
  };
  
  // Handle renewable percentage change
  const handleRenewablePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setRenewablePercentage(value);
    }
  };
  
  // Handle cooling type preference change
  const handleCoolingTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setPreferredCoolingTypes([...preferredCoolingTypes, type]);
    } else {
      setPreferredCoolingTypes(preferredCoolingTypes.filter(t => t !== type));
    }
  };
  
  // Get calculation config for saving
  const getCalculationConfig = () => {
    return {
      kwPerRack,
      coolingType,
      totalRacks
    };
  };
  
  return (
    <div className='space-y-6'>
      <Tabs defaultValue='basic'>
        <TabsList className='mb-4'>
          <TabsTrigger value='basic'>Basic Configuration</TabsTrigger>
          <TabsTrigger value='advanced'>Advanced Options</TabsTrigger>
          <TabsTrigger value='optimization'>Optimization</TabsTrigger>
        </TabsList>
        
        <TabsContent value='basic'>
          <Card>
            <CardHeader>
              <CardTitle>Configuration Parameters</CardTitle>
              <CardDescription>Set the basic parameters for your data center configuration</CardDescription>
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
                      <SelectItem value='200'>200 kW/rack</SelectItem>
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
                      <SelectItem value='air'>Air-cooled</SelectItem>
                      <SelectItem value='dlc'>Direct Liquid Cooling (DLC)</SelectItem>
                      <SelectItem value='hybrid'>Hybrid Cooling</SelectItem>
                      <SelectItem value='immersion'>Immersion Cooling</SelectItem>
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
                  onChange={handleRackCountChange}
                  min={1}
                  max={100}
                />
                <p className='text-sm text-muted-foreground'>
                  (Default: 28 racks - 2 rows × 14 racks per row)
                </p>
              </div>
              
              <div className='flex items-center space-x-2 py-2'>
                <Switch 
                  id='useLocation' 
                  checked={useLocationData}
                  onCheckedChange={setUseLocationData}
                />
                <Label htmlFor='useLocation' className='cursor-pointer'>
                  Enable Location-Based Calculations <span className='text-xs text-yellow-600 font-medium'>(BETA)</span>
                </Label>
              </div>
              
              {useLocationData && (
                <LocationSelector onLocationSelected={handleLocationSelected} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value='advanced'>
          <Card>
            <CardHeader>
              <CardTitle>Advanced Configuration Options</CardTitle>
              <CardDescription>Fine-tune your data center configuration with advanced parameters</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <Accordion type='single' collapsible defaultValue='power'>
                <AccordionItem value='power'>
                  <AccordionTrigger>Power Configuration</AccordionTrigger>
                  <AccordionContent className='space-y-4 pt-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='redundancyMode'>Redundancy Mode</Label>
                      <Select 
                        value={redundancyMode} 
                        onValueChange={setRedundancyMode}
                      >
                        <SelectTrigger id='redundancyMode'>
                          <SelectValue placeholder='Select redundancy mode' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='N'>N (No Redundancy)</SelectItem>
                          <SelectItem value='N+1'>N+1 (One Redundant Component)</SelectItem>
                          <SelectItem value='2N'>2N (Full Redundancy)</SelectItem>
                          <SelectItem value='2N+1'>2N+1 (Full Redundancy Plus One)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className='space-y-2'>
                      <div className='flex items-center space-x-2'>
                        <Switch 
                          id='includeGenerator' 
                          checked={includeGenerator}
                          onCheckedChange={setIncludeGenerator}
                        />
                        <Label htmlFor='includeGenerator' className='cursor-pointer'>
                          Include Backup Generator
                        </Label>
                      </div>
                    </div>
                    
                    <div className='space-y-2'>
                      <Label htmlFor='batteryRuntime'>Battery Runtime (minutes)</Label>
                      <Input
                        id='batteryRuntime'
                        type='number'
                        value={batteryRuntime}
                        onChange={handleBatteryRuntimeChange}
                        min={5}
                        max={60}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value='sustainability'>
                  <AccordionTrigger>Sustainability Options</AccordionTrigger>
                  <AccordionContent className='space-y-4 pt-4'>
                    <div className='space-y-2'>
                      <div className='flex items-center space-x-2'>
                        <Switch 
                          id='wasteHeatRecovery' 
                          checked={enableWasteHeatRecovery}
                          onCheckedChange={setEnableWasteHeatRecovery}
                        />
                        <Label htmlFor='wasteHeatRecovery' className='cursor-pointer'>
                          Enable Waste Heat Recovery
                        </Label>
                      </div>
                      <p className='text-sm text-muted-foreground pl-7'>
                        Recover waste heat from cooling systems for reuse
                      </p>
                    </div>
                    
                    <div className='space-y-2'>
                      <div className='flex items-center space-x-2'>
                        <Switch 
                          id='waterRecycling' 
                          checked={enableWaterRecycling}
                          onCheckedChange={setEnableWaterRecycling}
                        />
                        <Label htmlFor='waterRecycling' className='cursor-pointer'>
                          Enable Water Recycling
                        </Label>
                      </div>
                      <p className='text-sm text-muted-foreground pl-7'>
                        Implement water recycling systems to reduce consumption
                      </p>
                    </div>
                    
                    <div className='space-y-2'>
                      <Label htmlFor='renewablePercentage'>Renewable Energy Percentage (%)</Label>
                      <Input
                        id='renewablePercentage'
                        type='number'
                        value={renewablePercentage}
                        onChange={handleRenewablePercentageChange}
                        min={0}
                        max={100}
                      />
                      <p className='text-sm text-muted-foreground'>
                        Percentage of energy from renewable sources
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value='optimization'>
          <Card>
            <CardHeader>
              <CardTitle>Optimization Settings</CardTitle>
              <CardDescription>Let the calculator find the optimal configuration based on your priorities</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-4'>
                <div>
                  <Label className='text-base'>Optimization Goal</Label>
                  <RadioGroup 
                    value={optimizationGoal} 
                    onValueChange={(value) => setOptimizationGoal(value as any)}
                    className='grid grid-cols-2 gap-4 mt-2'
                  >
                    <div className='flex items-center space-x-2'>
                      <RadioGroupItem value='cost' id='cost' />
                      <Label htmlFor='cost'>Minimize Cost</Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <RadioGroupItem value='efficiency' id='efficiency' />
                      <Label htmlFor='efficiency'>Maximize Efficiency</Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <RadioGroupItem value='reliability' id='reliability' />
                      <Label htmlFor='reliability'>Maximize Reliability</Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <RadioGroupItem value='sustainability' id='sustainability' />
                      <Label htmlFor='sustainability'>Maximize Sustainability</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className='space-y-2'>
                  <Label>Power Density Range (kW/rack)</Label>
                  <div className='flex items-center gap-4'>
                    <Select 
                      value={String(minPowerDensity)} 
                      onValueChange={(value) => setMinPowerDensity(Number(value))}
                    >
                      <SelectTrigger className='w-[120px]'>
                        <SelectValue placeholder='Min' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='50'>50 kW</SelectItem>
                        <SelectItem value='75'>75 kW</SelectItem>
                        <SelectItem value='100'>100 kW</SelectItem>
                      </SelectContent>
                    </Select>
                    <span>to</span>
                    <Select 
                      value={String(maxPowerDensity)} 
                      onValueChange={(value) => setMaxPowerDensity(Number(value))}
                    >
                      <SelectTrigger className='w-[120px]'>
                        <SelectValue placeholder='Max' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='100'>100 kW</SelectItem>
                        <SelectItem value='150'>150 kW</SelectItem>
                        <SelectItem value='200'>200 kW</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className='space-y-2'>
                  <Label>Cooling Types to Consider</Label>
                  <div className='grid grid-cols-2 gap-2'>
                    <div className='flex items-center space-x-2'>
                      <Switch 
                        id='air-cooled' 
                        checked={preferredCoolingTypes.includes('air')}
                        onCheckedChange={(checked) => handleCoolingTypeChange('air', checked)}
                      />
                      <Label htmlFor='air-cooled'>Air Cooling</Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Switch 
                        id='dlc' 
                        checked={preferredCoolingTypes.includes('dlc')}
                        onCheckedChange={(checked) => handleCoolingTypeChange('dlc', checked)}
                      />
                      <Label htmlFor='dlc'>Direct Liquid Cooling</Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Switch 
                        id='hybrid' 
                        checked={preferredCoolingTypes.includes('hybrid')}
                        onCheckedChange={(checked) => handleCoolingTypeChange('hybrid', checked)}
                      />
                      <Label htmlFor='hybrid'>Hybrid Cooling</Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Switch 
                        id='immersion' 
                        checked={preferredCoolingTypes.includes('immersion')}
                        onCheckedChange={(checked) => handleCoolingTypeChange('immersion', checked)}
                      />
                      <Label htmlFor='immersion'>Immersion Cooling</Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className='flex flex-col sm:flex-row gap-4 justify-center'>
        <Button 
          onClick={() => {
            setCalculationMode('standard');
            generateResults();
          }}
          disabled={loading}
          className='w-full sm:w-auto bg-primary hover:bg-primary/90'
          type='button'
          size='lg'
        >
          {loading && calculationMode === 'standard' ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Calculating...
            </>
          ) : (
            'Generate Pricing Estimate'
          )}
        </Button>
        
        <Button 
          onClick={() => {
            setCalculationMode('optimize');
            generateResults();
          }}
          disabled={loading}
          className='w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 text-white'
          type='button'
          size='lg'
          variant='outline'
        >
          {loading && calculationMode === 'optimize' ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Optimizing...
            </>
          ) : (
            <>
              <Zap className='mr-2 h-4 w-4' />
              Find Optimal Config
            </>
          )}
        </Button>
        
        <Button 
          onClick={() => {
            setCalculationMode('report');
            generateResults();
          }}
          disabled={loading}
          className='w-full sm:w-auto'
          type='button'
          size='lg'
          variant='outline'
        >
          {loading && calculationMode === 'report' ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Generating Report...
            </>
          ) : (
            <>
              <FileText className='mr-2 h-4 w-4' />
              Generate Full Report
            </>
          )}
        </Button>
      </div>
      
      {results && (
        <>
          <ResultsDisplay results={results} onSave={onSave} userId={userId} />
          
          <div className='flex justify-center mt-6'>
            <SaveCalculationDialog
              config={getCalculationConfig()}
              results={results}
              options={{
                redundancyMode,
                includeGenerator,
                batteryRuntime,
                sustainabilityOptions: {
                  enableWasteHeatRecovery,
                  enableWaterRecycling,
                  renewableEnergyPercentage: renewablePercentage
                },
                location: useLocationData && location ? location : undefined
              }}
              onSaveComplete={(calculationId, projectId) => {
                toast({
                  title: 'Calculation Saved',
                  description: `Calculation has been saved to project successfully.`,
                });
                
                if (onSave) {
                  onSave({
                    id: calculationId,
                    projectId,
                    ...results
                  });
                }
              }}
              trigger={
                <Button variant='outline' size='lg' className='w-full sm:w-auto'>
                  Save Calculation to Project
                </Button>
              }
            />
          </div>
        </>
      )}
      
      {/* Add Debug Panel */}
      <div className='mt-8'>
        <CalculatorDebugPanel />
      </div>
    </div>
  );
}