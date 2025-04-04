import { getAuthSafely, getFirestoreSafely } from '@/lib/firebase';
import { disableNetwork, enableNetwork, getDocs, collection } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { waitForFirebaseBootstrap } from '@/utils/firebaseBootstrap';
import { initializeFirebaseMonitorSafely, safeMonitorOperation } from '@/utils/firebaseMonitorUtils';

export interface OperationLog {
  type: 'project' | 'module' | 'category' | 'auth' | 'connection' | 'settings';
  action: string;
  status: 'success' | 'error' | 'pending' | 'warning';
  timestamp: number;
  details?: Record<string, unknown>;
  error?: string;
  userId?: string;
  email?: string;
}

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  operationDuration: number;
  timestamp: number;
  sceneObjects?: number;
  triangles?: number;
}

export interface FirebaseStatus {
  isOnline: boolean;
  connectionState: 'online' | 'offline' | 'unknown';
  authState: 'authenticated' | 'unauthenticated' | 'unknown';
  operationLogs: OperationLog[];
  lastError: string | null;
  performanceMetrics: PerformanceMetrics[];
}

class FirebaseMonitor {
  private status: FirebaseStatus = {
    isOnline: true,
    connectionState: 'unknown',
    authState: 'unknown',
    operationLogs: [],
    lastError: null,
    performanceMetrics: []
  };

  private readonly PERFORMANCE_THRESHOLDS = {
    FPS_MIN: 30,
    MEMORY_MAX: 90,
    OPERATION_MAX_DURATION: 1000,
    METRICS_HISTORY_LIMIT: 100,
    TRIANGLES_WARNING: 100000
  };

  private subscribers: ((status: FirebaseStatus) => void)[] = [];

  constructor() {
    // Initialize monitoring asynchronously to avoid blocking
    setTimeout(() => this.initializeMonitoring(), 0);
  }

  private async initializeMonitoring() {
    try {
      // Use our new bootstrap utility to ensure Firebase is initialized
      const bootstrapped = await waitForFirebaseBootstrap();
      if (!bootstrapped) {
        console.error('[FirebaseMonitor] Firebase bootstrap failed');
        this.status.connectionState = 'unknown';
        this.status.lastError = 'Firebase initialization failed';
        this.notifySubscribers();
        return;
      }

      // Get auth instance safely
      const safeAuth = getAuthSafely();
      
      if (safeAuth) {
        onAuthStateChanged(safeAuth, (user) => {
          this.status.authState = user ? 'authenticated' : 'unauthenticated';
          this.notifySubscribers();
        });
      } else {
        console.error('Failed to get Auth instance in FirebaseMonitor');
        this.status.authState = 'unknown';
        this.status.lastError = 'Failed to get Auth instance';
      }

      // Get Firestore instance safely
      const safeDb = getFirestoreSafely();
      if (safeDb) {
        // Use the safely obtained Firestore instance directly
        enableNetwork(safeDb).then(() => {
          this.status.connectionState = 'online';
          this.status.isOnline = true;
          this.notifySubscribers();
        }).catch((error: Error) => {
          console.error('Error enabling network:', error);
          this.status.lastError = error.message;
          this.notifySubscribers();
        });
      } else {
        console.error('Failed to get Firestore instance in FirebaseMonitor');
        this.status.connectionState = 'unknown';
        this.status.lastError = 'Failed to get Firestore instance';
      }
    } catch (error) {
      console.error('[FirebaseMonitor] Error initializing monitoring:', error);
      this.status.lastError = error instanceof Error ? error.message : 'Unknown error initializing monitoring';
      this.notifySubscribers();
    }
  }

  async testConnection(): Promise<void> {
    return safeMonitorOperation(async () => {
      // Get Firestore instance safely
      const safeDb = getFirestoreSafely();
      if (!safeDb) {
        throw new Error('Failed to get Firestore instance');
      }
      
      this.logOperation({
        type: 'connection',
        action: 'test_connection',
        status: 'pending',
        timestamp: Date.now()
      });

      await disableNetwork(safeDb);
      this.status.connectionState = 'offline';
      this.status.isOnline = false;
      this.notifySubscribers();

      await new Promise(resolve => setTimeout(resolve, 1000));

      await enableNetwork(safeDb);
      this.status.connectionState = 'online';
      this.status.isOnline = true;

      const testCollection = collection(safeDb, 'editorPreferences');
      await getDocs(testCollection);

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
    }, undefined, 'Connection test failed');
  }

  measureOperation<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = window.performance.now();
    return fn().finally(() => {
      const duration = window.performance.now() - start;
      this.status.performanceMetrics.push({
        fps: 0,
        memoryUsage: 0,
        operationDuration: duration,
        timestamp: Date.now()
      });
      if (duration > 1000) {
        this.logOperation({
          type: 'settings',
          action: 'performance_warning',
          status: 'warning',
          timestamp: Date.now(),
          details: { operation, duration }
        });
      }
    });
  }

  getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.status.performanceMetrics];
  }

  clearPerformanceMetrics(): void {
    this.status.performanceMetrics = [];
  }

  logOperation(log: OperationLog): void {
    const safeAuth = getAuthSafely();
    const currentUser = safeAuth?.currentUser;
    
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

  logPerformanceMetric(metrics: Partial<PerformanceMetrics>): void {
    const currentMetrics = {
      fps: metrics.fps || 0,
      memoryUsage: metrics.memoryUsage || 0,
      operationDuration: metrics.operationDuration || 0,
      timestamp: Date.now(),
      sceneObjects: metrics.sceneObjects,
      triangles: metrics.triangles
    };

    this.status.performanceMetrics.push(currentMetrics);

    if (this.status.performanceMetrics.length > this.PERFORMANCE_THRESHOLDS.METRICS_HISTORY_LIMIT) {
      this.status.performanceMetrics = this.status.performanceMetrics.slice(-this.PERFORMANCE_THRESHOLDS.METRICS_HISTORY_LIMIT);
    }

    // Only log warnings if we have a valid Firestore instance
    const safeAuth = getAuthSafely();
    if (!safeAuth) {
      return;
    }

    if (metrics.fps && metrics.fps < this.PERFORMANCE_THRESHOLDS.FPS_MIN) {
      this.logOperation({
        type: 'settings',
        action: 'performance_warning',
        status: 'warning',
        timestamp: Date.now(),
        details: { fps: metrics.fps, message: 'Low frame rate detected' }
      });
    }

    if (metrics.triangles && metrics.triangles > this.PERFORMANCE_THRESHOLDS.TRIANGLES_WARNING) {
      this.logOperation({
        type: 'settings',
        action: 'performance_warning',
        status: 'warning',
        timestamp: Date.now(),
        details: { triangles: metrics.triangles, message: 'High polygon count detected' }
      });
    }

    if (metrics.memoryUsage && metrics.memoryUsage > this.PERFORMANCE_THRESHOLDS.MEMORY_MAX) {
      this.logOperation({
        type: 'settings',
        action: 'performance_warning',
        status: 'warning',
        timestamp: Date.now(),
        details: { memoryUsage: metrics.memoryUsage, message: 'High memory usage detected' }
      });
    }

    if (metrics.operationDuration && metrics.operationDuration > this.PERFORMANCE_THRESHOLDS.OPERATION_MAX_DURATION) {
      this.logOperation({
        type: 'settings',
        action: 'performance_warning',
        status: 'warning',
        timestamp: Date.now(),
        details: { duration: metrics.operationDuration, message: 'Operation took too long' }
      });
    }
  }
}

const firebaseMonitor = new FirebaseMonitor();
export default firebaseMonitor;