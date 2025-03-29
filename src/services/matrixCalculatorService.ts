import { getFirestore, doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { DEFAULT_PRICING, DEFAULT_CALCULATION_PARAMS } from '@/constants/calculatorConstants';
import { getClimateFactor, ClimateFactor } from './climateDataService';
import { calculateEnergyMetrics, calculateWithLocationFactors as calculateEnergyWithLocationFactors } from './energyDataService';
import { 
  calculateCurrentPerRow, 
  calculateCurrentPerRack, 
  selectBusbarSize, 
  selectTapOffBoxSize, 
  selectRPDUSize,
  calculateBusbarCost,
  CalculationParams,
  PricingMatrix,
  calculateSystemAvailability,
  calculateSustainabilityMetrics,
  calculateTCO,
  calculateCarbonFootprint,
  calculateThermalDistribution,
  calculatePipeSizing,
  calculateGeneratorRequirements,
  calculateCoolingCapacity,
  compareConfigurations as compareConfigurationsUtil
} from './calculatorUtils';
import { pricingCache, paramsCache, configurationCache, locationFactorsCache, memoize } from './calculationCache';
import { calculatorDebug, withDebug } from './calculatorDebug';
import { fallbackCalculation } from './calculatorFallback';
import { getNestedProperty, ensureObjectStructure, toNumber, safeDivide } from '@/utils/safeObjectAccess';
import { validateCalculationResults, validateCalculationInputs } from '@/utils/calculationValidator';

// Improved cache implementation
let cachedPricing: PricingMatrix | null = null;
let cachedParams: CalculationParams | null = null;
let lastFetchTime = 0;

export async function getPricingAndParams() {
  // Check if cache is valid (less than 5 minutes old)
  const now = Date.now();
  if (cachedPricing && cachedParams && now - lastFetchTime < 5 * 60 * 1000) {
    return { pricing: cachedPricing, params: cachedParams };
  }
  
  const db = getFirestore();
  
  try {
    // Fetch pricing
    const pricingDoc = await getDoc(doc(db, 'matrix_calculator', 'pricing_matrix'));
    const pricing = pricingDoc.exists() ? pricingDoc.data() as PricingMatrix : DEFAULT_PRICING;
    
    // Fetch parameters
    const paramsDoc = await getDoc(doc(db, 'matrix_calculator', 'calculation_params'));
    const params = paramsDoc.exists() ? paramsDoc.data() as CalculationParams : DEFAULT_CALCULATION_PARAMS;
    
    // Update cache
    cachedPricing = pricing;
    cachedParams = params;
    lastFetchTime = now;
    
    return { pricing, params };
  } catch (error) {
    console.error('Error fetching data:', error);
    return { pricing: DEFAULT_PRICING, params: DEFAULT_CALCULATION_PARAMS };
  }
}

// Memoized version of getPricingAndParams
export const getMemoizedPricingAndParams = memoize(
  getPricingAndParams,
  pricingCache,
  () => 'pricing_and_params'
);

export interface CalculationConfig {
  kwPerRack: number;
  coolingType: string;
  totalRacks?: number;
}

export interface CalculationOptions {
  redundancyMode?: string;
  includeGenerator?: boolean;
  batteryRuntime?: number;
  sustainabilityOptions?: {
    enableWasteHeatRecovery?: boolean;
    enableWaterRecycling?: boolean;
    renewableEnergyPercentage?: number;
  };
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    climateData?: any;
  };
}

// Replace the calculateUPSRequirements function with this safer version
function calculateUPSRequirements(kwPerRack: number, totalRacks: number, params: CalculationParams) {
  // Safety check for inputs
  kwPerRack = typeof kwPerRack === 'number' ? kwPerRack : 0;
  totalRacks = typeof totalRacks === 'number' ? totalRacks : 0;
  
  const totalITLoad = kwPerRack * totalRacks;
  
  // Ensure params and its properties exist
  const redundancyMode = params?.electrical?.redundancyMode || 'N+1';
  
  const redundancyFactor = redundancyMode === 'N' ? 1 :
                          redundancyMode === 'N+1' ? 1.2 :
                          redundancyMode === '2N' ? 2 : 1.5;
  
  const requiredCapacity = totalITLoad * redundancyFactor;
  const moduleSize = params?.power?.upsModuleSize || 250; // kW
  const maxModulesPerFrame = params?.power?.upsFrameMaxModules || 6;
  
  // Calculate number of modules needed (with safety checks)
  const totalModulesNeeded = Math.ceil(requiredCapacity / moduleSize) || 1;
  const framesNeeded = Math.ceil(totalModulesNeeded / maxModulesPerFrame) || 1;
  
  // Determine frame size based on modules per frame
  const frameSize = totalModulesNeeded <= 2 ? 'frame2Module' :
                   totalModulesNeeded <= 4 ? 'frame4Module' : 'frame6Module';
  
  return {
    totalITLoad: totalITLoad || 0,
    redundancyFactor: redundancyFactor || 1,
    requiredCapacity: requiredCapacity || 0, // Ensure this is never undefined
    moduleSize: moduleSize || 250,
    totalModulesNeeded: totalModulesNeeded || 1,
    redundantModules: totalModulesNeeded || 1,
    framesNeeded: framesNeeded || 1,
    frameSize: frameSize || 'frame2Module'
  };
}

// Calculate battery requirements
function calculateBatteryRequirements(totalITLoad: number, params: CalculationParams) {
  const runtime = params.power.batteryRuntime || 10; // minutes
  const batteryEfficiency = params.power.batteryEfficiency || 0.95;
  
  // Calculate energy needed in kWh
  const energyNeeded = (totalITLoad * runtime) / (60 * batteryEfficiency);
  
  // Assume each cabinet provides 40 kWh of energy
  const cabinetsNeeded = Math.ceil(energyNeeded / 40);
  
  return {
    runtime,
    energyNeeded: Math.round(energyNeeded),
    cabinetsNeeded,
    totalWeight: cabinetsNeeded * 1200 // kg, assuming 1200kg per cabinet
  };
}

// Calculate cooling requirements
function calculateCoolingRequirements(kwPerRack: number, coolingType: string, totalRacks: number, params: CalculationParams) {
  const totalITLoad = kwPerRack * totalRacks;
  
  // Get cooling capacity based on type
  const cooling = calculateCoolingCapacity(totalITLoad, coolingType, params);
  
  // Add additional details based on cooling type
  switch (coolingType.toLowerCase()) {
    case 'dlc':
      return {
        type: 'dlc',
        totalCapacity: cooling.totalCapacity,
        dlcCoolingCapacity: cooling.dlcCoolingCapacity || 0,
        residualCoolingCapacity: cooling.residualCoolingCapacity || 0,
        dlcFlowRate: (cooling.dlcCoolingCapacity || 0) * params.cooling.flowRateFactor,
        pipingSize: (cooling.dlcCoolingCapacity || 0) > 1000 ? 'dn160' : 'dn110',
        pue: cooling.pueImpact
      };
      
    case 'hybrid':
      return {
        type: 'hybrid',
        totalCapacity: cooling.totalCapacity,
        dlcPortion: cooling.dlcPortion || 0,
        airPortion: cooling.airPortion || 0,
        dlcFlowRate: (cooling.dlcPortion || 0) * params.cooling.flowRateFactor,
        rdhxUnits: Math.ceil((cooling.airPortion || 0) / 150),
        rdhxModel: 'average',
        pipingSize: 'dn110',
        pue: cooling.pueImpact
      };
      
    case 'immersion':
      return {
        type: 'immersion',
        totalCapacity: cooling.totalCapacity,
        tanksNeeded: Math.ceil(totalRacks / 4),
        flowRate: cooling.totalCapacity * params.cooling.flowRateFactor * 0.8, // 80% of heat removed by fluid
        pue: cooling.pueImpact
      };
      
    default: // air cooling
      const rdhxCapacity = 150; // kW per unit
      const rdhxUnits = Math.ceil(cooling.totalCapacity / rdhxCapacity);
      
      return {
        type: 'air',
        totalCapacity: cooling.totalCapacity,
        rdhxUnits,
        rdhxModel: kwPerRack <= 15 ? 'basic' : kwPerRack <= 30 ? 'standard' : 'highDensity',
        pue: cooling.pueImpact
      };
  }
}

async function calculateConfigurationImpl(
  kwPerRack: number,
  coolingType: string,
  totalRacks: number,
  options: CalculationOptions = {}
): Promise<any> {
  try {
    // Make sure inputs have default values
    kwPerRack = typeof kwPerRack === 'number' ? kwPerRack : 10;
    coolingType = typeof coolingType === 'string' ? coolingType : 'air';
    totalRacks = typeof totalRacks === 'number' ? totalRacks : 28;
    
    const { pricing, params } = await getMemoizedPricingAndParams();
    
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
    const cooling = safeCalculate(calculateCoolingRequirements, kwPerRack, coolingType, totalRacks, updatedParams) || {
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
    const ups = safeCalculate(calculateUPSRequirements, kwPerRack, totalRacks, updatedParams) || {
      totalITLoad: kwPerRack * totalRacks,
      redundancyFactor: 1.2,
      requiredCapacity: kwPerRack * totalRacks * 1.2,
      moduleSize: 250,
      totalModulesNeeded: 2,
      redundantModules: 2,
      framesNeeded: 1,
      frameSize: 'frame2Module'
    };
    
    const battery = safeCalculate(calculateBatteryRequirements, ups.totalITLoad || (kwPerRack * totalRacks), updatedParams) || {
      runtime: 10,
      energyNeeded: Math.round((kwPerRack * totalRacks * 10) / 60),
      cabinetsNeeded: 1,
      totalWeight: 1200
    };
    
    // Calculate generator if included with safety
    // CRITICAL: Ensure we have a valid requiredCapacity
    const generatorInputCapacity = typeof ups.requiredCapacity === 'number' ? 
      ups.requiredCapacity : 
      totalRacks * kwPerRack * 1.2;
    
    const generator = safeCalculate(calculateGeneratorRequirements, generatorInputCapacity, includeGenerator, updatedParams) || {
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
  async (kwPerRack: number, coolingType: string, totalRacks: number, options: CalculationOptions = {}): Promise<any> => {
    try {
      // Validate input parameters
      const validatedInputs = validateCalculationInputs({
        kwPerRack,
        coolingType,
        totalRacks,
        ...options
      });
      
      // Try the original calculation first
      const results = await calculateConfigurationImpl(
        validatedInputs.kwPerRack, 
        validatedInputs.coolingType, 
        validatedInputs.totalRacks, 
        validatedInputs
      );
      
      // Validate and ensure all required properties exist
      const validatedResults = validateCalculationResults(results, validatedInputs);
      
      // Apply additional defensive handling to ensure no undefined properties
      return safelyAccessCalculationResults(validatedResults);
    } catch (error) {
      calculatorDebug.error('Original calculation failed, using fallback', error);
      // If the original calculation fails, use the fallback
      const fallbackResults = await fallbackCalculation(kwPerRack, coolingType, totalRacks, options);
      
      // Also validate the fallback results
      const validatedFallback = validateCalculationResults(fallbackResults, {
        kwPerRack,
        coolingType,
        totalRacks,
        ...options
      });
      
      // Apply additional defensive handling to fallback results
      return safelyAccessCalculationResults(validatedFallback);
    }
  }
);

// Update the calculateCost function to handle undefined values
function calculateCost(config: any, pricing: PricingMatrix, params: CalculationParams) {
  try {
    // Add safety checks for all possible undefined inputs
    if (!config) throw new Error('Configuration is undefined');
    if (!pricing) throw new Error('Pricing matrix is undefined');
    if (!params) throw new Error('Calculation parameters are undefined');
    
    // Ensure required config properties exist
    const busbarSize = config.busbarSize || 'busbar800A';
    const coolingType = config.cooling?.type || 'air';
    const totalRacks = config.totalRacks || 28;
    
    // Get electrical properties with defaults
    const tapOffBox = config.electrical?.tapOffBox || 'standard63A';
    const rpdu = config.electrical?.rpdu || 'standard16A';
    
    // Calculate electrical costs
    const busbarCost = calculateBusbarCost(busbarSize, pricing);
    const tapOffBoxCost = pricing.tapOffBox[coolingType === 'dlc' ? 
      'custom250A' : tapOffBox] * totalRacks;
    const rpduCost = pricing.rpdu[rpdu] * totalRacks;
    
    // Calculate cooling costs with safety checks
    let coolingCost = 0;
    if (coolingType === 'dlc') {
      coolingCost = pricing.cooler.tcs310aXht + 
                   pricing.cooler.grundfosPump + 
                   pricing.cooler.bufferTank +
                   (config.cooling?.pipingSize === 'dn160' ? 
                    pricing.piping.dn160PerMeter : pricing.piping.dn110PerMeter) * 100 +
                   (config.cooling?.pipingSize === 'dn160' ? 
                    pricing.piping.valveDn160 : pricing.piping.valveDn110) * 10;
    } else if (coolingType === 'hybrid') {
      const dlcPortion = pricing.cooler.tcs310aXht * 0.7 +
                        pricing.cooler.grundfosPump + 
                        pricing.cooler.bufferTank +
                        pricing.piping.dn110PerMeter * 50;
      
      const airPortion = pricing.rdhx.average * Math.ceil(((config.cooling?.airPortion || 0) / 150) || 1);
      
      coolingCost = dlcPortion + airPortion;
    } else if (coolingType === 'immersion') {
      coolingCost = pricing.cooler.immersionTank * Math.ceil(totalRacks / 4) +
                   pricing.cooler.immersionCDU + 
                   pricing.piping.dn110PerMeter * 50;
    } else {
      // Default to air cooling with safety checks
      const rdhxModel = config.cooling?.rdhxModel || 'standard';
      const rdhxUnits = config.cooling?.rdhxUnits || Math.ceil(totalRacks / 10);
      coolingCost = pricing.rdhx[rdhxModel] * rdhxUnits;
    }
    
    // Calculate power costs with safety checks
    let upsCost = 0;
    if (config.power?.ups) {
      const frameSize = config.power.ups.frameSize || 'frame2Module';
      const framesNeeded = config.power.ups.framesNeeded || 1;
      const redundantModules = config.power.ups.redundantModules || 2;
      
      upsCost = pricing.ups[frameSize] * framesNeeded +
               pricing.ups.module250kw * redundantModules;
    }
    
    let batteryCost = 0;
    if (config.power?.battery) {
      const cabinetsNeeded = config.power.battery.cabinetsNeeded || 1;
      batteryCost = pricing.battery.revoTp240Cabinet * cabinetsNeeded;
    }
    
    // Calculate generator costs if included
    let generatorCost = 0;
    if (config.power?.generator && config.power.generator.included) {
      const generatorCapacity = config.power.generator.capacity || 1000;
      const generatorPriceKey = generatorCapacity <= 1000 ? 'generator1000kva' :
                               generatorCapacity <= 2000 ? 'generator2000kva' : 'generator3000kva';
      
      generatorCost = pricing.generator?.[generatorPriceKey] || 0;
      
      const fuelTankSize = config.power.generator.fuel?.tankSize || 0;
      generatorCost += fuelTankSize * (pricing.generator?.fuelTankPerLiter || 1);
    }
    
    // Calculate e-house costs
    const eHouseBaseSqm = params.power.eHouseBaseSqm || 20;
    const eHouseBatterySqm = params.power.eHouseBatterySqm || 5;
    const eHouseGeneratorSqm = (config.power?.generator?.included) ? 30 : 0;
    
    const framesNeeded = config.power?.ups?.framesNeeded || 1;
    const cabinetsNeeded = config.power?.battery?.cabinetsNeeded || 1;
    
    const eHouseSize = eHouseBaseSqm * framesNeeded +
                      eHouseBatterySqm * cabinetsNeeded +
                      eHouseGeneratorSqm;
    
    const eHouseCost = pricing.eHouse.base + pricing.eHouse.perSqMeter * eHouseSize;
    
    // Calculate sustainability options costs
    let sustainabilityCost = 0;
    if (pricing.sustainability) {
      if (config.sustainabilityOptions?.enableWasteHeatRecovery) {
        sustainabilityCost += pricing.sustainability.heatRecoverySystem || 0;
      }
      
      if (config.sustainabilityOptions?.enableWaterRecycling) {
        sustainabilityCost += pricing.sustainability.waterRecyclingSystem || 0;
      }
      
      const renewablePercentage = config.sustainabilityOptions?.renewableEnergyPercentage || 0;
      if (renewablePercentage > 0) {
        const solarCapacity = (config.kwPerRack * totalRacks * renewablePercentage / 100) * 1.5;
        sustainabilityCost += solarCapacity * (pricing.sustainability.solarPanelPerKw || 0);
      }
    }
    
    // Calculate total equipment cost
    const equipmentCost = busbarCost + tapOffBoxCost + rpduCost + coolingCost + 
                         upsCost + batteryCost + generatorCost + eHouseCost + sustainabilityCost;
    
    // Add installation and engineering costs
    const installationCost = equipmentCost * params.costFactors.installationPercentage;
    const engineeringCost = equipmentCost * params.costFactors.engineeringPercentage;
    const contingencyCost = equipmentCost * params.costFactors.contingencyPercentage;
    
    // Calculate total project cost
    const totalCost = equipmentCost + installationCost + engineeringCost + contingencyCost;
    
    // Return cost breakdown with safe rounding
    return {
      electrical: {
        busbar: Math.round(busbarCost || 0),
        tapOffBox: Math.round(tapOffBoxCost || 0),
        rpdu: Math.round(rpduCost || 0),
        total: Math.round((busbarCost || 0) + (tapOffBoxCost || 0) + (rpduCost || 0))
      },
      cooling: Math.round(coolingCost || 0),
      power: {
        ups: Math.round(upsCost || 0),
        battery: Math.round(batteryCost || 0),
        generator: Math.round(generatorCost || 0),
        total: Math.round((upsCost || 0) + (batteryCost || 0) + (generatorCost || 0))
      },
      infrastructure: Math.round(eHouseCost || 0),
      sustainability: Math.round(sustainabilityCost || 0),
      equipmentTotal: Math.round(equipmentCost || 0),
      installation: Math.round(installationCost || 0),
      engineering: Math.round(engineeringCost || 0),
      contingency: Math.round(contingencyCost || 0),
      totalProjectCost: Math.round(totalCost || 0),
      costPerRack: Math.round((totalCost || 0) / (totalRacks || 1)),
      costPerKw: Math.round((totalCost || 0) / ((config.kwPerRack || 10) * (totalRacks || 1)))
    };
  } catch (error) {
    console.error('Error calculating costs:', error);
    // Return a placeholder result to prevent errors cascading
    return {
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
  }
}

// Enhanced function to save calculation results with more metadata
export async function saveCalculationResult(userId: string, config: CalculationConfig, results: any, name: string, options: CalculationOptions = {}) {
  const db = getFirestore();
  
  try {
    // Extract options with defaults
    const redundancyMode = options.redundancyMode || 'N+1';
    const includeGenerator = options.includeGenerator || false;
    const sustainabilityOptions = options.sustainabilityOptions || {};
    const location = options.location || null;
    
    const docRef = await addDoc(collection(db, 'matrix_calculator', 'user_configurations', 'configs'), {
      userId,
      name,
      description: `${config.kwPerRack}kW per rack, ${config.coolingType} cooling, ${config.totalRacks || 28} racks`,
      kwPerRack: config.kwPerRack,
      coolingType: config.coolingType,
      totalRacks: config.totalRacks || 28,
      redundancyMode,
      includeGenerator,
      sustainabilityOptions,
      location,
      results,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Error saving calculation:', error);
    return { success: false, error };
  }
}

// New function to compare multiple configurations
export async function compareConfigurations(configIds: string[]): Promise<{
  success: boolean;
  error?: string;
  configurations?: any[];
  comparison?: any;
}> {
  if (!configIds || configIds.length === 0) {
    return { success: false, error: 'No configuration IDs provided' };
  }
  
  const db = getFirestore();
  const results: any[] = [];
  
  try {
    for (const id of configIds) {
      const docRef = doc(db, 'matrix_calculator', 'user_configurations', 'configs', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        results.push({
          id,
          ...docSnap.data()
        });
      }
    }
    
    if (results.length === 0) {
      return { success: false, error: 'No configurations found' };
    }
    
    // Use the comparison utility to analyze the configurations
    const comparison = compareConfigurationsUtil(results.map(r => {
      if (r.results) return r.results;
      return {};
    }));
    
    return {
      success: true,
      configurations: results,
      comparison
    };
  } catch (error) {
    console.error('Error comparing configurations:', error);
    return { success: false, error: String(error) };
  }
}

// Implement a more efficient calculateWithLocationFactors function
export async function calculateWithLocationFactors(
  kwPerRack: number, 
  coolingType: string, 
  totalRacks: number, 
  location: { latitude: number; longitude: number; }, 
  options: CalculationOptions = {}
): Promise<any> {
  try {
    // Check cache first
    const cacheKey = {
      kwPerRack,
      coolingType,
      totalRacks,
      latitude: location.latitude,
      longitude: location.longitude,
      options: JSON.stringify(options)
    };
    
    const cachedResult = locationFactorsCache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    // Get climate factor for the location
    const climateFactor = await getClimateFactor(location.latitude, location.longitude);
    
    // Calculate base configuration
    const baseConfig = await calculateConfigurationImpl(kwPerRack, coolingType, totalRacks, options);
    
    // Adjust cooling based on climate
    if (climateFactor) {
      // Adjust cooling capacity based on climate
      const adjustedCooling = {
        ...baseConfig.cooling,
        totalCapacity: Math.round(baseConfig.cooling.totalCapacity * (climateFactor.coolingFactor || 1.0)),
        pue: baseConfig.cooling.pue * ((climateFactor.temperature || 20) > 25 ? 1.05 : 0.95)
      };
      
      // Adjust energy metrics based on climate
      const energyConfig: any = {
        totalLoad: kwPerRack * totalRacks,
        pue: adjustedCooling.pue,
        renewablePercentage: climateFactor.renewableEnergyPotential,
        location: {
          latitude: location.latitude,
          longitude: location.longitude
        }
      };
      
      const energyMetrics = await calculateEnergyWithLocationFactors(energyConfig);
      
      const result = {
        ...baseConfig,
        cooling: adjustedCooling,
        climateFactor,
        energyMetrics
      };
      
      // Cache the result
      locationFactorsCache.set(cacheKey, result);
      
      return result;
    }
    
    return baseConfig;
  } catch (error) {
    console.error('Error calculating with location factors:', error);
    throw new Error('Failed to calculate with location factors: ' + (error instanceof Error ? error.message : String(error)));
  }
}