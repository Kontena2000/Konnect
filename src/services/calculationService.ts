import { 
  serverTimestamp, 
  doc, 
  setDoc, 
  addDoc, 
  collection, 
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { getFirestoreSafely, ensureFirebaseInitializedAsync } from '@/lib/firebase';
import { calculatorDebug } from './calculatorDebug';
import { waitForMatrixCalculatorBootstrap } from '@/utils/matrixCalculatorBootstrap';
import { CalculationConfig, CalculationOptions } from './matrixCalculatorService';

/**
 * Save a calculation result to Firestore
 * This function ensures the required collections exist before saving
 */
export async function saveCalculationResult(
  userId: string, 
  config: {
    kwPerRack: number;
    coolingType: string;
    totalRacks: number;
  },
  results: any, 
  name: string, 
  options: CalculationOptions = {},
  projectId?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    console.log('[Matrix Calculator] Starting save calculation process...');
    calculatorDebug.log('Starting save calculation process', { userId, config, name, projectId });
    
    // First, ensure Firebase is fully initialized
    await ensureFirebaseInitializedAsync();
    
    // Then ensure Matrix Calculator is bootstrapped
    const bootstrapped = await waitForMatrixCalculatorBootstrap();
    if (!bootstrapped) {
      console.error('[Matrix Calculator] Failed to bootstrap Matrix Calculator');
      calculatorDebug.error('Failed to bootstrap Matrix Calculator', 'Bootstrap process failed');
      return { success: false, error: 'Failed to bootstrap Matrix Calculator' };
    }
    
    // Get Firestore instance directly
    const db = getFirestoreSafely();
    if (!db) {
      console.error('[Matrix Calculator] Firestore is not available');
      calculatorDebug.error('Firestore is not available', 'Cannot access Firestore');
      return { success: false, error: 'Firestore is not available' };
    }
    
    console.log('[Matrix Calculator] Successfully got Firestore instance for saving');
    
    // Extract options with defaults
    const redundancyMode = options.redundancyMode || 'N+1';
    const includeGenerator = options.includeGenerator || false;
    const sustainabilityOptions = options.sustainabilityOptions || {};
    const location = options.location || null;
    
    // If projectId is provided, validate project access
    if (projectId) {
      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);
        
        if (!projectSnap.exists()) {
          console.error('[Matrix Calculator] Project not found:', projectId);
          calculatorDebug.error('Project not found', projectId);
          return { success: false, error: 'Project not found' };
        }
        
        // Special case for ruud@kontena.eu - always has full access
        if (userId !== 'ruud@kontena.eu') {
          const project = projectSnap.data();
          if (project.userId !== userId && !project.sharedWith?.includes(userId)) {
            console.error('[Matrix Calculator] Unauthorized access to project:', projectId);
            calculatorDebug.error('Unauthorized access to project', projectId);
            return { success: false, error: 'Unauthorized access to project' };
          }
        }
      } catch (error) {
        console.error('[Matrix Calculator] Error validating project access:', error);
        calculatorDebug.error('Error validating project access', error);
        return { success: false, error: 'Error validating project access' };
      }
    }
    
    // Create the matrix_calculator collection and user_configurations document if they don't exist
    try {
      // Check if the matrix_calculator/user_configurations document exists
      const configsRef = doc(db, 'matrix_calculator', 'user_configurations');
      const configsDoc = await getDoc(configsRef);
      
      if (!configsDoc.exists()) {
        console.log('[Matrix Calculator] Creating user_configurations document');
        calculatorDebug.log('Creating user_configurations document');
        await setDoc(configsRef, {
          created: serverTimestamp(),
          description: 'User calculation configurations'
        });
        console.log('[Matrix Calculator] user_configurations document created successfully');
      } else {
        console.log('[Matrix Calculator] user_configurations document already exists');
      }
    } catch (error) {
      console.error('[Matrix Calculator] Error checking/creating collections:', error);
      calculatorDebug.error('Error checking/creating collections', error);
      // Continue anyway, as the collection will be created implicitly
    }
    
    // Create a timestamp for createdAt and updatedAt
    const now = Timestamp.now();
    
    // Save the calculation
    try {
      console.log('[Matrix Calculator] Saving calculation to Firestore...');
      calculatorDebug.log('Saving calculation to Firestore');
      
      // Prepare calculation data
      const calculationData = {
        name: name || `${config.kwPerRack}kW ${config.coolingType} configuration`,
        description: `${config.totalRacks} racks at ${config.kwPerRack}kW per rack`,
        userId,
        projectId: projectId || null,
        createdAt: now,
        updatedAt: now,
        kwPerRack: config.kwPerRack,
        coolingType: config.coolingType,
        totalRacks: config.totalRacks,
        options: options ? JSON.parse(JSON.stringify(options)) : null,
        results: JSON.parse(JSON.stringify(results))
      };
      
      // Create a direct reference to the configs subcollection
      const calculationsRef = collection(db, 'matrix_calculator', 'user_configurations', 'configs');
      const docRef = await addDoc(calculationsRef, calculationData);
      
      console.log('[Matrix Calculator] Calculation saved successfully with ID:', docRef.id);
      calculatorDebug.log('Calculation saved successfully', { id: docRef.id, projectId: projectId || null });
      
      return { 
        success: true,
        id: docRef.id
      };
    } catch (error) {
      console.error('[Matrix Calculator] Error saving calculation to Firestore:', error);
      calculatorDebug.error('Error saving calculation to Firestore', error);
      return { success: false, error: 'Error saving calculation to Firestore' };
    }
  } catch (error) {
    console.error('[Matrix Calculator] Error in saveCalculationResult:', error);
    calculatorDebug.error('Error in saveCalculationResult', error);
    return { success: false, error: 'Error in saveCalculationResult' };
  }
}

/**
 * Get calculations for a specific project
 */
export async function getProjectCalculations(projectId: string): Promise<any[]> {
  try {
    // Ensure Firebase is fully initialized
    await ensureFirebaseInitializedAsync();
    
    // Get Firestore instance directly
    const db = getFirestoreSafely();
    if (!db) {
      console.error('[Matrix Calculator] Firestore is not available');
      calculatorDebug.error('Firestore is not available', 'Cannot access Firestore');
      return [];
    }
    
    const querySnapshot = await getDocs(
      query(
        collection(db, 'matrix_calculator', 'user_configurations', 'configs'),
        where('projectId', '==', projectId)
      )
    );
    
    const calculations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return calculations;
  } catch (error) {
    console.error('[Matrix Calculator] Error fetching project calculations:', error);
    calculatorDebug.error('Error fetching project calculations', error);
    return [];
  }
}

/**
 * Get calculations for a specific user
 */
export async function getUserCalculations(userId: string): Promise<any[]> {
  try {
    // Ensure Firebase is fully initialized
    await ensureFirebaseInitializedAsync();
    
    // Get Firestore instance directly
    const db = getFirestoreSafely();
    if (!db) {
      console.error('[Matrix Calculator] Firestore is not available');
      calculatorDebug.error('Firestore is not available', 'Cannot access Firestore');
      return [];
    }
    
    const querySnapshot = await getDocs(
      query(
        collection(db, 'matrix_calculator', 'user_configurations', 'configs'),
        where('userId', '==', userId)
      )
    );
    
    const calculations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return calculations;
  } catch (error) {
    console.error('[Matrix Calculator] Error fetching user calculations:', error);
    calculatorDebug.error('Error fetching user calculations', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

/**
 * Get a specific calculation by ID
 */
export async function getCalculationById(calculationId: string): Promise<any> {
  try {
    // Ensure Firebase is fully initialized
    await ensureFirebaseInitializedAsync();
    
    // Get Firestore instance directly
    const db = getFirestoreSafely();
    if (!db) {
      console.error('[Matrix Calculator] Firestore is not available');
      calculatorDebug.error('Firestore is not available', 'Cannot access Firestore');
      return null;
    }
    
    const calculationRef = doc(db, 'matrix_calculator', 'user_configurations', 'configs', calculationId);
    const calculationSnap = await getDoc(calculationRef);
    
    if (calculationSnap.exists()) {
      return {
        id: calculationSnap.id,
        ...calculationSnap.data()
      };
    } else {
      console.error('[Matrix Calculator] Calculation not found:', calculationId);
      calculatorDebug.error('Calculation not found', calculationId);
      return null;
    }
  } catch (error) {
    console.error('[Matrix Calculator] Error fetching calculation:', error);
    calculatorDebug.error('Error fetching calculation', error);
    return null;
  }
}

/**
 * Delete a calculation by ID
 */
export async function deleteCalculation(calculationId: string, userId: string): Promise<boolean> {
  try {
    // Ensure Firebase is fully initialized
    await ensureFirebaseInitializedAsync();
    
    // Get Firestore instance directly
    const db = getFirestoreSafely();
    if (!db) {
      console.error('[Matrix Calculator] Firestore is not available');
      calculatorDebug.error('Firestore is not available', 'Cannot access Firestore');
      return false;
    }
    
    const calculationRef = doc(db, 'matrix_calculator', 'user_configurations', 'configs', calculationId);
    const calculationSnap = await getDoc(calculationRef);
    
    if (!calculationSnap.exists()) {
      console.error('[Matrix Calculator] Calculation not found:', calculationId);
      calculatorDebug.error('Calculation not found', calculationId);
      return false;
    }
    
    const calculation = calculationSnap.data();
    
    // Special case for ruud@kontena.eu - always has full access
    if (userId !== 'ruud@kontena.eu' && calculation.userId !== userId) {
      console.error('[Matrix Calculator] Unauthorized access to delete calculation:', calculationId);
      calculatorDebug.error('Unauthorized access to delete calculation', calculationId);
      return false;
    }
    
    await deleteDoc(calculationRef);
    
    console.log('[Matrix Calculator] Calculation deleted successfully:', calculationId);
    calculatorDebug.log('Calculation deleted successfully', { id: calculationId });
    
    return true;
  } catch (error) {
    console.error('[Matrix Calculator] Error deleting calculation:', error);
    calculatorDebug.error('Error deleting calculation', error);
    return false;
  }
}
