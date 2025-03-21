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
  Timestamp,
  DocumentData
} from "firebase/firestore";
import firebaseMonitor from '@/services/firebase-monitor';
import { auth } from "@/lib/firebase";

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

export interface Project extends DocumentData {
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

export interface CreateProjectData extends DocumentData {
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
      const user = auth.currentUser;
      if (!user) {
        throw new ProjectError('Not authenticated', 'AUTH_REQUIRED');
      }

      // Special case for Ruud - always has full access
      const isRuud = user.email === 'ruud@kontena.eu';
      
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
          details: { ...data }
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
        details: { ...data }
      });
      throw new ProjectError('Failed to create project', 'CREATE_FAILED', error);
    }
  },

  // ... rest of the service implementation remains the same ...
};

export default projectService;