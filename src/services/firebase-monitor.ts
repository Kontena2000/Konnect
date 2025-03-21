
import { db, auth } from "@/lib/firebase";
import { getFirestore, disableNetwork, enableNetwork } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export interface OperationLog {
  type: 'project' | 'module' | 'category' | 'auth' | 'connection' | 'settings';
  action: string;
  status: 'success' | 'error' | 'pending';
  timestamp: number;
  details?: Record<string, unknown>;
  error?: string;
  userId?: string;
}

export interface FirebaseStatus {
  isOnline: boolean;
  connectionState: 'online' | 'offline' | 'unknown';
  authState: 'authenticated' | 'unauthenticated' | 'unknown';
  operationLogs: OperationLog[];
  lastError: string | null;
}

class FirebaseMonitor {
  private status: FirebaseStatus = {
    isOnline: true,
    connectionState: 'unknown',
    authState: 'unknown',
    operationLogs: [],
    lastError: null
  };

  private subscribers: ((status: FirebaseStatus) => void)[] = [];

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    // Monitor authentication state
    onAuthStateChanged(auth, (user) => {
      this.status.authState = user ? 'authenticated' : 'unauthenticated';
      this.notifySubscribers();
    });

    // Monitor connection state
    const firestore = getFirestore();
    enableNetwork(firestore).then(() => {
      this.status.connectionState = 'online';
      this.status.isOnline = true;
      this.notifySubscribers();
    }).catch((error: Error) => {
      console.error('Error enabling network:', error);
      this.status.lastError = error.message;
      this.notifySubscribers();
    });
  }

  async testConnection(): Promise<void> {
    const firestore = getFirestore();
    try {
      await disableNetwork(firestore);
      this.status.connectionState = 'offline';
      this.status.isOnline = false;
      this.notifySubscribers();

      await enableNetwork(firestore);
      this.status.connectionState = 'online';
      this.status.isOnline = true;
      this.notifySubscribers();
    } catch (error) {
      console.error('Connection test failed:', error);
      this.status.lastError = error instanceof Error ? error.message : 'Connection test failed';
      this.notifySubscribers();
    }
  }

  logOperation(log: OperationLog): void {
    const currentUser = auth.currentUser;
    if (currentUser) {
      log.userId = currentUser.uid;
      if (!log.details) log.details = {};
      log.details = { ...log.details, email: currentUser.email };
    }

    this.status.operationLogs.unshift(log);
    if (log.error) {
      this.status.lastError = log.error;
    }
    this.notifySubscribers();
  }

  clearLogs(): void {
    this.status.operationLogs = [];
    this.status.lastError = null;
    this.notifySubscribers();
  }

  getStatus(): FirebaseStatus {
    return { ...this.status };
  }

  subscribe(callback: (status: FirebaseStatus) => void): () => void {
    this.subscribers.push(callback);
    callback(this.status);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback({ ...this.status }));
  }
}

const firebaseMonitor = new FirebaseMonitor();
export default firebaseMonitor;
