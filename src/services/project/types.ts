
import { Timestamp } from "firebase/firestore";

export interface Project {
  id: string;
  name: string;
  description?: string;
  userId: string;
  clientInfo: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  plotWidth?: number;
  plotLength?: number;
  sharedWith?: string[];
  layouts?: { id: string }[];
  status?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateProjectData extends Record<string, unknown> {
  name: string;
  description?: string;
  userId: string;
  companyName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  status?: string;
}

export interface ProjectValidation {
  name: string;
  description?: string;
  clientEmail?: string;
  plotWidth?: number;
  plotLength?: number;
}

export class ProjectError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ProjectError';
    Object.setPrototypeOf(this, ProjectError.prototype);
  }
}
