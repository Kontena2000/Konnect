
import { ClimateFactor } from '../climateDataService';

export interface CalculationConfig {
  kwPerRack: number;
  coolingType: string;
  totalRacks?: number;
}

export interface CalculationOptions {
  redundancyMode?: string;
  includeGenerator?: boolean;
  batteryRuntime?: number;
  sustainabilityOptions?: {
    enableWasteHeatRecovery?: boolean;
    enableWaterRecycling?: boolean;
    renewableEnergyPercentage?: number;
  };
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    climateData?: any;
  };
}

export interface CoolingResult {
  type: string;
  totalCapacity: number;
  dlcCoolingCapacity?: number;
  residualCoolingCapacity?: number;
  dlcFlowRate?: number;
  dlcPortion?: number;
  airPortion?: number;
  rdhxUnits?: number;
  rdhxModel?: string;
  tanksNeeded?: number;
  flowRate?: number;
  pipingSize: string;
  pue: number;
}

export interface UPSResult {
  totalITLoad: number;
  redundancyFactor: number;
  requiredCapacity: number;
  moduleSize: number;
  totalModulesNeeded: number;
  redundantModules: number;
  framesNeeded: number;
  frameSize: string;
}

export interface BatteryResult {
  runtime: number;
  energyNeeded: number;
  cabinetsNeeded: number;
  totalWeight: number;
}

export interface GeneratorResult {
  included: boolean;
  capacity: number;
  model: string;
  fuel: {
    tankSize: number;
    consumption: number;
    runtime: number;
  };
}

export interface ReliabilityResult {
  availability: number;
  tier: string;
  annualDowntime: number;
  mtbf: number;
  mttr: number;
}

export interface SustainabilityResult {
  pue: number;
  wue: number;
  annualEnergyConsumption: {
    it: number;
    cooling: number;
    power: number;
    total: number;
  };
}

export interface CarbonFootprintResult {
  annualCO2Grid: number;
  annualCO2Generator: number;
  totalAnnualCO2: number;
  co2PerKwh: number;
}

export interface CostResult {
  electrical: {
    busbar: number;
    tapOffBox: number;
    rpdu: number;
    total: number;
  };
  cooling: number;
  power: {
    ups: number;
    battery: number;
    generator: number;
    total: number;
  };
  infrastructure: number;
  sustainability: number;
  equipmentTotal: number;
  installation: number;
  engineering: number;
  contingency: number;
  totalProjectCost: number;
  costPerRack: number;
  costPerKw: number;
}

export interface TCOResult {
  capex: number;
  opex: any;
  total5Year: number;
  total10Year: number;
}

export interface CalculationResult {
  rack: {
    powerDensity: number;
    coolingType: string;
    totalRacks: number;
  };
  electrical: {
    currentPerRow: number;
    busbarSize: string;
    currentPerRack: number;
    tapOffBox: string;
    rpdu: string;
    multiplicityWarning: string;
  };
  cooling: CoolingResult;
  thermalDistribution: {
    pue: number;
    distribution: {
      liquid: {
        load: number;
      };
    };
  };
  pipeSizing: {
    pipeSize: string;
    velocityMS: number;
    pressureDropKpa: number;
  } | null;
  power: {
    ups: UPSResult;
    battery: BatteryResult;
    generator: GeneratorResult;
  };
  reliability: ReliabilityResult;
  sustainability: SustainabilityResult;
  carbonFootprint: CarbonFootprintResult;
  cost: CostResult;
  tco: TCOResult;
  climateFactor?: ClimateFactor;
  energyMetrics?: any;
}

export interface SavedCalculation {
  id: string;
  userId: string;
  name: string;
  description: string;
  kwPerRack: number;
  coolingType: string;
  totalRacks: number;
  redundancyMode: string;
  includeGenerator: boolean;
  sustainabilityOptions: {
    enableWasteHeatRecovery?: boolean;
    enableWaterRecycling?: boolean;
    renewableEnergyPercentage?: number;
  };
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  projectId?: string;
  results: CalculationResult;
  createdAt: any;
  updatedAt: any;
  status?: string;
}
