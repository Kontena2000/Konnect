import { db, auth } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { CreateProjectData, ProjectError } from "./types";
import { validateProject } from "./validation";
import firebaseMonitor from '@/services/firebase-monitor';
import { 
  getFirestoreOrThrow, 
  getAuthOrThrow, 
  getCurrentUserOrThrow,
  safeDocRef,
  safeCollectionRef
} from '@/services/firebaseHelpers';

export const projectOperations = {
  async createProject(data: CreateProjectData): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new ProjectError('Not authenticated', 'AUTH_REQUIRED');
      }

      firebaseMonitor.logOperation({
        type: 'project',
        action: 'create',
        status: 'pending',
        timestamp: Date.now(),
        details: { name: data.name }
      });
      
      if (!validateProject(data)) {
        const error = 'Project validation failed: ' + JSON.stringify(data);
        firebaseMonitor.logOperation({
          type: 'project',
          action: 'create',
          status: 'error',
          timestamp: Date.now(),
          error: error,
          details: data
        });
        throw new ProjectError('Project validation failed', 'VALIDATION_FAILED');
      }

      const projectRef = await addDoc(collection(db, 'projects'), {
        name: data.name.trim(),
        description: data.description?.trim() || '',
        userId: user.uid,
        clientInfo: {
          name: data.companyName?.trim() || '',
          email: data.clientEmail?.trim() || '',
          phone: data.clientPhone?.trim() || '',
          address: data.clientAddress?.trim() || ''
        },
        status: data.status || 'planning',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        layouts: []
      });

      firebaseMonitor.logOperation({
        type: 'project',
        action: 'create',
        status: 'success',
        timestamp: Date.now(),
        details: { id: projectRef.id, name: data.name }
      });

      return projectRef.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      firebaseMonitor.logOperation({
        type: 'project',
        action: 'create',
        status: 'error',
        timestamp: Date.now(),
        error: errorMessage,
        details: data
      });
      throw new ProjectError('Failed to create project', 'CREATE_FAILED', error);
    }
  }
};