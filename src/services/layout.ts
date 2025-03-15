
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
import { ConnectionType } from "@/components/three/ModuleLibrary";

export interface Module {
  id: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  dimensions: {
    length: number;
    height: number;
    width: number;
  };
  connectionPoints?: Array<{
    position: [number, number, number];
    type: ConnectionType;
  }>;
}

export interface Connection {
  id: string;
  sourceModuleId: string;
  targetModuleId: string;
  sourcePoint: [number, number, number];
  targetPoint: [number, number, number];
  type: ConnectionType;
  capacity?: number;
}

export interface Layout {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  modules: Module[];
  connections: Connection[];
  createdAt: Date;
  updatedAt: Date;
}

const layoutService = {
  async createLayout(data: Omit<Layout, "id" | "createdAt" | "updatedAt">): Promise<string> {
    if (!data.projectId) {
      throw new Error('Project ID is required');
    }

    const layoutRef = await addDoc(collection(db, "layouts"), {
      ...data,
      modules: data.modules || [],
      connections: data.connections || [],
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
    try {
      const layoutRef = doc(db, "layouts", id);
      const snapshot = await getDoc(layoutRef);
      
      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.data();
      return {
        id: snapshot.id,
        modules: data.modules || [],
        connections: data.connections || [],
        ...data
      } as Layout;
    } catch (error) {
      console.error('Error fetching layout:', error);
      return null;
    }
  },

  async getProjectLayouts(projectId: string): Promise<Layout[]> {
    try {
      const layoutsQuery = query(
        collection(db, 'layouts'),
        where('projectId', '==', projectId)
      );
      
      const snapshot = await getDocs(layoutsQuery);
      const layouts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        modules: doc.data().modules || [],
        connections: doc.data().connections || []
      } as Layout));

      return layouts;
    } catch (error) {
      console.error('Error fetching project layouts:', error);
      throw new Error('Failed to load project layouts');
    }
  }
};

export default layoutService;
