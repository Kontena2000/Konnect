import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp, setDoc, getDocs, query, where } from 'firebase/firestore';
import { DEFAULT_PRICING, DEFAULT_CALCULATION_PARAMS } from '@/constants/calculatorConstants';

// Define constants locally to avoid import errors
export const REDUNDANCY_CONFIGURATIONS = {
  'N': {
    description: 'No redundancy',
    capacityFactor: 1.0,
    reliabilityFactor: 0.98,
    costFactor: 1.0
  },
  'N+1': {
    description: 'One redundant component',
    capacityFactor: 1.2,
    reliabilityFactor: 0.995,
    costFactor: 1.2
  },
  '2N': {
    description: 'Full redundancy (two complete systems)',
    capacityFactor: 2.0,
    reliabilityFactor: 0.9998,
    costFactor: 1.9
  },
  '2N+1': {
    description: 'Full redundancy plus one component',
    capacityFactor: 2.2,
    reliabilityFactor: 0.99995,
    costFactor: 2.1
  },
  '3N': {
    description: 'Triple redundancy',
    capacityFactor: 3.0,
    reliabilityFactor: 0.99999,
    costFactor: 2.8
  }
};

export const COOLING_TYPES = {
  'AIR': {
    name: 'Air Cooling',
    maxDensity: 75,
    pueImpact: 1.4,
    waterUsage: 0.5,
    costFactor: 1.0
  },
  'DLC': {
    name: 'Direct Liquid Cooling',
    maxDensity: 200,
    pueImpact: 1.15,
    waterUsage: 1.2,
    costFactor: 1.5
  },
  'HYBRID': {
    name: 'Hybrid Cooling',
    maxDensity: 150,
    pueImpact: 1.25,
    waterUsage: 0.9,
    costFactor: 1.3
  },
  'IMMERSION': {
    name: 'Immersion Cooling',
    maxDensity: 250,
    pueImpact: 1.08,
    waterUsage: 0.3,
    costFactor: 2.0
  }
};

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
export function calculateGeneratorRequirements(requiredCapacity: number, includeGenerator: boolean, params: CalculationParams) {
  // Ensure requiredCapacity is a number
  const capacity = typeof requiredCapacity === 'number' ? requiredCapacity : 0;
  
  if (!includeGenerator) {
    return {
      included: false,
      capacity: 0,
      fuel: {
        tankSize: 0,
        runtime: 0
      }
    };
  }
  
  // Rest of the function...
  const generatorCapacity = Math.ceil(capacity * 1.25 / 800) * 800; // Round up to nearest 800kVA
  const fuelConsumption = generatorCapacity * 0.2; // L/hr at full load
  const fuelTankSize = fuelConsumption * 8; // 8 hours runtime
  
  return {
    included: true,
    capacity: generatorCapacity,
    model: generatorCapacity <= 1000 ? '1000kVA' : 
           generatorCapacity <= 2000 ? '2000kVA' : '3000kVA',
    fuel: {
      tankSize: fuelTankSize,
      consumption: fuelConsumption,
      runtime: 8 // hours
    }
  };
}

// Cooling capacity utility
export function calculateCoolingCapacity(totalITLoad: number, coolingType: string, params: CalculationParams) {
  const coolingTypeKey = coolingType.toUpperCase() as keyof typeof COOLING_TYPES;
  const coolingInfo = COOLING_TYPES[coolingTypeKey] || COOLING_TYPES.AIR;
  
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
  const redundancyKey = redundancyMode as keyof typeof REDUNDANCY_CONFIGURATIONS;
  const redundancyConfig = REDUNDANCY_CONFIGURATIONS[redundancyKey] || REDUNDANCY_CONFIGURATIONS['N+1'];
  
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
    tier: adjustedAvailability > 0.9999 ? 'Tier IV' :
          adjustedAvailability > 0.999 ? 'Tier III' :
          adjustedAvailability > 0.99 ? 'Tier II' : 'Tier I',
    components: {
      ups: (upsAvailability * 100).toFixed(4) + '%',
      generator: hasGenerator ? (generatorAvailability * 100).toFixed(4) + '%' : 'N/A',
      cooling: (coolingAvailability * 100).toFixed(4) + '%'
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
  const coolingTypeKey = coolingType.toUpperCase() as keyof typeof COOLING_TYPES;
  const coolingInfo = COOLING_TYPES[coolingTypeKey] || COOLING_TYPES.AIR;
  
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

// Add these new utility functions

// Pipe sizing calculation for DLC systems
export function calculatePipeSizing(flowRate: number, deltaT: number) {
  // Calculate pipe diameter based on flow rate and temperature difference
  // Formula based on standard hydraulic calculations
  const flowRateM3h = flowRate / 1000; // Convert L/h to m³/h
  
  // Calculate minimum pipe cross-sectional area (m²)
  // Using velocity limit of 2.5 m/s for optimal performance
  const maxVelocity = 2.5; // m/s
  const minArea = flowRateM3h / (3600 * maxVelocity);
  
  // Calculate minimum diameter (mm)
  const minDiameter = Math.sqrt(minArea * 4 / Math.PI) * 1000;
  
  // Select standard pipe size
  const standardSizes = [
    { name: 'DN50', diameter: 50 },
    { name: 'DN80', diameter: 80 },
    { name: 'DN100', diameter: 100 },
    { name: 'DN110', diameter: 110 },
    { name: 'DN125', diameter: 125 },
    { name: 'DN150', diameter: 150 },
    { name: 'DN160', diameter: 160 },
    { name: 'DN200', diameter: 200 },
    { name: 'DN250', diameter: 250 }
  ];
  
  let selectedSize = standardSizes[standardSizes.length - 1];
  for (const size of standardSizes) {
    if (size.diameter >= minDiameter) {
      selectedSize = size;
      break;
    }
  }
  
  // Calculate actual velocity with selected pipe
  const actualArea = Math.PI * Math.pow(selectedSize.diameter / 1000, 2) / 4;
  const actualVelocity = flowRateM3h / (3600 * actualArea);
  
  // Calculate pressure drop (kPa per 100m)
  // Simplified Darcy-Weisbach formula with assumptions for water
  const roughness = 0.0015; // mm, for plastic pipes
  const reynoldsNumber = 353000 * actualVelocity * (selectedSize.diameter / 1000);
  const frictionFactor = 0.25 / Math.pow(Math.log10(roughness / (3.7 * selectedSize.diameter / 1000) + 5.74 / Math.pow(reynoldsNumber, 0.9)), 2);
  const pressureDrop = frictionFactor * 100 * Math.pow(actualVelocity, 2) / (2 * 9.81 * (selectedSize.diameter / 1000));
  
  return {
    flowRate,
    recommendedSize: selectedSize.name,
    diameter: selectedSize.diameter,
    actualVelocity: Math.round(actualVelocity * 100) / 100,
    pressureDrop: Math.round(pressureDrop * 10) / 10,
    warning: actualVelocity > 3 ? 'Flow velocity exceeds recommended maximum (3 m/s)' : ''
  };
}

// Total Cost of Ownership (TCO) calculation
export function calculateTCO(
  capitalCost: number, 
  annualEnergyConsumption: number, 
  coolingType: string,
  includeGenerator: boolean,
  params: CalculationParams
) {
  // Default values if not provided
  const electricityRate = 0.12; // €/kWh
  const maintenancePercentage = params.costFactors.maintenancePercentage || 0.03;
  const operationalPercentage = params.costFactors.operationalPercentage || 0.02;
  const inflationRate = 0.02;
  const discountRate = 0.05;
  const lifespan = 10; // years
  
  // Get cooling type info
  const coolingTypeKey = coolingType.toUpperCase() as keyof typeof COOLING_TYPES;
  const coolingInfo = COOLING_TYPES[coolingTypeKey] || COOLING_TYPES.AIR;
  
  // Calculate annual costs
  const annualEnergyCost = annualEnergyConsumption * electricityRate;
  const annualMaintenanceCost = capitalCost * maintenancePercentage;
  const annualOperationalCost = capitalCost * operationalPercentage;
  
  // Adjust maintenance cost based on cooling type
  const adjustedMaintenanceCost = annualMaintenanceCost * coolingInfo.costFactor;
  
  // Add generator maintenance if included
  const generatorMaintenanceCost = includeGenerator ? 
    annualMaintenanceCost * 0.15 : 0; // Assume generator maintenance is 15% of total maintenance
  
  const totalAnnualCost = annualEnergyCost + adjustedMaintenanceCost + 
                         annualOperationalCost + generatorMaintenanceCost;
  
  // Calculate NPV of all costs over lifespan
  let npv = capitalCost;
  for (let year = 1; year <= lifespan; year++) {
    const inflationFactor = Math.pow(1 + inflationRate, year);
    const discountFactor = Math.pow(1 + discountRate, year);
    npv += (totalAnnualCost * inflationFactor) / discountFactor;
  }
  
  // Calculate annualized TCO
  const annualizedTCO = npv / lifespan;
  
  return {
    capitalCost,
    annualCosts: {
      energy: Math.round(annualEnergyCost),
      maintenance: Math.round(adjustedMaintenanceCost + generatorMaintenanceCost),
      operational: Math.round(annualOperationalCost),
      total: Math.round(totalAnnualCost)
    },
    totalCostOfOwnership: Math.round(npv),
    annualizedTCO: Math.round(annualizedTCO),
    assumptions: {
      electricityRate,
      inflationRate,
      discountRate,
      lifespan
    }
  };
}

// Thermal load distribution calculation
export function calculateThermalDistribution(totalLoad: number, coolingType: string, params: CalculationParams) {
  const coolingTypeKey = coolingType.toUpperCase() as keyof typeof COOLING_TYPES;
  const coolingInfo = COOLING_TYPES[coolingTypeKey] || COOLING_TYPES.AIR;
  
  switch (coolingType.toLowerCase()) {
    case 'dlc':
      const dlcPortion = totalLoad * (1 - (params.cooling.dlcResidualHeatFraction || 0.25));
      const airPortion = totalLoad * (params.cooling.dlcResidualHeatFraction || 0.25);
      
      return {
        type: 'dlc',
        distribution: {
          liquid: {
            percentage: Math.round((1 - (params.cooling.dlcResidualHeatFraction || 0.25)) * 100),
            load: Math.round(dlcPortion)
          },
          air: {
            percentage: Math.round((params.cooling.dlcResidualHeatFraction || 0.25) * 100),
            load: Math.round(airPortion)
          }
        },
        pue: coolingInfo.pueImpact,
        waterUsage: Math.round(totalLoad * coolingInfo.waterUsage * 24) // L/day
      };
      
    case 'hybrid':
      const hybridRatio = params.cooling.hybridCoolingRatio || 0.7;
      
      return {
        type: 'hybrid',
        distribution: {
          liquid: {
            percentage: Math.round(hybridRatio * 100),
            load: Math.round(totalLoad * hybridRatio)
          },
          air: {
            percentage: Math.round((1 - hybridRatio) * 100),
            load: Math.round(totalLoad * (1 - hybridRatio))
          }
        },
        pue: coolingInfo.pueImpact,
        waterUsage: Math.round(totalLoad * coolingInfo.waterUsage * 24) // L/day
      };
      
    case 'immersion':
      return {
        type: 'immersion',
        distribution: {
          liquid: {
            percentage: 100,
            load: Math.round(totalLoad)
          },
          air: {
            percentage: 0,
            load: 0
          }
        },
        pue: coolingInfo.pueImpact,
        waterUsage: Math.round(totalLoad * coolingInfo.waterUsage * 24) // L/day
      };
      
    default: // air-cooled
      return {
        type: 'air',
        distribution: {
          liquid: {
            percentage: 0,
            load: 0
          },
          air: {
            percentage: 100,
            load: Math.round(totalLoad)
          }
        },
        pue: coolingInfo.pueImpact,
        waterUsage: Math.round(totalLoad * coolingInfo.waterUsage * 24) // L/day
      };
  }
}

// Enhanced carbon footprint calculation
export function calculateCarbonFootprint(
  annualEnergyConsumption: number,
  includeGenerator: boolean,
  generatorTestHours: number,
  generatorCapacity: number,
  renewablePercentage: number,
  params: CalculationParams
) {
  // Default values if not provided
  const carbonIntensityGrid = params.sustainability?.carbonIntensityGrid || 0.35; // kg CO2/kWh
  const carbonIntensityDiesel = params.sustainability?.carbonIntensityDiesel || 0.8; // kg CO2/kWh
  
  // Calculate grid emissions with renewable adjustment
  const gridEnergy = annualEnergyConsumption * (1 - (renewablePercentage / 100));
  const gridEmissions = gridEnergy * carbonIntensityGrid;
  
  // Calculate generator emissions if included
  let generatorEmissions = 0;
  if (includeGenerator && generatorCapacity) {
    const generatorEnergy = generatorCapacity * generatorTestHours * 0.8; // Assume 80% load during testing
    generatorEmissions = generatorEnergy * carbonIntensityDiesel;
  }
  
  // Calculate total emissions
  const totalEmissions = gridEmissions + generatorEmissions;
  
  // Calculate emissions reduction from renewables
  const renewableReduction = annualEnergyConsumption * (renewablePercentage / 100) * carbonIntensityGrid;
  
  return {
    totalAnnualEmissions: Math.round(totalEmissions / 1000), // tonnes CO2/year
    gridEmissions: Math.round(gridEmissions / 1000), // tonnes CO2/year
    generatorEmissions: Math.round(generatorEmissions / 1000), // tonnes CO2/year
    emissionsPerMWh: Math.round(totalEmissions / (annualEnergyConsumption / 1000)), // kg CO2/MWh
    renewableImpact: {
      percentage: renewablePercentage,
      emissionsAvoided: Math.round(renewableReduction / 1000) // tonnes CO2/year
    }
  };
}