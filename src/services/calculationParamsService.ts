import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { CalculationParams, validateCalculationParams, ensureParamsStructure } from "@/types/calculationParams";
import { DEFAULT_CALCULATION_PARAMS } from "@/constants/calculatorConstants";

const COLLECTION_PATH = "matrix_calculator";
const DOCUMENT_ID = "calculation_params";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to add delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Loads calculation parameters from Firestore with retry logic
 */
export async function loadCalculationParams(): Promise<CalculationParams> {
  const db = getFirestore();
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < MAX_RETRIES) {
    try {
      const paramsDoc = await getDoc(doc(db, COLLECTION_PATH, DOCUMENT_ID));
      
      if (paramsDoc.exists()) {
        const data = paramsDoc.data();
        // Ensure the data has the correct structure
        return ensureParamsStructure(data);
      } else {
        // Document doesn't exist, return default params
        return { ...DEFAULT_CALCULATION_PARAMS } as CalculationParams;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retries++;
      
      if (retries < MAX_RETRIES) {
        // Wait before retrying
        await delay(RETRY_DELAY * retries);
      }
    }
  }

  // If we've exhausted all retries, throw the last error
  if (lastError) {
    throw new Error(`Failed to load calculation parameters after ${MAX_RETRIES} attempts: ${lastError.message}`);
  }

  // Fallback to default params if all else fails
  return { ...DEFAULT_CALCULATION_PARAMS } as CalculationParams;
}

/**
 * Saves calculation parameters to Firestore with validation and retry logic
 */
export async function saveCalculationParams(params: CalculationParams): Promise<void> {
  // Validate the parameters first
  const validation = validateCalculationParams(params);
  if (!validation.isValid) {
    throw new Error(`Invalid calculation parameters: ${validation.errors.join(", ")}`);
  }

  const db = getFirestore();
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < MAX_RETRIES) {
    try {
      await setDoc(doc(db, COLLECTION_PATH, DOCUMENT_ID), params);
      return; // Success, exit the function
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retries++;
      
      if (retries < MAX_RETRIES) {
        // Wait before retrying
        await delay(RETRY_DELAY * retries);
      }
    }
  }

  // If we've exhausted all retries, throw the last error
  if (lastError) {
    throw new Error(`Failed to save calculation parameters after ${MAX_RETRIES} attempts: ${lastError.message}`);
  }
}