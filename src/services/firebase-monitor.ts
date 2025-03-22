
import { db, auth } from "@/lib/firebase";
import { getFirestore, disableNetwork, enableNetwork, getDocs, collection } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export interface OperationLog {
  type: 'project' | 'module' | 'category' | 'auth' | 'connection' | 'settings';
  action: string;
  status: 'success' | 'error' | 'pending';
  timestamp: number;
  details?: Record<string, unknown>;
  error?: string;
  userId?: string;
  email?: string;
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
    onAuthStateChanged(auth, (user) => {
      this.status.authState = user ? 'authenticated' : 'unauthenticated';
      this.notifySubscribers();
    });

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
      // Log the test start
      this.logOperation({
        type: 'connection',
        action: 'test_connection',
        status: 'pending',
        timestamp: Date.now()
      });

      // First test: Disable network
      await disableNetwork(firestore);
      this.status.connectionState = 'offline';
      this.status.isOnline = false;
      this.notifySubscribers();

      // Second test: Enable network
      await enableNetwork(firestore);
      this.status.connectionState = 'online';
      this.status.isOnline = true;

      // Third test: Actually try to read from Firestore
      const testCollection = collection(firestore, 'editorPreferences');
      await getDocs(testCollection);

      // Log success
      this.logOperation({
        type: 'connection',
        action: 'test_connection',
        status: 'success',
        timestamp: Date.now(),
        details: {
          connectionState: this.status.connectionState,
          authState: this.status.authState
        }
      });

      this.notifySubscribers();
    } catch (error) {
      // Update status and log error
      this.status.connectionState = 'error';
      this.status.isOnline = false;
      this.status.lastError = error instanceof Error ? error.message : 'Connection test failed';
      
      this.logOperation({
        type: 'connection',
        action: 'test_connection',
        status: 'error',
        timestamp: Date.now(),
        error: this.status.lastError,
        details: {
          connectionState: this.status.connectionState,
          authState: this.status.authState
        }
      });

      this.notifySubscribers();
      throw error;
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
