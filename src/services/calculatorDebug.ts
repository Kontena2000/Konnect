import { CalculationConfig, CalculationOptions } from './matrixCalculatorService';

/**
 * Debug utility to trace calculator execution flow
 */
export const calculatorDebug = {
  enabled: true,
  
  // Set this to true to enable detailed step-by-step logging
  verbose: true,
  
  // Track calculation steps
  calculationSteps: [] as string[],
  
  // Track timing information
  timers: {} as Record<string, number>,
  
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
    
    // Add to calculation steps
    this.calculationSteps.push(message);
  },
  
  warn(message: string, data?: any): void {
    if (!this.enabled) return;
    
    console.warn(`[Calculator Warning] ${message}`);
    if (data) {
      console.warn(data);
    }
    
    // Add to calculation steps
    this.calculationSteps.push(`WARNING: ${message}`);
  },
  
  error(message: string, error: any): void {
    if (!this.enabled) return;
    
    console.error(`[Calculator Error] ${message}`);
    console.error(error);
    
    // Add to calculation steps with error details
    this.calculationSteps.push(`ERROR: ${message} - ${error?.message || JSON.stringify(error)}`);
  },
  
  // Add the clear method to fix the TypeScript error
  clear(): void {
    this.calculationSteps = [];
    this.timers = {};
    console.log('[Calculator Debug] Logs cleared');
  },
  
  startCalculation(config: CalculationConfig, options?: CalculationOptions): void {
    // Reset calculation steps
    this.calculationSteps = [];
    
    // Start timer
    this.startTimer('totalCalculation');
    
    this.log('Starting calculation with config:', config);
    this.log('Options:', options || {});
  },
  
  endCalculation(success: boolean, results?: any): void {
    // End timer
    this.endTimer('totalCalculation');
    
    if (success) {
      this.log(`Calculation completed successfully in ${this.getElapsedTime('totalCalculation')}ms`, results);
    } else {
      this.error('Calculation failed', results);
    }
    
    // Log calculation steps if verbose
    if (this.verbose) {
      console.log('Calculation steps:', this.calculationSteps);
    }
  },
  
  // Start a timer for a specific operation
  startTimer(name: string): void {
    this.timers[name] = performance.now();
  },
  
  // End a timer and return elapsed time
  endTimer(name: string): number {
    const startTime = this.timers[name];
    if (!startTime) {
      this.warn(`Timer '${name}' was never started`);
      return 0;
    }
    
    const elapsed = performance.now() - startTime;
    this.log(`Operation '${name}' took ${elapsed.toFixed(2)}ms`);
    return elapsed;
  },
  
  // Get elapsed time without ending timer
  getElapsedTime(name: string): number {
    const startTime = this.timers[name];
    if (!startTime) return 0;
    return performance.now() - startTime;
  },
  
  // Track a specific calculation step with timing
  trackStep(stepName: string, fn: Function, ...args: any[]): any {
    if (!this.enabled) return fn(...args);
    
    this.startTimer(stepName);
    this.log(`Starting step: ${stepName}`);
    
    try {
      const result = fn(...args);
      this.endTimer(stepName);
      this.log(`Completed step: ${stepName}`);
      return result;
    } catch (error) {
      this.endTimer(stepName);
      this.error(`Error in step: ${stepName}`, error);
      throw error;
    }
  },
  
  // Track an async calculation step with timing
  async trackStepAsync(stepName: string, fn: Function, ...args: any[]): Promise<any> {
    if (!this.enabled) return fn(...args);
    
    this.startTimer(stepName);
    this.log(`Starting async step: ${stepName}`);
    
    try {
      const result = await fn(...args);
      this.endTimer(stepName);
      this.log(`Completed async step: ${stepName}`);
      return result;
    } catch (error) {
      this.endTimer(stepName);
      this.error(`Error in async step: ${stepName}`, error);
      throw error;
    }
  },
  
  // Log object properties with type information
  inspectObject(name: string, obj: any): void {
    if (!this.enabled || !this.verbose) return;
    
    this.log(`Inspecting object: ${name}`);
    
    if (!obj) {
      this.log(`${name} is ${obj}`);
      return;
    }
    
    const properties: Record<string, string> = {};
    
    for (const key in obj) {
      const value = obj[key];
      const type = typeof value;
      
      if (value === null) {
        properties[key] = 'null';
      } else if (value === undefined) {
        properties[key] = 'undefined';
      } else if (Array.isArray(value)) {
        properties[key] = `Array(${value.length})`;
      } else if (type === 'object') {
        properties[key] = `Object {${Object.keys(value).join(', ')}}`;
      } else {
        properties[key] = `${type}: ${String(value)}`;
      }
    }
    
    this.log(`${name} properties:`, properties);
  }
};

// Add a subscription mechanism to the calculatorDebug service
let debugLogs: any[] = [];
const subscribers: ((logs: any[]) => void)[] = [];

// Add methods to the calculatorDebug object
const enhancedCalculatorDebug = {
  ...calculatorDebug,
  
  // Subscribe to debug logs
  subscribe: (callback: (logs: any[]) => void) => {
    subscribers.push(callback);
    callback([...debugLogs]); // Immediately provide current logs
    
    // Return unsubscribe function
    return () => {
      const index = subscribers.indexOf(callback);
      if (index !== -1) {
        subscribers.splice(index, 1);
      }
    };
  },
  
  // Clear all logs
  clear: () => {
    debugLogs = [];
    subscribers.forEach(callback => callback([]));
  },
  
  // Override log method to store logs
  log: (message: string, data?: any) => {
    const logEntry = {
      level: 'info',
      source: 'calculator',
      message,
      data,
      timestamp: Date.now()
    };
    
    debugLogs.push(logEntry);
    subscribers.forEach(callback => callback([...debugLogs]));
    
    // Call original log method
    calculatorDebug.log(message, data);
  },
  
  // Override warn method to store logs
  warn: (message: string, data?: any) => {
    const logEntry = {
      level: 'warn',
      source: 'calculator',
      message,
      data,
      timestamp: Date.now()
    };
    
    debugLogs.push(logEntry);
    subscribers.forEach(callback => callback([...debugLogs]));
    
    // Call original warn method
    calculatorDebug.warn(message, data);
  },
  
  // Override error method to store logs
  error: (message: string, data?: any) => {
    const logEntry = {
      level: 'error',
      source: 'calculator',
      message,
      data,
      timestamp: Date.now()
    };
    
    debugLogs.push(logEntry);
    subscribers.forEach(callback => callback([...debugLogs]));
    
    // Call original error method
    calculatorDebug.error(message, data);
  }
};

// Export the enhanced calculatorDebug
export { enhancedCalculatorDebug as calculatorDebug };

/**
 * Wrap a calculator function with debug logging
 */
export function withDebug<T extends (...args: any[]) => Promise<any>>(
  name: string, 
  fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    calculatorDebug.log(`Starting ${name}`);
    calculatorDebug.startTimer(name);
    
    try {
      // Log input arguments
      args.forEach((arg, index) => {
        calculatorDebug.log(`${name} arg[${index}]:`, arg);
      });
      
      const result = await fn(...args);
      
      const elapsed = calculatorDebug.endTimer(name);
      calculatorDebug.log(`Completed ${name} in ${elapsed.toFixed(2)}ms`);
      
      // Inspect result structure
      if (calculatorDebug.verbose) {
        calculatorDebug.inspectObject(`${name} result`, result);
      }
      
      return result;
    } catch (error) {
      calculatorDebug.endTimer(name);
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
    // First check if firebase/app is available
    const { getApps } = require('firebase/app');
    
    // Check if we have any initialized Firebase apps
    if (getApps().length === 0) {
      calculatorDebug.error('Firebase initialization failed', 'No Firebase App has been created - call initializeApp() first');
      return false;
    }
    
    // Now check if Firestore is available
    const { getFirestore } = require('firebase/firestore');
    const db = getFirestore();
    
    if (!db) {
      calculatorDebug.error('Firebase Firestore initialization failed', 'Firestore instance is null or undefined');
      return false;
    }
    
    calculatorDebug.log('Firebase Firestore initialized successfully');
    return true;
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

/**
 * Create a debug logger for a specific calculation function
 */
export function createFunctionLogger(functionName: string) {
  return {
    start: (...args: any[]) => {
      calculatorDebug.startTimer(functionName);
      calculatorDebug.log(`Starting ${functionName}`, args);
    },
    end: (result: any) => {
      const elapsed = calculatorDebug.endTimer(functionName);
      calculatorDebug.log(`Completed ${functionName} in ${elapsed.toFixed(2)}ms`, result);
      return result;
    },
    error: (error: any) => {
      calculatorDebug.endTimer(functionName);
      calculatorDebug.error(`Error in ${functionName}`, error);
      throw error;
    }
  };
}

/**
 * Get a summary of the calculation process
 */
export function getCalculationSummary(): string {
  const steps = calculatorDebug.calculationSteps;
  const totalTime = calculatorDebug.getElapsedTime('totalCalculation');
  
  let summary = `Calculation completed in ${totalTime.toFixed(2)}ms with ${steps.length} steps.
`;
  
  // Find errors
  const errors = steps.filter(step => step.startsWith('ERROR:'));
  if (errors.length > 0) {
    summary += `
Errors (${errors.length}):
`;
    errors.forEach(error => {
      summary += `- ${error}
`;
    });
  }
  
  // Find warnings
  const warnings = steps.filter(step => step.startsWith('WARNING:'));
  if (warnings.length > 0) {
    summary += `
Warnings (${warnings.length}):
`;
    warnings.forEach(warning => {
      summary += `- ${warning}
`;
    });
  }
  
  return summary;
}