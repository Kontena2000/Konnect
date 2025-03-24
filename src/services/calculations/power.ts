
import { PowerCalculationParams, PowerCalculationResult } from "./types";
import { IEEE_CONSTANTS, CABLE_PROPERTIES } from "./constants";
import { validatePowerCalculations } from "./validation";
import firebaseMonitor from "@/services/firebase-monitor";

class PowerCalculationService {
  private cache = new Map<string, PowerCalculationResult>();

  private getCacheKey(params: PowerCalculationParams): string {
    return JSON.stringify(params);
  }

  async calculate(params: PowerCalculationParams): Promise<PowerCalculationResult> {
    const startTime = performance.now();
    const validation = validatePowerCalculations(params);

    if (!validation.isValid) {
      throw new Error(`Invalid parameters: ${validation.errors.join(", ")}`);
    }

    const cacheKey = this.getCacheKey(params);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const faultCurrent = this.calculateFaultCurrent(params);
      const shortCircuitCurrent = this.calculateShortCircuitCurrent(params);
      const arcFlashEnergy = this.calculateArcFlashEnergy(params);
      const voltageDrop = this.calculateVoltageDrop(params);
      const correctedPowerFactor = this.calculateCorrectedPowerFactor(params);
      const harmonicDistortion = this.calculateHarmonicDistortion(params);
      const requiredFeederSize = this.calculateRequiredFeederSize(params);
      const breakers = this.calculateBreakerSettings(params);

      const result: PowerCalculationResult = {
        faultCurrent,
        shortCircuitCurrent,
        arcFlashEnergy,
        voltageDrop,
        correctedPowerFactor,
        harmonicDistortion,
        requiredFeederSize,
        breakers
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
        action: "power_calculation",
        status: "error",
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }

  private calculateFaultCurrent(params: PowerCalculationParams): number {
    const { voltage, distance, cableType } = params;
    const cableProperties = CABLE_PROPERTIES[cableType === "COPPER" ? "COPPER" : "ALUMINUM"];
    const impedance = (cableProperties.RESISTIVITY * distance) / IEEE_CONSTANTS.FAULT_CURRENT.IMPEDANCE_FACTOR;
    return (voltage * IEEE_CONSTANTS.FAULT_CURRENT.VOLTAGE_FACTOR) / impedance;
  }

  private calculateShortCircuitCurrent(params: PowerCalculationParams): number {
    return this.calculateFaultCurrent(params) * 1.25; // 25% safety margin
  }

  private calculateArcFlashEnergy(params: PowerCalculationParams): number {
    const faultCurrent = this.calculateFaultCurrent(params);
    return (
      IEEE_CONSTANTS.ARC_FLASH.INCIDENT_ENERGY_FACTOR *
      faultCurrent *
      IEEE_CONSTANTS.ARC_FLASH.TIME_FACTOR /
      IEEE_CONSTANTS.ARC_FLASH.DISTANCE_FACTOR
    );
  }

  private calculateVoltageDrop(params: PowerCalculationParams): number {
    const { voltage, current, distance, powerFactor } = params;
    return (current * distance * powerFactor) / (voltage * 1000);
  }

  private calculateCorrectedPowerFactor(params: PowerCalculationParams): number {
    return Math.min(0.95, params.powerFactor * 1.2); // 20% improvement with correction
  }

  private calculateHarmonicDistortion(params: PowerCalculationParams): number {
    return params.loadType === "nonlinear" ? 0.15 : 0.05; // 15% for nonlinear, 5% for linear loads
  }

  private calculateRequiredFeederSize(params: PowerCalculationParams): number {
    const { current } = params;
    return current * 1.25; // 25% safety margin
  }

  private calculateBreakerSettings(params: PowerCalculationParams): {
    rating: number;
    tripTime: number;
    coordination: boolean;
  }[] {
    const faultCurrent = this.calculateFaultCurrent(params);
    return [
      {
        rating: faultCurrent * 1.25,
        tripTime: 0.1,
        coordination: true
      },
      {
        rating: faultCurrent * 1.5,
        tripTime: 0.3,
        coordination: true
      }
    ];
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const powerCalculationService = new PowerCalculationService();
