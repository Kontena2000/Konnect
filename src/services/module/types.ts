
import { Timestamp } from "firebase/firestore";

export interface CategoryData {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ModuleData {
  id: string;
  type: string;
  category: string;
  name: string;
  description: string;
  color: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  visibleInEditor: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  connectionPoints?: Array<{
    position: [number, number, number];
    type: string;
  }>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export class ModuleError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ModuleError';
    Object.setPrototypeOf(this, ModuleError.prototype);
  }
}
