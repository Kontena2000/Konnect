import { getFirestoreSafely } from "@/lib/firebase";
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

export interface TerrainPoint {
  x: number;
  y: number;
  z: number;
}

export interface TerrainData {
  id: string;
  projectId: string;
  points: TerrainPoint[];
  resolution: number;
  dimensions: [number, number];
  materialType?: 'soil' | 'concrete' | 'grass';
}

export interface EnvironmentalElement {
  id: string;
  type: "vegetation" | "infrastructure" | "utility" | "hardscape";
  category: string;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  model: string;
  properties: {
    [key: string]: any;
  };
}

export interface SiteData {
  id: string;
  projectId: string;
  terrain?: TerrainData;
  elements: EnvironmentalElement[];
  settings: {
    sunPath?: boolean;
    shadows?: boolean;
    groundPreparation?: boolean;
  };
}

const environmentService = {
  async createSiteData(data: Omit<SiteData, "id">): Promise<string> {
    const db = getFirestoreSafely();
    if (!db) {
      throw new Error('Firestore not available');
    }
    
    const siteRef = await addDoc(collection(db, "sites"), {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return siteRef.id;
  },
  
  async updateSiteData(id: string, data: Partial<SiteData>): Promise<void> {
    const db = getFirestoreSafely();
    if (!db) {
      throw new Error('Firestore not available');
    }
    
    const siteRef = doc(db, "sites", id);
    await updateDoc(siteRef, {
      ...data,
      updatedAt: new Date()
    });
  },
  
  async getProjectSiteData(projectId: string): Promise<SiteData | null> {
    const db = getFirestoreSafely();
    if (!db) {
      throw new Error('Firestore not available');
    }
    
    const sitesQuery = query(
      collection(db, "sites"),
      where("projectId", "==", projectId)
    );
    const snapshot = await getDocs(sitesQuery);
    if (snapshot.empty) return null;
    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    } as SiteData;
  },
  
  async updateTerrainData(siteId: string, terrainData: Partial<TerrainData>): Promise<void> {
    const db = getFirestoreSafely();
    if (!db) {
      throw new Error('Firestore not available');
    }
    
    const siteRef = doc(db, 'sites', siteId);
    await updateDoc(siteRef, {
      'terrain': terrainData,
      updatedAt: new Date()
    });
  }
};

export default environmentService;