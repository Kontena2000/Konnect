
import { CLIMATE_ZONES } from "@/constants/calculatorConstants";

interface EnergyConfig {
  kwPerRack: number;
  coolingType: string;
}

interface ClimateData {
  zone: string;
  avgTemperature: number;
  humidity: number;
  energyRates: {
    costPerKWh: number;
    carbonIntensity: number;
    renewablePct: number;
  };
}

export function calculateEnergyMetrics(config: EnergyConfig, climateData: ClimateData) {
  const { kwPerRack, coolingType } = config;
  const { energyRates } = climateData;
  
  // Calculate total IT load (kW)
  const totalRacks = 28; // Standard configuration
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
