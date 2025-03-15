
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
  serverTimestamp 
} from "firebase/firestore";

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  collaborators?: string[];
}

export interface CreateProjectData {
  name: string;
  description?: string;
  ownerId: string;
}

const projectService = {
  async createProject(data: CreateProjectData): Promise<string> {
    if (!data.name || !data.ownerId) {
      throw new Error("Project name and owner ID are required");
    }

    try {
      const projectRef = await addDoc(collection(db, "projects"), {
        name: data.name.trim(),
        description: data.description?.trim() || "",
        ownerId: data.ownerId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        collaborators: []
      });
      return projectRef.id;
    } catch (error) {
      console.error("Error creating project:", error);
      throw new Error("Failed to create project. Please try again.");
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
    try {
      const projectRef = doc(db, "projects", id);
      await updateDoc(projectRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating project:", error);
      throw new Error("Failed to update project");
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
        collection(db, "projects"),
        where("ownerId", "==", userId)
      );
      
      const snapshot = await getDocs(projectsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Project));
    } catch (error) {
      console.error("Error fetching user projects:", error);
      throw new Error("Failed to fetch projects");
    }
  }
};

export default projectService;
