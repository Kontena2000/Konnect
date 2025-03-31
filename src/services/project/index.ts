
import { CreateProjectData, ProjectError } from './types';
import { validateProject } from './validation';
import { projectOperations } from './operations';
import { 
  getFirestoreOrThrow, 
  getCurrentUserOrThrow,
  safeDocRef,
  safeCollectionRef
} from '@/services/firebaseHelpers';
import { doc, getDoc } from 'firebase/firestore';

// Export the project operations
export default {
  ...projectOperations,
  
  // Add any additional methods here
  async getProject(id: string): Promise<any> {
    const projectRef = safeDocRef('projects', id);
    const snapshot = await getDoc(projectRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return {
      id: snapshot.id,
      ...snapshot.data()
    };
  }
};

// Export types
export type { CreateProjectData, ProjectError };
