
export const DEFAULT_CALCULATION_PARAMS = {
  // Electrical parameters
  electrical: {
    voltageFactor: 400,       // Voltage (V)
    powerFactor: 0.9,         // Power factor
    busbarsPerRow: 1,         // Default number of busbars per row
    redundancyMode: "N+1" as "N" | "N+1" | "2N",    // Redundancy mode: 'N', 'N+1', '2N'
  },
  
  // Cooling parameters
  cooling: {
    deltaT: 10,               // Temperature delta (°C)
    flowRateFactor: 2.22,     // L/min/kW at delta T of 7°C
    dlcResidualHeatFraction: 0.25, // DLC residual heat fraction
    chillerEfficiencyFactor: 1.0,  // Chiller efficiency multiplier
  },
  
  // UPS and power parameters
  power: {
    upsModuleSize: 250,       // UPS module size (kW)
    upsFrameMaxModules: 8,    // Maximum modules per UPS frame
    batteryRuntime: 5,        // Battery runtime in minutes
    batteryEfficiency: 0.95,  // Battery efficiency factor
    eHouseBaseSqm: 20,        // Base sqm per UPS frame
    eHouseBatterySqm: 5,      // Sqm per battery cabinet
  },
  
  // Cost factors
  costFactors: {
    installationPercentage: 0.15, // 15% of equipment costs
    engineeringPercentage: 0.10,  // 10% of equipment costs
    contingencyPercentage: 0.05,  // 5% additional contingency (optional)
  },
  
  // Cooling mode thresholds
  coolingThresholds: {
    airCooledMax: 75,         // Maximum kW/rack for air-cooled (higher requires DLC)
    recommendedDlcMin: 75,    // Recommended minimum kW/rack for DLC
  }
};

export const DEFAULT_PRICING = {
  // Electrical components
  busbar: {
    base1250A: 12500,
    base2000A: 18000,
    perMeter: 1200,
    copperPremium: 2500,
    busbar800A: 9000,
    busbar1000A: 11000,
    busbar1600A: 15000
  },
  tapOffBox: {
    standard63A: 800,
    custom100A: 1200,
    custom150A: 1500,
    custom200A: 1800,
    custom250A: 2200
  },
  rpdu: {
    standard16A: 450,
    standard32A: 650,
    standard80A: 1200,
    standard112A: 1800
  },
  
  // Cooling components
  rdhx: {
    basic: 45000,
    standard: 65000,
    highDensity: 85000,
    average: 65000
  },
  piping: {
    dn110PerMeter: 350,
    dn160PerMeter: 550,
    valveDn110: 1200,
    valveDn160: 1800,
  },
  cooler: {
    tcs310aXht: 85000,
    grundfosPump: 12000,
    bufferTank: 8000,
    immersionTank: 120000,
    immersionCDU: 85000
  },
  
  // Power components
  ups: {
    frame2Module: 45000,
    frame4Module: 65000,
    frame6Module: 85000,
    module250kw: 35000
  },
  battery: {
    revoTp240Cabinet: 75000
  },
  
  // Infrastructure
  generator: {
    generator1000kva: 250000,
    generator2000kva: 450000,
    generator3000kva: 650000,
    fuelTankPerLiter: 2
  },
  eHouse: {
    base: 85000,
    perSqMeter: 3500
  },
  sustainability: {
    heatRecoverySystem: 120000,
    waterRecyclingSystem: 85000,
    solarPanelPerKw: 1200
  }
};

export const RELATIVE_COSTS = {
  'air-cooled-50': '100% (Baseline)',
  'air-cooled-75': '140%',
  'dlc-75': '145%',
  'dlc-100': '170%',
  'dlc-150': '225%'
};

export const CLIMATE_ZONES = {
  TROPICAL: {
    name: 'Tropical',
    coolingFactor: 1.2,
    humidityFactor: 1.15
  },
  ARID: {
    name: 'Arid',
    coolingFactor: 1.15,
    humidityFactor: 0.9
  },
  TEMPERATE: {
    name: 'Temperate',
    coolingFactor: 1.0,
    humidityFactor: 1.0
  },
  CONTINENTAL: {
    name: 'Continental',
    coolingFactor: 0.95,
    humidityFactor: 0.95
  },
  POLAR: {
    name: 'Polar',
    coolingFactor: 0.9,
    humidityFactor: 0.9
  }
};
