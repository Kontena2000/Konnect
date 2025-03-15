
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  getDoc
} from "firebase/firestore";

export interface Module {
  id: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
}

export interface Layout {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  modules: Module[];
  createdAt: Date;
  updatedAt: Date;
}

const layoutService = {
  async createLayout(data: Omit<Layout, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const layoutRef = await addDoc(collection(db, "layouts"), {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return layoutRef.id;
  },

  async updateLayout(id: string, data: Partial<Layout>): Promise<void> {
    const layoutRef = doc(db, "layouts", id);
    await updateDoc(layoutRef, {
      ...data,
      updatedAt: new Date()
    });
  },

  async getLayout(id: string): Promise<Layout | null> {
    const layoutRef = doc(db, "layouts", id);
    const snapshot = await getDoc(layoutRef);
    
    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data()
    } as Layout;
  },

  async getProjectLayouts(projectId: string): Promise<Layout[]> {
    const layoutsQuery = query(
      collection(db, "layouts"),
      where("projectId", "==", projectId)
    );
    
    const snapshot = await getDocs(layoutsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Layout));
  }
};

export default layoutService;
