import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { DEFAULT_PRICING, DEFAULT_CALCULATION_PARAMS } from '@/constants/calculatorConstants';

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
  };
  power: {
    upsModuleSize: number;
    upsFrameMaxModules: number;
    batteryRuntime: number;
    batteryEfficiency: number;
    eHouseBaseSqm: number;
    eHouseBatterySqm: number;
  };
  costFactors: {
    installationPercentage: number;
    engineeringPercentage: number;
    contingencyPercentage: number;
  };
  coolingThresholds: {
    airCooledMax: number;
    recommendedDlcMin: number;
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
  eHouse: {
    base: number;
    perSqMeter: number;
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
  location?: {
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    address?: string;
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
    const snapshot = await getDoc(doc(db, 'matrix_calculator', 'user_configurations'));
    if (!snapshot.exists()) {
      return [];
    }
    
    const configs = snapshot.data().configs || [];
    return configs.filter((config: UserConfiguration) => config.userId === userId);
  } catch (error) {
    console.error('Error fetching user configurations:', error);
    return [];
  }
}

export async function initializeCalculatorCollections() {
  const db = getFirestore();
  
  try {
    // Check if pricing matrix exists, if not create it
    const pricingDoc = await getDoc(doc(db, 'matrix_calculator', 'pricing_matrix'));
    if (!pricingDoc.exists()) {
      await doc(db, 'matrix_calculator', 'pricing_matrix').set(DEFAULT_PRICING);
    }
    
    // Check if calculation params exist, if not create them
    const paramsDoc = await getDoc(doc(db, 'matrix_calculator', 'calculation_params'));
    if (!paramsDoc.exists()) {
      await doc(db, 'matrix_calculator', 'calculation_params').set(DEFAULT_CALCULATION_PARAMS);
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing calculator collections:', error);
    return false;
  }
}