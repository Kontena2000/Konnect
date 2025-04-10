import axios from 'axios';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export interface ModelSearchOptions {
  category?: string;
  query?: string;
  limit?: number;
}

export interface ModelAsset {
  id: string;
  name: string;
  category: string[];
  thumbnailUrl: string;
  downloadLinks: Record<string, string>;
}

export interface ImportedModel {
  id: string;
  name: string;
  category: string;
  thumbnailUrl: string;
  modelUrl: string;
  format: string;
  importDate: Date;
  userId: string;
  projectId?: string;
  metadata?: Record<string, any>;
}

class ModelImporterService {
  private apiBaseUrl: string;
  private downloadBaseUrl: string;
  
  constructor() {
    this.apiBaseUrl = 'https://api.polyhaven.com/assets';
    this.downloadBaseUrl = 'https://dl.polyhaven.org/file/ph-assets/';
  }

  /**
   * Search for models on Poly Haven
   * @param options - Search parameters
   * @returns List of matching models
   */
  async searchModels(options: ModelSearchOptions = {}): Promise<ModelAsset[]> {
    const { 
      category = '', 
      query = '', 
      limit = 20 
    } = options;

    try {
      // Note: The actual Poly Haven API structure might differ, this is an example
      const response = await axios.get(`${this.apiBaseUrl}`, {
        params: {
          type: 'model',
          categories: category || undefined,
          q: query || undefined,
          limit
        }
      });

      // Transform the response to our expected format
      // This will need to be adjusted based on the actual API response structure
      return Object.entries(response.data).map(([id, data]: [string, any]) => ({
        id,
        name: data.name || id,
        category: data.categories || [],
        thumbnailUrl: `https://cdn.polyhaven.com/asset_img/thumbs/${id}.png?height=200`,
        downloadLinks: data.files?.blend || {}
      }));
    } catch (error) {
      console.error('Error searching models:', error);
      return [];
    }
  }

  /**
   * Download a model and save it to Firebase Storage
   * @param modelId - ID of the model to download
   * @param format - Desired 3D file format
   * @param userId - ID of the user importing the model
   * @param projectId - Optional project ID to associate with the model
   * @returns Imported model data
   */
  async importModel(
    modelId: string, 
    format: string = 'glb', 
    userId: string,
    projectId?: string
  ): Promise<ImportedModel> {
    try {
      // Get model details
      const modelDetails = await this.getModelDetails(modelId);
      
      // Download the model file
      const modelBuffer = await this.downloadModelFile(modelId, format);
      
      // Check if storage is null before using it
      if (!storage) {
        throw new Error('Firebase Storage is not available');
      }
      const uniqueId = uuidv4();
      const storagePath = `models/${userId}/${uniqueId}.${format}`;
      const storageRef = ref(storage, storagePath);
      
      await uploadBytes(storageRef, modelBuffer);
      const modelUrl = await getDownloadURL(storageRef);
      
      // Save metadata to Firestore
      const importedModel: ImportedModel = {
        id: uniqueId,
        name: modelDetails.name || modelId,
        category: Array.isArray(modelDetails.category) ? modelDetails.category[0] : 'other',
        thumbnailUrl: modelDetails.thumbnailUrl,
        modelUrl,
        format,
        importDate: new Date(),
        userId,
        projectId,
        metadata: {
          source: 'polyhaven',
          originalId: modelId
        }
      };
      
      await this.saveModelMetadata(importedModel);
      
      return importedModel;
    } catch (error) {
      console.error('Error importing model:', error);
      throw new Error(`Failed to import model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get detailed information about a specific model
   * @param modelId - ID of the model
   * @returns Model details
   */
  private async getModelDetails(modelId: string): Promise<ModelAsset> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/${modelId}`);
      
      return {
        id: modelId,
        name: response.data.name || modelId,
        category: response.data.categories || [],
        thumbnailUrl: `https://cdn.polyhaven.com/asset_img/thumbs/${modelId}.png?height=200`,
        downloadLinks: response.data.files || {}
      };
    } catch (error) {
      console.error(`Error getting details for model ${modelId}:`, error);
      // Return basic info if we can't get details
      return {
        id: modelId,
        name: modelId,
        category: ['unknown'],
        thumbnailUrl: '',
        downloadLinks: {}
      };
    }
  }

  /**
   * Download a model file from Poly Haven
   * @param modelId - ID of the model
   * @param format - Desired file format
   * @returns ArrayBuffer containing the model data
   */
  private async downloadModelFile(modelId: string, format: string): Promise<ArrayBuffer> {
    try {
      // The actual download URL structure might differ
      const downloadUrl = `${this.downloadBaseUrl}Models/${modelId}/${modelId}.${format}`;
      
      const response = await axios({
        method: 'get',
        url: downloadUrl,
        responseType: 'arraybuffer'
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error downloading model ${modelId}:`, error);
      throw new Error(`Failed to download model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save imported model metadata to Firestore
   * @param model - Imported model data
   */
  private async saveModelMetadata(model: ImportedModel): Promise<void> {
    try {
      const modelsCollection = collection(db, 'importedModels');
      await addDoc(modelsCollection, {
        ...model,
        importDate: model.importDate.toISOString()
      });
    } catch (error) {
      console.error('Error saving model metadata:', error);
      throw new Error(`Failed to save model metadata: ${error.message}`);
    }
  }

  /**
   * Get all models imported by a user
   * @param userId - ID of the user
   * @returns List of imported models
   */
  async getUserModels(userId: string): Promise<ImportedModel[]> {
    try {
      const modelsCollection = collection(db, 'importedModels');
      const userModelsQuery = query(modelsCollection, where('userId', '==', userId));
      const snapshot = await getDocs(userModelsQuery);
      
      return snapshot.docs.map(doc => {
        const data = doc.data() as Omit<ImportedModel, 'importDate'> & { importDate: string };
        return {
          ...data,
          importDate: new Date(data.importDate)
        } as ImportedModel;
      });
    } catch (error) {
      console.error('Error getting user models:', error);
      return [];
    }
  }

  /**
   * Get models associated with a specific project
   * @param projectId - ID of the project
   * @returns List of models in the project
   */
  async getProjectModels(projectId: string): Promise<ImportedModel[]> {
    try {
      const modelsCollection = collection(db, 'importedModels');
      const projectModelsQuery = query(modelsCollection, where('projectId', '==', projectId));
      const snapshot = await getDocs(projectModelsQuery);
      
      return snapshot.docs.map(doc => {
        const data = doc.data() as Omit<ImportedModel, 'importDate'> & { importDate: string };
        return {
          ...data,
          importDate: new Date(data.importDate)
        } as ImportedModel;
      });
    } catch (error) {
      console.error('Error getting project models:', error);
      return [];
    }
  }

  /**
   * Associate a model with a project
   * @param modelId - ID of the model
   * @param projectId - ID of the project
   */
  async assignModelToProject(modelId: string, projectId: string): Promise<void> {
    try {
      const modelsCollection = collection(db, 'importedModels');
      const modelQuery = query(modelsCollection, where('id', '==', modelId));
      const snapshot = await getDocs(modelQuery);
      
      if (snapshot.empty) {
        throw new Error(`Model with ID ${modelId} not found`);
      }
      
      const modelDoc = snapshot.docs[0];
      await updateDoc(doc(db, 'importedModels', modelDoc.id), {
        projectId
      });
    } catch (error) {
      console.error('Error assigning model to project:', error);
      throw new Error(`Failed to assign model to project: ${error.message}`);
    }
  }
}

export const modelImporterService = new ModelImporterService();
export default modelImporterService;