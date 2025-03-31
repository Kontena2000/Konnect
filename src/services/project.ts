import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  getDoc, 
  query, 
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  writeBatch,
  Timestamp
} from "firebase/firestore";
import firebaseMonitor from '@/services/firebase-monitor';
import { auth } from "@/lib/firebase";
import { 
  getFirestoreOrThrow, 
  getAuthOrThrow, 
  getCurrentUserOrThrow,
  safeDocRef,
  safeCollectionRef
} from '@/services/firebaseHelpers';

export class ProjectError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ProjectError';
    Object.setPrototypeOf(this, ProjectError.prototype);
  }
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  userId: string;
  clientInfo: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  plotWidth?: number;
  plotLength?: number;
  sharedWith?: string[];
  layouts?: { id: string }[];
  status?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateProjectData extends Record<string, unknown> {
  name: string;
  description?: string;
  userId: string;
  companyName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  status?: string;
}

export interface ProjectValidation {
  name: string;
  description?: string;
  clientEmail?: string;
  plotWidth?: number;
  plotLength?: number;
}

const validateProject = (data: Partial<ProjectValidation>): boolean => {
  if (!data.name || data.name.trim().length === 0) {
    console.error('Project validation failed: name is required');
    return false;
  }
  if (data.clientEmail && !data.clientEmail.includes('@')) {
    console.error('Project validation failed: invalid email format');
    return false;
  }
  if (data.plotWidth && (data.plotWidth <= 0 || data.plotWidth > 1000)) {
    console.error('Project validation failed: invalid plot width');
    return false;
  }
  if (data.plotLength && (data.plotLength <= 0 || data.plotLength > 1000)) {
    console.error('Project validation failed: invalid plot length');
    return false;
  }
  return true;
};

const projectService = {
  async createProject(data: CreateProjectData): Promise<string> {
    try {
      const user = getCurrentUserOrThrow();

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

      const projectRef = await addDoc(safeCollectionRef('projects'), {
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
  },

  async getProject(id: string): Promise<Project | null> {
    try {
      firebaseMonitor.logOperation({
        type: 'project',
        action: 'get',
        status: 'pending',
        timestamp: Date.now(),
        details: { id }
      });

      const projectRef = safeDocRef('projects', id);
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
      throw new ProjectError('Failed to fetch project details', 'FETCH_FAILED', error);
    }
  },

  async getUserProjects(userId: string): Promise<Project[]> {
    try {
      firebaseMonitor.logOperation({
        type: 'project',
        action: 'list',
        status: 'pending',
        timestamp: Date.now(),
        details: { userId }
      });

      const firestore = getFirestoreOrThrow();
      const projectsCollection = safeCollectionRef('projects');

      const [ownedSnapshot, sharedSnapshot] = await Promise.all([
        getDocs(query(projectsCollection, where('userId', '==', userId))),
        getDocs(query(projectsCollection, where('sharedWith', 'array-contains', userId)))
      ]);
      
      const projects = [...ownedSnapshot.docs, ...sharedSnapshot.docs].map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now()
        } as Project;
      });

      firebaseMonitor.logOperation({
        type: 'project',
        action: 'list',
        status: 'success',
        timestamp: Date.now(),
        details: { userId, count: projects.length }
      });

      return projects;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      firebaseMonitor.logOperation({
        type: 'project',
        action: 'list',
        status: 'error',
        timestamp: Date.now(),
        error: errorMessage,
        details: { userId }
      });
      throw new ProjectError('Failed to fetch projects', 'FETCH_FAILED', error);
    }
  },

  async updateProject(id: string, data: Partial<Project>, userId: string): Promise<void> {
    try {
      firebaseMonitor.logOperation({
        type: 'project',
        action: 'update',
        status: 'pending',
        timestamp: Date.now(),
        details: { id, userId }
      });

      if (!validateProject(data)) {
        firebaseMonitor.logOperation({
          type: 'project',
          action: 'update',
          status: 'error',
          timestamp: Date.now(),
          error: 'Invalid project data',
          details: { id, data }
        });
        throw new ProjectError('Invalid project data', 'VALIDATION_FAILED');
      }

      const projectRef = doc(db, 'projects', id);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        firebaseMonitor.logOperation({
          type: 'project',
          action: 'update',
          status: 'error',
          timestamp: Date.now(),
          error: 'Project not found',
          details: { id }
        });
        throw new ProjectError('Project not found', 'NOT_FOUND');
      }

      const project = projectSnap.data();
      if (project.userId !== userId && !project.sharedWith?.includes(userId)) {
        firebaseMonitor.logOperation({
          type: 'project',
          action: 'update',
          status: 'error',
          timestamp: Date.now(),
          error: 'Unauthorized access',
          details: { id, userId }
        });
        throw new ProjectError('Unauthorized to update project', 'UNAUTHORIZED');
      }

      await updateDoc(projectRef, {
        ...data,
        updatedAt: serverTimestamp()
      });

      firebaseMonitor.logOperation({
        type: 'project',
        action: 'update',
        status: 'success',
        timestamp: Date.now(),
        details: { id, userId }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      firebaseMonitor.logOperation({
        type: 'project',
        action: 'update',
        status: 'error',
        timestamp: Date.now(),
        error: errorMessage,
        details: { id, userId }
      });
      if (error instanceof ProjectError) throw error;
      throw new ProjectError('Failed to update project', 'UPDATE_FAILED', error);
    }
  },

  async deleteProject(id: string, userId: string): Promise<void> {
    try {
      firebaseMonitor.logOperation({
        type: 'project',
        action: 'delete',
        status: 'pending',
        timestamp: Date.now(),
        details: { id, userId }
      });

      const projectRef = doc(db, 'projects', id);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        firebaseMonitor.logOperation({
          type: 'project',
          action: 'delete',
          status: 'error',
          timestamp: Date.now(),
          error: 'Project not found',
          details: { id }
        });
        throw new ProjectError('Project not found', 'NOT_FOUND');
      }

      const project = projectSnap.data();
      if (project.userId !== userId) {
        firebaseMonitor.logOperation({
          type: 'project',
          action: 'delete',
          status: 'error',
          timestamp: Date.now(),
          error: 'Unauthorized access',
          details: { id, userId }
        });
        throw new ProjectError('Unauthorized to delete project', 'UNAUTHORIZED');
      }

      const batch = writeBatch(db);

      // Delete all layouts associated with the project
      const layoutsQuery = query(
        collection(db, 'layouts'),
        where('projectId', '==', id)
      );
      const layoutsSnapshot = await getDocs(layoutsQuery);
      layoutsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete all modules associated with the layouts
      const modulesQuery = query(
        collection(db, 'modules'),
        where('projectId', '==', id)
      );
      const modulesSnapshot = await getDocs(modulesQuery);
      modulesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Finally delete the project
      batch.delete(projectRef);
      await batch.commit();

      firebaseMonitor.logOperation({
        type: 'project',
        action: 'delete',
        status: 'success',
        timestamp: Date.now(),
        details: { 
          id, 
          userId,
          deletedLayouts: layoutsSnapshot.size,
          deletedModules: modulesSnapshot.size
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      firebaseMonitor.logOperation({
        type: 'project',
        action: 'delete',
        status: 'error',
        timestamp: Date.now(),
        error: errorMessage,
        details: { id, userId }
      });
      if (error instanceof ProjectError) throw error;
      throw new ProjectError('Failed to delete project', 'DELETE_FAILED', error);
    }
  },

  async shareProject(projectId: string, email: string): Promise<void> {
    try {
      firebaseMonitor.logOperation({
        type: 'project',
        action: 'share',
        status: 'pending',
        timestamp: Date.now(),
        details: { projectId, email }
      });

      if (!email || !email.includes("@")) {
        firebaseMonitor.logOperation({
          type: 'project',
          action: 'share',
          status: 'error',
          timestamp: Date.now(),
          error: 'Invalid email address',
          details: { projectId, email }
        });
        throw new ProjectError("Invalid email address", "VALIDATION_FAILED");
      }

      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, {
        sharedWith: arrayUnion(email)
      });

      firebaseMonitor.logOperation({
        type: 'project',
        action: 'share',
        status: 'success',
        timestamp: Date.now(),
        details: { projectId, email }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      firebaseMonitor.logOperation({
        type: 'project',
        action: 'share',
        status: 'error',
        timestamp: Date.now(),
        error: errorMessage,
        details: { projectId, email }
      });
      throw new ProjectError("Failed to share project", "SHARE_FAILED", error);
    }
  },

  async removeShare(projectId: string, email: string): Promise<void> {
    try {
      firebaseMonitor.logOperation({
        type: 'project',
        action: 'unshare',
        status: 'pending',
        timestamp: Date.now(),
        details: { projectId, email }
      });

      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, {
        sharedWith: arrayRemove(email)
      });

      firebaseMonitor.logOperation({
        type: 'project',
        action: 'unshare',
        status: 'success',
        timestamp: Date.now(),
        details: { projectId, email }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      firebaseMonitor.logOperation({
        type: 'project',
        action: 'unshare',
        status: 'error',
        timestamp: Date.now(),
        error: errorMessage,
        details: { projectId, email }
      });
      throw new ProjectError("Failed to remove share", "SHARE_REMOVE_FAILED", error);
    }
  }
};

export default projectService;