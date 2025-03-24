
import type { PowerCalculationParams, CoolingCalculationParams, EconomicCalculationParams, ValidationResult } from "./types";
import { ASHRAE_CONSTANTS, CONNECTION_TYPES } from "./constants";

export function validatePowerCalculations(params: PowerCalculationParams): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Voltage validation
  if (params.voltage <= 0) {
    errors.push("Voltage must be greater than 0");
  } else if (![120, 208, 240, 277, 480].includes(params.voltage)) {
    warnings.push("Non-standard voltage value detected");
  }

  // Current validation
  if (params.current <= 0) {
    errors.push("Current must be greater than 0");
  } else if (params.current > 1000) {
    warnings.push("High current value detected - verify requirements");
  }

  // Power factor validation
  if (params.powerFactor <= 0 || params.powerFactor > 1) {
    errors.push("Power factor must be between 0 and 1");
  } else if (params.powerFactor < 0.8) {
    warnings.push("Low power factor may require correction");
  }

  // Distance validation
  if (params.distance < 0) {
    errors.push("Distance cannot be negative");
  } else if (params.distance > 100) {
    warnings.push("Long cable run may require voltage drop analysis");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateCoolingCalculations(params: CoolingCalculationParams): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // IT Load validation
  if (params.itLoad <= 0) {
    errors.push("IT Load must be greater than 0");
  }

  // Temperature validation
  if (params.temperature.supply < ASHRAE_CONSTANTS.RECOMMENDED_TEMPERATURE.MIN) {
    warnings.push("Supply temperature below ASHRAE recommended minimum");
  }
  if (params.temperature.supply > ASHRAE_CONSTANTS.RECOMMENDED_TEMPERATURE.MAX) {
    warnings.push("Supply temperature above ASHRAE recommended maximum");
  }

  // Humidity validation
  if (params.humidity.relative < ASHRAE_CONSTANTS.RECOMMENDED_HUMIDITY.MIN) {
    warnings.push("Relative humidity below ASHRAE recommended minimum");
  }
  if (params.humidity.relative > ASHRAE_CONSTANTS.RECOMMENDED_HUMIDITY.MAX) {
    warnings.push("Relative humidity above ASHRAE recommended maximum");
  }

  // Rack density validation
  if (params.rackDensity <= 0) {
    errors.push("Rack density must be greater than 0");
  } else if (params.rackDensity > ASHRAE_CONSTANTS.HEAT_DENSITY_LIMITS.HIGH) {
    warnings.push("High rack density may require additional cooling");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateEconomicCalculations(params: EconomicCalculationParams): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Cost validation
  if (params.powerCost < 0) {
    errors.push("Power cost cannot be negative");
  }
  if (params.coolingCost < 0) {
    errors.push("Cooling cost cannot be negative");
  }
  if (params.maintenanceCost < 0) {
    errors.push("Maintenance cost cannot be negative");
  }

  // Investment validation
  if (params.initialInvestment <= 0) {
    errors.push("Initial investment must be greater than 0");
  }

  // Operational hours validation
  if (params.operationalHours <= 0 || params.operationalHours > 8760) {
    errors.push("Operational hours must be between 0 and 8760");
  }

  // Energy rates validation
  if (params.energyRates.peak <= 0) {
    errors.push("Peak energy rate must be greater than 0");
  }
  if (params.energyRates.offPeak <= 0) {
    errors.push("Off-peak energy rate must be greater than 0");
  }
  if (params.energyRates.offPeak >= params.energyRates.peak) {
    warnings.push("Off-peak rate should be lower than peak rate");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
