
import { powerCalculationService } from "./power";
import { coolingCalculationService } from "./cooling";
import { economicCalculationService } from "./economic";
import { PERFORMANCE_THRESHOLDS } from "./constants";
import firebaseMonitor from "@/services/firebase-monitor";

interface CalculationMetrics {
  startTime: number;
  endTime?: number;
  memoryBefore: number;
  memoryAfter?: number;
  operationType: string;
}

class CalculationService {
  private metrics: Map<string, CalculationMetrics> = new Map();
  private readonly CACHE_CLEANUP_INTERVAL = 1000 * 60 * 30; // 30 minutes

  constructor() {
    this.initializeCleanupInterval();
  }

  private initializeCleanupInterval() {
    setInterval(() => {
      this.cleanupCaches();
    }, this.CACHE_CLEANUP_INTERVAL);
  }

  private cleanupCaches() {
    powerCalculationService.clearCache();
    coolingCalculationService.clearCache();
    economicCalculationService.clearCache();
    
    firebaseMonitor.logOperation({
      type: "settings",
      action: "cache_cleanup",
      status: "success",
      timestamp: Date.now()
    });
  }

  private startMetrics(operationType: string): string {
    const id = `${operationType}-${Date.now()}`;
    this.metrics.set(id, {
      startTime: performance.now(),
      memoryBefore: this.getMemoryUsage(),
      operationType
    });
    return id;
  }

  private endMetrics(id: string) {
    const metric = this.metrics.get(id);
    if (!metric) return;

    metric.endTime = performance.now();
    metric.memoryAfter = this.getMemoryUsage();

    const duration = metric.endTime - metric.startTime;
    const memoryDelta = metric.memoryAfter - metric.memoryBefore;

    if (duration > PERFORMANCE_THRESHOLDS.CALCULATION_TIME_WARNING) {
      firebaseMonitor.logOperation({
        type: "settings",
        action: "calculation_performance_warning",
        status: "warning",
        timestamp: Date.now(),
        details: {
          duration,
          operationType: metric.operationType,
          memoryDelta
        }
      });
    }

    firebaseMonitor.logPerformanceMetric({
      operationDuration: duration,
      memoryUsage: metric.memoryAfter,
      timestamp: Date.now()
    });

    this.metrics.delete(id);
  }

  private getMemoryUsage(): number {
    try {
      if (typeof window !== 'undefined' && 
          window.performance && 
          (window.performance as any).memory) {
        return ((window.performance as any).memory.usedJSHeapSize / 
                (window.performance as any).memory.jsHeapSizeLimit) * 100;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  async calculatePower(params: any) {
    const metricId = this.startMetrics("power");
    try {
      const result = await powerCalculationService.calculate(params);
      return result;
    } finally {
      this.endMetrics(metricId);
    }
  }

  async calculateCooling(params: any) {
    const metricId = this.startMetrics("cooling");
    try {
      const result = await coolingCalculationService.calculate(params);
      return result;
    } finally {
      this.endMetrics(metricId);
    }
  }

  async calculateEconomics(params: any) {
    const metricId = this.startMetrics("economic");
    try {
      const result = await economicCalculationService.calculate(params);
      return result;
    } finally {
      this.endMetrics(metricId);
    }
  }

  clearAllCaches() {
    this.cleanupCaches();
  }
}

export const calculationService = new CalculationService();
