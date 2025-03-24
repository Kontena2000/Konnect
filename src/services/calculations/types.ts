
export interface PowerCalculationParams {
  voltage: number;
  current: number;
  powerFactor: number;
  distance: number;
  cableType: string;
  temperature: number;
  loadType: "linear" | "nonlinear";
}

export interface CoolingCalculationParams {
  itLoad: number;
  temperature: {
    supply: number;
    return: number;
    ambient: number;
  };
  humidity: {
    relative: number;
    target: number;
  };
  rackDensity: number;
  roomDimensions: {
    length: number;
    width: number;
    height: number;
  };
}

export interface EconomicCalculationParams {
  powerCost: number;
  coolingCost: number;
  maintenanceCost: number;
  initialInvestment: number;
  operationalHours: number;
  energyRates: {
    peak: number;
    offPeak: number;
  };
  carbonEmissionFactor: number;
}

export interface PowerCalculationResult {
  faultCurrent: number;
  shortCircuitCurrent: number;
  arcFlashEnergy: number;
  voltageDrop: number;
  correctedPowerFactor: number;
  harmonicDistortion: number;
  requiredFeederSize: number;
  breakers: {
    rating: number;
    tripTime: number;
    coordination: boolean;
  }[];
}

export interface CoolingCalculationResult {
  requiredCapacity: number;
  airflow: number;
  chilledWaterFlow: number;
  heatRejection: number;
  psychrometrics: {
    dewPoint: number;
    absoluteHumidity: number;
    enthalpy: number;
  };
  redundancyAnalysis: {
    n: boolean;
    nPlusOne: boolean;
    twoN: boolean;
  };
}

export interface EconomicCalculationResult {
  totalCostOfOwnership: number;
  powerUsageEffectiveness: number;
  annualEnergyCost: number;
  carbonFootprint: number;
  roi: {
    paybackPeriod: number;
    npv: number;
    irr: number;
  };
  costBreakdown: {
    capex: number;
    opex: number;
    maintenance: number;
    energy: number;
  };
}

export interface UnitConversion {
  fromSI: (value: number) => number;
  toSI: (value: number) => number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export type CalculationStatus = "pending" | "running" | "complete" | "error";

export interface CalculationProgress {
  status: CalculationStatus;
  progress: number;
  currentStep: string;
  estimatedTimeRemaining?: number;
}
