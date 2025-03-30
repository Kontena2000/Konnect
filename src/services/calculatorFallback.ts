import { CalculationConfig, CalculationOptions } from './matrixCalculatorService';
import { calculatorDebug } from './calculatorDebug';

interface FallbackConfig {
  kwPerRack: number;
  coolingType: string;
  totalRacks: number;
  options?: CalculationOptions;
}

/**
 * Fallback calculation function when main calculator fails
 * This provides basic results to ensure the UI can display something
 */
export async function fallbackCalculation(
  kwPerRack: number,
  coolingType: string,
  totalRacks: number,
  options: CalculationOptions = {}
): Promise<any> {
  calculatorDebug.log('Using fallback calculation', { kwPerRack, coolingType, totalRacks });
  
  // Basic calculation constants
  const powerFactor = 0.9;
  const coolingEfficiency = coolingType === 'air' ? 0.7 : 0.85;
  const redundancyFactor = options.redundancyMode === 'N+1' ? 1.2 : 
                          options.redundancyMode === '2N' ? 2 : 1;
  
  // Calculate total IT load
  const totalITLoad = kwPerRack * totalRacks;
  
  // Calculate cooling load
  const coolingLoad = totalITLoad / coolingEfficiency;
  
  // Calculate total facility load with redundancy
  const totalFacilityLoad = (totalITLoad + coolingLoad) * redundancyFactor;
  
  // Calculate PUE
  const pue = totalFacilityLoad / totalITLoad;
  
  // Calculate costs
  const costPerKw = 10000; // $10,000 per kW as a baseline
  const totalProjectCost = totalFacilityLoad * costPerKw;
  const costPerRack = totalProjectCost / totalRacks;
  
  // Calculate reliability metrics
  const availabilityPercentage = options.redundancyMode === '2N' ? 99.999 :
                                options.redundancyMode === 'N+1' ? 99.99 : 99.9;
  const annualDowntimeMinutes = (100 - availabilityPercentage) / 100 * 365 * 24 * 60;
  
  // Determine cooling-specific properties
  let coolingDetails = {};
  
  switch (coolingType.toLowerCase()) {
    case 'dlc':
      coolingDetails = {
        type: 'dlc',
        totalCapacity: totalITLoad * 1.1,
        dlcCoolingCapacity: totalITLoad * 0.75,
        residualCoolingCapacity: totalITLoad * 0.25,
        dlcFlowRate: totalITLoad * 0.75 * 0.25, // 0.25 L/min per kW
        pipingSize: 'dn110'
      };
      break;
    case 'hybrid':
      coolingDetails = {
        type: 'hybrid',
        totalCapacity: totalITLoad * 1.1,
        dlcPortion: totalITLoad * 0.6,
        airPortion: totalITLoad * 0.4,
        dlcFlowRate: totalITLoad * 0.6 * 0.25, // 0.25 L/min per kW
        rdhxUnits: Math.ceil(totalITLoad * 0.4 / 150),
        rdhxModel: 'average',
        pipingSize: 'dn110'
      };
      break;
    case 'immersion':
      coolingDetails = {
        type: 'immersion',
        totalCapacity: totalITLoad * 1.05,
        tanksNeeded: Math.ceil(totalRacks / 4),
        flowRate: totalITLoad * 1.05 * 0.25 * 0.8, // 0.25 L/min per kW, 80% of heat removed by fluid
        pipingSize: 'dn110'
      };
      break;
    default: // air-cooled
      coolingDetails = {
        type: 'air',
        totalCapacity: totalITLoad * 1.1,
        rdhxUnits: Math.ceil(totalITLoad * 1.1 / 150),
        rdhxModel: kwPerRack <= 15 ? 'basic' : kwPerRack <= 30 ? 'standard' : 'highDensity',
        pipingSize: 'none'
      };
  }
  
  // Return a simplified result structure
  return {
    rack: {
      powerDensity: kwPerRack,
      coolingType: coolingType,
      totalRacks: totalRacks,
      totalITLoad: totalITLoad
    },
    cooling: {
      ...coolingDetails,
      efficiency: coolingEfficiency,
      load: coolingLoad,
      pue: pue
    },
    electrical: {
      currentPerRow: Math.round(totalITLoad * 14 * 1000 / (400 * Math.sqrt(3) * powerFactor)),
      busbarSize: 'busbar800A',
      currentPerRack: Math.round(kwPerRack * 1000 / (400 * Math.sqrt(3) * powerFactor)),
      tapOffBox: 'standard63A',
      rpdu: 'standard16A',
      multiplicityWarning: ''
    },
    power: {
      ups: {
        totalITLoad: totalITLoad,
        redundancyFactor: redundancyFactor,
        requiredCapacity: totalITLoad * redundancyFactor,
        moduleSize: 250,
        totalModulesNeeded: Math.ceil(totalITLoad * redundancyFactor / 250),
        redundantModules: Math.ceil(totalITLoad * redundancyFactor / 250),
        framesNeeded: Math.ceil(Math.ceil(totalITLoad * redundancyFactor / 250) / 6),
        frameSize: Math.ceil(totalITLoad * redundancyFactor / 250) <= 2 ? 'frame2Module' :
                  Math.ceil(totalITLoad * redundancyFactor / 250) <= 4 ? 'frame4Module' : 'frame6Module',
        redundancyMode: options.redundancyMode || 'N+1'
      },
      battery: {
        runtime: options.batteryRuntime || 10,
        runtimeMinutes: options.batteryRuntime || 10,
        energyNeeded: Math.round(totalITLoad * (options.batteryRuntime || 10) / 60),
        energyRequired: Math.round(totalITLoad * (options.batteryRuntime || 10) / 60),
        cabinetsNeeded: Math.ceil(Math.round(totalITLoad * (options.batteryRuntime || 10) / 60) / 40),
        totalWeight: Math.ceil(Math.round(totalITLoad * (options.batteryRuntime || 10) / 60) / 40) * 1200
      },
      generator: {
        included: options.includeGenerator || false,
        capacity: options.includeGenerator ? Math.ceil(totalITLoad * redundancyFactor * 1.25 / 800) * 800 : 0,
        model: options.includeGenerator ? 
          (Math.ceil(totalITLoad * redundancyFactor * 1.25 / 800) * 800 <= 1000 ? '1000kVA' : 
           Math.ceil(totalITLoad * redundancyFactor * 1.25 / 800) * 800 <= 2000 ? '2000kVA' : '3000kVA') : 'none',
        fuel: {
          tankSize: options.includeGenerator ? Math.ceil(totalITLoad * redundancyFactor * 1.25 / 800) * 800 * 0.2 * 8 : 0,
          consumption: options.includeGenerator ? Math.ceil(totalITLoad * redundancyFactor * 1.25 / 800) * 800 * 0.2 : 0,
          runtime: options.includeGenerator ? 8 : 0
        }
      },
      totalFacilityLoad: totalFacilityLoad,
      powerFactor: powerFactor
    },
    cost: {
      totalProjectCost: totalProjectCost,
      costPerRack: costPerRack,
      costPerKw: costPerKw,
      electrical: { 
        busbar: totalProjectCost * 0.1, 
        tapOffBox: totalProjectCost * 0.1, 
        rpdu: totalProjectCost * 0.1, 
        total: totalProjectCost * 0.3 
      },
      cooling: totalProjectCost * 0.3,
      power: { 
        ups: totalProjectCost * 0.1, 
        battery: totalProjectCost * 0.05, 
        generator: options.includeGenerator ? totalProjectCost * 0.05 : 0, 
        total: options.includeGenerator ? totalProjectCost * 0.2 : totalProjectCost * 0.15 
      },
      infrastructure: totalProjectCost * 0.05,
      sustainability: totalProjectCost * 0.02,
      equipmentTotal: totalProjectCost * 0.8,
      installation: totalProjectCost * 0.1,
      engineering: totalProjectCost * 0.05,
      contingency: totalProjectCost * 0.05
    },
    reliability: {
      tier: options.redundancyMode === '2N' ? 'Tier IV' : 
            options.redundancyMode === 'N+1' ? 'Tier III' : 'Tier II',
      availabilityPercentage: availabilityPercentage.toString(),
      annualDowntimeMinutes: annualDowntimeMinutes,
      redundancyImpact: options.redundancyMode === '2N' ? 'Full redundancy (two complete systems)' :
                       options.redundancyMode === 'N+1' ? 'One redundant component' : 'No redundancy',
      mtbf: 8760,
      mttr: 4
    },
    sustainability: {
      pue: pue,
      wue: 0.5,
      annualEnergyConsumption: {
        it: totalITLoad * 8760,
        cooling: (totalFacilityLoad - totalITLoad) * 8760 * 0.7,
        power: (totalFacilityLoad - totalITLoad) * 8760 * 0.3,
        total: totalFacilityLoad * 8760,
        overhead: (totalFacilityLoad - totalITLoad) * 8760
      },
      waterUsage: {
        hourly: totalITLoad * (coolingType === 'dlc' ? 1.2 : coolingType === 'hybrid' ? 0.9 : coolingType === 'immersion' ? 0.3 : 0.5),
        annual: totalITLoad * (coolingType === 'dlc' ? 1.2 : coolingType === 'hybrid' ? 0.9 : coolingType === 'immersion' ? 0.3 : 0.5) * 24 * 365 / 1000,
        recyclingEnabled: options.sustainabilityOptions?.enableWaterRecycling || false,
        recyclingRate: options.sustainabilityOptions?.enableWaterRecycling ? 0.6 : 0
      },
      carbonFootprint: {
        annual: Math.round(totalFacilityLoad * 8760 * 0.35 * (1 - (options.sustainabilityOptions?.renewableEnergyPercentage || 20) / 100) / 1000),
        perKwh: 0.35 * (1 - (options.sustainabilityOptions?.renewableEnergyPercentage || 20) / 100),
        renewablePercentage: options.sustainabilityOptions?.renewableEnergyPercentage || 20
      },
      wasteHeatRecovery: {
        enabled: options.sustainabilityOptions?.enableWasteHeatRecovery || false,
        recoveredHeat: options.sustainabilityOptions?.enableWasteHeatRecovery ? Math.round(totalFacilityLoad * 8760 * 0.4) : 0,
        potentialSavings: options.sustainabilityOptions?.enableWasteHeatRecovery ? Math.round(totalFacilityLoad * 8760 * 0.4 * 0.05) : 0
      }
    },
    carbonFootprint: {
      totalAnnualEmissions: Math.round(totalFacilityLoad * 8760 * 0.35 * (1 - (options.sustainabilityOptions?.renewableEnergyPercentage || 20) / 100) / 1000),
      gridEmissions: Math.round(totalFacilityLoad * 8760 * 0.35 * (1 - (options.sustainabilityOptions?.renewableEnergyPercentage || 20) / 100) / 1000),
      generatorEmissions: options.includeGenerator ? Math.round(Math.ceil(totalITLoad * redundancyFactor * 1.25 / 800) * 800 * 24 * 0.8 * 0.8 / 1000) : 0,
      emissionsPerMWh: 350 * (1 - (options.sustainabilityOptions?.renewableEnergyPercentage || 20) / 100),
      renewableImpact: {
        percentage: options.sustainabilityOptions?.renewableEnergyPercentage || 20,
        emissionsAvoided: Math.round(totalFacilityLoad * 8760 * 0.35 * (options.sustainabilityOptions?.renewableEnergyPercentage || 20) / 100 / 1000)
      }
    },
    tco: {
      annualCosts: {
        energy: totalFacilityLoad * 8760 * 0.12,
        maintenance: totalProjectCost * 0.03,
        operational: totalProjectCost * 0.02,
        total: totalFacilityLoad * 8760 * 0.12 + totalProjectCost * 0.05
      },
      totalCostOfOwnership: totalProjectCost + (totalFacilityLoad * 8760 * 0.12 + totalProjectCost * 0.05) * 10,
      annualizedTCO: totalProjectCost / 10 + (totalFacilityLoad * 8760 * 0.12 + totalProjectCost * 0.05),
      assumptions: {
        electricityRate: 0.12,
        maintenanceRate: 0.03,
        operationalRate: 0.02,
        lifespan: 10
      },
      capex: totalProjectCost,
      opex: {
        energy: totalFacilityLoad * 8760 * 0.12,
        maintenance: totalProjectCost * 0.03,
        operational: totalProjectCost * 0.02
      },
      total5Year: totalProjectCost + (totalFacilityLoad * 8760 * 0.12 + totalProjectCost * 0.05) * 5,
      total10Year: totalProjectCost + (totalFacilityLoad * 8760 * 0.12 + totalProjectCost * 0.05) * 10
    }
  };
}

/**
 * Fallback analysis function
 */
export function fallbackAnalysis(results: any): any {
  return {
    optimizationPotential: 'Medium',
    recommendations: [
      {
        id: 'rec-1',
        message: 'Consider increasing rack density for better space utilization',
        impact: 'Medium',
        category: 'Efficiency'
      },
      {
        id: 'rec-2',
        message: 'Evaluate alternative cooling technologies for improved PUE',
        impact: 'High',
        category: 'Sustainability'
      },
      {
        id: 'rec-3',
        message: 'Implement waste heat recovery to reduce energy costs',
        impact: 'Medium',
        category: 'Cost'
      }
    ],
    efficiencyScore: 75,
    reliabilityScore: 80,
    costScore: 70,
    sustainabilityScore: 65,
    overallScore: 72
  };
}

/**
 * Fallback cooling comparison
 */
export async function fallbackCoolingComparison(
  kwPerRack: number,
  totalRacks: number
): Promise<any> {
  const totalITLoad = kwPerRack * totalRacks;
  
  return {
    comparisonId: 'cool-comp-' + Date.now(),
    baselineCooling: 'air',
    alternatives: [
      {
        type: 'water',
        pue: 1.25,
        capex: totalITLoad * 11000,
        annualOpex: totalITLoad * 8760 * 0.14,
        waterUsage: totalITLoad * 2000,
        spaceSavings: '15%'
      },
      {
        type: 'immersion',
        pue: 1.08,
        capex: totalITLoad * 14000,
        annualOpex: totalITLoad * 8760 * 0.12,
        waterUsage: totalITLoad * 100,
        spaceSavings: '40%'
      }
    ],
    recommendation: {
      recommendedCoolingType: 'immersion',
      reasonSummary: 'Best long-term TCO and sustainability profile',
      paybackPeriod: '3.5 years'
    }
  };
}

/**
 * Fallback redundancy comparison
 */
export async function fallbackRedundancyComparison(
  kwPerRack: number,
  coolingType: string,
  totalRacks: number
): Promise<any> {
  const totalITLoad = kwPerRack * totalRacks;
  
  return {
    comparisonId: 'red-comp-' + Date.now(),
    baselineRedundancy: 'n',
    alternatives: [
      {
        type: 'n+1',
        availability: '99.99%',
        annualDowntime: '52.6 minutes',
        capexIncrease: '20%',
        opexIncrease: '15%',
        tier: 'III'
      },
      {
        type: '2n',
        availability: '99.999%',
        annualDowntime: '5.3 minutes',
        capexIncrease: '100%',
        opexIncrease: '70%',
        tier: 'IV'
      }
    ],
    recommendation: {
      recommendedRedundancy: 'n+1',
      reasonSummary: 'Best balance of reliability and cost for most workloads',
      businessImpact: 'Minimal downtime for critical applications with reasonable cost increase'
    }
  };
}

const calculatorFallback = {
  /**
   * Get fallback results based on configuration
   */
  getResults(config: FallbackConfig) {
    const { kwPerRack, coolingType, totalRacks, options } = config;
    
    // Calculate total power
    const totalPower = kwPerRack * totalRacks;
    
    // Base costs per kW for different cooling types
    const baseCostPerKw = {
      air: 12000,
      dlc: 15000,
      hybrid: 14000,
      immersion: 18000
    };
    
    // Get the appropriate cost multiplier based on cooling type
    const costMultiplier = coolingType === 'air' ? 1 : 
                          coolingType === 'dlc' ? 1.25 : 
                          coolingType === 'hybrid' ? 1.15 : 
                          coolingType === 'immersion' ? 1.35 : 1;
    
    // Calculate base infrastructure cost
    const baseCost = totalPower * (baseCostPerKw[coolingType as keyof typeof baseCostPerKw] || 12000);
    
    // Apply redundancy multiplier if specified in options
    const redundancyMultiplier = 
      options?.redundancyMode === 'N+1' ? 1.2 :
      options?.redundancyMode === '2N' ? 1.8 :
      options?.redundancyMode === '2N+1' ? 2.0 : 1.0;
    
    // Apply generator cost if included
    const generatorCost = options?.includeGenerator ? totalPower * 500 : 0;
    
    // Calculate battery cost based on runtime
    const batteryCost = (options?.batteryRuntime || 10) * totalPower * 200;
    
    // Calculate total capital expenditure
    const capex = baseCost * redundancyMultiplier + generatorCost + batteryCost;
    
    // Calculate annual operational costs
    const annualPowerCost = totalPower * 8760 * 0.12; // $0.12 per kWh
    const annualCoolingCost = totalPower * 8760 * 0.04 * costMultiplier; // Cooling cost as a function of power
    const annualMaintenanceCost = capex * 0.05; // 5% of capex for maintenance
    
    // Apply sustainability adjustments if enabled
    const sustainabilityAdjustment = 
      (options?.sustainabilityOptions?.enableWasteHeatRecovery ? 0.05 : 0) +
      (options?.sustainabilityOptions?.enableWaterRecycling ? 0.03 : 0);
    
    const annualOpex = (annualPowerCost + annualCoolingCost + annualMaintenanceCost) * 
                      (1 - sustainabilityAdjustment);
    
    // Calculate 5-year TCO
    const tco5Year = capex + (annualOpex * 5);
    
    // Calculate PUE based on cooling type and sustainability options
    const basePue = 
      coolingType === 'air' ? 1.6 :
      coolingType === 'dlc' ? 1.2 :
      coolingType === 'hybrid' ? 1.3 :
      coolingType === 'immersion' ? 1.1 : 1.5;
    
    const pueAdjustment = 
      (options?.sustainabilityOptions?.enableWasteHeatRecovery ? 0.1 : 0) +
      (options?.sustainabilityOptions?.enableWaterRecycling ? 0.05 : 0);
    
    const pue = Math.max(1.03, basePue - pueAdjustment);
    
    // Calculate water usage
    const waterUsage = 
      coolingType === 'air' ? totalPower * 4 :
      coolingType === 'dlc' ? totalPower * 2 :
      coolingType === 'hybrid' ? totalPower * 3 :
      coolingType === 'immersion' ? totalPower * 1 : totalPower * 3;
    
    const adjustedWaterUsage = options?.sustainabilityOptions?.enableWaterRecycling ? 
                              waterUsage * 0.6 : waterUsage;
    
    // Calculate carbon footprint
    const renewablePercentage = options?.sustainabilityOptions?.renewableEnergyPercentage || 0;
    const carbonFootprint = totalPower * 8760 * (0.5 - (renewablePercentage / 200)); // tons of CO2 per year
    
    return {
      rack: {
        powerDensity: kwPerRack,
        coolingType: coolingType,
        totalRacks: totalRacks,
        totalPower: totalPower
      },
      costs: {
        capex: {
          total: capex,
          perRack: capex / totalRacks,
          perKw: capex / totalPower,
          breakdown: {
            infrastructure: baseCost * redundancyMultiplier,
            generator: generatorCost,
            battery: batteryCost
          }
        },
        opex: {
          annual: annualOpex,
          power: annualPowerCost,
          cooling: annualCoolingCost,
          maintenance: annualMaintenanceCost
        },
        tco: {
          annual: capex / 5 + annualOpex,
          total5Years: tco5Year,
          total10Years: capex + (annualOpex * 10)
        }
      },
      efficiency: {
        pue: pue,
        waterUsage: {
          annual: adjustedWaterUsage * 365, // liters per year
          recyclingEnabled: !!options?.sustainabilityOptions?.enableWaterRecycling
        }
      },
      sustainability: {
        carbonFootprint: {
          annual: carbonFootprint,
          renewablePercentage: renewablePercentage
        },
        wasteHeatRecovery: {
          enabled: !!options?.sustainabilityOptions?.enableWasteHeatRecovery,
          potentialSavings: options?.sustainabilityOptions?.enableWasteHeatRecovery ? 
                            annualPowerCost * 0.1 : 0
        }
      },
      reliability: {
        redundancyMode: options?.redundancyMode || 'N',
        redundancyImpact: `${options?.redundancyMode || 'N'} configuration provides ${
          options?.redundancyMode === 'N+1' ? 'basic component redundancy' :
          options?.redundancyMode === '2N' ? 'full system redundancy' :
          options?.redundancyMode === '2N+1' ? 'full system redundancy plus component redundancy' :
          'no redundancy'
        }`,
        batteryRuntime: options?.batteryRuntime || 10,
        generatorBackup: !!options?.includeGenerator
      },
      _meta: {
        calculationMethod: 'fallback',
        timestamp: Date.now(),
        disclaimer: 'These are estimated values based on fallback calculations and may not reflect actual costs or performance.'
      }
    };
  }
};

// Add a simple implementation for the getResults function if it doesn't exist
export const getResults = (config: any) => {
  const { kwPerRack, coolingType, totalRacks } = config;
  
  // Create a basic fallback result with the minimum required structure
  return {
    rack: {
      powerDensity: kwPerRack || 75,
      coolingType: coolingType || 'dlc',
      totalRacks: totalRacks || 28
    },
    electrical: {
      currentPerRow: kwPerRack * totalRacks * 2.5,
      busbarSize: 'busbar800A',
      currentPerRack: kwPerRack * 2.5,
      tapOffBox: 'standard63A',
      rpdu: 'standard16A'
    },
    cooling: {
      type: coolingType || 'dlc',
      totalCapacity: kwPerRack * totalRacks * 1.1,
      dlcCoolingCapacity: coolingType === 'dlc' ? kwPerRack * totalRacks * 0.8 : 0,
      residualCoolingCapacity: coolingType === 'dlc' ? kwPerRack * totalRacks * 0.3 : 0,
      dlcFlowRate: coolingType === 'dlc' ? kwPerRack * totalRacks * 0.25 : 0,
      pipingSize: 'dn110',
      pue: 1.2
    },
    power: {
      ups: {
        totalITLoad: kwPerRack * totalRacks,
        redundancyFactor: 1.2,
        requiredCapacity: kwPerRack * totalRacks * 1.2,
        moduleSize: 250,
        totalModulesNeeded: Math.ceil((kwPerRack * totalRacks * 1.2) / 250),
        redundantModules: Math.ceil((kwPerRack * totalRacks * 1.2) / 250),
        framesNeeded: Math.ceil(Math.ceil((kwPerRack * totalRacks * 1.2) / 250) / 6),
        frameSize: 'frame6Module'
      },
      battery: {
        runtime: 10,
        energyNeeded: Math.round((kwPerRack * totalRacks * 10) / 60),
        cabinetsNeeded: Math.ceil(Math.round((kwPerRack * totalRacks * 10) / 60) / 40),
        totalWeight: Math.ceil(Math.round((kwPerRack * totalRacks * 10) / 60) / 40) * 1200
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
      electrical: { 
        busbar: 50000, 
        tapOffBox: totalRacks * 2000, 
        rpdu: totalRacks * 1500, 
        total: 50000 + (totalRacks * 3500) 
      },
      cooling: coolingType === 'dlc' ? 150000 : 100000,
      power: { 
        ups: 200000, 
        battery: 100000, 
        generator: 0, 
        total: 300000 
      },
      infrastructure: 100000,
      sustainability: 0,
      equipmentTotal: 550000 + (totalRacks * 3500),
      installation: 100000,
      engineering: 50000,
      contingency: 70000,
      totalProjectCost: 770000 + (totalRacks * 3500),
      costPerRack: Math.round((770000 + (totalRacks * 3500)) / totalRacks),
      costPerKw: Math.round((770000 + (totalRacks * 3500)) / (kwPerRack * totalRacks))
    }
  };
};

export default calculatorFallback;