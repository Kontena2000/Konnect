
// IEEE 493/1584 Constants
export const IEEE_CONSTANTS = {
  ARC_FLASH: {
    INCIDENT_ENERGY_FACTOR: 1.5,
    DISTANCE_FACTOR: 610,
    TIME_FACTOR: 2
  },
  FAULT_CURRENT: {
    IMPEDANCE_FACTOR: 1.732,
    VOLTAGE_FACTOR: 1.05
  }
};

// ASHRAE Standards
export const ASHRAE_CONSTANTS = {
  SAFETY_MARGIN: 1.2,
  RECOMMENDED_TEMPERATURE: {
    MIN: 18,
    MAX: 27
  },
  RECOMMENDED_HUMIDITY: {
    MIN: 20,
    MAX: 80
  },
  HEAT_DENSITY_LIMITS: {
    LOW: 4,
    MEDIUM: 8,
    HIGH: 12
  }
};

// Economic Constants
export const ECONOMIC_CONSTANTS = {
  INFLATION_RATE: 0.02,
  DISCOUNT_RATE: 0.08,
  ENERGY_PRICE_ESCALATION: 0.03,
  MAINTENANCE_FACTOR: 0.1
};

// Unit Conversion Factors
export const CONVERSION_FACTORS = {
  TEMPERATURE: {
    C_TO_F: (c: number) => (c * 9/5) + 32,
    F_TO_C: (f: number) => (f - 32) * 5/9
  },
  POWER: {
    KW_TO_BTU: (kw: number) => kw * 3412.142,
    BTU_TO_KW: (btu: number) => btu / 3412.142
  },
  LENGTH: {
    M_TO_FT: (m: number) => m * 3.28084,
    FT_TO_M: (ft: number) => ft / 3.28084
  },
  FLOW: {
    LPS_TO_GPM: (lps: number) => lps * 15.8503,
    GPM_TO_LPS: (gpm: number) => gpm / 15.8503
  }
};

// Cable Properties
export const CABLE_PROPERTIES = {
  COPPER: {
    RESISTIVITY: 1.724e-8,
    TEMPERATURE_COEFFICIENT: 0.00393,
    THERMAL_CONDUCTIVITY: 401
  },
  ALUMINUM: {
    RESISTIVITY: 2.82e-8,
    TEMPERATURE_COEFFICIENT: 0.00403,
    THERMAL_CONDUCTIVITY: 237
  }
};

// Connection Types
export const CONNECTION_TYPES = {
  POWER: {
    PRIMARY: {
      voltage: 480,
      phases: 3,
      wireCount: 4
    },
    UPS_TO_PDU: {
      voltage: 208,
      phases: 3,
      wireCount: 4
    },
    PDU_TO_RACK: {
      voltage: 120,
      phases: 1,
      wireCount: 3
    }
  },
  COOLING: {
    CHILLED_WATER: {
      supplyTemp: 7,
      returnTemp: 13,
      pressureDrop: 30
    },
    VRF: {
      minTemp: -5,
      maxTemp: 43,
      cop: 3.5
    }
  },
  NETWORK: {
    FIBER: {
      bandwidth: "100G",
      maxLength: 10000
    },
    COPPER: {
      bandwidth: "10G",
      maxLength: 100
    }
  }
};

// Performance Thresholds
export const PERFORMANCE_THRESHOLDS = {
  CALCULATION_TIME_WARNING: 1000,
  MEMORY_USAGE_WARNING: 90,
  CACHE_SIZE_LIMIT: 1000,
  BATCH_SIZE: 100
};
