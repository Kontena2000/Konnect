
import { CalculationParams } from '@/types/calculationParams';
import { UPSResult, BatteryResult, GeneratorResult } from './types';

/**
 * Calculate UPS requirements based on input parameters
 */
export function calculateUPSRequirements(
  kwPerRack: number, 
  totalRacks: number, 
  params: CalculationParams
): UPSResult {
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

/**
 * Calculate battery requirements based on input parameters
 */
export function calculateBatteryRequirements(
  totalITLoad: number, 
  params: CalculationParams
): BatteryResult {
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

/**
 * Calculate generator requirements based on input parameters
 */
export function calculateGeneratorRequirements(
  requiredCapacity: number, 
  includeGenerator: boolean, 
  params: CalculationParams
): GeneratorResult {
  if (!includeGenerator) {
    return {
      included: false,
      capacity: 0,
      model: 'none',
      fuel: {
        tankSize: 0,
        consumption: 0,
        runtime: 0
      }
    };
  }
  
  // Calculate generator capacity with 20% headroom
  const generatorCapacity = Math.ceil(requiredCapacity * 1.2 / 500) * 500; // Round up to nearest 500 kVA
  
  // Determine model based on capacity
  const model = generatorCapacity <= 1000 ? '1000kVA' :
               generatorCapacity <= 2000 ? '2000kVA' : '3000kVA';
  
  // Calculate fuel consumption and tank size
  const fuelConsumption = generatorCapacity * 0.2; // L/hour at full load
  const tankSize = fuelConsumption * 8; // 8 hours runtime at full load
  
  return {
    included: true,
    capacity: generatorCapacity,
    model,
    fuel: {
      tankSize,
      consumption: fuelConsumption,
      runtime: 8 // hours
    }
  };
}

/**
 * Calculate all power-related requirements
 */
export function calculatePower(
  kwPerRack: number, 
  totalRacks: number, 
  params: CalculationParams, 
  includeGenerator: boolean = false
) {
  const ups = calculateUPSRequirements(kwPerRack, totalRacks, params);
  const battery = calculateBatteryRequirements(ups.totalITLoad, params);
  const generator = calculateGeneratorRequirements(ups.requiredCapacity, includeGenerator, params);
  
  return {
    ups,
    battery,
    generator
  };
}

// Export individual functions for direct use
calculatePower.calculateUPSRequirements = calculateUPSRequirements;
calculatePower.calculateBatteryRequirements = calculateBatteryRequirements;
calculatePower.calculateGeneratorRequirements = calculateGeneratorRequirements;
