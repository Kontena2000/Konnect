
import { serverTimestamp, getDoc, addDoc, getDocs, query, where } from 'firebase/firestore';
import { matrixDocRef, matrixCollectionRef } from '../matrixCalculatorHelpers';
import { CalculationConfig, CalculationOptions, SavedCalculation } from './types';

/**
 * Save calculation result to Firestore
 */
export async function saveCalculationResult(
  userId: string, 
  config: CalculationConfig, 
  results: any, 
  name: string, 
  options: CalculationOptions = {}, 
  projectId?: string
): Promise<{ id?: string; success: boolean; error?: any }> {
  try {
    // Extract options with defaults
    const redundancyMode = options.redundancyMode || 'N+1';
    const includeGenerator = options.includeGenerator || false;
    const sustainabilityOptions = options.sustainabilityOptions || {};
    const location = options.location || null;
    
    // If projectId is provided, validate project access
    if (projectId) {
      const projectRef = matrixDocRef('projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        throw new Error('Project not found');
      }
      
      // Special case for ruud@kontena.eu - always has full access
      if (userId !== 'ruud@kontena.eu') {
        const project = projectSnap.data();
        if (project.userId !== userId && !project.sharedWith?.includes(userId)) {
          throw new Error('Unauthorized access to project');
        }
      }
    }
    
    const docRef = await addDoc(matrixCollectionRef('matrix_calculator', 'user_configurations', 'configs'), {
      userId,
      name,
      description: `${config.kwPerRack}kW per rack, ${config.coolingType} cooling, ${config.totalRacks || 28} racks`,
      kwPerRack: config.kwPerRack,
      coolingType: config.coolingType,
      totalRacks: config.totalRacks || 28,
      redundancyMode,
      includeGenerator,
      sustainabilityOptions,
      location,
      projectId, // Add projectId to the saved calculation
      results,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Error saving calculation:', error);
    return { success: false, error };
  }
}

/**
 * Get calculations for a specific project
 */
export async function getProjectCalculations(projectId: string): Promise<SavedCalculation[]> {
  try {
    const querySnapshot = await getDocs(
      query(
        matrixCollectionRef('matrix_calculator', 'user_configurations', 'configs'),
        where('projectId', '==', projectId)
      )
    );
    
    const calculations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SavedCalculation[];
    
    return calculations;
  } catch (error) {
    console.error('Error fetching project calculations:', error);
    return [];
  }
}

/**
 * Fetch historical calculation data for comparison
 */
export async function fetchHistoricalCalculations(userId: string, limit = 5): Promise<SavedCalculation[]> {
  try {
    const calculationsQuery = query(
      matrixCollectionRef('matrix_calculator', 'user_configurations', 'configs'),
      where('userId', '==', userId),
      where('status', '==', 'completed')
    );
    
    const calculationsSnapshot = await getDocs(calculationsQuery);
    return calculationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as SavedCalculation[];
  } catch (error) {
    console.error('Error fetching historical calculations:', error);
    return [];
  }
}
