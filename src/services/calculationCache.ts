
import { CalculationParams, PricingMatrix } from './calculatorUtils';

// Cache for expensive calculations
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  expiresAt: number;
}

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_CACHE_SIZE = 50; // Maximum number of entries to store

// Generic cache implementation
class CalculationCache<K, V> {
  private cache = new Map<string, CacheEntry<V>>();
  private maxSize: number;
  private duration: number;

  constructor(maxSize = MAX_CACHE_SIZE, duration = CACHE_DURATION) {
    this.maxSize = maxSize;
    this.duration = duration;
  }

  // Generate a cache key from the parameters
  private generateKey(key: K): string {
    return JSON.stringify(key);
  }

  // Get a value from the cache
  get(key: K): V | null {
    const cacheKey = this.generateKey(key);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) return null;
    
    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return entry.value;
  }

  // Set a value in the cache
  set(key: K, value: V): void {
    // Clean up expired entries before adding new ones
    this.cleanup();
    
    // If cache is at max size, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.getOldestKey();
      if (oldestKey) this.cache.delete(oldestKey);
    }
    
    const cacheKey = this.generateKey(key);
    const now = Date.now();
    
    this.cache.set(cacheKey, {
      value,
      timestamp: now,
      expiresAt: now + this.duration
    });
  }

  // Get the oldest key in the cache
  private getOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Clear the entire cache
  clear(): void {
    this.cache.clear();
  }

  // Get the current size of the cache
  get size(): number {
    return this.cache.size;
  }
}

// Specific cache instances
export const pricingCache = new CalculationCache<string, PricingMatrix>();
export const paramsCache = new CalculationCache<string, CalculationParams>();
export const configurationCache = new CalculationCache<{
  kwPerRack: number;
  coolingType: string;
  totalRacks: number;
  options: string;
}, any>();
export const locationFactorsCache = new CalculationCache<{
  latitude: number;
  longitude: number;
}, any>();

// Helper function to memoize expensive calculations
export function memoize<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  cache: CalculationCache<any, any>,
  keyFn: (...args: Parameters<T>) => any = (...args) => args
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = keyFn(...args);
    const cachedResult = cache.get(key);
    
    if (cachedResult !== null) {
      return cachedResult as ReturnType<T>;
    }
    
    const result = await fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}
