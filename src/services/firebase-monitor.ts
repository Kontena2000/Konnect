
import { db, auth } from "@/lib/firebase";
import { enableIndexedDbPersistence, disableNetwork, enableNetwork } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export interface FirebaseStatus {
  isOnline: boolean;
  lastError: string | null;
  lastOperation: string | null;
  timestamp: number;
  authState: "authenticated" | "unauthenticated" | "unknown";
  connectionState: "online" | "offline" | "error";
}

class FirebaseMonitor {
  private status: FirebaseStatus = {
    isOnline: true,
    lastError: null,
    lastOperation: null,
    timestamp: Date.now(),
    authState: "unknown",
    connectionState: "online"
  };

  private listeners: ((status: FirebaseStatus) => void)[] = [];
  private initialized = false;
  private isClient = false;

  constructor() {
    this.isClient = typeof window !== 'undefined';
  }

  private initializeMonitoring() {
    if (!this.isClient || this.initialized) return;
    this.initialized = true;

    // Monitor authentication state
    onAuthStateChanged(auth, (user) => {
      this.updateStatus({
        authState: user ? "authenticated" : "unauthenticated",
        timestamp: Date.now()
      });
    });

    // Enable offline persistence
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === "failed-precondition") {
        this.logError("Multiple tabs open, persistence can only be enabled in one tab at a time.");
      } else if (err.code === "unimplemented") {
        this.logError("The current browser doesn't support persistence.");
      }
    });

    // Monitor online/offline status
    window.addEventListener("online", () => this.handleConnectionChange(true));
    window.addEventListener("offline", () => this.handleConnectionChange(false));

    // Initial online status
    this.updateStatus({
      isOnline: navigator.onLine,
      connectionState: navigator.onLine ? "online" : "offline",
      timestamp: Date.now()
    });
  }

  private async handleConnectionChange(isOnline: boolean) {
    if (!this.isClient) return;

    try {
      if (isOnline) {
        await enableNetwork(db);
        this.updateStatus({
          isOnline: true,
          connectionState: "online",
          timestamp: Date.now()
        });
      } else {
        await disableNetwork(db);
        this.updateStatus({
          isOnline: false,
          connectionState: "offline",
          timestamp: Date.now()
        });
      }
    } catch (error) {
      this.logError("Error handling connection change: " + (error as Error).message);
      this.updateStatus({
        connectionState: "error",
        timestamp: Date.now()
      });
    }
  }

  public logOperation(operation: string) {
    this.updateStatus({
      lastOperation: operation,
      timestamp: Date.now()
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
    if (this.isClient && !this.initialized) {
      this.initializeMonitoring();
    }

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
      this.updateStatus({
        isOnline: true,
        connectionState: "online",
        timestamp: Date.now()
      });
      return true;
    } catch (error) {
      this.logError("Connection test failed: " + (error as Error).message);
      return false;
    }
  }
}

const firebaseMonitor = new FirebaseMonitor();
export default firebaseMonitor;
