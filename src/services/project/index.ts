import { CreateProjectData, ProjectError } from './types';
import { validateProject } from './validation';
import { projectOperations } from './operations';
import { 
  getFirestoreOrThrow, 
  getCurrentUserOrThrow,
  safeDocRef,
  safeCollectionRef
} from '@/services/firebaseHelpers';
import { doc, getDoc, Firestore } from 'firebase/firestore';

// Create a new project service with the fixed implementation
const projectService = {
  ...projectOperations,
  
  // Add any additional methods here
  async getProject(id: string): Promise<any> {
    try {
      const projectRef = safeDocRef('projects', id);
      const snapshot = await getDoc(projectRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      return {
        id: snapshot.id,
        ...snapshot.data()
      };
    } catch (error) {
      console.error('Error getting project:', error);
      return null;
    }
  }
};

// Export the service and types
export default projectService;
export type { CreateProjectData, ProjectError };