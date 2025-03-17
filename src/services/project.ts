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
  writeBatch
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
  plotWidth?: number;
  plotLength?: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;  // Changed from userId to ownerId for consistency
  plotWidth?: number;
  plotLength?: number;
  sharedWith?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  ownerId: string;
}

const validateProject = (data: Partial<ProjectValidation>): boolean => {
  if (!data.name || data.name.trim().length === 0) return false;
  if (data.plotWidth && (data.plotWidth <= 0 || data.plotWidth > 1000)) return false;
  if (data.plotLength && (data.plotLength <= 0 || data.plotLength > 1000)) return false;
  return true;
};

const handleError = (error: unknown, code: string, message: string): never => {
  throw new ProjectError(message, code, error);
};

const projectService = {
  async createProject(data: CreateProjectData): Promise<string> {
    if (!validateProject(data)) {
      throw new ProjectError('Invalid project data', 'VALIDATION_FAILED');
    }

    try {
      const projectRef = await addDoc(collection(db, 'projects'), {
        name: data.name.trim(),
        description: data.description?.trim() || '',
        ownerId: data.ownerId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        collaborators: []
      });
      return projectRef.id;
    } catch (error) {
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

  async updateProject(id: string, data: Partial<Project>): Promise<void> {
    if (!validateProject(data)) {
      throw new ProjectError("Invalid project data", "VALIDATION_FAILED");
    }

    try {
      const projectRef = doc(db, "projects", id);
      await updateDoc(projectRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw new ProjectError("Failed to update project", "UPDATE_FAILED", error);
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

      const layoutsQuery = query(
        collection(db, 'layouts'),
        where('projectId', '==', id)
      );
      const layoutsSnapshot = await getDocs(layoutsQuery);
      layoutsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      batch.delete(projectRef);
      await batch.commit();
    } catch (error) {
      if (error instanceof ProjectError) throw error;
      throw new ProjectError('Failed to delete project', 'DELETE_FAILED', error);
    }
  },

  async getUserProjects(userId: string): Promise<Project[]> {
    try {
      // Query for owned projects
      const ownedProjectsQuery = query(
        collection(db, 'projects'),
        where('ownerId', '==', userId)
      );
      
      // Query for shared projects
      const sharedProjectsQuery = query(
        collection(db, 'projects'),
        where('sharedWith', 'array-contains', userId)
      );
      
      const [ownedSnapshot, sharedSnapshot] = await Promise.all([
        getDocs(ownedProjectsQuery),
        getDocs(sharedProjectsQuery)
      ]);
      
      const projects = [...ownedSnapshot.docs, ...sharedSnapshot.docs].map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Project;
      });

      return projects;
    } catch (error) {
      throw new ProjectError('Failed to fetch projects', 'FETCH_FAILED', error);
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