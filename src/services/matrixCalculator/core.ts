
import { calculatorDebug, withDebug } from '../calculatorDebug';
import { fallbackCalculation } from '../calculatorFallback';
import { validateCalculationResults, validateCalculationInputs } from '@/utils/calculationValidator';
import { calculatePower } from './power';
import { calculateCooling, calculatePipeSizing } from './cooling';
import { calculateCost } from './pricing';
import { getPricingAndParams } from './pricing';
import { 
  calculateCurrentPerRow, 
  calculateCurrentPerRack, 
  selectBusbarSize, 
  selectTapOffBoxSize, 
  selectRPDUSize,
  calculateSystemAvailability,
  calculateSustainabilityMetrics,
  calculateTCO,
  calculateCarbonFootprint,
  calculateThermalDistribution
} from '../calculatorUtils';
import { 
  CalculationConfig, 
  CalculationOptions, 
  CalculationResult 
} from './types';

// Helper function to ensure calculation results have all required properties
function safelyAccessCalculationResults(results: any): CalculationResult {
  // Provide a helper function to safely access nested properties
  if (!results) return {} as CalculationResult;
  
  // Ensure power object exists
  if (!results.power) {
    results.power = {
      ups: {
        requiredCapacity: 0,
        totalITLoad: 0,
        redundancyFactor: 1.2,
        moduleSize: 250,
        totalModulesNeeded: 1,
        redundantModules: 1,
        framesNeeded: 1,
        frameSize: 'frame2Module'
      },
      battery: {
        runtime: 10,
        energyNeeded: 0,
        cabinetsNeeded: 1,
        totalWeight: 1200
      },
      generator: {
        included: false,
        capacity: 0,
        model: 'none',
        fuel: {
          tankSize: 0,
          consumption: 0,
          runtime: 0
        }
      }
    };
  }
  
  // Ensure ups object exists
  if (!results.power.ups) {
    results.power.ups = {
      requiredCapacity: 0,
      totalITLoad: 0,
      redundancyFactor: 1.2,
      moduleSize: 250,
      totalModulesNeeded: 1,
      redundantModules: 1,
      framesNeeded: 1,
      frameSize: 'frame2Module'
    };
  }
  
  // Ensure requiredCapacity property exists
  if (typeof results.power.ups.requiredCapacity !== 'number') {
    // If rack properties exist, calculate a fallback value
    if (results.rack && typeof results.rack.powerDensity === 'number' && typeof results.rack.totalRacks === 'number') {
      results.power.ups.requiredCapacity = results.rack.powerDensity * results.rack.totalRacks * 1.2;
    } else {
      results.power.ups.requiredCapacity = 0;
    }
  }
  
  // Ensure cooling object exists
  if (!results.cooling) {
    results.cooling = {
      type: 'air',
      totalCapacity: 0,
      pipingSize: 'none',
      pue: 1.4
    };
  }
  
  // Ensure cooling.pipingSize exists
  if (results.cooling && typeof results.cooling.pipingSize === 'undefined') {
    // Set default pipingSize based on cooling type
    if (results.cooling.type === 'dlc' || results.cooling.type === 'hybrid') {
      results.cooling.pipingSize = 'dn110';
    } else if (results.cooling.type === 'immersion') {
      results.cooling.pipingSize = 'dn110';
    } else {
      results.cooling.pipingSize = 'none';
    }
  }
  
  return results as CalculationResult;
}

// Main calculation implementation
async function calculateConfigurationImpl(
  kwPerRack: number,
  coolingType: string,
  totalRacks: number,
  options: CalculationOptions = {}
): Promise<CalculationResult> {
  try {
    // Make sure inputs have default values
    kwPerRack = typeof kwPerRack === 'number' ? kwPerRack : 10;
    coolingType = typeof coolingType === 'string' ? coolingType : 'air';
    totalRacks = typeof totalRacks === 'number' ? totalRacks : 28;
    
    const { pricing, params } = await getPricingAndParams();
    
    // Extract options with defaults
    const redundancyMode = options.redundancyMode || params.electrical.redundancyMode || 'N+1';
    const includeGenerator = !!options.includeGenerator;
    const batteryRuntime = options.batteryRuntime || params.power.batteryRuntime || 10;
    const sustainabilityOptions = options.sustainabilityOptions || {
      enableWasteHeatRecovery: false,
      enableWaterRecycling: false,
      renewableEnergyPercentage: 20
    };
    
    // Update params with options
    const updatedParams = {
      ...params,
      electrical: {
        ...params.electrical,
        redundancyMode
      },
      power: {
        ...params.power,
        batteryRuntime
      }
    };
    
    // Create a wrapper for all calculation functions to ensure they don't throw errors
    const safeCalculate = (fn: Function, ...args: any[]) => {
      try {
        return fn(...args);
      } catch (error) {
        console.error(`Error in ${fn.name || 'calculation function'}:`, error);
        return {}; // Return an empty object as fallback
      }
    };
    
    // Calculate electrical requirements with safety
    const currentPerRow = safeCalculate(calculateCurrentPerRow, kwPerRack, updatedParams) || 0;
    const busbarSize = safeCalculate(selectBusbarSize, currentPerRow) || 'busbar800A';
    const currentPerRack = safeCalculate(calculateCurrentPerRack, kwPerRack, updatedParams) || 0;
    const tapOffBox = safeCalculate(selectTapOffBoxSize, currentPerRack) || 'standard63A';
    const rpdu = safeCalculate(selectRPDUSize, currentPerRack) || 'standard16A';
    
    // Calculate cooling requirements with safety
    const cooling = safeCalculate(calculateCooling, kwPerRack, coolingType, totalRacks, updatedParams) || {
      type: coolingType || 'air',
      totalCapacity: kwPerRack * totalRacks * 1.1,
      pue: 1.4
    };
    
    // Calculate thermal distribution with safety
    const thermalDistribution = safeCalculate(calculateThermalDistribution, kwPerRack * totalRacks, coolingType, updatedParams) || {
      pue: 1.4,
      distribution: {
        liquid: { load: 0 }
      }
    };
    
    // Calculate UPS and battery with safety
    const { ups, battery } = safeCalculate(calculatePower, kwPerRack, totalRacks, updatedParams, includeGenerator) || {
      ups: {
        totalITLoad: kwPerRack * totalRacks,
        redundancyFactor: 1.2,
        requiredCapacity: kwPerRack * totalRacks * 1.2,
        moduleSize: 250,
        totalModulesNeeded: 2,
        redundantModules: 2,
        framesNeeded: 1,
        frameSize: 'frame2Module'
      },
      battery: {
        runtime: 10,
        energyNeeded: Math.round((kwPerRack * totalRacks * 10) / 60),
        cabinetsNeeded: 1,
        totalWeight: 1200
      }
    };
    
    // Calculate generator if included with safety
    // CRITICAL: Ensure we have a valid requiredCapacity
    const generatorInputCapacity = typeof ups.requiredCapacity === 'number' ? 
      ups.requiredCapacity : 
      totalRacks * kwPerRack * 1.2;
    
    const generator = safeCalculate(calculatePower.calculateGeneratorRequirements, generatorInputCapacity, includeGenerator, updatedParams) || {
      included: includeGenerator,
      capacity: includeGenerator ? 1000 : 0,
      model: includeGenerator ? '1000kVA' : 'none',
      fuel: {
        tankSize: includeGenerator ? 1000 : 0,
        consumption: includeGenerator ? 200 : 0,
        runtime: includeGenerator ? 8 : 0
      }
    };
    
    // Calculate pipe sizing for DLC with safety
    let pipeSizing = null;
    if (coolingType === 'dlc' || coolingType === 'hybrid') {
      try {
        const flowRate = cooling.dlcFlowRate || 
          ((thermalDistribution.distribution?.liquid?.load || 0) * 
          (updatedParams.cooling?.flowRateFactor || 0.25));
        
        pipeSizing = safeCalculate(calculatePipeSizing, flowRate, updatedParams.cooling?.deltaT || 5) || {
          pipeSize: 'dn110',
          velocityMS: 2.5,
          pressureDropKpa: 1.5
        };
      } catch (error) {
        console.error('Error calculating pipe sizing:', error);
        pipeSizing = {
          pipeSize: 'dn110',
          velocityMS: 2.5,
          pressureDropKpa: 1.5
        };
      }
    }
    
    // Prepare config object for cost calculation with all required properties
    const configForCost = {
      kwPerRack,
      coolingType,
      totalRacks,
      busbarSize,
      cooling: cooling || {},
      ups: ups || {},
      battery: battery || {},
      generator: generator || { included: false },
      electrical: {
        currentPerRack: currentPerRack || 0,
        tapOffBox: tapOffBox || 'standard63A',
        rpdu: rpdu || 'standard16A'
      },
      sustainabilityOptions: sustainabilityOptions || {}
    };
    
    // Calculate costs with safety
    const cost = safeCalculate(calculateCost, configForCost, pricing, updatedParams) || {
      electrical: { busbar: 0, tapOffBox: 0, rpdu: 0, total: 0 },
      cooling: 0,
      power: { ups: 0, battery: 0, generator: 0, total: 0 },
      infrastructure: 0,
      sustainability: 0,
      equipmentTotal: 0,
      installation: 0,
      engineering: 0,
      contingency: 0,
      totalProjectCost: 0,
      costPerRack: 0,
      costPerKw: 0
    };
    
    // Calculate system availability with safety
    const reliability = safeCalculate(calculateSystemAvailability, redundancyMode, includeGenerator, updatedParams) || {
      availability: 0.995,
      tier: 'Tier 3',
      annualDowntime: 4.38,
      mtbf: 8760,
      mttr: 4
    };
    
    // Calculate sustainability metrics with safety
    const sustainability = safeCalculate(calculateSustainabilityMetrics, 
      ups.totalITLoad || (kwPerRack * totalRacks),
      thermalDistribution.pue || 1.4,
      coolingType,
      sustainabilityOptions,
      updatedParams) || {
        pue: 1.4,
        wue: 0.5,
        annualEnergyConsumption: {
          it: kwPerRack * totalRacks * 8760,
          cooling: kwPerRack * totalRacks * 8760 * 0.4,
          power: kwPerRack * totalRacks * 8760 * 0.1,
          total: kwPerRack * totalRacks * 8760 * 1.5
        }
      };
    
    // Calculate TCO with safety
    const tco = safeCalculate(calculateTCO,
      cost.totalProjectCost || 0,
      sustainability.annualEnergyConsumption?.total || (kwPerRack * totalRacks * 8760 * 1.5),
      coolingType,
      includeGenerator,
      updatedParams) || {
        capex: cost.totalProjectCost || 0,
        opex: {},
        total5Year: 0,
        total10Year: 0
      };
    
    // Calculate carbon footprint with safety
    const generatorCapacity = (generator && generator.included && typeof generator.capacity === 'number') ? 
      generator.capacity : 0;
    
    const renewablePercentage = sustainabilityOptions?.renewableEnergyPercentage ?? 20;
    
    const carbonFootprint = safeCalculate(calculateCarbonFootprint,
      sustainability.annualEnergyConsumption?.total || (kwPerRack * totalRacks * 8760 * 1.5),
      includeGenerator,
      24, // Generator testing hours
      generatorCapacity,
      renewablePercentage,
      updatedParams) || {
        annualCO2Grid: 0,
        annualCO2Generator: 0,
        totalAnnualCO2: 0,
        co2PerKwh: 0
      };
    
    // Return a fully populated result object with no undefined properties
    return {
      rack: {
        powerDensity: kwPerRack,
        coolingType: coolingType,
        totalRacks: totalRacks
      },
      electrical: {
        currentPerRow,
        busbarSize,
        currentPerRack,
        tapOffBox,
        rpdu,
        multiplicityWarning: currentPerRow > 2000 ? 
          `Current exceeds maximum busbar rating (2000A). Multiple busbars required per row.` : ``
      },
      cooling,
      thermalDistribution,
      pipeSizing,
      power: {
        ups: {
          ...ups,
          // Explicitly ensure requiredCapacity is set and a number
          requiredCapacity: typeof ups.requiredCapacity === 'number' ? ups.requiredCapacity : (kwPerRack * totalRacks * 1.2)
        },
        battery,
        generator
      },
      reliability,
      sustainability,
      carbonFootprint,
      cost,
      tco
    };
  } catch (error) {
    console.error('Error in calculation:', error);
    
    // Return a minimal valid result to prevent further errors
    return {
      rack: {
        powerDensity: kwPerRack || 10,
        coolingType: coolingType || 'air',
        totalRacks: totalRacks || 28
      },
      electrical: {
        currentPerRow: 0,
        busbarSize: 'busbar800A',
        currentPerRack: 0,
        tapOffBox: 'standard63A',
        rpdu: 'standard16A',
        multiplicityWarning: ''
      },
      cooling: {
        type: coolingType || 'air',
        totalCapacity: 0,
        pipingSize: 'none',
        pue: 1.4
      },
      thermalDistribution: {
        pue: 1.4,
        distribution: { liquid: { load: 0 } }
      },
      pipeSizing: null,
      power: {
        ups: {
          totalITLoad: 0,
          redundancyFactor: 1.2,
          requiredCapacity: 0,
          moduleSize: 250,
          totalModulesNeeded: 1,
          redundantModules: 1,
          framesNeeded: 1,
          frameSize: 'frame2Module'
        },
        battery: {
          runtime: 10,
          energyNeeded: 0,
          cabinetsNeeded: 1,
          totalWeight: 1200
        },
        generator: {
          included: false,
          capacity: 0,
          model: 'none',
          fuel: {
            tankSize: 0,
            consumption: 0,
            runtime: 0
          }
        }
      },
      reliability: {
        availability: 0.995,
        tier: 'Tier 3',
        annualDowntime: 4.38,
        mtbf: 8760,
        mttr: 4
      },
      sustainability: {
        pue: 1.4,
        wue: 0.5,
        annualEnergyConsumption: {
          it: 0,
          cooling: 0,
          power: 0,
          total: 0
        }
      },
      carbonFootprint: {
        annualCO2Grid: 0,
        annualCO2Generator: 0,
        totalAnnualCO2: 0,
        co2PerKwh: 0
      },
      cost: {
        electrical: { busbar: 0, tapOffBox: 0, rpdu: 0, total: 0 },
        cooling: 0,
        power: { ups: 0, battery: 0, generator: 0, total: 0 },
        infrastructure: 0,
        sustainability: 0,
        equipmentTotal: 0,
        installation: 0,
        engineering: 0,
        contingency: 0,
        totalProjectCost: 0,
        costPerRack: 0,
        costPerKw: 0
      },
      tco: {
        capex: 0,
        opex: {},
        total5Year: 0,
        total10Year: 0
      }
    };
  }
}

// Wrap the calculateConfiguration function with debug logging
export const calculateConfiguration = withDebug(
  'calculateConfiguration',
  async (kwPerRack: number, coolingType: string, totalRacks: number, options: CalculationOptions = {}): Promise<CalculationResult> => {
    try {
      // Log input parameters
      console.log('Calculate Configuration - Input Parameters:', { kwPerRack, coolingType, totalRacks, options });
      calculatorDebug.log('Calculate Configuration - Input Parameters:', { kwPerRack, coolingType, totalRacks, options });
      
      // Validate input parameters
      const validatedInputs = validateCalculationInputs({
        kwPerRack,
        coolingType,
        totalRacks,
        ...options
      });
      
      calculatorDebug.log('Calculate Configuration - Validated Inputs:', validatedInputs);
      
      // Try the original calculation first
      const results = await calculateConfigurationImpl(
        validatedInputs.kwPerRack, 
        validatedInputs.coolingType, 
        validatedInputs.totalRacks, 
        validatedInputs
      );
      
      console.log('Calculate Configuration - Raw Results:', results);
      calculatorDebug.log('Calculate Configuration - Raw Results:', results);
      
      // Validate and ensure all required properties exist
      const validatedResults = validateCalculationResults(results, validatedInputs);
      
      calculatorDebug.log('Calculate Configuration - Validated Results:', validatedResults);
      
      // Apply additional defensive handling to ensure no undefined properties
      const safeResults = safelyAccessCalculationResults(validatedResults);
      
      console.log('Calculate Configuration - Safe Results:', safeResults);
      calculatorDebug.log('Calculate Configuration - Safe Results:', safeResults);
      
      return safeResults;
    } catch (error) {
      console.error('Original calculation failed, using fallback', error);
      calculatorDebug.error('Original calculation failed, using fallback', error);
      // If the original calculation fails, use the fallback
      const fallbackResults = await fallbackCalculation(kwPerRack, coolingType, totalRacks, options);
      
      calculatorDebug.log('Calculate Configuration - Fallback Results:', fallbackResults);
      
      // Also validate the fallback results
      const validatedFallback = validateCalculationResults(fallbackResults, {
        kwPerRack,
        coolingType,
        totalRacks,
        ...options
      });
      
      // Apply additional defensive handling to fallback results
      const safeFallbackResults = safelyAccessCalculationResults(validatedFallback);
      
      calculatorDebug.log('Calculate Configuration - Safe Fallback Results:', safeFallbackResults);
      
      return safeFallbackResults;
    }
  }
);
