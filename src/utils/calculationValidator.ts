import { getNestedProperty, ensureObjectStructure, toNumber } from './safeObjectAccess';

/**
 * Default schema for calculation results
 * Maps paths to default values for critical properties
 */
const DEFAULT_CALCULATION_SCHEMA = {
  'rack.powerDensity': 10,
  'rack.coolingType': 'air',
  'rack.totalRacks': 28,
  'power.ups.totalITLoad': 0,
  'power.ups.redundancyFactor': 1.2,
  'power.ups.requiredCapacity': 0,
  'power.ups.moduleSize': 250,
  'power.ups.totalModulesNeeded': 1,
  'power.ups.redundantModules': 1,
  'power.ups.framesNeeded': 1,
  'power.ups.frameSize': 'frame2Module',
  'power.battery.runtime': 10,
  'power.battery.energyNeeded': 0,
  'power.battery.cabinetsNeeded': 1,
  'power.battery.totalWeight': 1200,
  'power.generator.included': false,
  'power.generator.capacity': 0,
  'power.generator.model': 'none',
  'power.generator.fuel.tankSize': 0,
  'power.generator.fuel.consumption': 0,
  'power.generator.fuel.runtime': 0,
  'cooling.type': 'air',
  'cooling.totalCapacity': 0,
  'cooling.pipingSize': 'none', // Add default pipingSize
  'cooling.pue': 1.4,
  'sustainability.pue': 1.4,
  'sustainability.annualEnergyConsumption.total': 0,
  'sustainability.annualEnergyConsumption.it': 0,
  'sustainability.annualEnergyConsumption.overhead': 0,
  'cost.totalProjectCost': 0,
  'cost.costPerRack': 0,
  'cost.costPerKw': 0
};

/**
 * Validate calculation results and ensure all required properties exist
 * @param results The calculation results to validate
 * @param inputParams The input parameters used for the calculation
 * @returns The validated results with all required properties
 */
export function validateCalculationResults(results: any, inputParams?: any): any {
  // If results are completely missing, create a minimal valid structure
  if (!results || typeof results !== 'object') {
    results = {};
  }

  // Ensure all required properties exist with defaults
  results = ensureObjectStructure(results, DEFAULT_CALCULATION_SCHEMA);

  // If we have input parameters, use them to calculate better defaults for missing values
  if (inputParams && typeof inputParams === 'object') {
    const kwPerRack = toNumber(inputParams.kwPerRack, 10);
    const totalRacks = toNumber(inputParams.totalRacks, 28);
    const coolingType = inputParams.coolingType || 'air';

    // Recalculate critical values if they're missing or zero
    if (!getNestedProperty(results, 'power.ups.totalITLoad', 0)) {
      results.power.ups.totalITLoad = kwPerRack * totalRacks;
    }

    if (!getNestedProperty(results, 'power.ups.requiredCapacity', 0)) {
      const redundancyFactor = getNestedProperty(results, 'power.ups.redundancyFactor', 1.2);
      results.power.ups.requiredCapacity = kwPerRack * totalRacks * redundancyFactor;
    }

    if (!getNestedProperty(results, 'cooling.totalCapacity', 0)) {
      results.cooling.totalCapacity = kwPerRack * totalRacks * 1.1;
    }

    if (!getNestedProperty(results, 'sustainability.annualEnergyConsumption.total', 0)) {
      const pue = getNestedProperty(results, 'sustainability.pue', 1.4);
      results.sustainability.annualEnergyConsumption.it = kwPerRack * totalRacks * 8760;
      results.sustainability.annualEnergyConsumption.total = 
        results.sustainability.annualEnergyConsumption.it * pue;
      results.sustainability.annualEnergyConsumption.overhead = 
        results.sustainability.annualEnergyConsumption.total - 
        results.sustainability.annualEnergyConsumption.it;
    }
  }

  return results;
}

/**
 * Validate calculation input parameters
 * @param params The input parameters to validate
 * @returns The validated parameters with defaults for missing values
 */
export function validateCalculationInputs(params: any): any {
  if (!params || typeof params !== 'object') {
    params = {};
  }

  // Define default values for critical input parameters
  const defaultInputs = {
    kwPerRack: 10,
    coolingType: 'air',
    totalRacks: 28,
    redundancyMode: 'N+1',
    includeGenerator: false,
    batteryRuntime: 10,
    sustainabilityOptions: {
      enableWasteHeatRecovery: false,
      enableWaterRecycling: false,
      renewableEnergyPercentage: 20
    }
  };

  // Ensure all required properties exist with defaults
  return ensureObjectStructure(params, defaultInputs);
}