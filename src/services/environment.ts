
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
    const siteRef = await addDoc(collection(db, "sites"), {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return siteRef.id;
  },

  async updateSiteData(id: string, data: Partial<SiteData>): Promise<void> {
    const siteRef = doc(db, "sites", id);
    await updateDoc(siteRef, {
      ...data,
      updatedAt: new Date()
    });
  },

  async getProjectSiteData(projectId: string): Promise<SiteData | null> {
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
  }
};

export default environmentService;
