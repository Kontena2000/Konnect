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

// Add error types
export interface ProjectError extends Error {
  code: string;
  details?: unknown;
}

// Add validation types
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

// Add validation function
const validateProject = (data: Partial<ProjectValidation>): boolean => {
  if (!data.name || data.name.trim().length === 0) return false;
  if (data.plotWidth && (data.plotWidth <= 0 || data.plotWidth > 1000)) return false;
  if (data.plotLength && (data.plotLength <= 0 || data.plotLength > 1000)) return false;
  return true;
};

const projectService = {
  async createProject(data: CreateProjectData): Promise<string> {
    if (!validateProject(data)) {
      throw new Error('Invalid project data');
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
      const projectError: ProjectError = new Error('Failed to create project');
      projectError.code = 'CREATE_FAILED';
      projectError.details = error;
      throw projectError;
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
      console.error("Error fetching project:", error);
      throw new Error("Failed to fetch project details");
    }
  },

  async updateProject(id: string, data: Partial<Project>): Promise<void> {
    if (!validateProject(data)) {
      throw new Error('Invalid project data');
    }

    try {
      const projectRef = doc(db, 'projects', id);
      await updateDoc(projectRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      const projectError: ProjectError = new Error('Failed to update project');
      projectError.code = 'UPDATE_FAILED';
      projectError.details = error;
      throw projectError;
    }
  },

  async deleteProject(id: string): Promise<void> {
    try {
      const projectRef = doc(db, "projects", id);
      await deleteDoc(projectRef);
    } catch (error) {
      console.error("Error deleting project:", error);
      throw new Error("Failed to delete project");
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
      console.error('Error fetching user projects:', error);
      throw new Error('Failed to fetch projects');
    }
  },

  async shareProject(projectId: string, email: string): Promise<void> {
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address');
    }

    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        sharedWith: arrayUnion(email)
      });
    } catch (error) {
      const projectError: ProjectError = new Error('Failed to share project');
      projectError.code = 'SHARE_FAILED';
      projectError.details = error;
      throw projectError;
    }
  },

  async removeShare(projectId: string, email: string) {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      sharedWith: arrayRemove(email)
    });
  }
};

export default projectService;