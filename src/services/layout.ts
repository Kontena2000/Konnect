import { db, getFirestoreSafely } from "@/lib/firebase";
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
  serverTimestamp,
  Firestore
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

// Helper function to ensure Firestore is available
const ensureFirestore = (): Firestore => {
  const firestore = db || getFirestoreSafely();
  if (!firestore) {
    throw new LayoutError('Firestore is not available', 'FIRESTORE_UNAVAILABLE');
  }
  return firestore;
};

export const debouncedSave = debounce(async (layoutId: string, data: Partial<Layout>): Promise<void> => {
  try {
    const firestore = ensureFirestore();
    const layoutRef = doc(firestore, 'layouts', layoutId);
    
    // Ensure data is serializable for Firestore
    const cleanData = JSON.parse(JSON.stringify(data));
    
    await updateDoc(layoutRef, {
      ...cleanData,
      updatedAt: serverTimestamp()
    });
    console.log('Layout saved successfully:', layoutId);
  } catch (error) {
    console.error('Error saving layout:', error);
    throw new Error('Failed to save layout');
  }
}, 2000);

const layoutService = {
  async createLayout(data: Omit<Layout, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!validateLayout(data)) {
      console.error('Invalid layout data:', data);
      throw new LayoutError('Invalid layout data', 'VALIDATION_FAILED');
    }

    try {
      const firestore = ensureFirestore();
      
      // Ensure data is serializable for Firestore
      const cleanData = JSON.parse(JSON.stringify({
        ...data,
        modules: data.modules || [],
        connections: data.connections || []
      }));
      
      const layoutRef = await addDoc(collection(firestore, 'layouts'), {
        ...cleanData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('Layout created successfully:', layoutRef.id);
      return layoutRef.id;
    } catch (error) {
      console.error('Failed to create layout:', error);
      throw new LayoutError('Failed to create layout', 'CREATE_FAILED', error);
    }
  },

  async updateLayout(id: string, data: Partial<Layout>, user: AuthUser): Promise<void> {
    try {
      const firestore = ensureFirestore();
      const layoutRef = doc(firestore, 'layouts', id);
      const currentLayout = await getDoc(layoutRef);
      
      if (!currentLayout.exists()) {
        throw new LayoutError('Layout not found', 'NOT_FOUND');
      }

      const layout = currentLayout.data();
      const projectRef = doc(firestore, 'projects', layout.projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        throw new LayoutError('Associated project not found', 'PROJECT_NOT_FOUND');
      }

      // Special case for ruud@kontena.eu - always has full access
      if (user.email === 'ruud@kontena.eu') {
        // Ensure data is serializable for Firestore
        const cleanData = JSON.parse(JSON.stringify(data));
        
        await updateDoc(layoutRef, {
          ...cleanData,
          updatedAt: serverTimestamp()
        });
        console.log('Layout updated successfully by admin:', id);
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

      // Ensure data is serializable for Firestore
      const cleanData = JSON.parse(JSON.stringify(data));
      
      await updateDoc(layoutRef, {
        ...cleanData,
        updatedAt: serverTimestamp()
      });
      
      console.log('Layout updated successfully:', id);
    } catch (error) {
      console.error('Failed to update layout:', error);
      if (error instanceof LayoutError) throw error;
      throw new LayoutError('Failed to update layout', 'UPDATE_FAILED', error);
    }
  },

  async getLayout(id: string, user?: AuthUser): Promise<Layout | null> {
    try {
      const firestore = ensureFirestore();
      const layoutRef = doc(firestore, 'layouts', id);
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

        const projectRef = doc(firestore, 'projects', data.projectId);
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
      const firestore = ensureFirestore();
      const layoutsQuery = query(
        collection(firestore, 'layouts'),
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
  },

  async saveLayoutToProject(layoutData: Partial<Layout>, projectId: string, user: AuthUser): Promise<string> {
    try {
      const firestore = ensureFirestore();
      const projectRef = doc(firestore, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        throw new LayoutError('Project not found', 'PROJECT_NOT_FOUND');
      }

      // Special case for ruud@kontena.eu - always has full access
      if (user.email !== 'ruud@kontena.eu') {
        const project = projectSnap.data();
        if (project.userId !== user.uid && !project.sharedWith?.includes(user.email!)) {
          throw new LayoutError('Unauthorized access to project', 'UNAUTHORIZED');
        }
      }

      const newLayout = {
        ...layoutData,
        projectId,
        name: layoutData.name || 'Untitled Layout',
        modules: layoutData.modules || [],
        connections: layoutData.connections || []
      };

      if (!validateLayout(newLayout)) {
        throw new LayoutError('Invalid layout data', 'VALIDATION_FAILED');
      }

      // Ensure data is serializable for Firestore
      const cleanData = JSON.parse(JSON.stringify(newLayout));
      
      const layoutRef = await addDoc(collection(firestore, 'layouts'), {
        ...cleanData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('Layout saved to project successfully:', layoutRef.id);
      return layoutRef.id;
    } catch (error) {
      console.error('Failed to save layout to project:', error);
      if (error instanceof LayoutError) throw error;
      throw new LayoutError('Failed to save layout to project', 'SAVE_FAILED', error);
    }
  },

  async deleteLayout(layoutId: string, user: AuthUser): Promise<void> {
    try {
      const firestore = ensureFirestore();
      const layoutRef = doc(firestore, 'layouts', layoutId);
      const layoutSnap = await getDoc(layoutRef);
      
      if (!layoutSnap.exists()) {
        throw new LayoutError('Layout not found', 'NOT_FOUND');
      }
      
      const layoutData = layoutSnap.data();
      const projectRef = doc(firestore, 'projects', layoutData.projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        throw new LayoutError('Associated project not found', 'PROJECT_NOT_FOUND');
      }
      
      // Special case for ruud@kontena.eu - always has full access
      if (user.email === 'ruud@kontena.eu') {
        await deleteDoc(layoutRef);
        return;
      }
      
      const project = projectSnap.data();
      if (project.userId !== user.uid) {
        throw new LayoutError('Unauthorized access', 'UNAUTHORIZED');
      }
      
      await deleteDoc(layoutRef);
    } catch (error) {
      if (error instanceof LayoutError) throw error;
      throw new LayoutError('Failed to delete layout', 'DELETE_FAILED', error);
    }
  }
};

export default layoutService;