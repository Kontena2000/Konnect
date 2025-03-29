import { CalculationConfig, CalculationOptions } from './matrixCalculatorService';
import { calculatorDebug } from './calculatorDebug';

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
  const redundancyFactor = options.redundancy === 'n+1' ? 1.2 : 
                          options.redundancy === '2n' ? 2 : 1;
  
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
  const availabilityPercentage = options.redundancy === '2n' ? 99.999 :
                                options.redundancy === 'n+1' ? 99.99 : 99.9;
  const annualDowntimeMinutes = (100 - availabilityPercentage) / 100 * 365 * 24 * 60;
  
  // Return a simplified result structure
  return {
    rack: {
      powerDensity: kwPerRack,
      totalRacks: totalRacks,
      totalITLoad: totalITLoad
    },
    cooling: {
      type: coolingType,
      efficiency: coolingEfficiency,
      load: coolingLoad
    },
    power: {
      totalFacilityLoad: totalFacilityLoad,
      redundancy: options.redundancy || 'n',
      powerFactor: powerFactor
    },
    cost: {
      totalProjectCost: totalProjectCost,
      costPerRack: costPerRack,
      costPerKw: costPerKw,
      electrical: { total: totalProjectCost * 0.4 },
      cooling: totalProjectCost * 0.3,
      power: { total: totalProjectCost * 0.2 },
      infrastructure: totalProjectCost * 0.05,
      sustainability: totalProjectCost * 0.02,
      installation: totalProjectCost * 0.01,
      engineering: totalProjectCost * 0.01,
      contingency: totalProjectCost * 0.01
    },
    reliability: {
      tier: options.redundancy === '2n' ? 'IV' : 
            options.redundancy === 'n+1' ? 'III' : 'II',
      availabilityPercentage: availabilityPercentage,
      annualDowntimeMinutes: annualDowntimeMinutes,
      redundancyImpact: options.redundancy || 'n'
    },
    sustainability: {
      pue: pue,
      annualEnergyConsumption: {
        total: totalFacilityLoad * 8760, // kWh per year
        it: totalITLoad * 8760,
        overhead: (totalFacilityLoad - totalITLoad) * 8760
      },
      waterUsage: {
        annual: coolingType === 'water' ? totalITLoad * 2000 : totalITLoad * 500, // Liters per year
        recyclingEnabled: false,
        recyclingRate: 0
      },
      wasteHeatRecovery: {
        enabled: false,
        recoveredHeat: 0,
        potentialSavings: totalITLoad * 0.2 * 8760 * 0.15 // 20% recoverable, $0.15/kWh
      }
    },
    carbonFootprint: {
      totalAnnualEmissions: totalFacilityLoad * 8760 * 0.5, // 0.5 kg CO2 per kWh
      emissionsPerMWh: 500, // kg CO2 per MWh
      renewableImpact: {
        percentage: 0,
        emissionsAvoided: 0
      }
    },
    tco: {
      annualCosts: {
        energy: totalFacilityLoad * 8760 * 0.15, // $0.15/kWh
        maintenance: totalProjectCost * 0.03, // 3% of capex per year
        operational: totalProjectCost * 0.02, // 2% of capex per year
        total: totalFacilityLoad * 8760 * 0.15 + totalProjectCost * 0.05
      },
      totalCostOfOwnership: totalProjectCost + (totalFacilityLoad * 8760 * 0.15 + totalProjectCost * 0.05) * 10, // 10 year TCO
      annualizedTCO: totalProjectCost / 10 + (totalFacilityLoad * 8760 * 0.15 + totalProjectCost * 0.05),
      assumptions: {
        energyCost: 0.15, // $/kWh
        maintenanceRate: 0.03, // 3% of capex
        operationalRate: 0.02, // 2% of capex
        lifespan: 10 // years
      }
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
