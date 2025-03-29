import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { CLIMATE_ZONES } from '@/constants/calculatorConstants';
import { ClimateData } from './climateDataService';

export interface EnergyConfig {
  totalLoad: number;
  pue: number;
  renewablePercentage?: number;
  location?: {
    latitude?: number;
    longitude?: number;
  };
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

export function calculateEnergyMetrics(totalLoad: number, pue: number, renewablePercentage = 0.2) {
  const annualITEnergy = totalLoad * 24 * 365; // kWh per year
  const annualTotalEnergy = annualITEnergy * pue; // kWh per year including cooling overhead
  
  // Calculate carbon footprint
  const gridEnergy = annualTotalEnergy * (1 - renewablePercentage);
  const carbonIntensity = 0.35; // kg CO2/kWh - default value
  const carbonEmissions = gridEnergy * carbonIntensity;
  
  return {
    annualITEnergy: Math.round(annualITEnergy),
    annualTotalEnergy: Math.round(annualTotalEnergy),
    annualOverheadEnergy: Math.round(annualTotalEnergy - annualITEnergy),
    pue,
    carbonFootprint: {
      annual: Math.round(carbonEmissions / 1000), // tonnes CO2/year
      perKwh: Math.round(carbonEmissions / annualTotalEnergy * 1000) / 1000, // kg CO2/kWh
      renewablePercentage: renewablePercentage * 100
    },
    energyRates: {
      costPerKWh: 0.15,
      carbonIntensity: carbonIntensity,
      renewablePct: renewablePercentage * 100
    }
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

export async function getEnergyRatesByRegion(latitude: number, longitude: number) {
  const db = getFirestore();
  
  try {
    // Try to find energy rates for this region in our database
    const energyRatesQuery = query(
      collection(db, 'matrix_calculator', 'energy_rates', 'regions'),
      where('latitude', '==', Math.round(latitude)),
      where('longitude', '==', Math.round(longitude))
    );
    
    const querySnapshot = await getDocs(energyRatesQuery);
    
    if (!querySnapshot.empty) {
      // We found energy rates in our database
      return querySnapshot.docs[0].data().rates;
    }
  } catch (error) {
    console.error('Error fetching energy rates from database:', error);
    // Continue with the fallback method
  }
  
  // Fallback: Return mock data based on region
  // Determine region based on coordinates
  let region = 'North America';
  if (longitude > -30 && longitude < 40) region = 'Europe';
  else if (longitude > 40 && longitude < 180) region = 'Asia';
  else if (latitude < 0 && longitude > 100) region = 'Australia';
  
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

export async function calculateWithLocationFactors(config: EnergyConfig) {
  try {
    const { totalLoad, pue, renewablePercentage = 0.2, location } = config;
    
    // If no location provided, use default calculation
    if (!location || !location.latitude || !location.longitude) {
      return calculateEnergyMetrics(totalLoad, pue, renewablePercentage);
    }
    
    // Get regional energy rates
    const energyRates = await getEnergyRatesByRegion(location.latitude, location.longitude);
    
    // Calculate with regional rates
    const annualITEnergy = totalLoad * 24 * 365; // kWh per year
    const annualTotalEnergy = annualITEnergy * pue; // kWh per year including cooling overhead
    
    // Calculate carbon footprint with regional carbon intensity
    const gridEnergy = annualTotalEnergy * (1 - renewablePercentage);
    const carbonEmissions = gridEnergy * (energyRates.carbonIntensity || 0.35);
    
    return {
      annualITEnergy: Math.round(annualITEnergy),
      annualTotalEnergy: Math.round(annualTotalEnergy),
      annualOverheadEnergy: Math.round(annualTotalEnergy - annualITEnergy),
      pue,
      carbonFootprint: {
        annual: Math.round(carbonEmissions / 1000), // tonnes CO2/year
        perKwh: Math.round(carbonEmissions / annualTotalEnergy * 1000) / 1000, // kg CO2/kWh
        renewablePercentage: renewablePercentage * 100
      },
      energyRates: {
        costPerKWh: energyRates.costPerKWh,
        carbonIntensity: energyRates.carbonIntensity,
        renewablePct: energyRates.renewablePct
      }
    };
  } catch (error) {
    console.error('Error calculating with location factors:', error);
    // Fall back to basic calculation
    return calculateEnergyMetrics(totalLoad, pue, renewablePercentage);
  }
}