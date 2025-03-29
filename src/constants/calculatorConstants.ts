
export const DEFAULT_CALCULATION_PARAMS = {
  // Electrical parameters
  electrical: {
    voltageFactor: 400,       // Voltage (V)
    powerFactor: 0.9,         // Power factor
    busbarsPerRow: 1,         // Default number of busbars per row
    redundancyMode: 'N+1',    // Redundancy mode: 'N', 'N+1', '2N'
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
    base1250A: 42000,
    base2000A: 65000,
    perMeter: 1200,
    copperPremium: 1.0,
  },
  tapOffBox: {
    standard63A: 1200,
    custom100A: 1500,
    custom150A: 1800,
    custom200A: 2100,
    custom250A: 2400,
  },
  rpdu: {
    standard80A: 3500,
    standard112A: 4200,
  },
  
  // Cooling components
  rdhx: {
    average: 8000,
    highEnd: 12000,
  },
  piping: {
    dn110PerMeter: 350,
    dn160PerMeter: 520,
    valveDn110: 1200,
    valveDn160: 1800,
  },
  cooler: {
    tcs310aXht: 75000,
    grundfosPump: 15000,
    bufferTank: 8000,
  },
  
  // Power components
  ups: {
    frame1000kw: 85000,
    frame1500kw: 110000,
    frame2000kw: 130000,
    module250kw: 45000,
  },
  battery: {
    revoTp240Cabinet: 35000,
  },
  
  // Infrastructure
  eHouse: {
    base: 120000,
    perSqMeter: 5000,
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
