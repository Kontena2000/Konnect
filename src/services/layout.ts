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
  if (!data.projectId) {
    console.error('Layout validation failed: missing projectId');
    return false;
  }
  if (!data.name || data.name.trim().length === 0) {
    console.error('Layout validation failed: missing or empty name');
    return false;
  }
  return true;
};

const validateModuleData = (module: Partial<Module>): boolean => {
  try {
    if (!module.type) {
      console.error('Module validation failed: missing type');
      return false;
    }
    if (!module.position || !Array.isArray(module.position) || module.position.length !== 3) {
      console.error('Module validation failed: invalid position', module.position);
      return false;
    }
    if (!module.rotation || !Array.isArray(module.rotation) || module.rotation.length !== 3) {
      console.error('Module validation failed: invalid rotation', module.rotation);
      return false;
    }
    if (!module.scale || !Array.isArray(module.scale) || module.scale.length !== 3) {
      console.error('Module validation failed: invalid scale', module.scale);
      return false;
    }
    if (!module.dimensions || 
        typeof module.dimensions.length !== 'number' || 
        typeof module.dimensions.width !== 'number' || 
        typeof module.dimensions.height !== 'number') {
      console.error('Module validation failed: invalid dimensions', module.dimensions);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Module validation error:', error);
    return false;
  }
};

const validateConnectionData = (connection: Partial<Connection>): boolean => {
  try {
    if (!connection.sourceModuleId || !connection.targetModuleId) {
      console.error('Connection validation failed: missing source or target module ID');
      return false;
    }
    if (!connection.sourcePoint || !Array.isArray(connection.sourcePoint) || connection.sourcePoint.length !== 3) {
      console.error('Connection validation failed: invalid sourcePoint', connection.sourcePoint);
      return false;
    }
    if (!connection.targetPoint || !Array.isArray(connection.targetPoint) || connection.targetPoint.length !== 3) {
      console.error('Connection validation failed: invalid targetPoint', connection.targetPoint);
      return false;
    }
    if (connection.type === undefined) {
      console.error('Connection validation failed: missing type');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Connection validation error:', error);
    return false;
  }
};

// Helper function to ensure Firestore is available
const ensureFirestore = (): Firestore => {
  const firestore = db || getFirestoreSafely();
  if (!firestore) {
    console.error('Firestore is not available');
    throw new LayoutError('Firestore is not available', 'FIRESTORE_UNAVAILABLE');
  }
  return firestore;
};

// Helper function to safely serialize data for Firestore
const safeSerialize = (data: any): any => {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error('Error serializing data for Firestore:', error);
    throw new LayoutError('Failed to serialize data for Firestore', 'SERIALIZATION_FAILED', error);
  }
};

export const debouncedSave = debounce(async (layoutId: string, data: Partial<Layout>): Promise<void> => {
  try {
    console.log('Debounced save triggered for layout:', layoutId);
    const firestore = ensureFirestore();
    const layoutRef = doc(firestore, 'layouts', layoutId);
    
    // Ensure data is serializable for Firestore
    const cleanData = safeSerialize(data);
    
    await updateDoc(layoutRef, {
      ...cleanData,
      updatedAt: serverTimestamp()
    });
    console.log('Layout saved successfully:', layoutId);
  } catch (error) {
    console.error('Error in debouncedSave:', error);
    throw new Error('Failed to save layout: ' + (error instanceof Error ? error.message : String(error)));
  }
}, 2000);

const layoutService = {
  async createLayout(data: Omit<Layout, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    console.log('Creating new layout with data:', { ...data, modules: data.modules?.length || 0, connections: data.connections?.length || 0 });
    
    if (!validateLayout(data)) {
      console.error('Invalid layout data:', data);
      throw new LayoutError('Invalid layout data', 'VALIDATION_FAILED');
    }

    try {
      const firestore = ensureFirestore();
      
      // Verify the project exists
      const projectRef = doc(firestore, 'projects', data.projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        console.error('Project not found:', data.projectId);
        throw new LayoutError('Project not found', 'PROJECT_NOT_FOUND');
      }
      
      // Ensure data is serializable for Firestore
      const cleanData = safeSerialize({
        ...data,
        modules: data.modules || [],
        connections: data.connections || []
      });
      
      const layoutRef = await addDoc(collection(firestore, 'layouts'), {
        ...cleanData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('Layout created successfully:', layoutRef.id);
      return layoutRef.id;
    } catch (error) {
      console.error('Failed to create layout:', error);
      throw new LayoutError(
        'Failed to create layout: ' + (error instanceof Error ? error.message : String(error)), 
        'CREATE_FAILED', 
        error
      );
    }
  },

  async updateLayout(id: string, data: Partial<Layout>, user: AuthUser): Promise<void> {
    console.log('Updating layout:', id, 'with data:', { ...data, modules: data.modules?.length || 0, connections: data.connections?.length || 0 });
    
    try {
      const firestore = ensureFirestore();
      const layoutRef = doc(firestore, 'layouts', id);
      const currentLayout = await getDoc(layoutRef);
      
      if (!currentLayout.exists()) {
        console.error('Layout not found:', id);
        throw new LayoutError('Layout not found', 'NOT_FOUND');
      }

      const layout = currentLayout.data();
      
      // Verify the projectId hasn't changed
      if (data.projectId && data.projectId !== layout.projectId) {
        console.error('Cannot change project ID of an existing layout');
        throw new LayoutError('Cannot change project ID of an existing layout', 'INVALID_OPERATION');
      }
      
      const projectRef = doc(firestore, 'projects', layout.projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        console.error('Associated project not found:', layout.projectId);
        throw new LayoutError('Associated project not found', 'PROJECT_NOT_FOUND');
      }

      // Special case for ruud@kontena.eu - always has full access
      if (user.email === 'ruud@kontena.eu') {
        // Ensure data is serializable for Firestore
        const cleanData = safeSerialize(data);
        
        await updateDoc(layoutRef, {
          ...cleanData,
          updatedAt: serverTimestamp()
        });
        console.log('Layout updated successfully by admin:', id);
        return;
      }

      const project = projectSnap.data();
      if (project.userId !== user.uid && !project.sharedWith?.includes(user.email!)) {
        console.error('Unauthorized access to layout:', id, 'by user:', user.uid);
        throw new LayoutError('Unauthorized access', 'UNAUTHORIZED');
      }

      // Validate modules and connections if they exist
      if (data.modules) {
        const invalidModules = data.modules.filter(m => !validateModuleData(m));
        if (invalidModules.length > 0) {
          console.error('Invalid module data found:', invalidModules);
          throw new LayoutError('Invalid module data', 'VALIDATION_FAILED');
        }
      }
      
      if (data.connections) {
        const invalidConnections = data.connections.filter(c => !validateConnectionData(c));
        if (invalidConnections.length > 0) {
          console.error('Invalid connection data found:', invalidConnections);
          throw new LayoutError('Invalid connection data', 'VALIDATION_FAILED');
        }
      }

      // Ensure data is serializable for Firestore
      const cleanData = safeSerialize(data);
      
      await updateDoc(layoutRef, {
        ...cleanData,
        updatedAt: serverTimestamp()
      });
      
      console.log('Layout updated successfully:', id);
    } catch (error) {
      console.error('Failed to update layout:', error);
      if (error instanceof LayoutError) throw error;
      throw new LayoutError(
        'Failed to update layout: ' + (error instanceof Error ? error.message : String(error)), 
        'UPDATE_FAILED', 
        error
      );
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

      // Always create a new layout with the specified project ID
      const newLayout = {
        ...layoutData,
        projectId, // Ensure we use the provided projectId
        name: layoutData.name || 'Untitled Layout',
        modules: layoutData.modules || [],
        connections: layoutData.connections || []
      };

      if (!validateLayout(newLayout)) {
        throw new LayoutError('Invalid layout data', 'VALIDATION_FAILED');
      }

      // Ensure data is serializable for Firestore
      const cleanData = safeSerialize(newLayout);
      
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