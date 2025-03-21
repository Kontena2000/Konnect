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

export interface ProjectValidation {
  name: string;
  description?: string;
  companyName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  plotWidth?: number;
  plotLength?: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  companyName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  plotWidth?: number;
  plotLength?: number;
  sharedWith?: string[];
  layouts?: { id: string }[];
  status?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  ownerId: string;
  companyName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  status?: string;
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
    if (!validateProject(data)) {
      console.error('Project validation failed:', data);
      throw new ProjectError('Project name is required', 'VALIDATION_FAILED');
    }

    try {
      console.log('Creating project with data:', data);
      const projectRef = await addDoc(collection(db, 'projects'), {
        name: data.name.trim(),
        description: data.description?.trim() || '',
        ownerId: data.ownerId,
        companyName: data.companyName?.trim() || '',
        clientEmail: data.clientEmail?.trim() || '',
        clientPhone: data.clientPhone?.trim() || '',
        clientAddress: data.clientAddress?.trim() || '',
        status: data.status || 'planning',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        layouts: []
      });
      console.log('Project created with ID:', projectRef.id);
      return projectRef.id;
    } catch (error) {
      console.error('Error in createProject:', error);
      throw new ProjectError('Failed to create project', 'CREATE_FAILED', error);
    }
  },

  async getProject(id: string): Promise<Project | null> {
    try {
      const projectRef = doc(db, "projects", id);
      const snapshot = await getDoc(projectRef);
      
      if (!snapshot.exists()) {
        return null;
      }

      return {
        id: snapshot.id,
        ...snapshot.data()
      } as Project;
    } catch (error) {
      throw new ProjectError("Failed to fetch project details", "FETCH_FAILED", error);
    }
  },

  async getUserProjects(userId: string): Promise<Project[]> {
    try {
      console.log('Fetching projects for user:', userId);
      const [ownedSnapshot, sharedSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'projects'), where('ownerId', '==', userId))),
        getDocs(query(collection(db, 'projects'), where('sharedWith', 'array-contains', userId)))
      ]);
      
      const projects = [...ownedSnapshot.docs, ...sharedSnapshot.docs].map(doc => {
        const data = doc.data();
        console.log('Project data:', data);
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now()
        } as Project;
      });

      console.log('Fetched projects:', projects);
      return projects;
    } catch (error) {
      console.error('Error in getUserProjects:', error);
      throw new ProjectError('Failed to fetch projects', 'FETCH_FAILED', error);
    }
  },

  async updateProject(id: string, data: Partial<Project>, userId: string): Promise<void> {
    try {
      // Validate project data
      if (!validateProject(data)) {
        throw new ProjectError('Invalid project data', 'VALIDATION_FAILED');
      }

      // Check project ownership
      const projectRef = doc(db, 'projects', id);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        throw new ProjectError('Project not found', 'NOT_FOUND');
      }

      const project = projectSnap.data();
      if (project.ownerId !== userId && !project.sharedWith?.includes(userId)) {
        throw new ProjectError('Unauthorized to update project', 'UNAUTHORIZED');
      }

      await updateDoc(projectRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating project:', error);
      if (error instanceof ProjectError) throw error;
      throw new ProjectError('Failed to update project', 'UPDATE_FAILED', error);
    }
  },

  async deleteProject(id: string, userId: string): Promise<void> {
    try {
      const projectRef = doc(db, 'projects', id);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        throw new ProjectError('Project not found', 'NOT_FOUND');
      }

      const project = projectSnap.data();
      if (project.ownerId !== userId) {
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
    } catch (error) {
      console.error('Error deleting project:', error);
      if (error instanceof ProjectError) throw error;
      throw new ProjectError('Failed to delete project', 'DELETE_FAILED', error);
    }
  },

  async shareProject(projectId: string, email: string): Promise<void> {
    if (!email || !email.includes("@")) {
      throw new ProjectError("Invalid email address", "VALIDATION_FAILED");
    }

    try {
      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, {
        sharedWith: arrayUnion(email)
      });
    } catch (error) {
      throw new ProjectError("Failed to share project", "SHARE_FAILED", error);
    }
  },

  async removeShare(projectId: string, email: string): Promise<void> {
    try {
      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, {
        sharedWith: arrayRemove(email)
      });
    } catch (error) {
      throw new ProjectError("Failed to remove share", "SHARE_REMOVE_FAILED", error);
    }
  }
};

export default projectService;