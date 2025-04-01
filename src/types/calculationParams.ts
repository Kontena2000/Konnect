import { DEFAULT_CALCULATION_PARAMS } from "@/constants/calculatorConstants";

export interface ElectricalParams {
  voltageFactor: number;
  powerFactor: number;
  busbarsPerRow: number;
  redundancyMode: "N" | "N+1" | "2N";
  volts: number; // Added missing property
  phases: number; // Added missing property
}

export interface CoolingParams {
  deltaT: number;
  flowRateFactor: number;
  airCoolingEfficiency: number; // Added missing property
  dlcEfficiency: number; // Added missing property
  hybridEfficiency: number; // Added missing property
  immersionEfficiency: number; // Added missing property
}

export interface PowerParams {
  upsModuleSize: number;
  upsFrameMaxModules: number;
  batteryRuntime: number;
  batteryEfficiency: number;
  eHouseBaseSqm: number;      // Added missing property
  eHouseBatterySqm: number;   // Added missing property
}

export interface CostFactorParams {
  installationPercentage: number;
  engineeringPercentage: number;
  contingencyPercentage: number;
}

export interface CoolingThresholds {
  lowDensity: number; // Added missing property
  mediumDensity: number; // Added missing property
  highDensity: number; // Added missing property
}

export interface CalculationParams {
  electrical: ElectricalParams;
  cooling: CoolingParams;
  power: PowerParams;
  costFactors: CostFactorParams;
  coolingThresholds: CoolingThresholds; // Added missing property
  [key: string]: any; // Added index signature
}

// Helper function to validate calculation parameters
export function validateCalculationParams(params: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if params exists and has the expected structure
  if (!params) {
    return { isValid: false, errors: ["Parameters object is missing"] };
  }

  // Check electrical parameters
  if (!params.electrical) {
    errors.push("Electrical parameters are missing");
  } else {
    if (typeof params.electrical.voltageFactor !== "number" || params.electrical.voltageFactor <= 0) {
      errors.push("Invalid voltage factor");
    }
    if (typeof params.electrical.powerFactor !== "number" || params.electrical.powerFactor <= 0 || params.electrical.powerFactor > 1) {
      errors.push("Power factor must be between 0 and 1");
    }
    if (typeof params.electrical.busbarsPerRow !== "number" || params.electrical.busbarsPerRow <= 0) {
      errors.push("Invalid busbars per row value");
    }
    if (!["N", "N+1", "2N"].includes(params.electrical.redundancyMode)) {
      errors.push("Invalid redundancy mode");
    }
    if (typeof params.electrical.volts !== "number" || params.electrical.volts <= 0) { // Added validation
      errors.push("Invalid volts value");
    }
    if (typeof params.electrical.phases !== "number" || params.electrical.phases <= 0) { // Added validation
      errors.push("Invalid phases value");
    }
  }

  // Check cooling parameters
  if (!params.cooling) {
    errors.push("Cooling parameters are missing");
  } else {
    if (typeof params.cooling.deltaT !== "number" || params.cooling.deltaT <= 0) {
      errors.push("Invalid temperature delta value");
    }
    if (typeof params.cooling.flowRateFactor !== "number" || params.cooling.flowRateFactor <= 0) {
      errors.push("Invalid flow rate factor");
    }
    if (typeof params.cooling.airCoolingEfficiency !== "number" || params.cooling.airCoolingEfficiency <= 0) { // Added validation
      errors.push("Invalid air cooling efficiency");
    }
    if (typeof params.cooling.dlcEfficiency !== "number" || params.cooling.dlcEfficiency <= 0) { // Added validation
      errors.push("Invalid DLC efficiency");
    }
    if (typeof params.cooling.hybridEfficiency !== "number" || params.cooling.hybridEfficiency <= 0) { // Added validation
      errors.push("Invalid hybrid efficiency");
    }
    if (typeof params.cooling.immersionEfficiency !== "number" || params.cooling.immersionEfficiency <= 0) { // Added validation
      errors.push("Invalid immersion efficiency");
    }
    if (typeof params.cooling.dlcResidualHeatFraction !== "number" || 
        params.cooling.dlcResidualHeatFraction <= 0 || 
        params.cooling.dlcResidualHeatFraction >= 1) {
      errors.push("DLC residual heat fraction must be between 0 and 1");
    }
    if (typeof params.cooling.chillerEfficiencyFactor !== "number" || params.cooling.chillerEfficiencyFactor <= 0) {
      errors.push("Invalid chiller efficiency factor");
    }
  }

  // Check power parameters
  if (!params.power) {
    errors.push("Power parameters are missing");
  } else {
    if (typeof params.power.upsModuleSize !== "number" || params.power.upsModuleSize <= 0) {
      errors.push("Invalid UPS module size");
    }
    if (typeof params.power.upsFrameMaxModules !== "number" || params.power.upsFrameMaxModules <= 0) {
      errors.push("Invalid max modules per UPS frame");
    }
    if (typeof params.power.batteryRuntime !== "number" || params.power.batteryRuntime <= 0) {
      errors.push("Invalid battery runtime");
    }
    if (typeof params.power.batteryEfficiency !== "number" || 
        params.power.batteryEfficiency <= 0 || 
        params.power.batteryEfficiency > 1) {
      errors.push("Battery efficiency must be between 0 and 1");
    }
  }

  // Check cost factor parameters
  if (!params.costFactors) {
    errors.push("Cost factor parameters are missing");
  } else {
    if (typeof params.costFactors.installationPercentage !== "number" || 
        params.costFactors.installationPercentage < 0 || 
        params.costFactors.installationPercentage > 1) {
      errors.push("Installation percentage must be between 0 and 1");
    }
    if (typeof params.costFactors.engineeringPercentage !== "number" || 
        params.costFactors.engineeringPercentage < 0 || 
        params.costFactors.engineeringPercentage > 1) {
      errors.push("Engineering percentage must be between 0 and 1");
    }
    if (typeof params.costFactors.contingencyPercentage !== "number" || 
        params.costFactors.contingencyPercentage < 0 || 
        params.costFactors.contingencyPercentage > 1) {
      errors.push("Contingency percentage must be between 0 and 1");
    }
  }

  return { isValid: errors.length === 0, errors };
}

// Helper function to ensure params has the correct structure
export function ensureParamsStructure(params: any): CalculationParams {
  if (!params) {
    return { ...DEFAULT_CALCULATION_PARAMS } as CalculationParams;
  }

  // Create a deep copy with default values for any missing properties
  return {
    electrical: {
      voltageFactor: params.electrical?.voltageFactor ?? DEFAULT_CALCULATION_PARAMS.electrical.voltageFactor,
      powerFactor: params.electrical?.powerFactor ?? DEFAULT_CALCULATION_PARAMS.electrical.powerFactor,
      busbarsPerRow: params.electrical?.busbarsPerRow ?? DEFAULT_CALCULATION_PARAMS.electrical.busbarsPerRow,
      redundancyMode: params.electrical?.redundancyMode ?? DEFAULT_CALCULATION_PARAMS.electrical.redundancyMode,
      volts: params.electrical?.volts ?? DEFAULT_CALCULATION_PARAMS.electrical.volts, // Added default value
      phases: params.electrical?.phases ?? DEFAULT_CALCULATION_PARAMS.electrical.phases, // Added default value
    },
    cooling: {
      deltaT: params.cooling?.deltaT ?? DEFAULT_CALCULATION_PARAMS.cooling.deltaT,
      flowRateFactor: params.cooling?.flowRateFactor ?? DEFAULT_CALCULATION_PARAMS.cooling.flowRateFactor,
      airCoolingEfficiency: params.cooling?.airCoolingEfficiency ?? DEFAULT_CALCULATION_PARAMS.cooling.airCoolingEfficiency, // Added default value
      dlcEfficiency: params.cooling?.dlcEfficiency ?? DEFAULT_CALCULATION_PARAMS.cooling.dlcEfficiency, // Added default value
      hybridEfficiency: params.cooling?.hybridEfficiency ?? DEFAULT_CALCULATION_PARAMS.cooling.hybridEfficiency, // Added default value
      immersionEfficiency: params.cooling?.immersionEfficiency ?? DEFAULT_CALCULATION_PARAMS.cooling.immersionEfficiency, // Added default value
    },
    power: {
      upsModuleSize: params.power?.upsModuleSize ?? DEFAULT_CALCULATION_PARAMS.power.upsModuleSize,
      upsFrameMaxModules: params.power?.upsFrameMaxModules ?? DEFAULT_CALCULATION_PARAMS.power.upsFrameMaxModules,
      batteryRuntime: params.power?.batteryRuntime ?? DEFAULT_CALCULATION_PARAMS.power.batteryRuntime,
      batteryEfficiency: params.power?.batteryEfficiency ?? DEFAULT_CALCULATION_PARAMS.power.batteryEfficiency,
      eHouseBaseSqm: params.power?.eHouseBaseSqm ?? DEFAULT_CALCULATION_PARAMS.power.eHouseBaseSqm,
      eHouseBatterySqm: params.power?.eHouseBatterySqm ?? DEFAULT_CALCULATION_PARAMS.power.eHouseBatterySqm,
    },
    costFactors: {
      installationPercentage: params.costFactors?.installationPercentage ?? DEFAULT_CALCULATION_PARAMS.costFactors.installationPercentage,
      engineeringPercentage: params.costFactors?.engineeringPercentage ?? DEFAULT_CALCULATION_PARAMS.costFactors.engineeringPercentage,
      contingencyPercentage: params.costFactors?.contingencyPercentage ?? DEFAULT_CALCULATION_PARAMS.costFactors.contingencyPercentage,
    },
    coolingThresholds: {
      lowDensity: params.coolingThresholds?.lowDensity ?? DEFAULT_CALCULATION_PARAMS.coolingThresholds.lowDensity, // Added default value
      mediumDensity: params.coolingThresholds?.mediumDensity ?? DEFAULT_CALCULATION_PARAMS.coolingThresholds.mediumDensity, // Added default value
      highDensity: params.coolingThresholds?.highDensity ?? DEFAULT_CALCULATION_PARAMS.coolingThresholds.highDensity, // Added default value
    }
  };
}