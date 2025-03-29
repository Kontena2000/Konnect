import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { CLIMATE_ZONES } from '@/constants/calculatorConstants';
import { ClimateData } from './climateDataService';

export interface EnergyConfig {
  kwPerRack: number;
  coolingType: string;
  totalRacks?: number;
}

export interface EnergyMetrics {
  pue: string;
  totalITLoad: number;
  totalFacilityPower: number;
  annualEnergyConsumption: number;
  annualEnergyCost: number;
  annualCarbonEmissions: number;
  renewableEnergy: number;
  energyRates: {
    costPerKWh: number;
    carbonIntensity: number;
    renewablePct: number;
  };
}

export function calculateEnergyMetrics(config: EnergyConfig, climateData: ClimateData): EnergyMetrics {
  const { kwPerRack, coolingType } = config;
  
  // Provide default energy rates if not available in climateData
  const energyRates = climateData.energyRates || {
    costPerKWh: 0.15,
    carbonIntensity: 0.5,
    renewablePct: 20
  };
  
  // Calculate total IT load (kW)
  const totalRacks = config.totalRacks || 28; // Standard configuration
  const totalITLoad = kwPerRack * totalRacks;
  
  // Calculate PUE based on cooling type and climate
  const basePUE = coolingType === 'dlc' ? 1.15 : 1.35;
  
  // Adjust PUE based on climate
  const climateFactor = getClimatePUEFactor(climateData, coolingType);
  const adjustedPUE = basePUE * climateFactor;
  
  // Calculate total facility power
  const totalFacilityPower = totalITLoad * adjustedPUE;
  
  // Calculate annual energy consumption (kWh)
  const hoursPerYear = 8760;
  const annualEnergyConsumption = totalFacilityPower * hoursPerYear;
  
  // Calculate costs and carbon metrics
  const annualEnergyCost = annualEnergyConsumption * energyRates.costPerKWh;
  const annualCarbonEmissions = annualEnergyConsumption * energyRates.carbonIntensity;
  const renewableEnergy = (annualEnergyConsumption * energyRates.renewablePct) / 100;
  
  return {
    pue: adjustedPUE.toFixed(2),
    totalITLoad,
    totalFacilityPower: Math.round(totalFacilityPower),
    annualEnergyConsumption: Math.round(annualEnergyConsumption),
    annualEnergyCost: Math.round(annualEnergyCost),
    annualCarbonEmissions: Math.round(annualCarbonEmissions),
    renewableEnergy: Math.round(renewableEnergy),
    energyRates
  };
}

function getClimatePUEFactor(climateData: ClimateData, coolingType: string): number {
  const { zone, avgTemperature, humidity } = climateData;
  let factor = 1.0;
  
  // Temperature impact
  if (avgTemperature > 30) {
    factor *= coolingType === 'dlc' ? 1.05 : 1.15;
  } else if (avgTemperature < 10) {
    factor *= 0.95; // Cold climate improves efficiency
  }
  
  // Humidity impact (affects air cooling more)
  if (coolingType === 'air-cooled' && humidity > 70) {
    factor *= 1.1;
  }
  
  return factor;
}

export async function getEnergyRatesByRegion(region: string) {
  const db = getFirestore();
  
  try {
    // Try to find energy rates for this region in our database
    const energyRatesQuery = query(
      collection(db, 'matrix_calculator', 'energy_rates', 'regions'),
      where('region', '==', region)
    );
    
    const querySnapshot = await getDocs(energyRatesQuery);
    
    if (!querySnapshot.empty) {
      // We found energy rates in our database
      return querySnapshot.docs[0].data().rates;
    }
  } catch (error) {
    console.error('Error fetching energy rates from database:', error);
  }
  
  // Fallback: Return mock data based on region
  const mockRates: {[key: string]: any} = {
    'North America': {
      costPerKWh: 0.12,
      carbonIntensity: 0.45,
      renewablePct: 18
    },
    'Europe': {
      costPerKWh: 0.22,
      carbonIntensity: 0.35,
      renewablePct: 30
    },
    'Asia': {
      costPerKWh: 0.15,
      carbonIntensity: 0.60,
      renewablePct: 15
    },
    'Australia': {
      costPerKWh: 0.25,
      carbonIntensity: 0.50,
      renewablePct: 22
    }
  };
  
  return mockRates[region] || {
    costPerKWh: 0.15,
    carbonIntensity: 0.5,
    renewablePct: 20
  };
}

export function calculateCarbonSavings(baseConfig: EnergyMetrics, optimizedConfig: EnergyMetrics) {
  const carbonSavings = baseConfig.annualCarbonEmissions - optimizedConfig.annualCarbonEmissions;
  const costSavings = baseConfig.annualEnergyCost - optimizedConfig.annualEnergyCost;
  const energySavings = baseConfig.annualEnergyConsumption - optimizedConfig.annualEnergyConsumption;
  
  return {
    carbonSavings,
    costSavings,
    energySavings,
    percentageSavings: {
      carbon: (carbonSavings / baseConfig.annualCarbonEmissions * 100).toFixed(1),
      cost: (costSavings / baseConfig.annualEnergyCost * 100).toFixed(1),
      energy: (energySavings / baseConfig.annualEnergyConsumption * 100).toFixed(1)
    }
  };
}