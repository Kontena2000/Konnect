
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getFirestoreAsync, ensureFirebaseInitializedAsync } from '@/lib/firebase';
import { DEFAULT_PRICING, DEFAULT_CALCULATION_PARAMS } from '@/constants/calculatorConstants';
import { calculatorDebug } from './calculatorDebug';

/**
 * Initializes the Matrix Calculator collections with default data if they don't exist
 * This ensures that the calculator always has data to work with
 */
export async function initializeMatrixCalculator(): Promise<boolean> {
  try {
    console.log('[Matrix Calculator] Starting initialization...');
    calculatorDebug.log('Starting Matrix Calculator initialization');
    
    // Ensure Firebase is initialized
    const initialized = await ensureFirebaseInitializedAsync();
    if (!initialized) {
      console.error('[Matrix Calculator] Firebase initialization failed');
      calculatorDebug.error('Firebase initialization failed', 'Could not initialize Firebase');
      return false;
    }
    
    // Get Firestore
    const db = await getFirestoreAsync();
    
    // Check if pricing matrix exists
    const pricingRef = doc(db, 'matrix_calculator', 'pricing_matrix');
    const pricingDoc = await getDoc(pricingRef);
    
    // If pricing matrix doesn't exist, create it with default values
    if (!pricingDoc.exists()) {
      console.log('[Matrix Calculator] Creating default pricing matrix');
      calculatorDebug.log('Creating default pricing matrix');
      await setDoc(pricingRef, DEFAULT_PRICING);
    } else {
      console.log('[Matrix Calculator] Pricing matrix already exists');
    }
    
    // Check if calculation parameters exist
    const paramsRef = doc(db, 'matrix_calculator', 'calculation_params');
    const paramsDoc = await getDoc(paramsRef);
    
    // If calculation parameters don't exist, create them with default values
    if (!paramsDoc.exists()) {
      console.log('[Matrix Calculator] Creating default calculation parameters');
      calculatorDebug.log('Creating default calculation parameters');
      await setDoc(paramsRef, DEFAULT_CALCULATION_PARAMS);
    } else {
      console.log('[Matrix Calculator] Calculation parameters already exist');
    }
    
    // Create the user_configurations collection if it doesn't exist
    // (Firestore collections are created implicitly when documents are added)
    
    console.log('[Matrix Calculator] Initialization complete');
    calculatorDebug.log('Matrix Calculator initialization complete');
    return true;
  } catch (error) {
    console.error('[Matrix Calculator] Initialization error:', error);
    calculatorDebug.error('Matrix Calculator initialization error', error);
    return false;
  }
}
