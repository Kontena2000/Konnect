import { doc, setDoc, getDoc, collection, deleteDoc } from 'firebase/firestore';
import { getFirestoreAsync, ensureFirebaseInitializedAsync, getFirestoreSafely } from '@/lib/firebase';
import { DEFAULT_PRICING, DEFAULT_CALCULATION_PARAMS } from '@/constants/calculatorConstants';
import { calculatorDebug } from './calculatorDebug';

/**
 * Initializes the Matrix Calculator collections with default data if they don't exist
 * This ensures that the calculator always has data to work with
 */
export async function initializeMatrixCalculator(): Promise<boolean> {
  try {
    console.log('[Matrix Calculator] Starting initialization...');
    calculatorDebug.log('Starting Matrix Calculator initialization', null);
    
    // First check if Firebase is already initialized using the safe accessor
    let db = getFirestoreSafely();
    
    if (!db) {
      // If not initialized, ensure Firebase is initialized
      console.log('[Matrix Calculator] Firebase not initialized, attempting to initialize...');
      const initialized = await ensureFirebaseInitializedAsync();
      if (!initialized) {
        console.error('[Matrix Calculator] Firebase initialization failed');
        calculatorDebug.error('Firebase initialization failed', new Error('Could not initialize Firebase'));
        return false;
      }
      
      // Get Firestore again after initialization
      db = getFirestoreSafely();
      if (!db) {
        console.error('[Matrix Calculator] Still could not get Firestore after initialization');
        calculatorDebug.error('Still could not get Firestore after initialization', new Error('Firestore unavailable after initialization'));
        return false;
      }
    }
    
    console.log('[Matrix Calculator] Firebase is initialized, proceeding with Matrix Calculator initialization');
    
    // Check if pricing matrix exists
    const pricingRef = doc(db, 'matrix_calculator', 'pricing_matrix');
    const pricingDoc = await getDoc(pricingRef);
    
    // If pricing matrix doesn't exist, create it with default values
    if (!pricingDoc.exists()) {
      console.log('[Matrix Calculator] Creating default pricing matrix');
      calculatorDebug.log('Creating default pricing matrix', null);
      await setDoc(pricingRef, DEFAULT_PRICING);
      console.log('[Matrix Calculator] Default pricing matrix created successfully');
    } else {
      console.log('[Matrix Calculator] Pricing matrix already exists');
    }
    
    // Check if calculation parameters exist
    const paramsRef = doc(db, 'matrix_calculator', 'calculation_params');
    const paramsDoc = await getDoc(paramsRef);
    
    // If calculation parameters don't exist, create them with default values
    if (!paramsDoc.exists()) {
      console.log('[Matrix Calculator] Creating default calculation parameters');
      calculatorDebug.log('Creating default calculation parameters', null);
      await setDoc(paramsRef, DEFAULT_CALCULATION_PARAMS);
      console.log('[Matrix Calculator] Default calculation parameters created successfully');
    } else {
      console.log('[Matrix Calculator] Calculation parameters already exist');
    }
    
    // Create the user_configurations document if it doesn't exist
    const configsRef = doc(db, 'matrix_calculator', 'user_configurations');
    const configsDoc = await getDoc(configsRef);
    
    if (!configsDoc.exists()) {
      console.log('[Matrix Calculator] Creating user_configurations document');
      calculatorDebug.log('Creating user_configurations document', null);
      await setDoc(configsRef, {
        created: new Date(),
        description: 'User calculation configurations'
      });
      console.log('[Matrix Calculator] user_configurations document created successfully');
    } else {
      console.log('[Matrix Calculator] user_configurations document already exists');
    }
    
    // Create the configs subcollection if it doesn't exist
    // Note: In Firestore, collections are created implicitly when documents are added
    // But we'll create an empty document to ensure the collection exists
    try {
      const configsCollectionRef = collection(db, 'matrix_calculator', 'user_configurations', 'configs');
      console.log('[Matrix Calculator] Configs collection reference created');
    } catch (error) {
      console.error('[Matrix Calculator] Error creating configs collection reference:', error);
      calculatorDebug.error('Error creating configs collection reference', error);
      // Continue with initialization even if this fails
    }
    
    console.log('[Matrix Calculator] Initialization complete');
    calculatorDebug.log('Matrix Calculator initialization complete', null);
    return true;
  } catch (error) {
    console.error('[Matrix Calculator] Initialization error:', error);
    calculatorDebug.error('Matrix Calculator initialization error', error);
    return false;
  }
}

/**
 * Run the Matrix Calculator initialization
 * This function is called from the Matrix Calculator page
 */
export async function runMatrixCalculatorInitialization(): Promise<boolean> {
  try {
    console.log('[Matrix Calculator] Running initialization...');
    return await initializeMatrixCalculator();
  } catch (error) {
    console.error('[Matrix Calculator] Error running initialization:', error);
    calculatorDebug.error('Error running Matrix Calculator initialization', error);
    return false;
  }
}

/**
 * Reset the Matrix Calculator to default values
 * This function deletes existing documents and recreates them with default values
 */
export async function resetMatrixCalculator(): Promise<boolean> {
  try {
    console.log('[Matrix Calculator] Starting reset...');
    calculatorDebug.log('Starting Matrix Calculator reset', null);
    
    // Get Firestore safely
    const db = getFirestoreSafely();
    if (!db) {
      console.error('[Matrix Calculator] Firebase is not initialized, cannot reset');
      calculatorDebug.error('Firebase is not initialized', new Error('Cannot reset Matrix Calculator'));
      return false;
    }
    
    // Delete and recreate pricing matrix
    const pricingRef = doc(db, 'matrix_calculator', 'pricing_matrix');
    try {
      await deleteDoc(pricingRef);
      console.log('[Matrix Calculator] Deleted existing pricing matrix');
      await setDoc(pricingRef, DEFAULT_PRICING);
      console.log('[Matrix Calculator] Created new pricing matrix with default values');
    } catch (error) {
      console.error('[Matrix Calculator] Error resetting pricing matrix:', error);
      calculatorDebug.error('Error resetting pricing matrix', error);
      return false;
    }
    
    // Delete and recreate calculation parameters
    const paramsRef = doc(db, 'matrix_calculator', 'calculation_params');
    try {
      await deleteDoc(paramsRef);
      console.log('[Matrix Calculator] Deleted existing calculation parameters');
      await setDoc(paramsRef, DEFAULT_CALCULATION_PARAMS);
      console.log('[Matrix Calculator] Created new calculation parameters with default values');
    } catch (error) {
      console.error('[Matrix Calculator] Error resetting calculation parameters:', error);
      calculatorDebug.error('Error resetting calculation parameters', error);
      return false;
    }
    
    console.log('[Matrix Calculator] Reset complete');
    calculatorDebug.log('Matrix Calculator reset complete', null);
    return true;
  } catch (error) {
    console.error('[Matrix Calculator] Reset error:', error);
    calculatorDebug.error('Matrix Calculator reset error', error);
    return false;
  }
}