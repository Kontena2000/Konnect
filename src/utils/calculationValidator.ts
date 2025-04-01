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
 * Validates calculation inputs to ensure they are within acceptable ranges
 * @param inputs The calculation inputs to validate
 * @returns Validated inputs with default values applied where needed
 */
export function validateCalculationInputs(inputs: any) {
  const validatedInputs = { ...inputs };
  
  // Validate kwPerRack
  if (typeof validatedInputs.kwPerRack !== 'number' || 
      isNaN(validatedInputs.kwPerRack) || 
      validatedInputs.kwPerRack <= 0) {
    validatedInputs.kwPerRack = 75; // Default value
  }
  
  // Validate coolingType
  const validCoolingTypes = ['air', 'dlc', 'hybrid', 'immersion'];
  if (!validCoolingTypes.includes(validatedInputs.coolingType)) {
    validatedInputs.coolingType = 'air'; // Default value
  }
  
  // Validate totalRacks
  if (typeof validatedInputs.totalRacks !== 'number' || 
      isNaN(validatedInputs.totalRacks) || 
      validatedInputs.totalRacks <= 0) {
    validatedInputs.totalRacks = 28; // Default value
  }
  
  // Validate redundancyMode
  const validRedundancyModes = ['N', 'N+1', '2N', '2N+1'];
  if (!validRedundancyModes.includes(validatedInputs.redundancyMode)) {
    validatedInputs.redundancyMode = 'N+1'; // Default value
  }
  
  // Validate includeGenerator
  validatedInputs.includeGenerator = !!validatedInputs.includeGenerator;
  
  // Validate batteryRuntime
  if (typeof validatedInputs.batteryRuntime !== 'number' || 
      isNaN(validatedInputs.batteryRuntime) || 
      validatedInputs.batteryRuntime <= 0) {
    validatedInputs.batteryRuntime = 10; // Default value
  }
  
  // Validate sustainabilityOptions
  if (!validatedInputs.sustainabilityOptions || typeof validatedInputs.sustainabilityOptions !== 'object') {
    validatedInputs.sustainabilityOptions = {};
  }
  
  // Validate enableWasteHeatRecovery
  validatedInputs.sustainabilityOptions.enableWasteHeatRecovery = 
    !!validatedInputs.sustainabilityOptions.enableWasteHeatRecovery;
  
  // Validate enableWaterRecycling
  validatedInputs.sustainabilityOptions.enableWaterRecycling = 
    !!validatedInputs.sustainabilityOptions.enableWaterRecycling;
  
  // Validate renewableEnergyPercentage
  if (typeof validatedInputs.sustainabilityOptions.renewableEnergyPercentage !== 'number' || 
      isNaN(validatedInputs.sustainabilityOptions.renewableEnergyPercentage) || 
      validatedInputs.sustainabilityOptions.renewableEnergyPercentage < 0 || 
      validatedInputs.sustainabilityOptions.renewableEnergyPercentage > 100) {
    validatedInputs.sustainabilityOptions.renewableEnergyPercentage = 20; // Default value
  }
  
  return validatedInputs;
}

/**
 * Validate calculation results and ensure all required properties exist
 * @param results The calculation results to validate
 * @param inputParams The input parameters used for the calculation
 * @returns The validated results with all required properties
 */
export function validateCalculationResults(results: any, inputParams?: any): any {
  if (!results) {
    return createDefaultResults(inputParams);
  }
  
  const validatedResults = { ...results };
  
  // Ensure rack object exists
  if (!validatedResults.rack) {
    validatedResults.rack = {
      powerDensity: inputParams.kwPerRack || 75,
      coolingType: inputParams.coolingType || 'air',
      totalRacks: inputParams.totalRacks || 28
    };
  }
  
  // Ensure electrical object exists
  if (!validatedResults.electrical) {
    validatedResults.electrical = {
      currentPerRow: 0,
      busbarSize: 'busbar800A',
      currentPerRack: 0,
      tapOffBox: 'standard63A',
      rpdu: 'standard16A',
      multiplicityWarning: ''
    };
  }
  
  // Ensure cooling object exists
  if (!validatedResults.cooling) {
    validatedResults.cooling = {
      type: inputParams.coolingType || 'air',
      totalCapacity: 0,
      pue: 1.4
    };
  }
  
  // Ensure power object exists
  if (!validatedResults.power) {
    validatedResults.power = {
      ups: {
        totalITLoad: 0,
        redundancyFactor: 1.2,
        requiredCapacity: 0,
        moduleSize: 250,
        totalModulesNeeded: 1,
        redundantModules: 1,
        framesNeeded: 1,
        frameSize: 'frame2Module'
      },
      battery: {
        runtime: inputParams.batteryRuntime || 10,
        energyNeeded: 0,
        cabinetsNeeded: 1,
        totalWeight: 1200
      },
      generator: {
        included: inputParams.includeGenerator || false,
        capacity: inputParams.includeGenerator ? 1000 : 0,
        model: inputParams.includeGenerator ? '1000kVA' : 'none',
        fuel: {
          tankSize: inputParams.includeGenerator ? 1000 : 0,
          consumption: inputParams.includeGenerator ? 200 : 0,
          runtime: inputParams.includeGenerator ? 8 : 0
        }
      }
    };
  }
  
  // Ensure cost object exists with reasonable defaults
  if (!validatedResults.cost || typeof validatedResults.cost.totalProjectCost !== 'number' || validatedResults.cost.totalProjectCost === 0) {
    const kwPerRack = inputParams.kwPerRack || 75;
    const totalRacks = inputParams.totalRacks || 28;
    const fallbackTotalCost = totalRacks * kwPerRack * 5000;
    
    validatedResults.cost = {
      electrical: { 
        busbar: 50000, 
        tapOffBox: 1200 * totalRacks, 
        rpdu: 800 * totalRacks, 
        total: 50000 + 2000 * totalRacks 
      },
      cooling: inputParams.coolingType === 'air' ? 60000 : 150000,
      power: { 
        ups: 220000, 
        battery: 80000, 
        generator: inputParams.includeGenerator ? 200000 : 0, 
        total: 300000 
      },
      infrastructure: 250000,
      sustainability: 0,
      equipmentTotal: 700000,
      installation: 105000,
      engineering: 70000,
      contingency: 70000,
      totalProjectCost: fallbackTotalCost,
      costPerRack: Math.round(fallbackTotalCost / totalRacks),
      costPerKw: Math.round(fallbackTotalCost / (kwPerRack * totalRacks))
    };
  }
  
  return validatedResults;
}

/**
 * Creates default calculation results based on inputs
 * @param inputs The calculation inputs
 * @returns Default calculation results
 */
function createDefaultResults(inputs: any) {
  const kwPerRack = inputs.kwPerRack || 75;
  const coolingType = inputs.coolingType || 'air';
  const totalRacks = inputs.totalRacks || 28;
  const includeGenerator = inputs.includeGenerator || false;
  
  // Calculate a reasonable fallback total cost
  const fallbackTotalCost = totalRacks * kwPerRack * 5000;
  
  return {
    rack: {
      powerDensity: kwPerRack,
      coolingType: coolingType,
      totalRacks: totalRacks
    },
    electrical: {
      currentPerRow: 0,
      busbarSize: 'busbar800A',
      currentPerRack: 0,
      tapOffBox: 'standard63A',
      rpdu: 'standard16A',
      multiplicityWarning: ''
    },
    cooling: {
      type: coolingType,
      totalCapacity: 0,
      pue: 1.4
    },
    thermalDistribution: {
      pue: 1.4,
      distribution: { liquid: { load: 0 } }
    },
    pipeSizing: null,
    power: {
      ups: {
        totalITLoad: 0,
        redundancyFactor: 1.2,
        requiredCapacity: 0,
        moduleSize: 250,
        totalModulesNeeded: 1,
        redundantModules: 1,
        framesNeeded: 1,
        frameSize: 'frame2Module'
      },
      battery: {
        runtime: 10,
        energyNeeded: 0,
        cabinetsNeeded: 1,
        totalWeight: 1200
      },
      generator: {
        included: includeGenerator,
        capacity: includeGenerator ? 1000 : 0,
        model: includeGenerator ? '1000kVA' : 'none',
        fuel: {
          tankSize: includeGenerator ? 1000 : 0,
          consumption: includeGenerator ? 200 : 0,
          runtime: includeGenerator ? 8 : 0
        }
      }
    },
    reliability: {
      availability: 0.995,
      tier: 'Tier 3',
      annualDowntime: 4.38,
      mtbf: 8760,
      mttr: 4
    },
    sustainability: {
      pue: 1.4,
      wue: 0.5,
      annualEnergyConsumption: {
        it: kwPerRack * totalRacks * 8760,
        cooling: kwPerRack * totalRacks * 8760 * 0.4,
        power: kwPerRack * totalRacks * 8760 * 0.1,
        total: kwPerRack * totalRacks * 8760 * 1.5
      }
    },
    carbonFootprint: {
      annualCO2Grid: 0,
      annualCO2Generator: 0,
      totalAnnualCO2: 0,
      co2PerKwh: 0
    },
    cost: {
      electrical: { 
        busbar: 50000, 
        tapOffBox: 1200 * totalRacks, 
        rpdu: 800 * totalRacks, 
        total: 50000 + 2000 * totalRacks 
      },
      cooling: coolingType === 'air' ? 60000 : 150000,
      power: { 
        ups: 220000, 
        battery: 80000, 
        generator: includeGenerator ? 200000 : 0, 
        total: 300000 
      },
      infrastructure: 250000,
      sustainability: 0,
      equipmentTotal: 700000,
      installation: 105000,
      engineering: 70000,
      contingency: 70000,
      totalProjectCost: fallbackTotalCost,
      costPerRack: Math.round(fallbackTotalCost / totalRacks),
      costPerKw: Math.round(fallbackTotalCost / (kwPerRack * totalRacks))
    },
    tco: {
      capex: fallbackTotalCost,
      opex: {},
      total5Year: 0,
      total10Year: 0
    }
  };
}