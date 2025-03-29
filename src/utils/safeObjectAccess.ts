
/**
 * Utility functions for safely accessing nested properties in objects
 * and providing defaults when properties don't exist
 */

/**
 * Safely access a nested property in an object
 * @param obj The object to access
 * @param path The path to the property (e.g., 'power.ups.requiredCapacity')
 * @param defaultValue The default value to return if the property doesn't exist
 * @returns The value at the path or the default value
 */
export function getNestedProperty<T>(obj: any, path: string, defaultValue: T): T {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }

  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[part];
  }

  return current !== undefined && current !== null ? current : defaultValue;
}

/**
 * Safely set a nested property in an object, creating the path if it doesn't exist
 * @param obj The object to modify
 * @param path The path to the property (e.g., 'power.ups.requiredCapacity')
 * @param value The value to set
 * @returns The modified object
 */
export function setNestedProperty<T>(obj: any, path: string, value: T): any {
  if (!obj || typeof obj !== 'object') {
    obj = {};
  }

  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || current[part] === null || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }

  current[parts[parts.length - 1]] = value;
  return obj;
}

/**
 * Ensure an object has all required properties, creating them with defaults if missing
 * @param obj The object to validate
 * @param schema An object mapping paths to default values
 * @returns The validated object with all required properties
 */
export function ensureObjectStructure(obj: any, schema: Record<string, any>): any {
  if (!obj || typeof obj !== 'object') {
    obj = {};
  }

  const result = { ...obj };
  
  for (const [path, defaultValue] of Object.entries(schema)) {
    const value = getNestedProperty(result, path, undefined);
    if (value === undefined) {
      setNestedProperty(result, path, defaultValue);
    }
  }

  return result;
}

/**
 * Convert a value to a number, with a default if conversion fails
 * @param value The value to convert
 * @param defaultValue The default value to use if conversion fails
 * @returns The converted number or the default value
 */
export function toNumber(value: any, defaultValue: number): number {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Safely perform a division operation, handling division by zero
 * @param numerator The numerator
 * @param denominator The denominator
 * @param defaultValue The default value to return if division by zero
 * @returns The result of the division or the default value
 */
export function safeDivide(numerator: number, denominator: number, defaultValue: number): number {
  if (denominator === 0) {
    return defaultValue;
  }
  return numerator / denominator;
}
