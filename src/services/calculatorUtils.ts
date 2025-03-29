
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp, setDoc, getDocs, query, where } from 'firebase/firestore';
import { DEFAULT_PRICING, DEFAULT_CALCULATION_PARAMS, REDUNDANCY_CONFIGURATIONS, COOLING_TYPES } from '@/constants/calculatorConstants';

// Types
export interface CalculationParams {
  electrical: {
    voltageFactor: number;
    powerFactor: number;
    busbarsPerRow: number;
    redundancyMode: string;
  };
  cooling: {
    deltaT: number;
    flowRateFactor: number;
    dlcResidualHeatFraction: number;
    chillerEfficiencyFactor: number;
    waterUsagePerKwh?: number;
    heatRejectionEfficiency?: number;
    hybridCoolingRatio?: number;
  };
  power: {
    upsModuleSize: number;
    upsFrameMaxModules: number;
    batteryRuntime: number;
    batteryEfficiency: number;
    eHouseBaseSqm: number;
    eHouseBatterySqm: number;
  };
  generator?: {
    sizingFactor?: number;
    fuelConsumptionRate?: number;
    fuelTankRuntime?: number;
    startupReliability?: number;
    maintenanceInterval?: number;
    loadFactor?: number;
    noxEmissionsFactor?: number;
  };
  costFactors: {
    installationPercentage: number;
    engineeringPercentage: number;
    contingencyPercentage: number;
    maintenancePercentage?: number;
    operationalPercentage?: number;
  };
  coolingThresholds: {
    airCooledMax: number;
    recommendedDlcMin: number;
    hybridCoolingMin?: number;
    hybridCoolingMax?: number;
  };
  sustainability?: {
    carbonIntensityGrid?: number;
    carbonIntensityDiesel?: number;
    waterRecoveryRate?: number;
    wasteHeatRecoveryRate?: number;
    renewableEnergyFraction?: number;
  };
  reliability?: {
    mtbfUps?: number;
    mtbfGenerator?: number;
    mtbfCooling?: number;
    mttrUps?: number;
    mttrGenerator?: number;
    mttrCooling?: number;
  };
}

export interface PricingMatrix {
  busbar: {
    base1250A: number;
    base2000A: number;
    perMeter: number;
    copperPremium: number;
  };
  tapOffBox: {
    [key: string]: number;
  };
  rpdu: {
    [key: string]: number;
  };
  rdhx: {
    [key: string]: number;
  };
  piping: {
    dn110PerMeter: number;
    dn160PerMeter: number;
    valveDn110: number;
    valveDn160: number;
  };
  cooler: {
    [key: string]: number;
  };
  ups: {
    [key: string]: number;
  };
  battery: {
    [key: string]: number;
  };
  generator?: {
    [key: string]: number;
  };
  eHouse: {
    base: number;
    perSqMeter: number;
  };
  sustainability?: {
    heatRecoverySystem?: number;
    waterRecyclingSystem?: number;
    solarPanelPerKw?: number;
    batteryStoragePerKwh?: number;
  };
}

export interface UserConfiguration {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  kwPerRack: number;
  coolingType: string;
  totalRacks: number;
  redundancyMode?: string;
  includeGenerator?: boolean;
  batteryRuntime?: number;
  sustainabilityOptions?: {
    enableWasteHeatRecovery?: boolean;
    enableWaterRecycling?: boolean;
    renewableEnergyPercentage?: number;
  };
  location?: {
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    address?: string;
    climateData?: {
      zone: string;
      avgTemperature: number;
      humidity: number;
      renewablePotential?: number;
      waterScarcityFactor?: number;
    };
  };
  results?: any;
  createdAt?: any;
  updatedAt?: any;
}

// Electrical utility functions
export function calculateCurrentPerRow(kwPerRack: number, params: CalculationParams) {
  const racksPerRow = 14; // Standard setup: 2 rows of 14 racks
  const totalKwPerRow = kwPerRack * racksPerRow;
  return Math.round(
    (totalKwPerRow * 1000) / 
    (params.electrical.voltageFactor * Math.sqrt(3) * params.electrical.powerFactor)
  );
}

export function calculateCurrentPerRack(kwPerRack: number, params: CalculationParams) {
  return Math.round(
    (kwPerRack * 1000) / 
    (params.electrical.voltageFactor * Math.sqrt(3) * params.electrical.powerFactor)
  );
}

export function selectBusbarSize(current: number) {
  const ratings = [250, 400, 600, 800, 1000, 1250, 1600, 2000];
  for (const rating of ratings) {
    if (rating >= current) return rating;
  }
  return 2000; // Max rating
}

export function selectTapOffBoxSize(current: number) {
  if (current <= 63) return 'standard63A';
  if (current <= 100) return 'custom100A';
  if (current <= 150) return 'custom150A';
  if (current <= 200) return 'custom200A';
  return 'custom250A';
}

export function selectRPDUSize(current: number) {
  return current <= 80 ? 'standard80A' : 'standard112A';
}

// Cost calculation utilities
export function calculateBusbarCost(size: number, pricing: PricingMatrix) {
  const basePrice = size <= 1250 ? pricing.busbar.base1250A : pricing.busbar.base2000A;
  return basePrice + (pricing.busbar.perMeter * 30); // Estimate 30m of busbar
}

// Generator sizing utility
export function calculateGeneratorSize(upsCapacity: number, params: CalculationParams) {
  const sizingFactor = params.generator?.sizingFactor || 1.2;
  return Math.round(upsCapacity * sizingFactor);
}

// Cooling capacity utility
export function calculateCoolingCapacity(totalITLoad: number, coolingType: string, params: CalculationParams) {
  const coolingInfo = COOLING_TYPES[coolingType.toUpperCase()] || COOLING_TYPES.AIR;
  
  switch (coolingType.toLowerCase()) {
    case 'dlc':
      return {
        dlcCoolingCapacity: totalITLoad * (1 - (params.cooling.dlcResidualHeatFraction || 0.25)),
        residualCoolingCapacity: totalITLoad * (params.cooling.dlcResidualHeatFraction || 0.25),
        totalCapacity: totalITLoad,
        pueImpact: coolingInfo.pueImpact
      };
    case 'hybrid':
      const hybridRatio = params.cooling.hybridCoolingRatio || 0.7;
      return {
        dlcPortion: totalITLoad * hybridRatio,
        airPortion: totalITLoad * (1 - hybridRatio),
        totalCapacity: totalITLoad,
        pueImpact: coolingInfo.pueImpact
      };
    case 'immersion':
      return {
        totalCapacity: totalITLoad * 1.05, // 5% safety margin
        pueImpact: coolingInfo.pueImpact
      };
    default: // air-cooled
      return {
        totalCapacity: totalITLoad * 1.1, // 10% safety margin
        pueImpact: coolingInfo.pueImpact
      };
  }
}

// Reliability calculation utility
export function calculateSystemAvailability(redundancyMode: string, hasGenerator: boolean, params: CalculationParams) {
  const redundancyConfig = REDUNDANCY_CONFIGURATIONS[redundancyMode] || REDUNDANCY_CONFIGURATIONS['N+1'];
  
  // Default values if not provided in params
  const mtbfUps = params.reliability?.mtbfUps || 250000;
  const mtbfGenerator = params.reliability?.mtbfGenerator || 175000;
  const mtbfCooling = params.reliability?.mtbfCooling || 200000;
  const mttrUps = params.reliability?.mttrUps || 4;
  const mttrGenerator = params.reliability?.mttrGenerator || 6;
  const mttrCooling = params.reliability?.mttrCooling || 8;
  
  // Calculate availability based on MTBF and MTTR
  const upsAvailability = mtbfUps / (mtbfUps + mttrUps);
  const generatorAvailability = hasGenerator ? mtbfGenerator / (mtbfGenerator + mttrGenerator) : 0;
  const coolingAvailability = mtbfCooling / (mtbfCooling + mttrCooling);
  
  // Apply redundancy factor
  const powerAvailability = hasGenerator ? 
    1 - ((1 - upsAvailability) * (1 - generatorAvailability)) : 
    upsAvailability;
  
  const systemAvailability = powerAvailability * coolingAvailability;
  const adjustedAvailability = systemAvailability * redundancyConfig.reliabilityFactor;
  
  return {
    availabilityPercentage: (adjustedAvailability * 100).toFixed(4),
    annualDowntimeMinutes: Math.round((1 - adjustedAvailability) * 365 * 24 * 60),
    tier: adjustedAvailability > 0.9999 ? "Tier IV" :
          adjustedAvailability > 0.999 ? "Tier III" :
          adjustedAvailability > 0.99 ? "Tier II" : "Tier I",
    components: {
      ups: (upsAvailability * 100).toFixed(4) + "%",
      generator: hasGenerator ? (generatorAvailability * 100).toFixed(4) + "%" : "N/A",
      cooling: (coolingAvailability * 100).toFixed(4) + "%"
    },
    redundancyImpact: redundancyConfig.description
  };
}

// Sustainability calculation utility
export function calculateSustainabilityMetrics(
  totalITLoad: number, 
  pue: number, 
  coolingType: string, 
  options: any,
  params: CalculationParams
) {
  // Default values if not provided in params
  const carbonIntensityGrid = params.sustainability?.carbonIntensityGrid || 0.35;
  const waterRecoveryRate = params.sustainability?.waterRecoveryRate || 0.6;
  const wasteHeatRecoveryRate = params.sustainability?.wasteHeatRecoveryRate || 0.4;
  const renewableEnergyFraction = params.sustainability?.renewableEnergyFraction || 0.2;
  
  // Get cooling info
  const coolingInfo = COOLING_TYPES[coolingType.toUpperCase()] || COOLING_TYPES.AIR;
  
  // Calculate annual energy consumption
  const annualITEnergy = totalITLoad * 24 * 365; // kWh per year
  const annualTotalEnergy = annualITEnergy * pue; // kWh per year including cooling overhead
  
  // Calculate water usage
  const hourlyWaterUsage = totalITLoad * coolingInfo.waterUsage; // L/hr
  const annualWaterUsage = hourlyWaterUsage * 24 * 365 / 1000; // m³ per year
  
  // Apply water recycling if enabled
  const waterRecyclingEnabled = options.enableWaterRecycling || false;
  const effectiveWaterUsage = waterRecyclingEnabled ? 
    annualWaterUsage * (1 - waterRecoveryRate) : 
    annualWaterUsage;
  
  // Calculate carbon footprint
  const renewablePercentage = options.renewableEnergyPercentage || renewableEnergyFraction;
  const gridEnergy = annualTotalEnergy * (1 - renewablePercentage);
  const carbonEmissions = gridEnergy * carbonIntensityGrid;
  
  // Calculate waste heat recovery potential
  const wasteHeatRecoveryEnabled = options.enableWasteHeatRecovery || false;
  const recoveredHeat = wasteHeatRecoveryEnabled ? 
    annualTotalEnergy * wasteHeatRecoveryRate : 0;
  
  return {
    pue,
    annualEnergyConsumption: {
      it: Math.round(annualITEnergy),
      total: Math.round(annualTotalEnergy),
      overhead: Math.round(annualTotalEnergy - annualITEnergy)
    },
    waterUsage: {
      hourly: Math.round(hourlyWaterUsage * 10) / 10, // L/hr
      annual: Math.round(effectiveWaterUsage), // m³/year
      recyclingEnabled: waterRecyclingEnabled,
      recyclingRate: waterRecyclingEnabled ? waterRecoveryRate : 0
    },
    carbonFootprint: {
      annual: Math.round(carbonEmissions / 1000), // tonnes CO2/year
      perKwh: Math.round(carbonEmissions / annualTotalEnergy * 1000) / 1000, // kg CO2/kWh
      renewablePercentage: renewablePercentage * 100
    },
    wasteHeatRecovery: {
      enabled: wasteHeatRecoveryEnabled,
      recoveredHeat: Math.round(recoveredHeat), // kWh/year
      potentialSavings: Math.round(recoveredHeat * 0.05) // Assume €0.05/kWh value
    }
  };
}

// Firebase utilities
export async function saveUserConfiguration(config: UserConfiguration) {
  const db = getFirestore();
  
  try {
    // Add timestamp
    const configWithTimestamp = {
      ...config,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'matrix_calculator', 'user_configurations', 'configs'), configWithTimestamp);
    
    // Add version history entry
    await addDoc(collection(db, 'matrix_calculator', 'version_history', 'entries'), {
      configId: docRef.id,
      userId: config.userId,
      action: 'create',
      timestamp: serverTimestamp(),
      data: configWithTimestamp
    });
    
    return {
      id: docRef.id,
      ...configWithTimestamp
    };
  } catch (error) {
    console.error('Error saving configuration:', error);
    throw error;
  }
}

export async function getUserConfigurations(userId: string) {
  const db = getFirestore();
  
  try {
    // First check if the collection exists
    const configsCollection = collection(db, 'matrix_calculator', 'user_configurations', 'configs');
    const querySnapshot = await getDocs(query(configsCollection, where('userId', '==', userId)));
    
    const configs: UserConfiguration[] = [];
    querySnapshot.forEach((doc) => {
      configs.push({
        id: doc.id,
        ...doc.data()
      } as UserConfiguration);
    });
    
    return configs;
  } catch (error) {
    console.error('Error fetching user configurations:', error);
    return [];
  }
}

export async function initializeCalculatorCollections() {
  const db = getFirestore();
  
  try {
    // Check if pricing matrix exists, if not create it
    const pricingDocRef = doc(db, 'matrix_calculator', 'pricing_matrix');
    const pricingDoc = await getDoc(pricingDocRef);
    if (!pricingDoc.exists()) {
      await setDoc(pricingDocRef, DEFAULT_PRICING);
    }
    
    // Check if calculation params exist, if not create them
    const paramsDocRef = doc(db, 'matrix_calculator', 'calculation_params');
    const paramsDoc = await getDoc(paramsDocRef);
    if (!paramsDoc.exists()) {
      await setDoc(paramsDocRef, DEFAULT_CALCULATION_PARAMS);
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing calculator collections:', error);
    return false;
  }
}

// Comparison utility
export function compareConfigurations(results: any[]) {
  if (!results || results.length === 0) return { configurations: [], summary: {} };
  
  const baseline = results[0];
  
  const comparisons = results.map((result, index) => {
    if (index === 0) return { ...result, comparison: { isBaseline: true } };
    
    const costDiff = (result.cost.totalProjectCost - baseline.cost.totalProjectCost) / baseline.cost.totalProjectCost;
    const pueDiff = (result.sustainability.pue - baseline.sustainability.pue) / baseline.sustainability.pue;
    const waterUsageDiff = (result.sustainability.waterUsage.annual - baseline.sustainability.waterUsage.annual) / baseline.sustainability.waterUsage.annual;
    const carbonFootprintDiff = (result.sustainability.carbonFootprint.annual - baseline.sustainability.carbonFootprint.annual) / baseline.sustainability.carbonFootprint.annual;
    
    return {
      ...result,
      comparison: {
        isBaseline: false,
        costDiff: costDiff,
        costDiffPercentage: (costDiff * 100).toFixed(1) + '%',
        pueDiff: pueDiff,
        pueDiffPercentage: (pueDiff * 100).toFixed(1) + '%',
        waterUsageDiff: waterUsageDiff,
        waterUsageDiffPercentage: (waterUsageDiff * 100).toFixed(1) + '%',
        carbonFootprintDiff: carbonFootprintDiff,
        carbonFootprintDiffPercentage: (carbonFootprintDiff * 100).toFixed(1) + '%',
      }
    };
  });
  
  return {
    configurations: comparisons,
    summary: {
      lowestCost: comparisons.reduce((prev, curr) => 
        prev.cost.totalProjectCost < curr.cost.totalProjectCost ? prev : curr
      ).rack,
      lowestPUE: comparisons.reduce((prev, curr) => 
        prev.sustainability.pue < curr.sustainability.pue ? prev : curr
      ).rack,
      lowestWaterUsage: comparisons.reduce((prev, curr) => 
        prev.sustainability.waterUsage.annual < curr.sustainability.waterUsage.annual ? prev : curr
      ).rack,
      lowestCarbonFootprint: comparisons.reduce((prev, curr) => 
        prev.sustainability.carbonFootprint.annual < curr.sustainability.carbonFootprint.annual ? prev : curr
      ).rack,
      highestReliability: comparisons.reduce((prev, curr) => 
        parseFloat(prev.reliability.availabilityPercentage) > parseFloat(curr.reliability.availabilityPercentage) ? prev : curr
      ).rack
    }
  };
}

// Climate adjustment utility
export function adjustForClimate(cooling: any, climateData: any) {
  if (!climateData) return cooling;
  
  const climateFactor = climateData.coolingFactor || 1.0;
  const adjustedCooling = JSON.parse(JSON.stringify(cooling));
  
  // Apply climate factor to cooling capacities
  if (cooling.type === 'dlc') {
    adjustedCooling.dlcCoolingCapacity = Math.round(cooling.dlcCoolingCapacity * climateFactor);
    adjustedCooling.residualCoolingCapacity = Math.round(cooling.residualCoolingCapacity * climateFactor);
    adjustedCooling.dlcFlowRate = Math.round(cooling.dlcFlowRate * climateFactor);
  } else if (cooling.type === 'hybrid') {
    adjustedCooling.dlcPortion = Math.round(cooling.dlcPortion * climateFactor);
    adjustedCooling.airPortion = Math.round(cooling.airPortion * climateFactor);
    adjustedCooling.dlcFlowRate = Math.round(cooling.dlcFlowRate * climateFactor);
  } else {
    adjustedCooling.totalCoolingCapacity = Math.round(cooling.totalCoolingCapacity * climateFactor);
  }
  
  return adjustedCooling;
}
