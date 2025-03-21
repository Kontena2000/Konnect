
import { db, auth } from "@/lib/firebase";
import { disableNetwork, enableNetwork } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export interface OperationLog {
  type: 'project' | 'module' | 'category' | 'auth' | 'connection';
  action: string;
  status: 'success' | 'error' | 'pending';
  timestamp: number;
  details?: any;
  error?: string;
  userId?: string;
}

export interface FirebaseStatus {
  isOnline: boolean;
  lastError: string | null;
  lastOperation: string | null;
  timestamp: number;
  authState: "authenticated" | "unauthenticated" | "unknown";
  connectionState: "online" | "offline" | "error";
  operationLogs: OperationLog[];
}

class FirebaseMonitor {
  private status: FirebaseStatus = {
    isOnline: true,
    lastError: null,
    lastOperation: null,
    timestamp: Date.now(),
    authState: "unknown",
    connectionState: "online",
    operationLogs: []
  };

  private listeners: ((status: FirebaseStatus) => void)[] = [];
  private initialized = false;
  private isClient = false;
  private maxLogs = 100;

  constructor() {
    this.isClient = typeof window !== 'undefined';
    if (this.isClient) {
      this.initializeMonitoring();
    }
  }

  private initializeMonitoring() {
    if (this.initialized) return;
    this.initialized = true;

    // Monitor authentication state
    onAuthStateChanged(auth, (user) => {
      this.logOperation({
        type: 'auth',
        action: user ? 'sign_in' : 'sign_out',
        status: 'success',
        timestamp: Date.now(),
        userId: user?.uid,
        details: { email: user?.email }
      });

      this.updateStatus({
        authState: user ? "authenticated" : "unauthenticated",
        timestamp: Date.now()
      });
    });

    // Monitor online/offline status
    if (typeof window !== 'undefined') {
      window.addEventListener("online", () => this.handleConnectionChange(true));
      window.addEventListener("offline", () => this.handleConnectionChange(false));

      // Initial online status
      this.updateStatus({
        isOnline: navigator.onLine,
        connectionState: navigator.onLine ? "online" : "offline",
        timestamp: Date.now()
      });
    }
  }

  private async handleConnectionChange(isOnline: boolean) {
    if (!this.isClient) return;

    try {
      if (isOnline) {
        await enableNetwork(db);
        this.logOperation({
          type: 'connection',
          action: 'enable_network',
          status: 'success',
          timestamp: Date.now()
        });
        this.updateStatus({
          isOnline: true,
          connectionState: "online",
          timestamp: Date.now()
        });
      } else {
        await disableNetwork(db);
        this.logOperation({
          type: 'connection',
          action: 'disable_network',
          status: 'success',
          timestamp: Date.now()
        });
        this.updateStatus({
          isOnline: false,
          connectionState: "offline",
          timestamp: Date.now()
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logOperation({
        type: 'connection',
        action: isOnline ? 'enable_network' : 'disable_network',
        status: 'error',
        timestamp: Date.now(),
        error: errorMessage
      });
      this.logError("Error handling connection change: " + errorMessage);
      this.updateStatus({
        connectionState: "error",
        timestamp: Date.now()
      });
    }
  }

  public logOperation(log: OperationLog) {
    const updatedLogs = [log, ...this.status.operationLogs].slice(0, this.maxLogs);
    
    this.updateStatus({
      lastOperation: `${log.type}:${log.action}`,
      operationLogs: updatedLogs,
      timestamp: Date.now()
    });

    if (log.status === 'error') {
      this.logError(`${log.type}:${log.action} - ${log.error}`);
    }

    // Log to console for debugging
    console.log(`Firebase Operation:`, {
      type: log.type,
      action: log.action,
      status: log.status,
      timestamp: new Date(log.timestamp).toISOString(),
      ...(log.details && { details: log.details }),
      ...(log.error && { error: log.error }),
      ...(log.userId && { userId: log.userId })
    });
  }

  public logError(error: string) {
    console.error("Firebase Error:", error);
    this.updateStatus({
      lastError: error,
      timestamp: Date.now()
    });
  }

  private updateStatus(partial: Partial<FirebaseStatus>) {
    this.status = {
      ...this.status,
      ...partial
    };
    this.notifyListeners();
  }

  public subscribe(listener: (status: FirebaseStatus) => void) {
    this.listeners.push(listener);
    listener(this.status);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.status));
  }

  public getStatus(): FirebaseStatus {
    return { ...this.status };
  }

  public async testConnection(): Promise<boolean> {
    if (!this.isClient) return false;

    try {
      await enableNetwork(db);
      this.logOperation({
        type: 'connection',
        action: 'test_connection',
        status: 'success',
        timestamp: Date.now()
      });
      this.updateStatus({
        isOnline: true,
        connectionState: "online",
        timestamp: Date.now()
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logOperation({
        type: 'connection',
        action: 'test_connection',
        status: 'error',
        timestamp: Date.now(),
        error: errorMessage
      });
      this.logError("Connection test failed: " + errorMessage);
      return false;
    }
  }

  public clearLogs() {
    this.updateStatus({
      operationLogs: [],
      timestamp: Date.now()
    });
  }
}

const firebaseMonitor = new FirebaseMonitor();
export default firebaseMonitor;
