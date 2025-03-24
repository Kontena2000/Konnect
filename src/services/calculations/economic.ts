
import { EconomicCalculationParams, EconomicCalculationResult } from "./types";
import { ECONOMIC_CONSTANTS } from "./constants";
import { validateEconomicCalculations } from "./validation";
import firebaseMonitor from "@/services/firebase-monitor";

class EconomicCalculationService {
  private cache = new Map<string, EconomicCalculationResult>();

  private getCacheKey(params: EconomicCalculationParams): string {
    return JSON.stringify(params);
  }

  async calculate(params: EconomicCalculationParams): Promise<EconomicCalculationResult> {
    const startTime = performance.now();
    const validation = validateEconomicCalculations(params);

    if (!validation.isValid) {
      throw new Error(`Invalid parameters: ${validation.errors.join(", ")}`);
    }

    const cacheKey = this.getCacheKey(params);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const totalCostOfOwnership = this.calculateTCO(params);
      const powerUsageEffectiveness = this.calculatePUE(params);
      const annualEnergyCost = this.calculateAnnualEnergyCost(params);
      const carbonFootprint = this.calculateCarbonFootprint(params);
      const roi = this.calculateROI(params);
      const costBreakdown = this.calculateCostBreakdown(params);

      const result: EconomicCalculationResult = {
        totalCostOfOwnership,
        powerUsageEffectiveness,
        annualEnergyCost,
        carbonFootprint,
        roi,
        costBreakdown
      };

      this.cache.set(cacheKey, result);

      const duration = performance.now() - startTime;
      firebaseMonitor.logPerformanceMetric({
        operationDuration: duration,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      firebaseMonitor.logOperation({
        type: "settings",
        action: "economic_calculation",
        status: "error",
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }

  private calculateTCO(params: EconomicCalculationParams): number {
    const { initialInvestment, operationalHours } = params;
    const annualCosts = this.calculateAnnualCosts(params);
    const years = 10; // Standard 10-year TCO calculation
    
    let tco = initialInvestment;
    for (let year = 1; year <= years; year++) {
      const inflationFactor = Math.pow(1 + ECONOMIC_CONSTANTS.INFLATION_RATE, year);
      tco += annualCosts * inflationFactor;
    }
    
    return tco;
  }

  private calculatePUE(params: EconomicCalculationParams): number {
    const { powerCost, coolingCost } = params;
    const totalFacilityPower = powerCost + coolingCost;
    const itEquipmentPower = powerCost;
    return totalFacilityPower / itEquipmentPower;
  }

  private calculateAnnualEnergyCost(params: EconomicCalculationParams): number {
    const { operationalHours, energyRates } = params;
    const peakHours = operationalHours * 0.6; // Assume 60% peak hours
    const offPeakHours = operationalHours * 0.4; // Assume 40% off-peak hours
    
    return (peakHours * energyRates.peak) + (offPeakHours * energyRates.offPeak);
  }

  private calculateCarbonFootprint(params: EconomicCalculationParams): number {
    const annualEnergy = this.calculateAnnualEnergyCost(params);
    return annualEnergy * params.carbonEmissionFactor;
  }

  private calculateROI(params: EconomicCalculationParams): {
    paybackPeriod: number;
    npv: number;
    irr: number;
  } {
    const { initialInvestment } = params;
    const annualSavings = this.calculateAnnualSavings(params);
    
    // Simple payback period
    const paybackPeriod = initialInvestment / annualSavings;
    
    // NPV calculation
    let npv = -initialInvestment;
    for (let year = 1; year <= 10; year++) {
      npv += annualSavings / Math.pow(1 + ECONOMIC_CONSTANTS.DISCOUNT_RATE, year);
    }
    
    // IRR approximation using Newton's method
    const irr = this.calculateIRR(initialInvestment, annualSavings);
    
    return {
      paybackPeriod,
      npv,
      irr
    };
  }

  private calculateCostBreakdown(params: EconomicCalculationParams): {
    capex: number;
    opex: number;
    maintenance: number;
    energy: number;
  } {
    const { initialInvestment, maintenanceCost } = params;
    const annualEnergyCost = this.calculateAnnualEnergyCost(params);
    
    return {
      capex: initialInvestment,
      opex: annualEnergyCost * 10, // 10-year operational costs
      maintenance: maintenanceCost * 10, // 10-year maintenance costs
      energy: annualEnergyCost * 10 // 10-year energy costs
    };
  }

  private calculateAnnualCosts(params: EconomicCalculationParams): number {
    const { powerCost, coolingCost, maintenanceCost } = params;
    return powerCost + coolingCost + maintenanceCost;
  }

  private calculateAnnualSavings(params: EconomicCalculationParams): number {
    const currentCosts = this.calculateAnnualCosts(params);
    const baselineCosts = currentCosts * 1.3; // Assume 30% higher baseline costs
    return baselineCosts - currentCosts;
  }

  private calculateIRR(initialInvestment: number, annualSavings: number): number {
    let irr = 0.1; // Initial guess
    const maxIterations = 100;
    const tolerance = 0.0001;
    
    for (let i = 0; i < maxIterations; i++) {
      let npv = -initialInvestment;
      let derivativeNpv = 0;
      
      for (let year = 1; year <= 10; year++) {
        npv += annualSavings / Math.pow(1 + irr, year);
        derivativeNpv -= year * annualSavings / Math.pow(1 + irr, year + 1);
      }
      
      const newIrr = irr - npv / derivativeNpv;
      
      if (Math.abs(newIrr - irr) < tolerance) {
        return newIrr;
      }
      
      irr = newIrr;
    }
    
    return irr;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const economicCalculationService = new EconomicCalculationService();
