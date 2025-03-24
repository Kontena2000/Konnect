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
  getDoc,
  serverTimestamp
} from "firebase/firestore";
import { ConnectionType } from '@/types/connection';
import { debounce } from "lodash";
import { AuthUser } from '@/services/auth';
import { Module } from '@/types/module';

export interface Connection {
  id: string;
  sourceModuleId: string;
  targetModuleId: string;
  sourcePoint: [number, number, number];
  targetPoint: [number, number, number];
  type: ConnectionType;
  capacity?: number;
  currentLoad?: number;
  intermediatePoints?: [number, number, number][];
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

class LayoutError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'LayoutError';
    Object.setPrototypeOf(this, LayoutError.prototype);
  }
}

const validateLayout = (data: Partial<Layout>): boolean => {
  if (!data.projectId) return false;
  if (!data.name || data.name.trim().length === 0) return false;
  return true;
};

const validateModuleData = (module: Partial<Module>): boolean => {
  if (!module.type || !module.position || !module.rotation || !module.scale) return false;
  if (!module.dimensions || !module.dimensions.length || !module.dimensions.width || !module.dimensions.height) return false;
  return true;
};

const validateConnectionData = (connection: Partial<Connection>): boolean => {
  if (!connection.sourceModuleId || !connection.targetModuleId) return false;
  if (!connection.sourcePoint || !connection.targetPoint || !connection.type) return false;
  return true;
};

export const debouncedSave = debounce(async (layoutId: string, data: Partial<Layout>): Promise<void> => {
  try {
    const layoutRef = doc(db, 'layouts', layoutId);
    await updateDoc(layoutRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving layout:', error);
    throw new Error('Failed to save layout');
  }
}, 2000);

const layoutService = {
  async createLayout(data: Omit<Layout, "id" | "createdAt" | "updatedAt">): Promise<string> {
    if (!validateLayout(data)) {
      throw new LayoutError('Invalid layout data', 'VALIDATION_FAILED');
    }

    try {
      const layoutRef = await addDoc(collection(db, 'layouts'), {
        ...data,
        modules: data.modules || [],
        connections: data.connections || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return layoutRef.id;
    } catch (error) {
      throw new LayoutError('Failed to create layout', 'CREATE_FAILED', error);
    }
  },

  async updateLayout(id: string, data: Partial<Layout>, user: AuthUser): Promise<void> {
    try {
      const layoutRef = doc(db, 'layouts', id);
      const currentLayout = await getDoc(layoutRef);
      
      if (!currentLayout.exists()) {
        throw new LayoutError('Layout not found', 'NOT_FOUND');
      }

      const layout = currentLayout.data();
      const projectRef = doc(db, 'projects', layout.projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        throw new LayoutError('Associated project not found', 'PROJECT_NOT_FOUND');
      }

      // Special case for ruud@kontena.eu - always has full access
      if (user.email === 'ruud@kontena.eu') {
        await updateDoc(layoutRef, {
          ...data,
          updatedAt: serverTimestamp()
        });
        return;
      }

      const project = projectSnap.data();
      if (project.userId !== user.uid && !project.sharedWith?.includes(user.email!)) {
        throw new LayoutError('Unauthorized access', 'UNAUTHORIZED');
      }

      if (data.modules?.some(m => !validateModuleData(m))) {
        throw new LayoutError('Invalid module data', 'VALIDATION_FAILED');
      }
      if (data.connections?.some(c => !validateConnectionData(c))) {
        throw new LayoutError('Invalid connection data', 'VALIDATION_FAILED');
      }

      await updateDoc(layoutRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      if (error instanceof LayoutError) throw error;
      throw new LayoutError('Failed to update layout', 'UPDATE_FAILED', error);
    }
  },

  async getLayout(id: string, user?: AuthUser): Promise<Layout | null> {
    try {
      const layoutRef = doc(db, 'layouts', id);
      const snapshot = await getDoc(layoutRef);
      
      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.data();
      
      if (user) {
        // Special case for ruud@kontena.eu - always has full access
        if (user.email === 'ruud@kontena.eu') {
          return {
            id: snapshot.id,
            ...data,
            modules: data.modules || [],
            connections: data.connections || [],
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } as Layout;
        }

        const projectRef = doc(db, 'projects', data.projectId);
        const projectSnap = await getDoc(projectRef);
        
        if (!projectSnap.exists()) {
          throw new LayoutError('Associated project not found', 'PROJECT_NOT_FOUND');
        }

        const project = projectSnap.data();
        if (project.userId !== user.uid && !project.sharedWith?.includes(user.email!)) {
          throw new LayoutError('Unauthorized access', 'UNAUTHORIZED');
        }
      }

      return {
        id: snapshot.id,
        ...data,
        modules: data.modules || [],
        connections: data.connections || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Layout;
    } catch (error) {
      if (error instanceof LayoutError) throw error;
      throw new LayoutError('Failed to fetch layout', 'FETCH_FAILED', error);
    }
  },

  async getProjectLayouts(projectId: string): Promise<Layout[]> {
    try {
      const layoutsQuery = query(
        collection(db, 'layouts'),
        where('projectId', '==', projectId)
      );
      
      const snapshot = await getDocs(layoutsQuery);
      const layouts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          modules: data.modules || [],
          connections: data.connections || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Layout;
      });

      return layouts;
    } catch (error) {
      console.error('Error fetching project layouts:', error);
      throw new Error('Failed to load project layouts');
    }
  }
};

export default layoutService;