
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getFirestoreAsync, ensureFirebaseInitializedAsync } from '@/lib/firebase';
import { DEFAULT_PRICING, DEFAULT_CALCULATION_PARAMS } from '@/constants/calculatorConstants';
import { calculatorDebug } from '@/services/calculatorDebug';

/**
 * Bootstraps the Matrix Calculator by ensuring Firebase is initialized
 * and the required collections and documents exist
 */
export async function bootstrapMatrixCalculator(): Promise<boolean> {
  try {
    console.log('[Matrix Calculator] Starting bootstrap process...');
    
    // First, ensure Firebase is initialized
    const initialized = await ensureFirebaseInitializedAsync();
    if (!initialized) {
      console.error('[Matrix Calculator] Firebase initialization failed during bootstrap');
      calculatorDebug.error('Firebase initialization failed during bootstrap');
      return false;
    }
    
    // Get Firestore instance
    const db = await getFirestoreAsync();
    console.log('[Matrix Calculator] Successfully got Firestore instance');
    
    // Create the matrix_calculator collection if it doesn't exist
    // (In Firestore, collections are created implicitly when documents are added)
    
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
    
    // Create the user_configurations subcollection if it doesn't exist
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
    return await bootstrapMatrixCalculator();
  } catch (error) {
    console.error('[Matrix Calculator] Error waiting for bootstrap:', error);
    calculatorDebug.error('Error waiting for Matrix Calculator bootstrap', error);
    return false;
  }
}
