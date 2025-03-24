
import { CONNECTION_TYPES, IEEE_CONSTANTS } from "./constants";
import firebaseMonitor from "@/services/firebase-monitor";

export interface ConnectionCalculationParams {
  type: "power" | "cooling" | "network";
  subtype: string;
  sourcePoint: [number, number, number];
  targetPoint: [number, number, number];
  load: number;
}

export interface ConnectionCalculationResult {
  isValid: boolean;
  capacity: number;
  loss: number;
  efficiency: number;
  warnings: string[];
}

class ConnectionCalculationService {
  async validateConnection(params: ConnectionCalculationParams): Promise<ConnectionCalculationResult> {
    const startTime = performance.now();
    
    try {
      switch (params.type) {
        case "power":
          return this.validatePowerConnection(params);
        case "cooling":
          return this.validateCoolingConnection(params);
        case "network":
          return this.validateNetworkConnection(params);
        default:
          throw new Error("Invalid connection type");
      }
    } catch (error) {
      firebaseMonitor.logOperation({
        type: "connection",
        action: "validate",
        status: "error",
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      firebaseMonitor.logPerformanceMetric({
        operationDuration: duration,
        timestamp: Date.now()
      });
    }
  }

  private validatePowerConnection(params: ConnectionCalculationParams): ConnectionCalculationResult {
    const config = CONNECTION_TYPES.POWER[params.subtype as keyof typeof CONNECTION_TYPES.POWER];
    if (!config) {
      throw new Error("Invalid power connection subtype");
    }

    const distance = this.calculateDistance(params.sourcePoint, params.targetPoint);
    const voltageDrop = this.calculateVoltageDrop(params.load, distance, config.voltage);
    const efficiency = 1 - (voltageDrop / config.voltage);

    const warnings: string[] = [];
    if (voltageDrop > config.voltage * 0.05) { // 5% voltage drop threshold
      warnings.push("High voltage drop detected");
    }

    return {
      isValid: efficiency > 0.9, // 90% minimum efficiency
      capacity: config.voltage * params.load,
      loss: voltageDrop * params.load,
      efficiency,
      warnings
    };
  }

  private validateCoolingConnection(params: ConnectionCalculationParams): ConnectionCalculationResult {
    const config = CONNECTION_TYPES.COOLING[params.subtype as keyof typeof CONNECTION_TYPES.COOLING];
    if (!config) {
      throw new Error("Invalid cooling connection subtype");
    }

    const distance = this.calculateDistance(params.sourcePoint, params.targetPoint);
    const pressureDrop = this.calculatePressureDrop(distance, params.load);
    const efficiency = 1 - (pressureDrop / config.pressureDrop);

    const warnings: string[] = [];
    if (pressureDrop > config.pressureDrop) {
      warnings.push("High pressure drop detected");
    }

    return {
      isValid: efficiency > 0.85, // 85% minimum efficiency
      capacity: params.load,
      loss: pressureDrop,
      efficiency,
      warnings
    };
  }

  private validateNetworkConnection(params: ConnectionCalculationParams): ConnectionCalculationResult {
    const config = CONNECTION_TYPES.NETWORK[params.subtype as keyof typeof CONNECTION_TYPES.NETWORK];
    if (!config) {
      throw new Error("Invalid network connection subtype");
    }

    const distance = this.calculateDistance(params.sourcePoint, params.targetPoint);
    const isValid = distance <= config.maxLength;

    const warnings: string[] = [];
    if (distance > config.maxLength * 0.8) {
      warnings.push("Connection length approaching maximum limit");
    }

    return {
      isValid,
      capacity: parseInt(config.bandwidth.replace(/[^0-9]/g, "")),
      loss: distance / config.maxLength,
      efficiency: 1 - (distance / config.maxLength),
      warnings
    };
  }

  private calculateDistance(source: [number, number, number], target: [number, number, number]): number {
    return Math.sqrt(
      Math.pow(target[0] - source[0], 2) +
      Math.pow(target[1] - source[1], 2) +
      Math.pow(target[2] - source[2], 2)
    );
  }

  private calculateVoltageDrop(current: number, distance: number, voltage: number): number {
    return (current * distance * IEEE_CONSTANTS.FAULT_CURRENT.IMPEDANCE_FACTOR) / voltage;
  }

  private calculatePressureDrop(distance: number, flow: number): number {
    // Simplified pressure drop calculation
    const FRICTION_FACTOR = 0.02;
    const PIPE_DIAMETER = 0.1; // meters
    const FLUID_DENSITY = 1000; // kg/m³ (water)
    const VELOCITY = flow / (Math.PI * Math.pow(PIPE_DIAMETER / 2, 2));
    
    return FRICTION_FACTOR * (distance / PIPE_DIAMETER) * 
           (FLUID_DENSITY * Math.pow(VELOCITY, 2)) / 2;
  }
}

export const connectionCalculationService = new ConnectionCalculationService();
