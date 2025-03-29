import { CalculationParams, PricingMatrix, COOLING_TYPES } from './calculatorUtils';
import { calculateConfiguration, CalculationConfig, CalculationOptions } from './matrixCalculatorService';
import { memoize } from './calculationCache';
import { calculatorDebug, withDebug } from './calculatorDebug';
import { fallbackAnalysis, fallbackCoolingComparison, fallbackRedundancyComparison } from './calculatorFallback';

// Cache for optimization results
const optimizationCache = new Map<string, any>();

/**
 * Finds the optimal configuration based on user constraints and optimization goals
 */
export async function findOptimalConfiguration(
  constraints: {
    minPowerDensity?: number;
    maxPowerDensity?: number;
    preferredCoolingTypes?: string[];
    maxBudget?: number;
    minReliability?: number;
    maxPUE?: number;
    rackCountRange?: [number, number];
  },
  optimizationGoal: 'cost' | 'efficiency' | 'reliability' | 'sustainability' = 'cost'
) {
  // Generate cache key from constraints and goal
  const cacheKey = JSON.stringify({ constraints, optimizationGoal });
  
  // Check cache first
  if (optimizationCache.has(cacheKey)) {
    return optimizationCache.get(cacheKey);
  }
  
  // Define power density options to evaluate
  const powerDensityOptions = [50, 75, 100, 150, 200].filter(
    density => 
      (!constraints.minPowerDensity || density >= constraints.minPowerDensity) &&
      (!constraints.maxPowerDensity || density <= constraints.maxPowerDensity)
  );
  
  // Define cooling types to evaluate
  const coolingTypeOptions = ['air-cooled', 'dlc', 'hybrid', 'immersion'].filter(
    type => !constraints.preferredCoolingTypes || constraints.preferredCoolingTypes.includes(type)
  );
  
  // Define rack count options
  const minRacks = constraints.rackCountRange?.[0] || 14;
  const maxRacks = constraints.rackCountRange?.[1] || 56;
  const rackCountOptions = [minRacks, Math.floor((minRacks + maxRacks) / 2), maxRacks];
  
  // Generate all possible configurations to evaluate
  const configurationsToEvaluate: CalculationConfig[] = [];
  
  for (const kwPerRack of powerDensityOptions) {
    for (const coolingType of coolingTypeOptions) {
      for (const totalRacks of rackCountOptions) {
        configurationsToEvaluate.push({
          kwPerRack,
          coolingType,
          totalRacks
        });
      }
    }
  }
  
  // Calculate results for all configurations
  const results = await Promise.all(
    configurationsToEvaluate.map(async config => {
      try {
        const result = await calculateConfiguration(
          config.kwPerRack, 
          config.coolingType, 
          config.totalRacks
        );
        
        return {
          config,
          result,
          // Calculate score based on optimization goal
          score: calculateScore(result, optimizationGoal)
        };
      } catch (error) {
        console.error(`Error calculating configuration: ${config.kwPerRack}kW, ${config.coolingType}, ${config.totalRacks} racks`, error);
        return null;
      }
    })
  );
  
  // Filter out failed calculations and sort by score
  const validResults = results.filter(r => r !== null);
  validResults.sort((a, b) => b!.score - a!.score);
  
  // Get top 3 configurations
  const topConfigurations = validResults.slice(0, 3).map(r => ({
    config: r!.config,
    result: r!.result,
    score: r!.score
  }));
  
  // Add optimization summary
  const optimizationResult = {
    topConfigurations,
    recommendedConfiguration: topConfigurations[0],
    summary: generateOptimizationSummary(topConfigurations, optimizationGoal)
  };
  
  // Cache the result
  optimizationCache.set(cacheKey, optimizationResult);
  
  return optimizationResult;
}

/**
 * Calculate a score for a configuration based on the optimization goal
 */
function calculateScore(result: any, goal: string): number {
  if (!result) return 0;
  
  try {
    switch (goal) {
      case 'cost':
        // Lower cost is better
        return result.cost?.totalProjectCost ? 1000000 / result.cost.totalProjectCost : 0;
        
      case 'efficiency':
        // Lower PUE is better
        return result.sustainability?.pue ? 10 / result.sustainability.pue : 0;
        
      case 'reliability':
        // Higher availability is better
        return result.reliability?.availabilityPercentage ? 
          parseFloat(result.reliability.availabilityPercentage) : 0;
        
      case 'sustainability':
        // Calculate sustainability score based on multiple factors
        const pueScore = result.sustainability?.pue ? 10 / result.sustainability.pue : 0;
        const carbonScore = result.carbonFootprint?.totalAnnualEmissions ? 
          1000 / (result.carbonFootprint.totalAnnualEmissions + 1) : 0;
        const waterScore = result.sustainability?.waterUsage?.recyclingEnabled ? 2 : 1;
        return pueScore * 0.4 + carbonScore * 0.4 + waterScore * 0.2;
        
      default:
        return 0;
    }
  } catch (error) {
    console.error('Error calculating score:', error);
    return 0;
  }
}

/**
 * Generate a summary of the optimization results
 */
function generateOptimizationSummary(topConfigurations: any[], goal: string): any {
  const recommended = topConfigurations[0];
  
  switch (goal) {
    case 'cost':
      return {
        message: `Optimized for lowest total cost of ownership`,
        costSavings: recommended.result.cost.totalProjectCost,
        costPerRack: recommended.result.cost.costPerRack,
        costPerKw: recommended.result.cost.costPerKw,
        paybackPeriod: calculatePaybackPeriod(recommended.result)
      };
      
    case 'efficiency':
      return {
        message: `Optimized for maximum energy efficiency`,
        pue: recommended.result.sustainability.pue,
        annualEnergySavings: recommended.result.sustainability.annualEnergyConsumption.total,
        estimatedCostSavings: recommended.result.tco.annualCosts.energy
      };
      
    case 'reliability':
      return {
        message: `Optimized for maximum system reliability`,
        availability: recommended.result.reliability.availabilityPercentage,
        tier: recommended.result.reliability.tier,
        annualDowntime: recommended.result.reliability.annualDowntimeMinutes
      };
      
    case 'sustainability':
      return {
        message: `Optimized for environmental sustainability`,
        carbonFootprint: recommended.result.carbonFootprint.totalAnnualEmissions,
        waterUsage: recommended.result.sustainability.waterUsage.annual,
        renewablePercentage: recommended.result.carbonFootprint.renewableImpact.percentage
      };
      
    default:
      return { message: "Optimization complete" };
  }
}

/**
 * Calculate estimated payback period in years
 */
function calculatePaybackPeriod(result: any): number {
  const capitalCost = result.cost.totalProjectCost;
  const annualSavings = result.tco.annualCosts.total;
  
  // Simple payback calculation
  return Math.round((capitalCost / annualSavings) * 10) / 10;
}

/**
 * Analyze a configuration and provide recommendations for improvement
 */
function analyzeConfigurationImpl(config: any): any {
  const recommendations = [];
  
  // Check power density
  if (config.rack.powerDensity > 100) {
    if (config.cooling.type === 'air-cooled') {
      recommendations.push({
        type: 'cooling',
        severity: 'high',
        message: 'Air cooling may be insufficient for high power density. Consider DLC or hybrid cooling.',
        potentialSavings: 'Improved cooling efficiency could reduce PUE by 0.2-0.3'
      });
    }
  }
  
  // Check PUE
  if (config.sustainability.pue > 1.3) {
    recommendations.push({
      type: 'efficiency',
      severity: 'medium',
      message: 'PUE could be improved with better cooling solutions or waste heat recovery.',
      potentialSavings: 'Reducing PUE by 0.1 could save approximately 7% on energy costs'
    });
  }
  
  // Check redundancy
  if (config.power.ups.redundancyFactor < 1.2 && config.rack.powerDensity > 75) {
    recommendations.push({
      type: 'reliability',
      severity: 'high',
      message: 'Consider increasing redundancy for high-density deployments.',
      potentialSavings: 'Improved uptime could prevent costly outages'
    });
  }
  
  // Check generator
  if (!config.power.generator?.included && config.reliability.tier === 'Tier III') {
    recommendations.push({
      type: 'reliability',
      severity: 'medium',
      message: 'Adding a generator would improve reliability for Tier III requirements.',
      potentialSavings: 'Could improve availability by 0.1-0.2%'
    });
  }
  
  // Check sustainability options
  if (!config.sustainability.wasteHeatRecovery?.enabled && config.cooling.type === 'dlc') {
    recommendations.push({
      type: 'sustainability',
      severity: 'medium',
      message: 'DLC systems are ideal for waste heat recovery. Consider enabling this option.',
      potentialSavings: 'Could recover up to 40% of waste heat for reuse'
    });
  }
  
  return {
    recommendations,
    optimizationPotential: recommendations.length > 2 ? 'high' : recommendations.length > 0 ? 'medium' : 'low',
    summary: `${recommendations.length} improvement opportunities identified`
  };
}

// Wrap the analyzeConfiguration function with debug logging
export const analyzeConfiguration = withDebug(
  'analyzeConfiguration',
  (results: any): any => {
    try {
      // Try the original analysis first
      return analyzeConfigurationImpl(results);
    } catch (error) {
      calculatorDebug.error('Original analysis failed, using fallback', error);
      // If the original analysis fails, use the fallback
      return fallbackAnalysis(results);
    }
  }
);

/**
 * Calculate the impact of different cooling technologies on the same workload
 */
async function compareCoolingTechnologiesImpl(kwPerRack: number, totalRacks: number): Promise<any> {
  const coolingTypes = ['air-cooled', 'dlc', 'hybrid', 'immersion'];
  
  const results = await Promise.all(
    coolingTypes.map(async coolingType => {
      try {
        const result = await calculateConfiguration(kwPerRack, coolingType, totalRacks);
        return {
          coolingType,
          result
        };
      } catch (error) {
        console.error(`Error calculating for ${coolingType}`, error);
        return null;
      }
    })
  );
  
  const validResults = results.filter(r => r !== null);
  
  // Calculate comparison metrics
  const baseline = validResults[0]?.result;
  if (!baseline) return { error: 'Failed to calculate baseline configuration' };
  
  const comparisonResults = validResults.map(r => {
    const result = r!.result;
    const pueImprovement = baseline.sustainability.pue - result.sustainability.pue;
    const costDifference = result.cost.totalProjectCost - baseline.cost.totalProjectCost;
    const energySavings = baseline.sustainability.annualEnergyConsumption.total - 
                         result.sustainability.annualEnergyConsumption.total;
    
    return {
      coolingType: r!.coolingType,
      pue: result.sustainability.pue,
      pueImprovement: pueImprovement,
      pueImprovementPercentage: (pueImprovement / baseline.sustainability.pue * 100).toFixed(1) + '%',
      initialCost: result.cost.totalProjectCost,
      costDifference: costDifference,
      costDifferencePercentage: (costDifference / baseline.cost.totalProjectCost * 100).toFixed(1) + '%',
      annualEnergySavings: energySavings,
      waterUsage: result.sustainability.waterUsage.annual,
      paybackPeriod: calculatePaybackPeriod(result)
    };
  });
  
  return {
    baseConfiguration: {
      kwPerRack,
      totalRacks,
      totalPower: kwPerRack * totalRacks
    },
    comparisonResults,
    recommendation: findBestCoolingOption(comparisonResults)
  };
}

// Wrap the compareCoolingTechnologies function with debug logging
export const compareCoolingTechnologies = withDebug(
  'compareCoolingTechnologies',
  async (kwPerRack: number, totalRacks: number): Promise<any> => {
    try {
      // Try the original comparison first
      return await compareCoolingTechnologiesImpl(kwPerRack, totalRacks);
    } catch (error) {
      calculatorDebug.error('Original cooling comparison failed, using fallback', error);
      // If the original comparison fails, use the fallback
      return fallbackCoolingComparison(kwPerRack, totalRacks);
    }
  }
);

/**
 * Calculate the impact of different redundancy configurations on reliability and cost
 */
async function compareRedundancyOptionsImpl(
  kwPerRack: number, 
  coolingType: string, 
  totalRacks: number
): Promise<any> {
  const redundancyOptions = ['N', 'N+1', '2N', '2N+1'];
  
  const results = await Promise.all(
    redundancyOptions.map(async redundancyMode => {
      try {
        const options: CalculationOptions = { redundancyMode };
        const result = await calculateConfiguration(kwPerRack, coolingType, totalRacks, options);
        return {
          redundancyMode,
          result
        };
      } catch (error) {
        console.error(`Error calculating for ${redundancyMode}`, error);
        return null;
      }
    })
  );
  
  const validResults = results.filter(r => r !== null);
  
  // Calculate comparison metrics
  const comparisonResults = validResults.map(r => {
    const result = r!.result;
    return {
      redundancyMode: r!.redundancyMode,
      availability: result.reliability.availabilityPercentage,
      annualDowntime: result.reliability.annualDowntimeMinutes,
      tier: result.reliability.tier,
      totalCost: result.cost.totalProjectCost,
      costIncrease: 0, // Will calculate relative to N
      costPerAvailabilityPoint: 0 // Will calculate
    };
  });
  
  // Calculate relative metrics
  const baselineResult = comparisonResults.find(r => r.redundancyMode === 'N');
  if (baselineResult) {
    const baselineCost = baselineResult.totalCost;
    const baselineAvailability = parseFloat(baselineResult.availability);
    
    comparisonResults.forEach(result => {
      result.costIncrease = result.totalCost - baselineCost;
      result.costPerAvailabilityPoint = result.costIncrease / 
        (parseFloat(result.availability) - baselineAvailability);
    });
  }
  
  return {
    baseConfiguration: {
      kwPerRack,
      coolingType,
      totalRacks,
      totalPower: kwPerRack * totalRacks
    },
    comparisonResults,
    recommendation: findBestRedundancyOption(comparisonResults)
  };
}

// Wrap the compareRedundancyOptions function with debug logging
export const compareRedundancyOptions = withDebug(
  'compareRedundancyOptions',
  async (kwPerRack: number, coolingType: string, totalRacks: number): Promise<any> => {
    try {
      // Try the original comparison first
      return await compareRedundancyOptionsImpl(kwPerRack, coolingType, totalRacks);
    } catch (error) {
      calculatorDebug.error('Original redundancy comparison failed, using fallback', error);
      // If the original comparison fails, use the fallback
      return fallbackRedundancyComparison(kwPerRack, coolingType, totalRacks);
    }
  }
);

/**
 * Find the best cooling option based on comparison results
 */
function findBestCoolingOption(comparisonResults: any[]): any {
  // Sort by different metrics
  const byEfficiency = [...comparisonResults].sort((a, b) => a.pue - b.pue);
  const byCost = [...comparisonResults].sort((a, b) => a.initialCost - b.initialCost);
  const byPayback = [...comparisonResults].sort((a, b) => a.paybackPeriod - b.paybackPeriod);
  
  // Find the most balanced option (appears in top 2 of multiple categories)
  const scoreMap = new Map<string, number>();
  
  // Give points based on ranking in each category
  for (let i = 0; i < comparisonResults.length; i++) {
    const efficiencyScore = 3 - Math.min(i, 2); // 3 points for 1st, 2 for 2nd, 1 for 3rd
    scoreMap.set(byEfficiency[i].coolingType, (scoreMap.get(byEfficiency[i].coolingType) || 0) + efficiencyScore);
    
    const costScore = 3 - Math.min(i, 2);
    scoreMap.set(byCost[i].coolingType, (scoreMap.get(byCost[i].coolingType) || 0) + costScore);
    
    const paybackScore = 3 - Math.min(i, 2);
    scoreMap.set(byPayback[i].coolingType, (scoreMap.get(byPayback[i].coolingType) || 0) + paybackScore);
  }
  
  // Find cooling type with highest score
  let bestType = comparisonResults[0].coolingType;
  let highestScore = 0;
  
  scoreMap.forEach((score, type) => {
    if (score > highestScore) {
      highestScore = score;
      bestType = type;
    }
  });
  
  // Find the result for the best type
  const bestResult = comparisonResults.find(r => r.coolingType === bestType);
  
  return {
    recommendedCoolingType: bestType,
    reason: generateRecommendationReason(bestType, bestResult),
    metrics: bestResult
  };
}

/**
 * Generate a reason for the cooling recommendation
 */
function generateRecommendationReason(coolingType: string, result: any): string {
  switch (coolingType) {
    case 'air-cooled':
      return `Air cooling offers the lowest initial cost and simplest implementation, with a PUE of ${result.pue}.`;
      
    case 'dlc':
      return `Direct Liquid Cooling provides excellent efficiency with a PUE of ${result.pue}, making it ideal for high-density deployments.`;
      
    case 'hybrid':
      return `Hybrid cooling offers a balanced approach with good efficiency (PUE ${result.pue}) and moderate cost, suitable for mixed workloads.`;
      
    case 'immersion':
      return `Immersion cooling delivers the best efficiency (PUE ${result.pue}) and is recommended for very high-density deployments despite higher initial cost.`;
      
    default:
      return `This cooling type offers the best balance of efficiency, cost, and implementation complexity.`;
  }
}

/**
 * Find the best redundancy option based on comparison results
 */
function findBestRedundancyOption(comparisonResults: any[]): any {
  // Sort by availability
  const byAvailability = [...comparisonResults].sort((a, b) => 
    parseFloat(b.availability) - parseFloat(a.availability)
  );
  
  // Sort by cost-effectiveness (cost per availability point)
  const byCostEffectiveness = [...comparisonResults]
    .filter(r => r.costPerAvailabilityPoint > 0) // Filter out N configuration
    .sort((a, b) => a.costPerAvailabilityPoint - b.costPerAvailabilityPoint);
  
  // Determine best option based on tier requirements
  const tierIV = byAvailability.find(r => r.tier === 'Tier IV');
  const tierIII = byAvailability.find(r => r.tier === 'Tier III');
  
  // Most cost-effective option that meets Tier III
  const bestOption = tierIII || byAvailability[0];
  
  return {
    recommendedRedundancy: bestOption.redundancyMode,
    tier: bestOption.tier,
    availability: bestOption.availability,
    annualDowntime: bestOption.annualDowntime,
    costImplication: bestOption.costIncrease > 0 ? 
      `${(bestOption.costIncrease / comparisonResults[0].totalCost * 100).toFixed(1)}% increase over N configuration` : 
      'Baseline cost',
    alternativeOptions: {
      highestAvailability: tierIV ? {
        mode: tierIV.redundancyMode,
        availability: tierIV.availability,
        costIncrease: `${(tierIV.costIncrease / comparisonResults[0].totalCost * 100).toFixed(1)}% increase`
      } : null,
      mostCostEffective: byCostEffectiveness.length > 0 ? {
        mode: byCostEffectiveness[0].redundancyMode,
        availability: byCostEffectiveness[0].availability,
        costEffectiveness: `${byCostEffectiveness[0].costPerAvailabilityPoint.toFixed(0)} per 0.01% availability`
      } : null
    }
  };
}