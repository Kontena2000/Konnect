import { getFirestore, doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { DEFAULT_PRICING, DEFAULT_CALCULATION_PARAMS } from '@/constants/calculatorConstants';
import { getClimateFactor } from './climateDataService';
import { calculateEnergyMetrics } from './energyDataService';
import { 
  calculateCurrentPerRow, 
  calculateCurrentPerRack, 
  selectBusbarSize, 
  selectTapOffBoxSize, 
  selectRPDUSize,
  calculateBusbarCost,
  CalculationParams,
  PricingMatrix
} from './calculatorUtils';

// Cache
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

export interface CalculationConfig {
  kwPerRack: number;
  coolingType: string;
  totalRacks?: number;
}

export async function calculateConfiguration(kwPerRack: number, coolingType: string, totalRacks = 28) {
  const { pricing, params } = await getPricingAndParams();
  
  // Calculate electrical requirements
  const currentPerRow = calculateCurrentPerRow(kwPerRack, params);
  const busbarSize = selectBusbarSize(currentPerRow);
  const currentPerRack = calculateCurrentPerRack(kwPerRack, params);
  const tapOffBox = selectTapOffBoxSize(currentPerRack);
  const rpdu = selectRPDUSize(currentPerRack);
  
  // Calculate cooling requirements
  const cooling = calculateCoolingRequirements(kwPerRack, coolingType, totalRacks, params);
  
  // Calculate UPS and battery
  const ups = calculateUPSRequirements(kwPerRack, totalRacks, params);
  const battery = calculateBatteryRequirements(ups.totalITLoad, params);
  
  // Calculate costs
  const cost = calculateCost({
    kwPerRack,
    coolingType,
    totalRacks,
    busbarSize,
    cooling,
    ups,
    battery,
    electrical: {
      currentPerRack,
      tapOffBox,
      rpdu
    }
  }, pricing, params);
  
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
    power: {
      ups,
      battery
    },
    cost
  };
}

export async function calculateWithLocationFactors(config: CalculationConfig, location: any) {
  // Get base configuration
  const baseConfig = await calculateConfiguration(
    config.kwPerRack,
    config.coolingType,
    config.totalRacks
  );
  
  // Check if location has climate data
  if (!location || !location.climateData) {
    console.warn('No climate data available for location-based calculations');
    return {
      ...baseConfig,
      location: location ? {
        coordinates: location.coordinates,
        address: location.address
      } : null
    };
  }
  
  try {
    // Adjust cooling for climate
    const adjustedCooling = adjustCoolingForClimate(
      baseConfig.cooling,
      location.climateData
    );
    
    // Calculate energy metrics
    const energyMetrics = calculateEnergyMetrics(
      config,
      location.climateData
    );
    
    return {
      ...baseConfig,
      cooling: adjustedCooling,
      energy: energyMetrics,
      location: {
        coordinates: location.coordinates,
        address: location.address,
        climateZone: location.climateData.zone,
        avgTemperature: location.climateData.avgTemperature,
        humidity: location.climateData.humidity
      }
    };
  } catch (error) {
    console.error('Error in location-based calculations:', error);
    // Fall back to base configuration if location calculations fail
    return baseConfig;
  }
}

// Helper functions
function calculateCoolingRequirements(kwPerRack: number, coolingType: string, totalRacks: number, params: CalculationParams) {
  const totalITLoad = kwPerRack * totalRacks;
  
  // DLC vs air-cooled calculations
  if (coolingType === 'dlc') {
    // Direct Liquid Cooling
    const dlcCoolingCapacity = totalITLoad * (1 - params.cooling.dlcResidualHeatFraction);
    const residualCoolingCapacity = totalITLoad * params.cooling.dlcResidualHeatFraction;
    
    // Calculate flow rates
    const dlcFlowRate = dlcCoolingCapacity * params.cooling.flowRateFactor;
    
    return {
      type: 'dlc',
      totalCoolingCapacity: totalITLoad,
      dlcCoolingCapacity,
      residualCoolingCapacity,
      dlcFlowRate: Math.round(dlcFlowRate),
      pipingSize: dlcFlowRate > 500 ? 'dn160' : 'dn110',
      coolerModel: 'tcs310aXht',
      warning: kwPerRack < params.coolingThresholds?.recommendedDlcMin ? 
        `Power density (${kwPerRack} kW/rack) is below recommended minimum (${params.coolingThresholds?.recommendedDlcMin} kW/rack) for DLC.` : ''
    };
  } else {
    // Air-cooled
    const coolingCapacity = totalITLoad * 1.1; // 10% safety margin
    
    return {
      type: 'air-cooled',
      totalCoolingCapacity: coolingCapacity,
      rdhxUnits: Math.ceil(coolingCapacity / 150), // Each RDHX can handle ~150kW
      rdhxModel: 'average',
      warning: kwPerRack > params.coolingThresholds?.airCooledMax ? 
        `Power density (${kwPerRack} kW/rack) exceeds maximum recommended (${params.coolingThresholds?.airCooledMax} kW/rack) for air cooling.` : ''
    };
  }
}

function calculateUPSRequirements(kwPerRack: number, totalRacks: number, params: CalculationParams) {
  const totalITLoad = kwPerRack * totalRacks;
  
  // Calculate required UPS capacity with N+1 redundancy
  const requiredCapacity = totalITLoad * 1.2; // 20% headroom
  const moduleSize = params.power.upsModuleSize;
  const modulesNeeded = Math.ceil(requiredCapacity / moduleSize);
  const redundantModules = params.electrical.redundancyMode === 'N+1' ? 
    modulesNeeded + 1 : 
    params.electrical.redundancyMode === '2N' ? 
      modulesNeeded * 2 : 
      modulesNeeded;
  
  // Determine UPS frame size
  const modulesPerFrame = params.power.upsFrameMaxModules;
  const framesNeeded = Math.ceil(redundantModules / modulesPerFrame);
  
  let frameSize;
  if (redundantModules <= 4) frameSize = 'frame1000kw';
  else if (redundantModules <= 6) frameSize = 'frame1500kw';
  else frameSize = 'frame2000kw';
  
  return {
    totalITLoad,
    requiredCapacity: Math.round(requiredCapacity),
    moduleSize,
    modulesNeeded,
    redundantModules,
    framesNeeded,
    frameSize,
    redundancyMode: params.electrical.redundancyMode
  };
}

function calculateBatteryRequirements(totalLoad: number, params: CalculationParams) {
  // Calculate battery requirements
  const runtimeMinutes = params.power.batteryRuntime;
  const batteryEfficiency = params.power.batteryEfficiency;
  
  // Convert to kWh
  const energyRequired = (totalLoad * runtimeMinutes) / 60 / batteryEfficiency;
  
  // Each cabinet is ~240kWh
  const cabinetsNeeded = Math.ceil(energyRequired / 240);
  
  return {
    runtimeMinutes,
    energyRequired: Math.round(energyRequired),
    cabinetsNeeded,
    cabinetModel: 'revoTp240Cabinet'
  };
}

function calculateCost(config: any, pricing: PricingMatrix, params: CalculationParams) {
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
  } else {
    coolingCost = pricing.rdhx[config.cooling.rdhxModel] * config.cooling.rdhxUnits;
  }
  
  // Calculate power costs
  const upsCost = pricing.ups[config.power.ups.frameSize] * config.power.ups.framesNeeded +
                 pricing.ups.module250kw * config.power.ups.redundantModules;
  const batteryCost = pricing.battery.revoTp240Cabinet * config.power.battery.cabinetsNeeded;
  
  // Calculate e-house costs
  const eHouseBaseSqm = params.power.eHouseBaseSqm || 20; // Base square meters for e-house per UPS frame
  const eHouseBatterySqm = params.power.eHouseBatterySqm || 5; // Additional square meters per battery cabinet
  const eHouseSize = eHouseBaseSqm * config.power.ups.framesNeeded +
                    eHouseBatterySqm * config.power.battery.cabinetsNeeded;
  const eHouseCost = pricing.eHouse.base + pricing.eHouse.perSqMeter * eHouseSize;
  
  // Calculate total equipment cost
  const equipmentCost = busbarCost + tapOffBoxCost + rpduCost + coolingCost + upsCost + batteryCost + eHouseCost;
  
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
      total: Math.round(upsCost + batteryCost)
    },
    infrastructure: Math.round(eHouseCost),
    equipmentTotal: Math.round(equipmentCost),
    installation: Math.round(installationCost),
    engineering: Math.round(engineeringCost),
    contingency: Math.round(contingencyCost),
    totalProjectCost: Math.round(totalCost),
    costPerRack: Math.round(totalCost / config.totalRacks),
    costPerKw: Math.round(totalCost / (config.kwPerRack * config.totalRacks))
  };
}

function adjustCoolingForClimate(cooling: any, climateData: any) {
  if (!climateData) {
    return cooling; // Return unchanged if no climate data
  }
  
  try {
    const climateFactor = getClimateFactor(climateData, cooling.type);
    
    // Create a deep copy of the cooling object
    const adjustedCooling = JSON.parse(JSON.stringify(cooling));
    
    // Apply climate factor to cooling capacities
    if (cooling.type === 'dlc') {
      adjustedCooling.dlcCoolingCapacity = Math.round(cooling.dlcCoolingCapacity * climateFactor);
      adjustedCooling.residualCoolingCapacity = Math.round(cooling.residualCoolingCapacity * climateFactor);
      adjustedCooling.dlcFlowRate = Math.round(cooling.dlcFlowRate * climateFactor);
    } else {
      adjustedCooling.totalCoolingCapacity = Math.round(cooling.totalCoolingCapacity * climateFactor);
      adjustedCooling.rdhxUnits = Math.ceil(adjustedCooling.totalCoolingCapacity / 150);
    }
    
    // Add climate adjustment note
    adjustedCooling.climateAdjustment = {
      factor: climateFactor.toFixed(2),
      note: `Cooling requirements ${climateFactor > 1 ? 'increased' : 'decreased'} by ${Math.abs((climateFactor - 1) * 100).toFixed(0)}% due to ${climateData.zone} climate conditions.`
    };
    
    return adjustedCooling;
  } catch (error) {
    console.error('Error adjusting cooling for climate:', error);
    return cooling; // Return original cooling data if adjustment fails
  }
}

// Save calculation results
export async function saveCalculationResult(userId: string, config: CalculationConfig, results: any, name: string) {
  const db = getFirestore();
  
  try {
    const docRef = await addDoc(collection(db, 'matrix_calculator', 'user_configurations', 'configs'), {
      userId,
      name,
      description: `${config.kwPerRack}kW per rack, ${config.coolingType} cooling, ${config.totalRacks || 28} racks`,
      kwPerRack: config.kwPerRack,
      coolingType: config.coolingType,
      totalRacks: config.totalRacks || 28,
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