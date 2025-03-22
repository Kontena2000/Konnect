
import { projectOperations } from "./operations";
import { Project, ProjectError, CreateProjectData } from "./types";
import { validateProject } from "./validation";
import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query, 
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  writeBatch,
  Timestamp
} from "firebase/firestore";
import firebaseMonitor from '@/services/firebase-monitor';

const projectService = {
  ...projectOperations,

  async getProject(id: string): Promise<Project | null> {
    try {
      firebaseMonitor.logOperation({
        type: 'project',
        action: 'get',
        status: 'pending',
        timestamp: Date.now(),
        details: { id }
      });

      const projectRef = doc(db, "projects", id);
      const snapshot = await getDoc(projectRef);
      
      if (!snapshot.exists()) {
        firebaseMonitor.logOperation({
          type: 'project',
          action: 'get',
          status: 'error',
          timestamp: Date.now(),
          error: 'Project not found',
          details: { id }
        });
        return null;
      }

      firebaseMonitor.logOperation({
        type: 'project',
        action: 'get',
        status: 'success',
        timestamp: Date.now(),
        details: { id }
      });

      return {
        id: snapshot.id,
        ...snapshot.data()
      } as Project;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      firebaseMonitor.logOperation({
        type: 'project',
        action: 'get',
        status: 'error',
        timestamp: Date.now(),
        error: errorMessage,
        details: { id }
      });
      throw new ProjectError("Failed to fetch project details", "FETCH_FAILED", error);
    }
  },

  // ... Rest of the service methods remain the same but imported from operations
};

export default projectService;
export type { Project, ProjectError, CreateProjectData };
