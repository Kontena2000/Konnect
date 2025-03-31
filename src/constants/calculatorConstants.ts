export const DEFAULT_CALCULATION_PARAMS = {
  // Electrical parameters
  electrical: {
    voltageFactor: 400,       // Voltage (V)
    powerFactor: 0.9,         // Power factor
    busbarsPerRow: 1,         // Default number of busbars per row
    redundancyMode: "N+1" as "N" | "N+1" | "2N",    // Redundancy mode: 'N', 'N+1', '2N'
    volts: 400,
    phases: 3,
  },
  
  // Cooling parameters
  cooling: {
    deltaT: 10,               // Temperature delta (°C)
    flowRateFactor: 2.22,     // L/min/kW at delta T of 7°C
    dlcResidualHeatFraction: 0.25, // DLC residual heat fraction
    chillerEfficiencyFactor: 1.0,  // Chiller efficiency multiplier
    airCoolingEfficiency: 0.85,
    dlcEfficiency: 0.95,
    hybridEfficiency: 0.9,
    immersionEfficiency: 0.98,
  },
  
  // UPS and power parameters
  power: {
    upsModuleSize: 250,       // UPS module size (kW)
    upsFrameMaxModules: 8,    // Maximum modules per UPS frame
    batteryRuntime: 5,        // Battery runtime in minutes
    batteryEfficiency: 0.95,  // Battery efficiency factor
    eHouseBaseSqm: 20,        // Base sqm per UPS frame
    eHouseBatterySqm: 5,      // Sqm per battery cabinet
    upsEfficiency: 0.97,
    generatorEfficiency: 0.85,
  },
  
  // Cost factors
  costFactors: {
    installationPercentage: 0.15, // 15% of equipment costs
    engineeringPercentage: 0.10,  // 10% of equipment costs
    contingencyPercentage: 0.05,  // 5% additional contingency (optional)
    electricityCostPerKwh: 0.15,
    maintenancePercentageOfCapex: 0.03,
    inflationRate: 0.02,
  },
  
  // Cooling mode thresholds
  coolingThresholds: {
    airCooledMax: 75,         // Maximum kW/rack for air-cooled (higher requires DLC)
    recommendedDlcMin: 75,    // Recommended minimum kW/rack for DLC
  },
  
  sustainability: {
    co2PerKwh: 0.4, // kg CO2 per kWh
    waterUsagePerMwh: 2.5, // m³ per MWh
    generatorCo2PerLiter: 2.68 // kg CO2 per liter of diesel
  }
};

export const DEFAULT_PRICING = {
  // Electrical components
  busbar: {
    base1250A: 12500,
    base2000A: 18000,
    busbar800A: 25000,
    busbar1000A: 30000,
    busbar1200A: 35000,
    busbar1600A: 45000,
    busbar2000A: 55000,
    perMeter: 1200,
    copperPremium: 2500,
  },
  tapOffBox: {
    standard63A: 1200,
    custom100A: 1500,
    custom150A: 1500,
    custom200A: 1800,
    custom250A: 2500,
  },
  rpdu: {
    standard16A: 800,
    standard32A: 1200,
    monitored16A: 1500,
    monitored32A: 2000,
    switched16A: 2500,
    switched32A: 3000,
  },
  
  // Cooling components
  rdhx: {
    basic: 50000,
    standard: 75000,
    highDensity: 100000,
    average: 75000,
  },
  piping: {
    dn110PerMeter: 250,
    dn160PerMeter: 350,
    valveDn110: 1500,
    valveDn160: 2000,
  },
  cooler: {
    tcs310aXht: 150000,
    grundfosPump: 25000,
    bufferTank: 15000,
    immersionTank: 75000,
    immersionCDU: 120000,
  },
  
  // Power components
  ups: {
    frame2Module: 50000,
    frame4Module: 75000,
    frame6Module: 100000,
    module250kw: 25000,
  },
  battery: {
    revoTp240Cabinet: 75000,
  },
  
  // Infrastructure
  generator: {
    generator1000kva: 250000,
    generator2000kva: 400000,
    generator3000kva: 550000,
    fuelTankPerLiter: 2,
  },
  eHouse: {
    base: 100000,
    perSqMeter: 2500,
  },
  sustainability: {
    heatRecoverySystem: 75000,
    waterRecyclingSystem: 50000,
    solarPanelPerKw: 1500,
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