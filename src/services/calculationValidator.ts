import { calculatorDebug } from './calculatorDebug';

/**
 * Validates calculation inputs and provides default values for missing properties
 */
export function validateCalculationInputs(inputs: any): any {
  // Start with default values
  const validatedInputs = {
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
    },
    location: null as null | {
      latitude: number;
      longitude: number;
      address?: string;
      climateData?: any;
    }
  };

  try {
    // Validate kwPerRack
    if (inputs && typeof inputs.kwPerRack === 'number' && !isNaN(inputs.kwPerRack) && inputs.kwPerRack > 0) {
      validatedInputs.kwPerRack = inputs.kwPerRack;
    } else {
      calculatorDebug.warn('Invalid kwPerRack value, using default', { 
        provided: inputs?.kwPerRack, 
        default: validatedInputs.kwPerRack 
      });
    }

    // Validate coolingType
    const validCoolingTypes = ['air', 'dlc', 'hybrid', 'immersion'];
    if (inputs && typeof inputs.coolingType === 'string' && validCoolingTypes.includes(inputs.coolingType.toLowerCase())) {
      validatedInputs.coolingType = inputs.coolingType.toLowerCase();
    } else {
      calculatorDebug.warn('Invalid coolingType value, using default', { 
        provided: inputs?.coolingType, 
        default: validatedInputs.coolingType,
        validOptions: validCoolingTypes
      });
    }

    // Validate totalRacks
    if (inputs && typeof inputs.totalRacks === 'number' && !isNaN(inputs.totalRacks) && inputs.totalRacks > 0) {
      validatedInputs.totalRacks = inputs.totalRacks;
    } else {
      calculatorDebug.warn('Invalid totalRacks value, using default', { 
        provided: inputs?.totalRacks, 
        default: validatedInputs.totalRacks 
      });
    }

    // Validate redundancyMode
    const validRedundancyModes = ['N', 'N+1', '2N', '2N+1'];
    if (inputs && typeof inputs.redundancyMode === 'string' && validRedundancyModes.includes(inputs.redundancyMode)) {
      validatedInputs.redundancyMode = inputs.redundancyMode;
    } else if (inputs?.redundancyMode) {
      calculatorDebug.warn('Invalid redundancyMode value, using default', { 
        provided: inputs.redundancyMode, 
        default: validatedInputs.redundancyMode,
        validOptions: validRedundancyModes
      });
    }

    // Validate includeGenerator
    if (inputs && typeof inputs.includeGenerator === 'boolean') {
      validatedInputs.includeGenerator = inputs.includeGenerator;
    } else if (inputs?.includeGenerator !== undefined) {
      calculatorDebug.warn('Invalid includeGenerator value, using default', { 
        provided: inputs.includeGenerator, 
        default: validatedInputs.includeGenerator 
      });
    }

    // Validate batteryRuntime
    if (inputs && typeof inputs.batteryRuntime === 'number' && !isNaN(inputs.batteryRuntime) && inputs.batteryRuntime > 0) {
      validatedInputs.batteryRuntime = inputs.batteryRuntime;
    } else if (inputs?.batteryRuntime !== undefined) {
      calculatorDebug.warn('Invalid batteryRuntime value, using default', { 
        provided: inputs.batteryRuntime, 
        default: validatedInputs.batteryRuntime 
      });
    }

    // Validate sustainabilityOptions
    if (inputs && inputs.sustainabilityOptions) {
      const options = inputs.sustainabilityOptions;
      
      // Validate enableWasteHeatRecovery
      if (typeof options.enableWasteHeatRecovery === 'boolean') {
        validatedInputs.sustainabilityOptions.enableWasteHeatRecovery = options.enableWasteHeatRecovery;
      }
      
      // Validate enableWaterRecycling
      if (typeof options.enableWaterRecycling === 'boolean') {
        validatedInputs.sustainabilityOptions.enableWaterRecycling = options.enableWaterRecycling;
      }
      
      // Validate renewableEnergyPercentage
      if (typeof options.renewableEnergyPercentage === 'number' && 
          !isNaN(options.renewableEnergyPercentage) && 
          options.renewableEnergyPercentage >= 0 && 
          options.renewableEnergyPercentage <= 100) {
        validatedInputs.sustainabilityOptions.renewableEnergyPercentage = options.renewableEnergyPercentage;
      } else if (options.renewableEnergyPercentage !== undefined) {
        calculatorDebug.warn('Invalid renewableEnergyPercentage value, using default', { 
          provided: options.renewableEnergyPercentage, 
          default: validatedInputs.sustainabilityOptions.renewableEnergyPercentage 
        });
      }
    }

    // Validate location
    if (inputs && inputs.location) {
      const location = inputs.location;
      
      // Basic validation for latitude and longitude
      const hasValidCoordinates = 
        typeof location.latitude === 'number' && !isNaN(location.latitude) &&
        typeof location.longitude === 'number' && !isNaN(location.longitude);
      
      if (hasValidCoordinates) {
        validatedInputs.location = {
          latitude: location.latitude,
          longitude: location.longitude,
          address: typeof location.address === 'string' ? location.address : undefined,
          climateData: location.climateData
        };
      } else {
        calculatorDebug.warn('Invalid location coordinates, ignoring location data', { 
          provided: location
        });
      }
    }

    return validatedInputs;
  } catch (error) {
    calculatorDebug.error('Error validating calculation inputs', error);
    return validatedInputs; // Return default values if validation fails
  }
}

/**
 * Validates calculation results and ensures all required properties exist
 */
export function validateCalculationResults(results: any, inputs: any): any {
  if (!results) {
    calculatorDebug.error('Calculation results are undefined or null', { inputs });
    return createDefaultResults(inputs);
  }

  try {
    // Create a validated results object with all required properties
    const validatedResults = {
      rack: validateRackSection(results.rack, inputs),
      electrical: validateElectricalSection(results.electrical, inputs),
      cooling: validateCoolingSection(results.cooling, inputs),
      power: validatePowerSection(results.power, inputs),
      cost: validateCostSection(results.cost, inputs),
      reliability: validateReliabilitySection(results.reliability, inputs),
      sustainability: validateSustainabilitySection(results.sustainability, inputs),
      carbonFootprint: validateCarbonFootprintSection(results.carbonFootprint, inputs),
      tco: validateTCOSection(results.tco, inputs)
    };

    return validatedResults;
  } catch (error) {
    calculatorDebug.error('Error validating calculation results', error);
    return createDefaultResults(inputs);
  }
}

// Helper function to create default results when validation fails
function createDefaultResults(inputs: any): any {
  const kwPerRack = typeof inputs.kwPerRack === 'number' ? inputs.kwPerRack : 10;
  const coolingType = typeof inputs.coolingType === 'string' ? inputs.coolingType : 'air';
  const totalRacks = typeof inputs.totalRacks === 'number' ? inputs.totalRacks : 28;
  const totalITLoad = kwPerRack * totalRacks;

  calculatorDebug.warn('Creating default results due to validation failure', { inputs });

  return {
    rack: {
      powerDensity: kwPerRack,
      coolingType: coolingType,
      totalRacks: totalRacks,
      totalITLoad: totalITLoad
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
      totalCapacity: totalITLoad * 1.1,
      pipingSize: coolingType === 'air' ? 'none' : 'dn110',
      pue: 1.4
    },
    power: {
      ups: {
        totalITLoad: totalITLoad,
        redundancyFactor: 1.2,
        requiredCapacity: totalITLoad * 1.2,
        moduleSize: 250,
        totalModulesNeeded: Math.ceil(totalITLoad * 1.2 / 250),
        redundantModules: Math.ceil(totalITLoad * 1.2 / 250),
        framesNeeded: Math.ceil(Math.ceil(totalITLoad * 1.2 / 250) / 6),
        frameSize: 'frame2Module'
      },
      battery: {
        runtime: 10,
        energyNeeded: Math.round(totalITLoad * 10 / 60),
        cabinetsNeeded: Math.ceil(Math.round(totalITLoad * 10 / 60) / 40),
        totalWeight: Math.ceil(Math.round(totalITLoad * 10 / 60) / 40) * 1200
      },
      generator: {
        included: false,
        capacity: 0,
        model: 'none',
        fuel: {
          tankSize: 0,
          consumption: 0,
          runtime: 0
        }
      }
    },
    cost: {
      electrical: { busbar: 50000, tapOffBox: 1200 * totalRacks, rpdu: 800 * totalRacks, total: 50000 + 2000 * totalRacks },
      cooling: coolingType === 'air' ? 60000 : 150000,
      power: { ups: 220000, battery: 80000, generator: 0, total: 300000 },
      infrastructure: 250000,
      sustainability: 0,
      equipmentTotal: 700000,
      installation: 105000,
      engineering: 70000,
      contingency: 70000,
      totalProjectCost: totalITLoad * 5000,
      costPerRack: Math.round((totalITLoad * 5000) / totalRacks),
      costPerKw: Math.round((totalITLoad * 5000) / totalITLoad)
    },
    reliability: {
      tier: 'Tier III',
      availability: '99.99%',
      annualDowntime: 52.6,
      mtbf: 8760,
      mttr: 4
    },
    sustainability: {
      pue: 1.4,
      wue: 0.5,
      annualEnergyConsumption: {
        it: totalITLoad * 8760,
        cooling: totalITLoad * 8760 * 0.4,
        power: totalITLoad * 8760 * 0.1,
        total: totalITLoad * 8760 * 1.5
      }
    },
    carbonFootprint: {
      totalAnnualEmissions: Math.round(totalITLoad * 8760 * 1.5 * 0.35 * 0.8 / 1000),
      gridEmissions: Math.round(totalITLoad * 8760 * 1.5 * 0.35 * 0.8 / 1000),
      generatorEmissions: 0,
      emissionsPerMWh: 280
    },
    tco: {
      capex: totalITLoad * 5000,
      opex: {
        annual: totalITLoad * 8760 * 0.12
      },
      total5Year: totalITLoad * 5000 + (totalITLoad * 8760 * 0.12 * 5),
      total10Year: totalITLoad * 5000 + (totalITLoad * 8760 * 0.12 * 10)
    }
  };
}

// Validation functions for each section
function validateRackSection(rackData: any, inputs: any): any {
  if (!rackData || typeof rackData !== 'object') {
    return {
      powerDensity: inputs.kwPerRack || 10,
      coolingType: inputs.coolingType || 'air',
      totalRacks: inputs.totalRacks || 28,
      totalITLoad: (inputs.kwPerRack || 10) * (inputs.totalRacks || 28)
    };
  }

  return {
    powerDensity: typeof rackData.powerDensity === 'number' ? rackData.powerDensity : (inputs.kwPerRack || 10),
    coolingType: typeof rackData.coolingType === 'string' ? rackData.coolingType : (inputs.coolingType || 'air'),
    totalRacks: typeof rackData.totalRacks === 'number' ? rackData.totalRacks : (inputs.totalRacks || 28),
    totalITLoad: typeof rackData.totalITLoad === 'number' ? rackData.totalITLoad : 
                (inputs.kwPerRack || 10) * (inputs.totalRacks || 28)
  };
}

function validateElectricalSection(electricalData: any, inputs: any): any {
  if (!electricalData || typeof electricalData !== 'object') {
    return {
      currentPerRow: 0,
      busbarSize: 'busbar800A',
      currentPerRack: 0,
      tapOffBox: 'standard63A',
      rpdu: 'standard16A',
      multiplicityWarning: ''
    };
  }

  return {
    currentPerRow: typeof electricalData.currentPerRow === 'number' ? electricalData.currentPerRow : 0,
    busbarSize: typeof electricalData.busbarSize === 'string' ? electricalData.busbarSize : 'busbar800A',
    currentPerRack: typeof electricalData.currentPerRack === 'number' ? electricalData.currentPerRack : 0,
    tapOffBox: typeof electricalData.tapOffBox === 'string' ? electricalData.tapOffBox : 'standard63A',
    rpdu: typeof electricalData.rpdu === 'string' ? electricalData.rpdu : 'standard16A',
    multiplicityWarning: typeof electricalData.multiplicityWarning === 'string' ? electricalData.multiplicityWarning : ''
  };
}

function validateCoolingSection(coolingData: any, inputs: any): any {
  const totalITLoad = (inputs.kwPerRack || 10) * (inputs.totalRacks || 28);
  
  if (!coolingData || typeof coolingData !== 'object') {
    return {
      type: inputs.coolingType || 'air',
      totalCapacity: totalITLoad * 1.1,
      pipingSize: (inputs.coolingType || 'air') === 'air' ? 'none' : 'dn110',
      pue: 1.4
    };
  }

  // Ensure cooling type is consistent
  const coolingType = coolingData.type || inputs.coolingType || 'air';

  // Create base cooling object
  const validatedCooling: any = {
    type: coolingType,
    totalCapacity: typeof coolingData.totalCapacity === 'number' ? coolingData.totalCapacity : totalITLoad * 1.1,
    pue: typeof coolingData.pue === 'number' ? coolingData.pue : 1.4
  };

  // Add cooling type specific properties
  if (coolingType === 'dlc') {
    validatedCooling.dlcCoolingCapacity = typeof coolingData.dlcCoolingCapacity === 'number' ? 
      coolingData.dlcCoolingCapacity : totalITLoad * 0.75;
    validatedCooling.residualCoolingCapacity = typeof coolingData.residualCoolingCapacity === 'number' ? 
      coolingData.residualCoolingCapacity : totalITLoad * 0.25;
    validatedCooling.dlcFlowRate = typeof coolingData.dlcFlowRate === 'number' ? 
      coolingData.dlcFlowRate : totalITLoad * 0.75 * 0.25;
    validatedCooling.pipingSize = typeof coolingData.pipingSize === 'string' ? 
      coolingData.pipingSize : 'dn110';
  } else if (coolingType === 'hybrid') {
    validatedCooling.dlcPortion = typeof coolingData.dlcPortion === 'number' ? 
      coolingData.dlcPortion : totalITLoad * 0.6;
    validatedCooling.airPortion = typeof coolingData.airPortion === 'number' ? 
      coolingData.airPortion : totalITLoad * 0.4;
    validatedCooling.dlcFlowRate = typeof coolingData.dlcFlowRate === 'number' ? 
      coolingData.dlcFlowRate : totalITLoad * 0.6 * 0.25;
    validatedCooling.rdhxUnits = typeof coolingData.rdhxUnits === 'number' ? 
      coolingData.rdhxUnits : Math.ceil(totalITLoad * 0.4 / 150);
    validatedCooling.rdhxModel = typeof coolingData.rdhxModel === 'string' ? 
      coolingData.rdhxModel : 'average';
    validatedCooling.pipingSize = typeof coolingData.pipingSize === 'string' ? 
      coolingData.pipingSize : 'dn110';
  } else if (coolingType === 'immersion') {
    validatedCooling.tanksNeeded = typeof coolingData.tanksNeeded === 'number' ? 
      coolingData.tanksNeeded : Math.ceil((inputs.totalRacks || 28) / 4);
    validatedCooling.flowRate = typeof coolingData.flowRate === 'number' ? 
      coolingData.flowRate : totalITLoad * 1.05 * 0.25 * 0.8;
    validatedCooling.pipingSize = typeof coolingData.pipingSize === 'string' ? 
      coolingData.pipingSize : 'dn110';
  } else {
    // Air cooling
    validatedCooling.rdhxUnits = typeof coolingData.rdhxUnits === 'number' ? 
      coolingData.rdhxUnits : Math.ceil(totalITLoad * 1.1 / 150);
    validatedCooling.rdhxModel = typeof coolingData.rdhxModel === 'string' ? 
      coolingData.rdhxModel : ((inputs.kwPerRack || 10) <= 15 ? 'basic' : 
                              (inputs.kwPerRack || 10) <= 30 ? 'standard' : 'highDensity');
    validatedCooling.pipingSize = typeof coolingData.pipingSize === 'string' ? 
      coolingData.pipingSize : 'none';
  }

  return validatedCooling;
}

function validatePowerSection(powerData: any, inputs: any): any {
  const totalITLoad = (inputs.kwPerRack || 10) * (inputs.totalRacks || 28);
  const redundancyMode = inputs.redundancyMode || 'N+1';
  const redundancyFactor = redundancyMode === 'N' ? 1 : 
                          redundancyMode === 'N+1' ? 1.2 : 
                          redundancyMode === '2N' ? 2 : 1.5;
  
  if (!powerData || typeof powerData !== 'object') {
    return {
      ups: {
        totalITLoad: totalITLoad,
        redundancyFactor: redundancyFactor,
        requiredCapacity: totalITLoad * redundancyFactor,
        moduleSize: 250,
        totalModulesNeeded: Math.ceil(totalITLoad * redundancyFactor / 250),
        redundantModules: Math.ceil(totalITLoad * redundancyFactor / 250),
        framesNeeded: Math.ceil(Math.ceil(totalITLoad * redundancyFactor / 250) / 6),
        frameSize: 'frame2Module'
      },
      battery: {
        runtime: inputs.batteryRuntime || 10,
        energyNeeded: Math.round(totalITLoad * (inputs.batteryRuntime || 10) / 60),
        cabinetsNeeded: Math.ceil(Math.round(totalITLoad * (inputs.batteryRuntime || 10) / 60) / 40),
        totalWeight: Math.ceil(Math.round(totalITLoad * (inputs.batteryRuntime || 10) / 60) / 40) * 1200
      },
      generator: {
        included: inputs.includeGenerator || false,
        capacity: inputs.includeGenerator ? Math.ceil(totalITLoad * redundancyFactor * 1.25 / 800) * 800 : 0,
        model: inputs.includeGenerator ? 
          (Math.ceil(totalITLoad * redundancyFactor * 1.25 / 800) * 800 <= 1000 ? '1000kVA' : 
           Math.ceil(totalITLoad * redundancyFactor * 1.25 / 800) * 800 <= 2000 ? '2000kVA' : '3000kVA') : 'none',
        fuel: {
          tankSize: inputs.includeGenerator ? Math.ceil(totalITLoad * redundancyFactor * 1.25 / 800) * 800 * 0.2 * 8 : 0,
          consumption: inputs.includeGenerator ? Math.ceil(totalITLoad * redundancyFactor * 1.25 / 800) * 800 * 0.2 : 0,
          runtime: inputs.includeGenerator ? 8 : 0
        }
      }
    };
  }

  // Validate UPS section
  const validatedUps = !powerData.ups || typeof powerData.ups !== 'object' ? {
    totalITLoad: totalITLoad,
    redundancyFactor: redundancyFactor,
    requiredCapacity: totalITLoad * redundancyFactor,
    moduleSize: 250,
    totalModulesNeeded: Math.ceil(totalITLoad * redundancyFactor / 250),
    redundantModules: Math.ceil(totalITLoad * redundancyFactor / 250),
    framesNeeded: Math.ceil(Math.ceil(totalITLoad * redundancyFactor / 250) / 6),
    frameSize: 'frame2Module'
  } : {
    totalITLoad: typeof powerData.ups.totalITLoad === 'number' ? powerData.ups.totalITLoad : totalITLoad,
    redundancyFactor: typeof powerData.ups.redundancyFactor === 'number' ? powerData.ups.redundancyFactor : redundancyFactor,
    requiredCapacity: typeof powerData.ups.requiredCapacity === 'number' ? powerData.ups.requiredCapacity : totalITLoad * redundancyFactor,
    moduleSize: typeof powerData.ups.moduleSize === 'number' ? powerData.ups.moduleSize : 250,
    totalModulesNeeded: typeof powerData.ups.totalModulesNeeded === 'number' ? powerData.ups.totalModulesNeeded : Math.ceil(totalITLoad * redundancyFactor / 250),
    redundantModules: typeof powerData.ups.redundantModules === 'number' ? powerData.ups.redundantModules : Math.ceil(totalITLoad * redundancyFactor / 250),
    framesNeeded: typeof powerData.ups.framesNeeded === 'number' ? powerData.ups.framesNeeded : Math.ceil(Math.ceil(totalITLoad * redundancyFactor / 250) / 6),
    frameSize: typeof powerData.ups.frameSize === 'string' ? powerData.ups.frameSize : 'frame2Module'
  };

  // Validate battery section
  const batteryRuntime = inputs.batteryRuntime || 10;
  const validatedBattery = !powerData.battery || typeof powerData.battery !== 'object' ? {
    runtime: batteryRuntime,
    energyNeeded: Math.round(totalITLoad * batteryRuntime / 60),
    cabinetsNeeded: Math.ceil(Math.round(totalITLoad * batteryRuntime / 60) / 40),
    totalWeight: Math.ceil(Math.round(totalITLoad * batteryRuntime / 60) / 40) * 1200
  } : {
    runtime: typeof powerData.battery.runtime === 'number' ? powerData.battery.runtime : batteryRuntime,
    energyNeeded: typeof powerData.battery.energyNeeded === 'number' ? powerData.battery.energyNeeded : Math.round(totalITLoad * batteryRuntime / 60),
    cabinetsNeeded: typeof powerData.battery.cabinetsNeeded === 'number' ? powerData.battery.cabinetsNeeded : Math.ceil(Math.round(totalITLoad * batteryRuntime / 60) / 40),
    totalWeight: typeof powerData.battery.totalWeight === 'number' ? powerData.battery.totalWeight : Math.ceil(Math.round(totalITLoad * batteryRuntime / 60) / 40) * 1200
  };

  // Validate generator section
  const includeGenerator = inputs.includeGenerator || false;
  let validatedGenerator;
  
  if (!powerData.generator || typeof powerData.generator !== 'object') {
    validatedGenerator = {
      included: includeGenerator,
      capacity: includeGenerator ? Math.ceil(totalITLoad * redundancyFactor * 1.25 / 800) * 800 : 0,
      model: includeGenerator ? 
        (Math.ceil(totalITLoad * redundancyFactor * 1.25 / 800) * 800 <= 1000 ? '1000kVA' : 
         Math.ceil(totalITLoad * redundancyFactor * 1.25 / 800) * 800 <= 2000 ? '2000kVA' : '3000kVA') : 'none',
      fuel: {
        tankSize: includeGenerator ? Math.ceil(totalITLoad * redundancyFactor * 1.25 / 800) * 800 * 0.2 * 8 : 0,
        consumption: includeGenerator ? Math.ceil(totalITLoad * redundancyFactor * 1.25 / 800) * 800 * 0.2 : 0,
        runtime: includeGenerator ? 8 : 0
      }
    };
  } else {
    const generatorCapacity = includeGenerator ? Math.ceil(totalITLoad * redundancyFactor * 1.25 / 800) * 800 : 0;
    
    validatedGenerator = {
      included: typeof powerData.generator.included === 'boolean' ? powerData.generator.included : includeGenerator,
      capacity: typeof powerData.generator.capacity === 'number' ? powerData.generator.capacity : generatorCapacity,
      model: typeof powerData.generator.model === 'string' ? powerData.generator.model : 
        (includeGenerator ? 
          (generatorCapacity <= 1000 ? '1000kVA' : 
           generatorCapacity <= 2000 ? '2000kVA' : '3000kVA') : 'none'),
      fuel: !powerData.generator.fuel || typeof powerData.generator.fuel !== 'object' ? {
        tankSize: includeGenerator ? generatorCapacity * 0.2 * 8 : 0,
        consumption: includeGenerator ? generatorCapacity * 0.2 : 0,
        runtime: includeGenerator ? 8 : 0
      } : {
        tankSize: typeof powerData.generator.fuel.tankSize === 'number' ? powerData.generator.fuel.tankSize : (includeGenerator ? generatorCapacity * 0.2 * 8 : 0),
        consumption: typeof powerData.generator.fuel.consumption === 'number' ? powerData.generator.fuel.consumption : (includeGenerator ? generatorCapacity * 0.2 : 0),
        runtime: typeof powerData.generator.fuel.runtime === 'number' ? powerData.generator.fuel.runtime : (includeGenerator ? 8 : 0)
      }
    };
  }

  return {
    ups: validatedUps,
    battery: validatedBattery,
    generator: validatedGenerator
  };
}

function validateCostSection(costData: any, inputs: any): any {
  const totalITLoad = (inputs.kwPerRack || 10) * (inputs.totalRacks || 28);
  const totalRacks = inputs.totalRacks || 28;
  const coolingType = inputs.coolingType || 'air';
  const includeGenerator = inputs.includeGenerator || false;
  
  // Calculate a reasonable fallback total cost
  const fallbackTotalCost = totalITLoad * 5000;
  
  if (!costData || typeof costData !== 'object') {
    return {
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
        total: includeGenerator ? 500000 : 300000 
      },
      infrastructure: 250000,
      sustainability: 0,
      equipmentTotal: 700000,
      installation: 105000,
      engineering: 70000,
      contingency: 70000,
      totalProjectCost: fallbackTotalCost,
      costPerRack: Math.round(fallbackTotalCost / totalRacks),
      costPerKw: Math.round(fallbackTotalCost / totalITLoad)
    };
  }

  // Validate electrical costs
  const validatedElectrical = !costData.electrical || typeof costData.electrical !== 'object' ? {
    busbar: 50000,
    tapOffBox: 1200 * totalRacks,
    rpdu: 800 * totalRacks,
    total: 50000 + 2000 * totalRacks
  } : {
    busbar: typeof costData.electrical.busbar === 'number' ? costData.electrical.busbar : 50000,
    tapOffBox: typeof costData.electrical.tapOffBox === 'number' ? costData.electrical.tapOffBox : 1200 * totalRacks,
    rpdu: typeof costData.electrical.rpdu === 'number' ? costData.electrical.rpdu : 800 * totalRacks,
    total: typeof costData.electrical.total === 'number' ? costData.electrical.total : 50000 + 2000 * totalRacks
  };

  // Validate power costs
  const validatedPower = !costData.power || typeof costData.power !== 'object' ? {
    ups: 220000,
    battery: 80000,
    generator: includeGenerator ? 200000 : 0,
    total: includeGenerator ? 500000 : 300000
  } : {
    ups: typeof costData.power.ups === 'number' ? costData.power.ups : 220000,
    battery: typeof costData.power.battery === 'number' ? costData.power.battery : 80000,
    generator: typeof costData.power.generator === 'number' ? costData.power.generator : (includeGenerator ? 200000 : 0),
    total: typeof costData.power.total === 'number' ? costData.power.total : (includeGenerator ? 500000 : 300000)
  };

  // Validate cooling cost
  const coolingCost = typeof costData.cooling === 'number' ? costData.cooling : (coolingType === 'air' ? 60000 : 150000);

  // Validate other costs
  const infrastructureCost = typeof costData.infrastructure === 'number' ? costData.infrastructure : 250000;
  const sustainabilityCost = typeof costData.sustainability === 'number' ? costData.sustainability : 0;
  
  // Calculate equipment total
  const equipmentTotal = typeof costData.equipmentTotal === 'number' ? costData.equipmentTotal : 
    (validatedElectrical.total + coolingCost + validatedPower.total + infrastructureCost + sustainabilityCost);
  
  // Calculate additional costs
  const installationCost = typeof costData.installation === 'number' ? costData.installation : Math.round(equipmentTotal * 0.15);
  const engineeringCost = typeof costData.engineering === 'number' ? costData.engineering : Math.round(equipmentTotal * 0.10);
  const contingencyCost = typeof costData.contingency === 'number' ? costData.contingency : Math.round(equipmentTotal * 0.10);
  
  // Calculate total project cost
  const totalProjectCost = typeof costData.totalProjectCost === 'number' ? costData.totalProjectCost : 
    (equipmentTotal + installationCost + engineeringCost + contingencyCost);
  
  // Calculate per-rack and per-kW costs
  const costPerRack = typeof costData.costPerRack === 'number' ? costData.costPerRack : Math.round(totalProjectCost / totalRacks);
  const costPerKw = typeof costData.costPerKw === 'number' ? costData.costPerKw : Math.round(totalProjectCost / totalITLoad);

  return {
    electrical: validatedElectrical,
    cooling: coolingCost,
    power: validatedPower,
    infrastructure: infrastructureCost,
    sustainability: sustainabilityCost,
    equipmentTotal: equipmentTotal,
    installation: installationCost,
    engineering: engineeringCost,
    contingency: contingencyCost,
    totalProjectCost: totalProjectCost,
    costPerRack: costPerRack,
    costPerKw: costPerKw
  };
}

function validateReliabilitySection(reliabilityData: any, inputs: any): any {
  const redundancyMode = inputs.redundancyMode || 'N+1';
  
  if (!reliabilityData || typeof reliabilityData !== 'object') {
    return {
      tier: redundancyMode === '2N' ? 'Tier IV' : 
            redundancyMode === 'N+1' ? 'Tier III' : 'Tier II',
      availability: redundancyMode === '2N' ? '99.999%' : 
                   redundancyMode === 'N+1' ? '99.99%' : '99.9%',
      annualDowntime: redundancyMode === '2N' ? 5.3 : 
                     redundancyMode === 'N+1' ? 52.6 : 526,
      mtbf: 8760,
      mttr: 4
    };
  }

  return {
    tier: typeof reliabilityData.tier === 'string' ? reliabilityData.tier : 
          (redundancyMode === '2N' ? 'Tier IV' : 
           redundancyMode === 'N+1' ? 'Tier III' : 'Tier II'),
    availability: typeof reliabilityData.availability === 'string' ? reliabilityData.availability : 
                 (redundancyMode === '2N' ? '99.999%' : 
                  redundancyMode === 'N+1' ? '99.99%' : '99.9%'),
    annualDowntime: typeof reliabilityData.annualDowntime === 'number' ? reliabilityData.annualDowntime : 
                   (redundancyMode === '2N' ? 5.3 : 
                    redundancyMode === 'N+1' ? 52.6 : 526),
    mtbf: typeof reliabilityData.mtbf === 'number' ? reliabilityData.mtbf : 8760,
    mttr: typeof reliabilityData.mttr === 'number' ? reliabilityData.mttr : 4
  };
}

function validateSustainabilitySection(sustainabilityData: any, inputs: any): any {
  const totalITLoad = (inputs.kwPerRack || 10) * (inputs.totalRacks || 28);
  const coolingType = inputs.coolingType || 'air';
  
  // Calculate PUE based on cooling type
  const basePue = 
    coolingType === 'air' ? 1.6 :
    coolingType === 'dlc' ? 1.2 :
    coolingType === 'hybrid' ? 1.3 :
    coolingType === 'immersion' ? 1.1 : 1.5;
  
  // Apply sustainability adjustments
  const pueAdjustment = 
    (inputs.sustainabilityOptions?.enableWasteHeatRecovery ? 0.1 : 0) +
    (inputs.sustainabilityOptions?.enableWaterRecycling ? 0.05 : 0);
  
  const pue = Math.max(1.03, basePue - pueAdjustment);
  
  if (!sustainabilityData || typeof sustainabilityData !== 'object') {
    return {
      pue: pue,
      wue: 0.5,
      annualEnergyConsumption: {
        it: totalITLoad * 8760,
        cooling: totalITLoad * 8760 * (pue - 1) * 0.7,
        power: totalITLoad * 8760 * (pue - 1) * 0.3,
        total: totalITLoad * 8760 * pue,
        overhead: totalITLoad * 8760 * (pue - 1)
      }
    };
  }

  // Validate annual energy consumption
  const validatedEnergyConsumption = !sustainabilityData.annualEnergyConsumption || 
    typeof sustainabilityData.annualEnergyConsumption !== 'object' ? {
      it: totalITLoad * 8760,
      cooling: totalITLoad * 8760 * (pue - 1) * 0.7,
      power: totalITLoad * 8760 * (pue - 1) * 0.3,
      total: totalITLoad * 8760 * pue,
      overhead: totalITLoad * 8760 * (pue - 1)
    } : {
      it: typeof sustainabilityData.annualEnergyConsumption.it === 'number' ? 
        sustainabilityData.annualEnergyConsumption.it : totalITLoad * 8760,
      cooling: typeof sustainabilityData.annualEnergyConsumption.cooling === 'number' ? 
        sustainabilityData.annualEnergyConsumption.cooling : totalITLoad * 8760 * (pue - 1) * 0.7,
      power: typeof sustainabilityData.annualEnergyConsumption.power === 'number' ? 
        sustainabilityData.annualEnergyConsumption.power : totalITLoad * 8760 * (pue - 1) * 0.3,
      total: typeof sustainabilityData.annualEnergyConsumption.total === 'number' ? 
        sustainabilityData.annualEnergyConsumption.total : totalITLoad * 8760 * pue,
      overhead: typeof sustainabilityData.annualEnergyConsumption.overhead === 'number' ? 
        sustainabilityData.annualEnergyConsumption.overhead : totalITLoad * 8760 * (pue - 1)
    };

  return {
    pue: typeof sustainabilityData.pue === 'number' ? sustainabilityData.pue : pue,
    wue: typeof sustainabilityData.wue === 'number' ? sustainabilityData.wue : 0.5,
    annualEnergyConsumption: validatedEnergyConsumption
  };
}

function validateCarbonFootprintSection(carbonData: any, inputs: any): any {
  const totalITLoad = (inputs.kwPerRack || 10) * (inputs.totalRacks || 28);
  const includeGenerator = inputs.includeGenerator || false;
  const renewablePercentage = inputs.sustainabilityOptions?.renewableEnergyPercentage || 20;
  
  // Calculate PUE based on cooling type
  const coolingType = inputs.coolingType || 'air';
  const basePue = 
    coolingType === 'air' ? 1.6 :
    coolingType === 'dlc' ? 1.2 :
    coolingType === 'hybrid' ? 1.3 :
    coolingType === 'immersion' ? 1.1 : 1.5;
  
  // Apply sustainability adjustments
  const pueAdjustment = 
    (inputs.sustainabilityOptions?.enableWasteHeatRecovery ? 0.1 : 0) +
    (inputs.sustainabilityOptions?.enableWaterRecycling ? 0.05 : 0);
  
  const pue = Math.max(1.03, basePue - pueAdjustment);
  
  // Calculate total facility load
  const totalFacilityLoad = totalITLoad * pue;
  
  // Calculate carbon emissions
  const gridEmissions = Math.round(totalFacilityLoad * 8760 * 0.35 * (1 - renewablePercentage / 100) / 1000);
  
  // Calculate generator emissions if included
  const generatorEmissions = includeGenerator ? 
    Math.round(Math.ceil(totalITLoad * 1.2 * 1.25 / 800) * 800 * 24 * 0.8 * 0.8 / 1000) : 0;
  
  // Calculate total emissions
  const totalEmissions = gridEmissions + generatorEmissions;
  
  if (!carbonData || typeof carbonData !== 'object') {
    return {
      totalAnnualEmissions: totalEmissions,
      gridEmissions: gridEmissions,
      generatorEmissions: generatorEmissions,
      emissionsPerMWh: 350 * (1 - renewablePercentage / 100),
      renewableImpact: {
        percentage: renewablePercentage,
        emissionsAvoided: Math.round(totalFacilityLoad * 8760 * 0.35 * renewablePercentage / 100 / 1000)
      }
    };
  }

  // Validate renewable impact
  const validatedRenewableImpact = !carbonData.renewableImpact || typeof carbonData.renewableImpact !== 'object' ? {
    percentage: renewablePercentage,
    emissionsAvoided: Math.round(totalFacilityLoad * 8760 * 0.35 * renewablePercentage / 100 / 1000)
  } : {
    percentage: typeof carbonData.renewableImpact.percentage === 'number' ? 
      carbonData.renewableImpact.percentage : renewablePercentage,
    emissionsAvoided: typeof carbonData.renewableImpact.emissionsAvoided === 'number' ? 
      carbonData.renewableImpact.emissionsAvoided : Math.round(totalFacilityLoad * 8760 * 0.35 * renewablePercentage / 100 / 1000)
  };

  return {
    totalAnnualEmissions: typeof carbonData.totalAnnualEmissions === 'number' ? 
      carbonData.totalAnnualEmissions : totalEmissions,
    gridEmissions: typeof carbonData.gridEmissions === 'number' ? 
      carbonData.gridEmissions : gridEmissions,
    generatorEmissions: typeof carbonData.generatorEmissions === 'number' ? 
      carbonData.generatorEmissions : generatorEmissions,
    emissionsPerMWh: typeof carbonData.emissionsPerMWh === 'number' ? 
      carbonData.emissionsPerMWh : 350 * (1 - renewablePercentage / 100),
    renewableImpact: validatedRenewableImpact
  };
}

function validateTCOSection(tcoData: any, inputs: any): any {
  const totalITLoad = (inputs.kwPerRack || 10) * (inputs.totalRacks || 28);
  
  // Use cost data to calculate TCO
  const capex = totalITLoad * 5000; // Simplified capex calculation
  const annualOpex = totalITLoad * 8760 * 0.12; // Simplified opex calculation
  
  if (!tcoData || typeof tcoData !== 'object') {
    return {
      capex: capex,
      opex: {
        annual: annualOpex,
        energy: totalITLoad * 8760 * 0.12,
        maintenance: capex * 0.03,
        operational: capex * 0.02
      },
      total5Year: capex + (annualOpex * 5),
      total10Year: capex + (annualOpex * 10)
    };
  }

  // Validate opex
  const validatedOpex = !tcoData.opex || typeof tcoData.opex !== 'object' ? {
    annual: annualOpex,
    energy: totalITLoad * 8760 * 0.12,
    maintenance: capex * 0.03,
    operational: capex * 0.02
  } : {
    annual: typeof tcoData.opex.annual === 'number' ? tcoData.opex.annual : annualOpex,
    energy: typeof tcoData.opex.energy === 'number' ? tcoData.opex.energy : totalITLoad * 8760 * 0.12,
    maintenance: typeof tcoData.opex.maintenance === 'number' ? tcoData.opex.maintenance : capex * 0.03,
    operational: typeof tcoData.opex.operational === 'number' ? tcoData.opex.operational : capex * 0.02
  };

  // Get validated capex
  const validatedCapex = typeof tcoData.capex === 'number' ? tcoData.capex : capex;
  
  // Calculate 5-year and 10-year TCO
  const annual = validatedOpex.annual || annualOpex;
  const total5Year = typeof tcoData.total5Year === 'number' ? tcoData.total5Year : validatedCapex + (annual * 5);
  const total10Year = typeof tcoData.total10Year === 'number' ? tcoData.total10Year : validatedCapex + (annual * 10);

  return {
    capex: validatedCapex,
    opex: validatedOpex,
    total5Year: total5Year,
    total10Year: total10Year
  };
}