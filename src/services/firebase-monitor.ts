
import { db, auth } from "@/lib/firebase";
import { disableNetwork, enableNetwork } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export interface OperationLog {
  type: 'project' | 'module' | 'category' | 'auth' | 'connection' | 'settings';
  action: string;
  status: 'success' | 'error' | 'pending';
  timestamp: number;
  details?: any;
  error?: string;
  userId?: string;
}

// Rest of the file remains the same...
