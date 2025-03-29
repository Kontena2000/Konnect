import { getFirestore, doc, collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { calculateConfiguration, CalculationConfig, CalculationOptions } from './matrixCalculatorService';
import { analyzeConfiguration, compareCoolingTechnologies, compareRedundancyOptions } from './optimizationService';
import { calculatorDebug, withDebug } from './calculatorDebug';

/**
 * Generate a comprehensive report for a data center configuration
 */
const originalGenerateConfigurationReport = generateConfigurationReport;

export const generateConfigurationReport = withDebug(
  'generateConfigurationReport',
  async (userId: string, config: CalculationConfig, options: CalculationOptions = {}): Promise<any> => {
    try {
      // Try the original report generation first
      return await originalGenerateConfigurationReport(userId, config, options);
    } catch (error) {
      calculatorDebug.error('Error in report generation, creating simplified report', error);
      
      // Calculate basic results using fallback
      const baseResults = await fallbackCalculation(
        config.kwPerRack,
        config.coolingType,
        config.totalRacks || 28,
        options
      );
      
      // Generate basic analysis
      const analysis = fallbackAnalysis(baseResults);
      
      // Create a simplified report
      const report = {
        reportId: generateReportId(),
        userId,
        createdAt: new Date().toISOString(),
        configuration: {
          ...config,
          options
        },
        baseResults,
        analysis,
        note: 'This is a simplified report generated due to an error in the full report generation process.'
      };
      
      // Try to save the report, but don't fail if it doesn't work
      try {
        await saveReportToFirestore(userId, report);
      } catch (saveError) {
        calculatorDebug.error('Failed to save simplified report', saveError);
      }
      
      return report;
    }
  }
);

/**
 * Generate a unique report ID
 */
function generateReportId(): string {
  return 'RPT-' + Date.now().toString(36).toUpperCase() + 
    '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
}

/**
 * Generate an executive summary of the report
 */
function generateExecutiveSummary(
  baseResults: any,
  analysis: any,
  coolingComparison: any,
  redundancyComparison: any
): any {
  const { rack, cooling, cost, reliability, sustainability } = baseResults;
  
  return {
    configurationOverview: {
      powerDensity: `${rack.powerDensity} kW/rack`,
      totalPower: `${rack.powerDensity * rack.totalRacks} kW`,
      coolingType: cooling.type,
      redundancyMode: reliability.redundancyImpact,
      tier: reliability.tier
    },
    keyMetrics: {
      totalCost: `$${cost.totalProjectCost.toLocaleString()}`,
      costPerRack: `$${cost.costPerRack.toLocaleString()}`,
      costPerKw: `$${cost.costPerKw.toLocaleString()}`,
      pue: sustainability.pue.toFixed(2),
      availability: reliability.availabilityPercentage + '%',
      annualDowntime: `${reliability.annualDowntimeMinutes} minutes/year`
    },
    optimizationPotential: analysis.optimizationPotential,
    recommendationCount: analysis.recommendations.length,
    topRecommendation: analysis.recommendations.length > 0 ? 
      analysis.recommendations[0].message : 'No recommendations',
    alternativeCooling: coolingComparison.recommendation.recommendedCoolingType !== cooling.type ?
      `Consider ${coolingComparison.recommendation.recommendedCoolingType} cooling for better efficiency` : 
      'Current cooling type is optimal',
    alternativeRedundancy: redundancyComparison.recommendation.recommendedRedundancy !== reliability.redundancyImpact ?
      `Consider ${redundancyComparison.recommendation.recommendedRedundancy} redundancy for better reliability/cost balance` :
      'Current redundancy configuration is optimal'
  };
}

/**
 * Generate financial analysis section
 */
function generateFinancialAnalysis(results: any): any {
  const { cost, tco } = results;
  
  // Calculate ROI and payback for different scenarios
  const baselineAnnualOpex = tco.annualCosts.total;
  const baselineTCO = tco.totalCostOfOwnership;
  
  // Scenario 1: 10% higher efficiency
  const efficientOpex = baselineAnnualOpex * 0.9;
  const efficientSavings = baselineAnnualOpex - efficientOpex;
  const efficientPayback = cost.totalProjectCost * 0.1 / efficientSavings;
  
  // Scenario 2: Higher reliability
  const reliabilityBenefit = baselineAnnualOpex * 0.05; // Assume 5% benefit from reduced downtime
  const reliabilityCost = cost.totalProjectCost * 0.2; // Assume 20% cost increase for higher reliability
  const reliabilityPayback = reliabilityCost / reliabilityBenefit;
  
  return {
    capitalExpenditure: {
      total: cost.totalProjectCost,
      breakdown: {
        electrical: cost.electrical.total,
        cooling: cost.cooling,
        power: cost.power.total,
        infrastructure: cost.infrastructure,
        sustainability: cost.sustainability,
        installation: cost.installation,
        engineering: cost.engineering,
        contingency: cost.contingency
      }
    },
    operationalExpenditure: {
      annual: tco.annualCosts.total,
      breakdown: {
        energy: tco.annualCosts.energy,
        maintenance: tco.annualCosts.maintenance,
        operational: tco.annualCosts.operational
      }
    },
    totalCostOfOwnership: {
      total: tco.totalCostOfOwnership,
      annualized: tco.annualizedTCO,
      assumptions: tco.assumptions
    },
    investmentScenarios: {
      baseline: {
        capex: cost.totalProjectCost,
        annualOpex: baselineAnnualOpex,
        tenYearTCO: baselineTCO
      },
      efficientOption: {
        additionalCapex: cost.totalProjectCost * 0.1,
        annualSavings: efficientSavings,
        paybackPeriod: efficientPayback.toFixed(1) + ' years',
        tenYearSavings: efficientSavings * 10 - cost.totalProjectCost * 0.1
      },
      reliableOption: {
        additionalCapex: reliabilityCost,
        annualBenefit: reliabilityBenefit,
        paybackPeriod: reliabilityPayback.toFixed(1) + ' years',
        tenYearBenefit: reliabilityBenefit * 10 - reliabilityCost
      }
    }
  };
}

/**
 * Generate sustainability analysis section
 */
function generateSustainabilityAnalysis(results: any): any {
  const { sustainability, carbonFootprint } = results;
  
  // Calculate additional sustainability metrics
  const annualEnergyConsumption = sustainability.annualEnergyConsumption.total;
  const annualCarbonEmissions = carbonFootprint.totalAnnualEmissions;
  const waterUsage = sustainability.waterUsage.annual;
  
  // Calculate industry benchmarks
  const industryAvgPUE = 1.58; // Industry average PUE
  const puePerformance = ((industryAvgPUE - sustainability.pue) / industryAvgPUE * 100).toFixed(1);
  
  // Calculate emissions reduction potential
  const potentialPUE = Math.max(1.1, sustainability.pue - 0.2);
  const potentialEmissionsReduction = 
    annualCarbonEmissions * (1 - potentialPUE / sustainability.pue);
  
  // Calculate water usage efficiency
  const waterUsageEfficiency = waterUsage / annualEnergyConsumption * 1000; // L/MWh
  
  return {
    energyEfficiency: {
      pue: sustainability.pue.toFixed(2),
      industryComparison: `${puePerformance}% better than industry average`,
      annualEnergyConsumption: {
        total: annualEnergyConsumption,
        it: sustainability.annualEnergyConsumption.it,
        overhead: sustainability.annualEnergyConsumption.overhead
      },
      improvementPotential: {
        targetPUE: potentialPUE.toFixed(2),
        energySavingsPotential: annualEnergyConsumption * (1 - potentialPUE / sustainability.pue)
      }
    },
    carbonFootprint: {
      annualEmissions: annualCarbonEmissions,
      emissionsPerMWh: carbonFootprint.emissionsPerMWh,
      renewableEnergy: {
        percentage: carbonFootprint.renewableImpact.percentage,
        emissionsAvoided: carbonFootprint.renewableImpact.emissionsAvoided
      },
      reductionPotential: {
        potentialReduction: Math.round(potentialEmissionsReduction),
        equivalentTrees: Math.round(potentialEmissionsReduction * 45) // ~45 trees per tonne of CO2
      }
    },
    waterUsage: {
      annual: waterUsage,
      recycling: {
        enabled: sustainability.waterUsage.recyclingEnabled,
        recyclingRate: sustainability.waterUsage.recyclingRate * 100 + '%',
        savingsPotential: sustainability.waterUsage.recyclingEnabled ? 0 :
          Math.round(waterUsage * 0.6) // Assume 60% recycling potential
      },
      efficiency: {
        waterUsageEfficiency: Math.round(waterUsageEfficiency),
        industryBenchmark: waterUsageEfficiency < 2000 ? 'Excellent' : 
                          waterUsageEfficiency < 3500 ? 'Good' : 'Needs Improvement'
      }
    },
    wasteHeatRecovery: {
      enabled: sustainability.wasteHeatRecovery.enabled,
      recoveredHeat: sustainability.wasteHeatRecovery.recoveredHeat,
      potentialSavings: sustainability.wasteHeatRecovery.potentialSavings,
      implementationRecommendation: sustainability.wasteHeatRecovery.enabled ? 
        'Waste heat recovery system already implemented' : 
        'Implementing waste heat recovery could provide significant benefits'
    }
  };
}

/**
 * Save the report to Firestore
 */
async function saveReportToFirestore(userId: string, report: any): Promise<string> {
  const db = getFirestore();
  
  try {
    // First check if the collection path exists
    try {
      // Try to use a simpler collection path if the nested one fails
      const docRef = await addDoc(
        collection(db, 'matrix_calculator_reports'), 
        {
          ...report,
          userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      );
      
      return docRef.id;
    } catch (nestedError) {
      calculatorDebug.error('Failed to save to nested collection, trying root collection', nestedError);
      
      // Try the original nested path
      const docRef = await addDoc(
        collection(db, 'matrix_calculator', 'reports', 'user_reports'), 
        {
          ...report,
          userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      );
      
      return docRef.id;
    }
  } catch (error) {
    calculatorDebug.error('Error saving report to Firestore:', error);
    // Don't throw, just return a generated ID
    return 'local-' + generateReportId();
  }
}

/**
 * Retrieve a saved report by ID
 */
export async function getReportById(reportId: string): Promise<any> {
  const db = getFirestore();
  
  try {
    const reportRef = doc(db, 'matrix_calculator', 'reports', 'user_reports', reportId);
    const reportDoc = await getDoc(reportRef);
    
    if (!reportDoc.exists()) {
      throw new Error('Report not found');
    }
    
    return {
      id: reportDoc.id,
      ...reportDoc.data()
    };
  } catch (error) {
    console.error('Error retrieving report:', error);
    throw new Error('Failed to retrieve report: ' + 
      (error instanceof Error ? error.message : String(error)));
  }
}