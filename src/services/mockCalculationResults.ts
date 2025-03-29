
/**
 * Mock calculation results for testing the calculator UI
 */
export const mockCalculationResults = {
  rack: {
    powerDensity: 150,
    coolingType: "dlc",
    totalRacks: 28
  },
  power: {
    totalITLoad: 4200,
    ups: {
      totalITLoad: 4200,
      requiredCapacity: 4620,
      moduleSize: 1100,
      redundantModules: 5,
      redundancyMode: "N+1",
      framesNeeded: 2
    },
    battery: {
      runtimeMinutes: 10,
      energyRequired: 770,
      cabinetsNeeded: 4
    },
    generator: {
      included: true,
      capacity: 5500
    }
  },
  cooling: {
    type: "dlc",
    totalCoolingCapacity: 4620,
    dlcCoolingCapacity: 3780,
    residualCoolingCapacity: 840,
    dlcFlowRate: 1890,
    pipingSize: "dn80",
    coolerModel: "DLC-4800",
    climateAdjustment: {
      factor: "1.0",
      note: "Standard climate zone with moderate temperature and humidity."
    }
  },
  electrical: {
    currentPerRow: 1050,
    busbarSize: 1200,
    currentPerRack: 150,
    tapOffBox: "highCapacity",
    rpdu: "managedPDU"
  },
  cost: {
    electrical: {
      busbar: 420000,
      tapOffBox: 168000,
      rpdu: 224000,
      total: 812000
    },
    cooling: 1680000,
    power: {
      ups: 1470000,
      battery: 560000,
      generator: 385000,
      total: 2415000
    },
    infrastructure: 718000,
    equipmentTotal: 5625000,
    installation: 843750,
    engineering: 562500,
    contingency: 0,
    totalProjectCost: 7031250,
    costPerRack: 251116,
    costPerKw: 1674
  },
  reliability: {
    redundancyImpact: "N+1 redundancy provides protection against single component failures.",
    availabilityPercentage: 99.95,
    mtbf: 87600,
    mttr: 4
  },
  sustainability: {
    wasteHeatRecovery: {
      enabled: false,
      potentialSavings: 0
    },
    waterUsage: {
      annualConsumption: 12600,
      recyclingEnabled: false
    },
    carbonFootprint: {
      annualEmissions: 18396,
      renewablePercentage: 20
    }
  },
  energy: {
    pue: 1.15,
    totalITLoad: 4200,
    totalFacilityPower: 4830,
    annualEnergyConsumption: 42310800,
    renewableEnergy: 8462160,
    annualCarbonEmissions: 18396,
    annualEnergyCost: 5077296,
    energyRates: {
      costPerKWh: 0.12
    }
  },
  location: {
    climateZone: "Temperate",
    avgTemperature: 18.5,
    humidity: 45
  }
};

/**
 * Function to get mock calculation results for testing
 */
export function getMockResults() {
  return { ...mockCalculationResults };
}
