
import { CoolingCalculationParams, CoolingCalculationResult } from "./types";
import { ASHRAE_CONSTANTS } from "./constants";
import { validateCoolingCalculations } from "./validation";
import firebaseMonitor from "@/services/firebase-monitor";

class CoolingCalculationService {
  private cache = new Map<string, CoolingCalculationResult>();

  private getCacheKey(params: CoolingCalculationParams): string {
    return JSON.stringify(params);
  }

  async calculate(params: CoolingCalculationParams): Promise<CoolingCalculationResult> {
    const startTime = performance.now();
    const validation = validateCoolingCalculations(params);

    if (!validation.isValid) {
      throw new Error(`Invalid parameters: ${validation.errors.join(", ")}`);
    }

    const cacheKey = this.getCacheKey(params);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const requiredCapacity = this.calculateRequiredCapacity(params);
      const airflow = this.calculateAirflow(params);
      const chilledWaterFlow = this.calculateChilledWaterFlow(params);
      const heatRejection = this.calculateHeatRejection(params);
      const psychrometrics = this.calculatePsychrometrics(params);
      const redundancyAnalysis = this.analyzeRedundancy(params);

      const result: CoolingCalculationResult = {
        requiredCapacity,
        airflow,
        chilledWaterFlow,
        heatRejection,
        psychrometrics,
        redundancyAnalysis
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
        action: "cooling_calculation",
        status: "error",
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }

  private calculateRequiredCapacity(params: CoolingCalculationParams): number {
    const { itLoad } = params;
    return itLoad * ASHRAE_CONSTANTS.SAFETY_MARGIN;
  }

  private calculateAirflow(params: CoolingCalculationParams): number {
    const { itLoad, temperature } = params;
    const deltaT = temperature.return - temperature.supply;
    return (itLoad * 3412.142) / (1.08 * deltaT);
  }

  private calculateChilledWaterFlow(params: CoolingCalculationParams): number {
    const { itLoad } = params;
    return (itLoad * 3412.142) / (500 * 8.34);
  }

  private calculateHeatRejection(params: CoolingCalculationParams): number {
    const { itLoad } = params;
    return itLoad * 1.3; // 30% additional heat from cooling system inefficiency
  }

  private calculatePsychrometrics(params: CoolingCalculationParams): {
    dewPoint: number;
    absoluteHumidity: number;
    enthalpy: number;
  } {
    const { temperature, humidity } = params;
    
    // Magnus formula for dew point
    const alpha = Math.log(humidity.relative / 100) + (17.27 * temperature.supply) / (237.3 + temperature.supply);
    const dewPoint = (237.3 * alpha) / (17.27 - alpha);

    // Absolute humidity calculation
    const absoluteHumidity = (6.112 * Math.exp((17.67 * temperature.supply) / (temperature.supply + 243.5)) * humidity.relative * 2.1674) / (273.15 + temperature.supply);

    // Enthalpy calculation
    const enthalpy = 1.006 * temperature.supply + absoluteHumidity * (2501 + 1.86 * temperature.supply);

    return {
      dewPoint,
      absoluteHumidity,
      enthalpy
    };
  }

  private analyzeRedundancy(params: CoolingCalculationParams): {
    n: boolean;
    nPlusOne: boolean;
    twoN: boolean;
  } {
    const requiredCapacity = this.calculateRequiredCapacity(params);
    const unitCapacity = requiredCapacity / 2; // Assume standard unit size

    return {
      n: true, // Basic redundancy
      nPlusOne: unitCapacity * 2 >= requiredCapacity, // N+1 redundancy
      twoN: unitCapacity * 3 >= requiredCapacity * 2 // 2N redundancy
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const coolingCalculationService = new CoolingCalculationService();
