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
  arrayRemove
} from "firebase/firestore";

class ProjectError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ProjectError";
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
  userId: string;
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

  async deleteProject(id: string): Promise<void> {
    try {
      const projectRef = doc(db, "projects", id);
      await deleteDoc(projectRef);
    } catch (error) {
      throw new ProjectError("Failed to delete project", "DELETE_FAILED", error);
    }
  },

  async getUserProjects(userId: string): Promise<Project[]> {
    try {
      const projectsQuery = query(
        collection(db, 'projects'),
        where('ownerId', '==', userId)
      );
      
      const snapshot = await getDocs(projectsQuery);
      
      if (snapshot.empty) {
        return [];
      }

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      } as Project));
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