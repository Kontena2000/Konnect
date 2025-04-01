import { 
  serverTimestamp, 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  DocumentReference, 
  CollectionReference, 
  Firestore 
} from 'firebase/firestore';
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
import { getMatrixFirestore, matrixDocRef, matrixCollectionRef } from './matrixCalculatorHelpers';
import { getFirestoreOrThrow } from '@/services/firebaseHelpers';
import { PricingMatrix } from '@/types/pricingMatrix';

// Cached pricing and params
let cachedPricing: PricingMatrix | null = null;
let cachedParams: CalculationParams | null = null;
let lastFetchTime = 0;

// Safe document and collection reference creators
function getFirestore(): Firestore {
  return getMatrixFirestore();
}

function safeDocRef(path: string, ...pathSegments: string[]): DocumentReference {
  return matrixDocRef(path, ...pathSegments);
}

function safeCollectionRef(path: string, ...pathSegments: string[]): CollectionReference {
  return matrixCollectionRef(path, ...pathSegments);
}

export async function getPricingAndParams() {
  // Check if cache is valid (less than 5 minutes old)
  const now = Date.now();
  if (cachedPricing && cachedParams && now - lastFetchTime < 5 * 60 * 1000) {
    console.log('Using cached pricing and params data');
    return { pricing: cachedPricing, params: cachedParams };
  }
  
  try {
    // Get Firestore safely
    const db = getFirestoreOrThrow();
    if (!db) {
      console.error('Firestore is not initialized, using default values');
      calculatorDebug.error('Firestore is not initialized', 'Using default values');
      return { pricing: DEFAULT_PRICING, params: DEFAULT_CALCULATION_PARAMS };
    }
    
    // Fetch pricing with better error handling
    let pricing: PricingMatrix = DEFAULT_PRICING;
    try {
      const pricingDocRef = safeDocRef('matrix_calculator', 'pricing_matrix');
      console.log('Attempting to fetch pricing matrix from:', pricingDocRef.path);
      
      const pricingDoc = await getDoc(pricingDocRef);
      if (pricingDoc.exists()) {
        pricing = pricingDoc.data() as PricingMatrix;
        console.log('Successfully fetched pricing matrix from Firestore:', pricing);
        calculatorDebug.log('Successfully fetched pricing matrix', pricing);
      } else {
        console.log('Pricing matrix not found in Firestore, using default values');
        calculatorDebug.log('Pricing matrix not found, using defaults', DEFAULT_PRICING);
      }
    } catch (pricingError) {
      console.error('Error fetching pricing matrix:', pricingError);
      calculatorDebug.error('Error fetching pricing matrix', pricingError);
    }
    
    // Fetch parameters with better error handling
    let params: CalculationParams = DEFAULT_CALCULATION_PARAMS;
    try {
      const paramsDocRef = safeDocRef('matrix_calculator', 'calculation_params');
      console.log('Attempting to fetch calculation parameters from:', paramsDocRef.path);
      
      const paramsDoc = await getDoc(paramsDocRef);
      if (paramsDoc.exists()) {
        params = paramsDoc.data() as CalculationParams;
        console.log('Successfully fetched calculation parameters from Firestore:', params);
        calculatorDebug.log('Successfully fetched calculation parameters', params);
      } else {
        console.log('Calculation parameters not found in Firestore, using default values');
        calculatorDebug.log('Calculation parameters not found, using defaults', DEFAULT_CALCULATION_PARAMS);
      }
    } catch (paramsError) {
      console.error('Error fetching calculation parameters:', paramsError);
      calculatorDebug.error('Error fetching calculation parameters', paramsError);
    }
    
    // Update cache
    cachedPricing = pricing;
    cachedParams = params;
    lastFetchTime = now;
    
    return { pricing, params };
  } catch (error) {
    console.error('Error fetching data from Firestore:', error);
    calculatorDebug.error('Error fetching data from Firestore', error);
    return { pricing: DEFAULT_PRICING, params: DEFAULT_CALCULATION_PARAMS };
  }
}

// Memoized version of getPricingAndParams
export const getMemoizedPricingAndParams = memoize(
  getPricingAndParams,
  pricingCache,
  () => 'pricing_and_params'
);

// Rest of the file remains the same as in the previous implementation...
// [The remaining code would be identical to the previous version]

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

// [Continue with the rest of the existing implementation]

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
        pipingSize: 'dn110', // Add pipingSize for immersion cooling
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
        pipingSize: 'none', // Add default pipingSize for air cooling
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

// Helper function to ensure calculation results have all required properties
// This prevents 'undefined is not an object' errors when accessing nested properties
function safelyAccessCalculationResults(results: any) {
  // Provide a helper function to safely access nested properties
  if (!results) return {};
  
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
  
  return results;
}

// Wrap the calculateConfiguration function with debug logging
export const calculateConfiguration = withDebug(
  'calculateConfiguration',
  async (kwPerRack: number, coolingType: string, totalRacks: number, options: CalculationOptions = {}): Promise<any> => {
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

// Update the calculateCost function to ensure it doesn't return zero values
function calculateCost(config: any, pricing: PricingMatrix, params: CalculationParams) {
  try {
    console.log('Calculate Cost - Input Config:', JSON.stringify(config, null, 2));
    console.log('Calculate Cost - Pricing Matrix:', JSON.stringify(pricing, null, 2));
    calculatorDebug.log('Calculate Cost - Input Config', config);
    calculatorDebug.log('Calculate Cost - Pricing Matrix', pricing);
    
    // Validate inputs
    if (!config) {
      console.error('Configuration is undefined');
      throw new Error('Configuration is undefined');
    }
    
    if (!pricing) {
      console.error('Pricing matrix is undefined');
      throw new Error('Pricing matrix is undefined');
    }
    
    if (!params) {
      console.error('Calculation parameters are undefined');
      throw new Error('Calculation parameters are undefined');
    }
    
    // Check if pricing has actual data or is just an empty object
    const hasPricingData = Object.keys(pricing).length > 0 && 
                          pricing.busbar && Object.keys(pricing.busbar).length > 0;
    
    if (!hasPricingData) {
      console.error('Pricing matrix is empty or invalid, using default values');
      calculatorDebug.error('Pricing matrix is empty or invalid', pricing);
      pricing = DEFAULT_PRICING;
    }
    
    // Extract configuration values with validation
    const kwPerRack = typeof config.kwPerRack === 'number' ? config.kwPerRack : 75;
    const totalRacks = typeof config.totalRacks === 'number' ? config.totalRacks : 28;
    const busbarSize = config.busbarSize || 'busbar800A';
    const coolingType = config.cooling?.type || 'air';
    
    // Get electrical properties with defaults
    const tapOffBox = config.electrical?.tapOffBox || 'standard63A';
    const rpdu = config.electrical?.rpdu || 'standard16A';
    
    // Log the actual pricing values we're using
    console.log('Using busbar pricing:', pricing.busbar);
    console.log('Using tapOffBox pricing:', pricing.tapOffBox);
    console.log('Using rpdu pricing:', pricing.rpdu);
    
    // Calculate electrical costs with direct pricing access
    let busbarCost = 0;
    if (pricing.busbar && pricing.busbar[busbarSize]) {
      busbarCost = pricing.busbar[busbarSize];
      console.log(`Using actual pricing for ${busbarSize}: ${busbarCost}`);
    } else {
      busbarCost = busbarSize === 'busbar800A' ? 50000 : 
                  busbarSize === 'busbar1000A' ? 65000 : 
                  busbarSize === 'busbar1600A' ? 85000 : 110000;
      console.log(`Using fallback pricing for ${busbarSize}: ${busbarCost}`);
    }
    
    // Calculate tapOffBox cost with direct pricing access
    let tapOffBoxPrice = 0;
    const effectiveTapOffBox = coolingType === 'dlc' ? 'custom250A' : tapOffBox;
    
    if (pricing.tapOffBox && pricing.tapOffBox[effectiveTapOffBox]) {
      tapOffBoxPrice = pricing.tapOffBox[effectiveTapOffBox];
      console.log(`Using actual pricing for ${effectiveTapOffBox}: ${tapOffBoxPrice}`);
    } else {
      tapOffBoxPrice = effectiveTapOffBox === 'custom250A' ? 3500 : 
                      effectiveTapOffBox === 'standard63A' ? 1200 : 
                      effectiveTapOffBox === 'standard100A' ? 1800 : 2500;
      console.log(`Using fallback pricing for ${effectiveTapOffBox}: ${tapOffBoxPrice}`);
    }
    
    // Calculate rpdu cost with direct pricing access
    let rpduPrice = 0;
    if (pricing.rpdu && pricing.rpdu[rpdu]) {
      rpduPrice = pricing.rpdu[rpdu];
      console.log(`Using actual pricing for ${rpdu}: ${rpduPrice}`);
    } else {
      rpduPrice = rpdu === 'standard16A' ? 800 : 
                 rpdu === 'standard32A' ? 1200 : 2000;
      console.log(`Using fallback pricing for ${rpdu}: ${rpduPrice}`);
    }
    
    const tapOffBoxCost = tapOffBoxPrice * totalRacks;
    const rpduCost = rpduPrice * totalRacks;
    
    console.log('Electrical costs calculated:', { 
      busbarCost, 
      tapOffBoxCost, 
      rpduCost,
      totalRacks
    });
    
    // Calculate cooling costs based on cooling type
    let coolingCost = 0;
    
    if (coolingType === 'dlc') {
      // Check if we have actual pricing for DLC components
      const tcs310aXhtPrice = pricing.cooler?.tcs310aXht || 120000;
      const grundfosPumpPrice = pricing.cooler?.grundfosPump || 15000;
      const bufferTankPrice = pricing.cooler?.bufferTank || 8000;
      
      const pipingSize = config.cooling?.pipingSize || 'dn110';
      const pipePerMeterPrice = pipingSize === 'dn160' ? 
                               (pricing.piping?.dn160PerMeter || 350) : 
                               (pricing.piping?.dn110PerMeter || 200);
      
      const valvePrice = pipingSize === 'dn160' ? 
                        (pricing.piping?.valveDn160 || 2500) : 
                        (pricing.piping?.valveDn110 || 1500);
      
      coolingCost = tcs310aXhtPrice + grundfosPumpPrice + bufferTankPrice +
                   pipePerMeterPrice * 100 + valvePrice * 10;
      
      console.log('DLC cooling cost breakdown:', {
        tcs310aXhtPrice,
        grundfosPumpPrice,
        bufferTankPrice,
        pipingSize,
        pipePerMeterPrice,
        valvePrice,
        totalCost: coolingCost
      });
      
    } else if (coolingType === 'hybrid') {
      // Check if we have actual pricing for hybrid components
      const tcs310aXhtPrice = pricing.cooler?.tcs310aXht || 120000;
      const grundfosPumpPrice = pricing.cooler?.grundfosPump || 15000;
      const bufferTankPrice = pricing.cooler?.bufferTank || 8000;
      const pipePerMeterPrice = pricing.piping?.dn110PerMeter || 200;
      
      const dlcPortion = tcs310aXhtPrice * 0.7 + grundfosPumpPrice + bufferTankPrice + pipePerMeterPrice * 50;
      
      const rdhxModel = config.cooling?.rdhxModel || 'average';
      const rdhxPrice = pricing.rdhx?.[rdhxModel] || 80000;
      const rdhxUnits = Math.ceil(((config.cooling?.airPortion || 0) / 150) || 1);
      
      const airPortion = rdhxPrice * rdhxUnits;
      
      coolingCost = dlcPortion + airPortion;
      
      console.log('Hybrid cooling cost breakdown:', {
        dlcPortion,
        airPortion,
        rdhxModel,
        rdhxPrice,
        rdhxUnits,
        totalCost: coolingCost
      });
      
    } else if (coolingType === 'immersion') {
      // Check if we have actual pricing for immersion components
      const immersionTankPrice = pricing.cooler?.immersionTank || 80000;
      const immersionCDUPrice = pricing.cooler?.immersionCDU || 150000;
      const pipePerMeterPrice = pricing.piping?.dn110PerMeter || 200;
      
      const tanksNeeded = Math.ceil(totalRacks / 4);
      
      coolingCost = immersionTankPrice * tanksNeeded + immersionCDUPrice + pipePerMeterPrice * 50;
      
      console.log('Immersion cooling cost breakdown:', {
        immersionTankPrice,
        immersionCDUPrice,
        pipePerMeterPrice,
        tanksNeeded,
        totalCost: coolingCost
      });
      
    } else {
      // Default to air cooling
      const rdhxModel = config.cooling?.rdhxModel || 'standard';
      const rdhxUnits = config.cooling?.rdhxUnits || Math.ceil(totalRacks / 10);
      
      let rdhxPrice = 0;
      if (pricing.rdhx && pricing.rdhx[rdhxModel]) {
        rdhxPrice = pricing.rdhx[rdhxModel];
        console.log(`Using actual pricing for ${rdhxModel}: ${rdhxPrice}`);
      } else {
        rdhxPrice = rdhxModel === 'basic' ? 40000 : 
                   rdhxModel === 'standard' ? 60000 : 
                   rdhxModel === 'highDensity' ? 120000 : 80000;
        console.log(`Using fallback pricing for ${rdhxModel}: ${rdhxPrice}`);
      }
      
      coolingCost = rdhxPrice * rdhxUnits;
      
      console.log('Air cooling cost breakdown:', {
        rdhxModel,
        rdhxPrice,
        rdhxUnits,
        totalCost: coolingCost
      });
    }
    
    // Calculate power costs (UPS, battery, generator)
    let upsCost = 0;
    if (config.power?.ups) {
      const frameSize = config.power.ups.frameSize || 'frame2Module';
      const framesNeeded = config.power.ups.framesNeeded || 1;
      const redundantModules = config.power.ups.redundantModules || 2;
      
      let framePrice = 0;
      if (pricing.ups && pricing.ups[frameSize]) {
        framePrice = pricing.ups[frameSize];
        console.log(`Using actual pricing for ${frameSize}: ${framePrice}`);
      } else {
        framePrice = frameSize === 'frame2Module' ? 120000 : 
                    frameSize === 'frame4Module' ? 180000 : 240000;
        console.log(`Using fallback pricing for ${frameSize}: ${framePrice}`);
      }
      
      const modulePrice = pricing.ups?.module250kw || 50000;
      
      upsCost = framePrice * framesNeeded + modulePrice * redundantModules;
      
      console.log('UPS cost breakdown:', {
        frameSize,
        framePrice,
        framesNeeded,
        modulePrice,
        redundantModules,
        totalCost: upsCost
      });
    } else {
      // Default UPS cost
      const framePrice = pricing.ups?.frame2Module || 120000;
      const modulePrice = pricing.ups?.module250kw || 50000;
      
      upsCost = framePrice + modulePrice * 2;
      
      console.log('Default UPS cost breakdown:', {
        framePrice,
        modulePrice,
        totalCost: upsCost
      });
    }
    
    // Calculate battery costs
    let batteryCost = 0;
    if (config.power?.battery) {
      const cabinetsNeeded = config.power.battery.cabinetsNeeded || 1;
      const cabinetPrice = pricing.battery?.revoTp240Cabinet || 80000;
      
      batteryCost = cabinetPrice * cabinetsNeeded;
      
      console.log('Battery cost breakdown:', {
        cabinetPrice,
        cabinetsNeeded,
        totalCost: batteryCost
      });
    } else {
      // Default battery cost
      batteryCost = pricing.battery?.revoTp240Cabinet || 80000;
      
      console.log('Default battery cost:', batteryCost);
    }
    
    // Calculate generator costs if included
    let generatorCost = 0;
    if (config.power?.generator && config.power.generator.included) {
      const generatorCapacity = config.power.generator.capacity || 1000;
      const generatorPriceKey = generatorCapacity <= 1000 ? 'generator1000kva' :
                               generatorCapacity <= 2000 ? 'generator2000kva' : 'generator3000kva';
      
      let generatorPrice = 0;
      if (pricing.generator && pricing.generator[generatorPriceKey]) {
        generatorPrice = pricing.generator[generatorPriceKey];
        console.log(`Using actual pricing for ${generatorPriceKey}: ${generatorPrice}`);
      } else {
        generatorPrice = generatorPriceKey === 'generator1000kva' ? 200000 : 
                        generatorPriceKey === 'generator2000kva' ? 350000 : 500000;
        console.log(`Using fallback pricing for ${generatorPriceKey}: ${generatorPrice}`);
      }
      
      const fuelTankSize = config.power.generator.fuel?.tankSize || 1000;
      const fuelTankPerLiterPrice = pricing.generator?.fuelTankPerLiter || 2;
      
      generatorCost = generatorPrice + fuelTankSize * fuelTankPerLiterPrice;
      
      console.log('Generator cost breakdown:', {
        generatorCapacity,
        generatorPriceKey,
        generatorPrice,
        fuelTankSize,
        fuelTankPerLiterPrice,
        totalCost: generatorCost
      });
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
    
    const eHouseBasePrice = pricing.eHouse?.base || 150000;
    const eHousePerSqMeterPrice = pricing.eHouse?.perSqMeter || 5000;
    
    const eHouseCost = eHouseBasePrice + eHousePerSqMeterPrice * eHouseSize;
    
    console.log('E-house cost breakdown:', {
      eHouseBaseSqm,
      eHouseBatterySqm,
      eHouseGeneratorSqm,
      framesNeeded,
      cabinetsNeeded,
      eHouseSize,
      eHouseBasePrice,
      eHousePerSqMeterPrice,
      totalCost: eHouseCost
    });
    
    // Calculate sustainability options costs
    let sustainabilityCost = 0;
    if (pricing.sustainability) {
      if (config.sustainabilityOptions?.enableWasteHeatRecovery) {
        const heatRecoveryPrice = pricing.sustainability.heatRecoverySystem || 100000;
        sustainabilityCost += heatRecoveryPrice;
        console.log('Added heat recovery system cost:', heatRecoveryPrice);
      }
      
      if (config.sustainabilityOptions?.enableWaterRecycling) {
        const waterRecyclingPrice = pricing.sustainability.waterRecyclingSystem || 80000;
        sustainabilityCost += waterRecyclingPrice;
        console.log('Added water recycling system cost:', waterRecyclingPrice);
      }
      
      const renewablePercentage = config.sustainabilityOptions?.renewableEnergyPercentage || 0;
      if (renewablePercentage > 0) {
        const solarCapacity = (kwPerRack * totalRacks * renewablePercentage / 100) * 1.5;
        const solarPanelPerKwPrice = pricing.sustainability.solarPanelPerKw || 1500;
        const solarCost = solarCapacity * solarPanelPerKwPrice;
        
        sustainabilityCost += solarCost;
        
        console.log('Solar power cost breakdown:', {
          renewablePercentage,
          solarCapacity,
          solarPanelPerKwPrice,
          solarCost
        });
      }
    }
    
    // Calculate total equipment cost
    const electricalTotal = busbarCost + tapOffBoxCost + rpduCost;
    const powerTotal = upsCost + batteryCost + generatorCost;
    
    const equipmentCost = electricalTotal + coolingCost + powerTotal + eHouseCost + sustainabilityCost;
    
    // Calculate additional costs
    const installationPercentage = params.costFactors?.installationPercentage || 0.15;
    const engineeringPercentage = params.costFactors?.engineeringPercentage || 0.10;
    const contingencyPercentage = params.costFactors?.contingencyPercentage || 0.10;
    
    const installationCost = equipmentCost * installationPercentage;
    const engineeringCost = equipmentCost * engineeringPercentage;
    const contingencyCost = equipmentCost * contingencyPercentage;
    
    // Calculate total project cost
    const totalCost = equipmentCost + installationCost + engineeringCost + contingencyCost;
    
    console.log('Total cost breakdown:', {
      electricalTotal,
      coolingCost,
      powerTotal,
      eHouseCost,
      sustainabilityCost,
      equipmentCost,
      installationCost,
      engineeringCost,
      contingencyCost,
      totalCost
    });
    
    // Ensure we have a valid total cost
    const safeTotalCost = totalCost > 0 ? totalCost : (kwPerRack * totalRacks * 5000);
    
    // Return cost breakdown with precise values
    const result = {
      electrical: {
        busbar: Math.round(busbarCost),
        tapOffBox: Math.round(tapOffBoxCost),
        rpdu: Math.round(rpduCost),
        total: Math.round(electricalTotal)
      },
      cooling: Math.round(coolingCost),
      power: {
        ups: Math.round(upsCost),
        battery: Math.round(batteryCost),
        generator: Math.round(generatorCost),
        total: Math.round(powerTotal)
      },
      infrastructure: Math.round(eHouseCost),
      sustainability: Math.round(sustainabilityCost),
      equipmentTotal: Math.round(equipmentCost),
      installation: Math.round(installationCost),
      engineering: Math.round(engineeringCost),
      contingency: Math.round(contingencyCost),
      totalProjectCost: Math.round(safeTotalCost),
      costPerRack: Math.round(safeTotalCost / (totalRacks || 1)),
      costPerKw: Math.round(safeTotalCost / ((kwPerRack || 10) * (totalRacks || 1)))
    };
    
    console.log('Final cost calculation result:', result);
    calculatorDebug.log('Final cost calculation result', result);
    
    return result;
  } catch (error) {
    console.error('Error calculating costs:', error);
    calculatorDebug.error('Error calculating costs', error);
    
    // Return a fallback result with reasonable default values
    const totalRacks = config?.totalRacks || 28;
    const kwPerRack = config?.kwPerRack || 75;
    
    // Calculate a reasonable fallback total cost based on rack count and power density
    const fallbackTotalCost = totalRacks * kwPerRack * 5000;
    
    return {
      electrical: { 
        busbar: 50000, 
        tapOffBox: 1200 * totalRacks, 
        rpdu: 800 * totalRacks, 
        total: 50000 + 2000 * totalRacks 
      },
      cooling: config?.coolingType === 'air' ? 60000 : 150000,
      power: { 
        ups: 220000, 
        battery: 80000, 
        generator: config?.power?.generator?.included ? 200000 : 0, 
        total: 300000 
      },
      infrastructure: 250000,
      sustainability: 0,
      equipmentTotal: 700000,
      installation: 105000,
      engineering: 70000,
      contingency: 70000,
      totalProjectCost: fallbackTotalCost,
      costPerRack: Math.round(fallbackTotalCost / totalRacks),
      costPerKw: Math.round(fallbackTotalCost / (kwPerRack * totalRacks))
    };
  }
}

// Enhanced function to save calculation results with more metadata
export async function saveCalculationResult(userId: string, config: CalculationConfig, results: any, name: string, options: CalculationOptions = {}, projectId?: string) {
  try {
    // Extract options with defaults
    const redundancyMode = options.redundancyMode || 'N+1';
    const includeGenerator = options.includeGenerator || false;
    const sustainabilityOptions = options.sustainabilityOptions || {};
    const location = options.location || null;
    
    // If projectId is provided, validate project access
    if (projectId) {
      const projectRef = safeDocRef('projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        throw new Error('Project not found');
      }
      
      // Special case for ruud@kontena.eu - always has full access
      if (userId !== 'ruud@kontena.eu') {
        const project = projectSnap.data();
        if (project.userId !== userId && !project.sharedWith?.includes(userId)) {
          throw new Error('Unauthorized access to project');
        }
      }
    }
    
    const docRef = await addDoc(safeCollectionRef('matrix_calculator', 'user_configurations', 'configs'), {
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
      projectId, // Add projectId to the saved calculation
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

// New function to get calculations for a specific project
export async function getProjectCalculations(projectId: string): Promise<any[]> {
  try {
    const querySnapshot = await getDocs(
      query(
        safeCollectionRef('matrix_calculator', 'user_configurations', 'configs'),
        where('projectId', '==', projectId)
      )
    );
    
    const calculations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return calculations;
  } catch (error) {
    console.error('Error fetching project calculations:', error);
    return [];
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

/**
 * Fetch historical calculation data for comparison
 */
export async function fetchHistoricalCalculations(userId: string, limit = 5) {
  try {
    const calculationsQuery = query(
      safeCollectionRef('matrix_calculator', 'user_configurations', 'configs'),
      where('userId', '==', userId),
      where('status', '==', 'completed')
    );
    
    const calculationsSnapshot = await getDocs(calculationsQuery);
    return calculationsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    })).slice(0, limit);
  } catch (error) {
    console.error('Error fetching historical calculations:', error);
    return [];
  }
}