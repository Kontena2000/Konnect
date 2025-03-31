import { getApps } from "firebase/app";
import { collection, getDocs, query, limit, where, orderBy } from "firebase/firestore";
import { db, getFirestoreSafely } from "@/lib/firebase";
import { ModuleTag, LogLevel } from '@/types/module-tags'; // Import from the new file

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  module: ModuleTag;
  stackTrace?: string;
}

export interface DiagnosticResult {
  firebaseInitialized: boolean;
  collections: {
    name: string;
    documentCount: number;
    sampleDocumentIds: string[];
  }[];
  errors: string[];
}

class DebugService {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private listeners: ((logs: LogEntry[]) => void)[] = [];
  private moduleFilters: Set<ModuleTag> = new Set<ModuleTag>(["matrix", "layout", "firebase", "auth", "editor", "general"]);
  private levelFilters: Set<LogLevel> = new Set<LogLevel>(["info", "log", "warn", "error", "debug"]);

  constructor() {
    // Initialize with some system info
    this.log("Debug service initialized", { 
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      timestamp: new Date().toISOString()
    }, "general");
  }

  /**
   * Log an informational message
   */
  info(message: string, data?: any, module: ModuleTag = "general"): void {
    this.addLogEntry("info", message, data, module);
  }

  /**
   * Log a standard message
   */
  log(message: string, data?: any, module: ModuleTag = "general"): void {
    this.addLogEntry("log", message, data, module);
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: any, module: ModuleTag = "general"): void {
    this.addLogEntry("warn", message, data, module);
  }

  /**
   * Log an error message
   */
  error(message: string, data?: any, module: ModuleTag = "general"): void {
    // Capture stack trace for errors
    const stackTrace = new Error().stack;
    this.addLogEntry("error", message, data, module, stackTrace);
    
    // Also log to console for immediate visibility
    console.error(`[${module}] ${message}`, data);
  }

  /**
   * Log a debug message
   */
  debug(message: string, data?: any, module: ModuleTag = "general"): void {
    this.addLogEntry("debug", message, data, module);
  }

  /**
   * Add a log entry to the logs array
   */
  private addLogEntry(level: LogLevel, message: string, data?: any, module: ModuleTag = "general", stackTrace?: string): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      module,
      stackTrace
    };

    this.logs.unshift(entry);

    // Trim logs if they exceed the maximum
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return this.logs;
  }

  /**
   * Get filtered logs based on module and level
   */
  getFilteredLogs(moduleFilters?: ModuleTag[], levelFilters?: LogLevel[]): LogEntry[] {
    const modules = moduleFilters || Array.from(this.moduleFilters);
    const levels = levelFilters || Array.from(this.levelFilters);

    return this.logs.filter(log => 
      modules.includes(log.module) && 
      levels.includes(log.level)
    );
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    this.notifyListeners();
  }

  /**
   * Set module filters
   */
  setModuleFilters(modules: ModuleTag[]): void {
    this.moduleFilters = new Set(modules);
    this.notifyListeners();
  }

  /**
   * Set level filters
   */
  setLevelFilters(levels: LogLevel[]): void {
    this.levelFilters = new Set(levels);
    this.notifyListeners();
  }

  /**
   * Add a listener for log updates
   */
  addListener(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of log updates
   */
  private notifyListeners(): void {
    const filteredLogs = this.getFilteredLogs();
    this.listeners.forEach(listener => listener(filteredLogs));
  }

  /**
   * Check Firebase initialization
   */
  checkFirebaseInitialization(): boolean {
    const apps = getApps();
    const isInitialized = apps.length > 0;
    
    this.log("Firebase initialization check", {
      initialized: isInitialized,
      appCount: apps.length,
      appName: isInitialized ? apps[0].name : null,
      options: isInitialized ? {
        apiKey: apps[0].options.apiKey ? "Set" : "Missing",
        authDomain: apps[0].options.authDomain ? "Set" : "Missing",
        projectId: apps[0].options.projectId ? "Set" : "Missing",
        storageBucket: apps[0].options.storageBucket ? "Set" : "Missing",
        messagingSenderId: apps[0].options.messagingSenderId ? "Set" : "Missing",
        appId: apps[0].options.appId ? "Set" : "Missing"
      } : null
    }, "firebase");
    
    if (!isInitialized) {
      this.warn("Firebase is not initialized", {
        envVars: {
          apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID
        }
      }, "firebase");
    }
    
    return isInitialized;
  }

  /**
   * Run a comprehensive diagnostic on Firebase dependencies
   */
  async runDiagnostic(): Promise<DiagnosticResult> {
    const result: DiagnosticResult = {
      firebaseInitialized: false,
      collections: [],
      errors: []
    };
    
    try {
      // Check Firebase initialization
      result.firebaseInitialized = this.checkFirebaseInitialization();
      
      if (!result.firebaseInitialized) {
        result.errors.push("Firebase is not properly initialized");
        return result;
      }
      
      // Check access to key collections
      const collectionsToCheck = [
        "calculations",
        "users",
        "projects",
        "modules",
        "layouts"
      ];
      
      for (const collectionName of collectionsToCheck) {
        try {
          const collectionInfo = await this.checkCollection(collectionName);
          result.collections.push(collectionInfo);
        } catch (error) {
          if (error instanceof Error) {
            result.errors.push(`Error checking collection ${collectionName}: ${error.message}`);
          } else {
            result.errors.push(`Unknown error checking collection ${collectionName}`);
          }
        }
      }
      
      return result;
    } catch (error) {
      if (error instanceof Error) {
        result.errors.push(`Diagnostic error: ${error.message}`);
      } else {
        result.errors.push("Unknown diagnostic error occurred");
      }
      return result;
    }
  }
  
  /**
   * Check a specific Firestore collection and return information about it
   */
  async checkCollection(collectionName: string) {
    try {
      const safeDb = getFirestoreSafely();
      if (!safeDb) {
        throw new Error("Firestore is not available");
      }
      
      const collRef = collection(safeDb, collectionName);
      const q = query(collRef, orderBy("createdAt", "desc"), limit(5));
      const snapshot = await getDocs(q);
      
      return {
        name: collectionName,
        documentCount: snapshot.size,
        sampleDocumentIds: snapshot.docs.map(doc => doc.id)
      };
    } catch (error) {
      this.error(`Error checking collection ${collectionName}`, error, "firebase");
      throw error;
    }
  }
  
  /**
   * Test a specific calculation to verify data access
   */
  async testCalculation(calculationId: string) {
    try {
      const safeDb = getFirestoreSafely();
      if (!safeDb) {
        throw new Error("Firestore is not available");
      }
      
      const calculationsRef = collection(safeDb, "calculations");
      const q = query(calculationsRef, where("id", "==", calculationId), limit(1));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return { exists: false, data: null };
      }
      
      const doc = snapshot.docs[0];
      return {
        exists: true,
        data: {
          id: doc.id,
          ...doc.data()
        }
      };
    } catch (error) {
      this.error(`Error testing calculation ${calculationId}`, error, "matrix");
      throw error;
    }
  }

  /**
   * Test a specific layout to verify data access
   */
  async testLayout(layoutId: string) {
    try {
      const safeDb = getFirestoreSafely();
      if (!safeDb) {
        throw new Error("Firestore is not available");
      }
      
      const layoutsRef = collection(safeDb, "layouts");
      const q = query(layoutsRef, where("id", "==", layoutId), limit(1));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return { exists: false, data: null };
      }
      
      const doc = snapshot.docs[0];
      return {
        exists: true,
        data: {
          id: doc.id,
          ...doc.data()
        }
      };
    } catch (error) {
      this.error(`Error testing layout ${layoutId}`, error, "layout");
      throw error;
    }
  }
}

// Create a singleton instance
const debugService = new DebugService();
export default debugService;