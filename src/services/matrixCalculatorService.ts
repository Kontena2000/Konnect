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
  location?: any;
}

// Calculate UPS requirements
function calculateUPSRequirements(kwPerRack: number, totalRacks: number, params: CalculationParams) {
  const totalITLoad = kwPerRack * totalRacks;
  const redundancyFactor = params.electrical.redundancyMode === 'N' ? 1 :
                          params.electrical.redundancyMode === 'N+1' ? 1.2 :
                          params.electrical.redundancyMode === '2N' ? 2 : 1.5;
  
  const requiredCapacity = totalITLoad * redundancyFactor;
  const moduleSize = params.power.upsModuleSize || 250; // kW
  const maxModulesPerFrame = params.power.upsFrameMaxModules || 6;
  
  // Calculate number of modules needed
  const totalModulesNeeded = Math.ceil(requiredCapacity / moduleSize);
  const framesNeeded = Math.ceil(totalModulesNeeded / maxModulesPerFrame);
  
  // Determine frame size based on modules per frame
  const frameSize = totalModulesNeeded <= 2 ? 'frame2Module' :
                   totalModulesNeeded <= 4 ? 'frame4Module' : 'frame6Module';
  
  return {
    totalITLoad,
    redundancyFactor,
    requiredCapacity,
    moduleSize,
    totalModulesNeeded,
    redundantModules: totalModulesNeeded,
    framesNeeded,
    frameSize
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

export async function calculateConfiguration(kwPerRack: number, coolingType: string, totalRacks = 28, options: CalculationOptions = {}) {
  try {
    const { pricing, params } = await getMemoizedPricingAndParams();
    
    // Extract options with defaults
    const {
      redundancyMode = params.electrical.redundancyMode,
      includeGenerator = false,
      batteryRuntime = params.power.batteryRuntime,
      sustainabilityOptions = {
        enableWasteHeatRecovery: false,
        enableWaterRecycling: false,
        renewableEnergyPercentage: 20
      }
    } = options;
    
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
    
    // Calculate electrical requirements
    const currentPerRow = calculateCurrentPerRow(kwPerRack, updatedParams);
    const busbarSize = selectBusbarSize(currentPerRow);
    const currentPerRack = calculateCurrentPerRack(kwPerRack, updatedParams);
    const tapOffBox = selectTapOffBoxSize(currentPerRack);
    const rpdu = selectRPDUSize(currentPerRack);
    
    // Calculate cooling requirements
    const cooling = calculateCoolingRequirements(kwPerRack, coolingType, totalRacks, updatedParams);
    
    // Calculate thermal distribution
    const thermalDistribution = calculateThermalDistribution(
      kwPerRack * totalRacks,
      coolingType,
      updatedParams
    );
    
    // Calculate UPS and battery
    const ups = calculateUPSRequirements(kwPerRack, totalRacks, updatedParams);
    const battery = calculateBatteryRequirements(ups.totalITLoad, updatedParams);
    
    // Calculate generator if included
    const generator = calculateGeneratorRequirements(
      ups.requiredCapacity,
      includeGenerator,
      updatedParams
    );
    
    // Calculate pipe sizing for DLC
    let pipeSizing = null;
    if (coolingType === 'dlc' || coolingType === 'hybrid') {
      const flowRate = cooling.dlcFlowRate || thermalDistribution.distribution.liquid.load * updatedParams.cooling.flowRateFactor;
      pipeSizing = calculatePipeSizing(flowRate, updatedParams.cooling.deltaT);
    }
    
    // Calculate costs
    const cost = calculateCost({
      kwPerRack,
      coolingType,
      totalRacks,
      busbarSize,
      cooling,
      ups,
      battery,
      generator,
      electrical: {
        currentPerRack,
        tapOffBox,
        rpdu
      },
      sustainabilityOptions
    }, pricing, updatedParams);
    
    // Calculate system availability
    const reliability = calculateSystemAvailability(
      redundancyMode,
      includeGenerator,
      updatedParams
    );
    
    // Calculate sustainability metrics
    const sustainability = calculateSustainabilityMetrics(
      ups.totalITLoad,
      thermalDistribution.pue,
      coolingType,
      sustainabilityOptions,
      updatedParams
    );
    
    // Calculate TCO
    const tco = calculateTCO(
      cost.totalProjectCost,
      sustainability.annualEnergyConsumption.total,
      coolingType,
      includeGenerator,
      updatedParams
    );
    
    // Calculate carbon footprint
    // Ensure we have a valid number for generator capacity
    const generatorCapacity = (generator && generator.included && typeof generator.capacity === 'number') ? generator.capacity : 0;
    // Ensure we have a valid number for renewable percentage
    const renewablePercentage = sustainabilityOptions?.renewableEnergyPercentage ?? 20;
    
    const carbonFootprint = calculateCarbonFootprint(
      sustainability.annualEnergyConsumption.total,
      includeGenerator,
      24, // Assume 24 hours of generator testing per year
      generatorCapacity, // Now guaranteed to be a number
      renewablePercentage,
      updatedParams
    );
    
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
        ups,
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
    throw new Error('Failed to calculate configuration: ' + (error instanceof Error ? error.message : String(error)));
  }
}

// Fix the calculateCost function to handle undefined values
function calculateCost(config: any, pricing: PricingMatrix, params: CalculationParams) {
  try {
    // Calculate electrical costs
    const busbarCost = calculateBusbarCost(config.busbarSize, pricing);
    const tapOffBoxCost = pricing.tapOffBox[config.cooling.type === 'dlc' ? 
      'custom250A' : config.electrical.tapOffBox] * config.totalRacks;
    const rpduCost = pricing.rpdu[config.electrical.rpdu] * config.totalRacks;
    
    // Calculate cooling costs
    let coolingCost = 0;
    if (config.cooling.type === 'dlc') {
      coolingCost = pricing.cooler.tcs310aXht + 
                   pricing.cooler.grundfosPump + 
                   pricing.cooler.bufferTank +
                   (config.cooling.pipingSize === 'dn160' ? 
                    pricing.piping.dn160PerMeter : pricing.piping.dn110PerMeter) * 100 + // Estimate 100m of piping
                   (config.cooling.pipingSize === 'dn160' ? 
                    pricing.piping.valveDn160 : pricing.piping.valveDn110) * 10; // Estimate 10 valves
    } else if (config.cooling.type === 'hybrid') {
      // For hybrid, calculate both DLC and air cooling components
      const dlcPortion = pricing.cooler.tcs310aXht * 0.7 + // Scale down for partial coverage
                        pricing.cooler.grundfosPump + 
                        pricing.cooler.bufferTank +
                        pricing.piping.dn110PerMeter * 50; // Less piping than full DLC
      
      // Use airPortion property for hybrid cooling
      const airPortion = pricing.rdhx.average * Math.ceil((config.cooling.airPortion || 0) / 150);
      
      coolingCost = dlcPortion + airPortion;
    } else if (config.cooling.type === 'immersion') {
      // Immersion cooling is typically more expensive
      coolingCost = pricing.cooler.immersionTank * Math.ceil(config.totalRacks / 4) + // Each tank handles ~4 racks
                   pricing.cooler.immersionCDU + 
                   pricing.piping.dn110PerMeter * 50;
    } else {
      coolingCost = pricing.rdhx[config.cooling.rdhxModel] * config.cooling.rdhxUnits;
    }
    
    // Calculate power costs
    const upsCost = pricing.ups[config.power.ups.frameSize] * config.power.ups.framesNeeded +
                   pricing.ups.module250kw * config.power.ups.redundantModules;
    const batteryCost = pricing.battery.revoTp240Cabinet * config.power.battery.cabinetsNeeded;
    
    // Calculate generator costs if included
    let generatorCost = 0;
    if (config.power.generator && config.power.generator.included) {
      const generatorCapacity = config.power.generator.capacity;
      const generatorPriceKey = generatorCapacity <= 1000 ? 'generator1000kva' :
                               generatorCapacity <= 2000 ? 'generator2000kva' : 'generator3000kva';
      
      generatorCost = pricing.generator?.[generatorPriceKey] || 0;
      
      // Add fuel tank cost - ensure fuelTankSize is a number
      const fuelTankSize = config.power.generator.fuel?.tankSize || 0;
      generatorCost += fuelTankSize * (pricing.generator?.fuelTankPerLiter || 1);
    }
    
    // Calculate e-house costs
    const eHouseBaseSqm = params.power.eHouseBaseSqm || 20; // Base square meters for e-house per UPS frame
    const eHouseBatterySqm = params.power.eHouseBatterySqm || 5; // Additional square meters per battery cabinet
    const eHouseGeneratorSqm = config.power.generator?.included ? 30 : 0; // Space for generator if included
    
    const eHouseSize = eHouseBaseSqm * config.power.ups.framesNeeded +
                      eHouseBatterySqm * config.power.battery.cabinetsNeeded +
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
      
      // Add renewable energy costs if specified
      const renewablePercentage = config.sustainabilityOptions?.renewableEnergyPercentage || 0;
      if (renewablePercentage > 0) {
        // Estimate solar capacity needed based on IT load and percentage
        const solarCapacity = (config.kwPerRack * config.totalRacks * renewablePercentage / 100) * 1.5; // 1.5x oversizing
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
    
    return {
      electrical: {
        busbar: Math.round(busbarCost),
        tapOffBox: Math.round(tapOffBoxCost),
        rpdu: Math.round(rpduCost),
        total: Math.round(busbarCost + tapOffBoxCost + rpduCost)
      },
      cooling: Math.round(coolingCost),
      power: {
        ups: Math.round(upsCost),
        battery: Math.round(batteryCost),
        generator: Math.round(generatorCost),
        total: Math.round(upsCost + batteryCost + generatorCost)
      },
      infrastructure: Math.round(eHouseCost),
      sustainability: Math.round(sustainabilityCost),
      equipmentTotal: Math.round(equipmentCost),
      installation: Math.round(installationCost),
      engineering: Math.round(engineeringCost),
      contingency: Math.round(contingencyCost),
      totalProjectCost: Math.round(totalCost),
      costPerRack: Math.round(totalCost / config.totalRacks),
      costPerKw: Math.round(totalCost / (config.kwPerRack * config.totalRacks))
    };
  } catch (error) {
    console.error('Error calculating costs:', error);
    throw new Error('Cost calculation failed');
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

// Function to calculate with location factors
export async function calculateWithLocationFactors(
  kwPerRack: number, 
  coolingType: string, 
  totalRacks: number, 
  location: { latitude: number; longitude: number; }, 
  options: CalculationOptions = {}
) {
  try {
    // Get climate factor for the location
    const climateFactor = await getClimateFactor(location.latitude, location.longitude);
    
    // Calculate base configuration
    const baseConfig = await calculateConfiguration(kwPerRack, coolingType, totalRacks, options);
    
    // Adjust cooling based on climate
    if (climateFactor) {
      // Adjust cooling capacity based on climate
      const adjustedCooling = {
        ...baseConfig.cooling,
        totalCapacity: Math.round(baseConfig.cooling.totalCapacity * (climateFactor.coolingFactor || 1.0)),
        pue: baseConfig.cooling.pue * ((climateFactor.temperature || 20) > 25 ? 1.05 : 0.95)
      };
      
      // Adjust energy metrics based on climate
      const energyMetrics = calculateEnergyMetrics(
        kwPerRack * totalRacks,
        adjustedCooling.pue,
        climateFactor.renewableEnergyPotential || 0.2
      );
      
      return {
        ...baseConfig,
        cooling: adjustedCooling,
        climateFactor,
        energyMetrics
      };
    }
    
    return baseConfig;
  } catch (error) {
    console.error('Error calculating with location factors:', error);
    throw new Error('Failed to calculate with location factors: ' + (error instanceof Error ? error.message : String(error)));
  }
}