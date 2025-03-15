
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where 
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

const projectService = {
  async createProject(data: Omit<Project, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const projectRef = await addDoc(collection(db, "projects"), {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return projectRef.id;
  },

  async updateProject(id: string, data: Partial<Project>): Promise<void> {
    const projectRef = doc(db, "projects", id);
    await updateDoc(projectRef, {
      ...data,
      updatedAt: new Date()
    });
  },

  async deleteProject(id: string): Promise<void> {
    const projectRef = doc(db, "projects", id);
    await deleteDoc(projectRef);
  },

  async getUserProjects(userId: string): Promise<Project[]> {
    const projectsQuery = query(
      collection(db, "projects"),
      where("ownerId", "==", userId)
    );
    
    const snapshot = await getDocs(projectsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Project));
  }
};

export default projectService;
