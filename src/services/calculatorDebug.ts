import { CalculationConfig, CalculationOptions } from './matrixCalculatorService';

/**
 * Debug utility to trace calculator execution flow
 */
export const calculatorDebug = {
  enabled: true,
  
  log(message: string, data?: any): void {
    if (!this.enabled) return;
    
    console.log(`[Calculator Debug] ${message}`);
    if (data) {
      try {
        console.log(JSON.stringify(data, null, 2));
      } catch (error) {
        console.log('Data could not be stringified:', data);
      }
    }
  },
  
  warn(message: string, data?: any): void {
    if (!this.enabled) return;
    
    console.warn(`[Calculator Warning] ${message}`);
    if (data) {
      console.warn(data);
    }
  },
  
  error(message: string, error: any): void {
    if (!this.enabled) return;
    
    console.error(`[Calculator Error] ${message}`);
    console.error(error);
  },
  
  startCalculation(config: CalculationConfig, options?: CalculationOptions): void {
    this.log('Starting calculation with config:', config);
    this.log('Options:', options || {});
  },
  
  endCalculation(success: boolean, results?: any): void {
    if (success) {
      this.log('Calculation completed successfully', results);
    } else {
      this.error('Calculation failed', results);
    }
  }
};

/**
 * Wrap a calculator function with debug logging
 */
export function withDebug<T extends (...args: any[]) => Promise<any>>(
  name: string, 
  fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    calculatorDebug.log(`Starting ${name}`);
    try {
      const result = await fn(...args);
      calculatorDebug.log(`Completed ${name}`, result);
      return result;
    } catch (error) {
      calculatorDebug.error(`Error in ${name}`, error);
      throw error;
    }
  };
}

/**
 * Check if Firebase is properly initialized
 */
export function checkFirebaseInitialization(): boolean {
  try {
    const { getFirestore } = require('firebase/firestore');
    const db = getFirestore();
    calculatorDebug.log('Firebase Firestore initialized successfully');
    return !!db;
  } catch (error) {
    calculatorDebug.error('Firebase Firestore initialization failed', error);
    return false;
  }
}

/**
 * Verify that required calculator services are available
 */
export function verifyCalculatorServices(): { 
  success: boolean; 
  missingServices: string[] 
} {
  const missingServices: string[] = [];
  
  try {
    const { calculateConfiguration } = require('./matrixCalculatorService');
    if (!calculateConfiguration) missingServices.push('calculateConfiguration');
  } catch (error) {
    missingServices.push('matrixCalculatorService');
  }
  
  try {
    const { analyzeConfiguration } = require('./optimizationService');
    if (!analyzeConfiguration) missingServices.push('analyzeConfiguration');
  } catch (error) {
    missingServices.push('optimizationService');
  }
  
  try {
    const { fetchClimateData } = require('./climateDataService');
    if (!fetchClimateData) missingServices.push('fetchClimateData');
  } catch (error) {
    missingServices.push('climateDataService');
  }
  
  const success = missingServices.length === 0;
  calculatorDebug.log(`Calculator services verification: ${success ? 'SUCCESS' : 'FAILED'}`);
  if (!success) {
    calculatorDebug.log('Missing services:', missingServices);
  }
  
  return { success, missingServices };
}