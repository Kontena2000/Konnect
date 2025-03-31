import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getFirestoreSafely } from '@/lib/firebase';
import { DEFAULT_PRICING, DEFAULT_CALCULATION_PARAMS } from '@/constants/calculatorConstants';
import { calculatorDebug } from '@/services/calculatorDebug';

/**
 * Bootstraps the Matrix Calculator by ensuring the required collections and documents exist
 * This function assumes Firebase is already initialized by the main app
 */
export async function bootstrapMatrixCalculator(): Promise<boolean> {
  try {
    console.log('[Matrix Calculator] Starting bootstrap process...');
    
    // Get Firestore instance using the safe accessor (doesn't try to initialize Firebase)
    const db = getFirestoreSafely();
    if (!db) {
      console.error('[Matrix Calculator] Firestore is not available during bootstrap');
      calculatorDebug.error('Firestore is not available during bootstrap');
      return false;
    }
    
    console.log('[Matrix Calculator] Successfully got Firestore instance');
    
    // Create the matrix_calculator collection if it doesn't exist
    // This is done implicitly by creating documents within it
    
    // Create the pricing_matrix document if it doesn't exist
    try {
      const pricingRef = doc(db, 'matrix_calculator', 'pricing_matrix');
      const pricingDoc = await getDoc(pricingRef);
      
      if (!pricingDoc.exists()) {
        console.log('[Matrix Calculator] Creating default pricing matrix');
        calculatorDebug.log('Creating default pricing matrix');
        await setDoc(pricingRef, DEFAULT_PRICING);
        console.log('[Matrix Calculator] Default pricing matrix created successfully');
      } else {
        console.log('[Matrix Calculator] Pricing matrix already exists');
      }
    } catch (error) {
      console.error('[Matrix Calculator] Error creating pricing matrix:', error);
      calculatorDebug.error('Error creating pricing matrix', error);
      // Continue with bootstrap process even if this fails
    }
    
    // Create the calculation_params document if it doesn't exist
    try {
      const paramsRef = doc(db, 'matrix_calculator', 'calculation_params');
      const paramsDoc = await getDoc(paramsRef);
      
      if (!paramsDoc.exists()) {
        console.log('[Matrix Calculator] Creating default calculation parameters');
        calculatorDebug.log('Creating default calculation parameters');
        await setDoc(paramsRef, DEFAULT_CALCULATION_PARAMS);
        console.log('[Matrix Calculator] Default calculation parameters created successfully');
      } else {
        console.log('[Matrix Calculator] Calculation parameters already exists');
      }
    } catch (error) {
      console.error('[Matrix Calculator] Error creating calculation parameters:', error);
      calculatorDebug.error('Error creating calculation parameters', error);
      // Continue with bootstrap process even if this fails
    }
    
    // Create the user_configurations document if it doesn't exist
    try {
      const configsRef = doc(db, 'matrix_calculator', 'user_configurations');
      const configsDoc = await getDoc(configsRef);
      
      if (!configsDoc.exists()) {
        console.log('[Matrix Calculator] Creating user_configurations document');
        calculatorDebug.log('Creating user_configurations document');
        await setDoc(configsRef, {
          created: new Date(),
          description: 'User calculation configurations'
        });
        console.log('[Matrix Calculator] user_configurations document created successfully');
      } else {
        console.log('[Matrix Calculator] user_configurations document already exists');
      }
    } catch (error) {
      console.error('[Matrix Calculator] Error creating user_configurations document:', error);
      calculatorDebug.error('Error creating user_configurations document', error);
      // Continue with bootstrap process even if this fails
    }
    
    console.log('[Matrix Calculator] Bootstrap process completed successfully');
    calculatorDebug.log('Matrix Calculator bootstrap completed successfully');
    return true;
  } catch (error) {
    console.error('[Matrix Calculator] Bootstrap process failed:', error);
    calculatorDebug.error('Matrix Calculator bootstrap failed', error);
    return false;
  }
}

/**
 * Wait for the Matrix Calculator to be bootstrapped
 * This function can be used in components to ensure the Matrix Calculator is ready
 */
export async function waitForMatrixCalculatorBootstrap(): Promise<boolean> {
  try {
    // Ensure we don't try to bootstrap on the server side
    if (typeof window === 'undefined') {
      console.log('[Matrix Calculator] Skipping bootstrap on server side');
      return false;
    }
    
    return await bootstrapMatrixCalculator();
  } catch (error) {
    console.error('[Matrix Calculator] Error waiting for bootstrap:', error);
    calculatorDebug.error('Error waiting for Matrix Calculator bootstrap', error);
    return false;
  }
}