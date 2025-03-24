
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layout/AppLayout";
import { SceneContainer } from "@/components/three/SceneContainer";
import { Toolbox } from '@/components/layout/Toolbox';
import { ConnectionManager } from '@/components/three/ConnectionManager';
import { useAuth } from '@/contexts/AuthContext';
import editorPreferencesService, { EditorPreferences } from '@/services/editor-preferences';
import { Module } from '@/types/module';
import { Connection } from '@/services/layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import firebaseMonitor from '@/services/firebase-monitor';
import { Vector3 } from "three";
import { ConnectionType } from "@/types/connection";
import { useToast } from "@/hooks/use-toast";

interface EditorState {
  modules: Module[];
  connections: Connection[];
}

interface ActiveConnection {
  sourceModuleId: string;
  sourcePoint: Vector3;
  type: ConnectionType;
}

export default function LayoutEditorPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const controlsRef = useRef<any>(null);
  const isUndoingOrRedoing = useRef(false);

  // State
  const [modules, setModules] = useState<Module[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [undoStack, setUndoStack] = useState<EditorState[]>([]);
  const [redoStack, setRedoStack] = useState<EditorState[]>([]);
  const [editorPreferences, setEditorPreferences] = useState<EditorPreferences | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string>();
  const [transformMode, setTransformMode] = useState<"translate" | "rotate" | "scale">("translate");
  const [activeConnection, setActiveConnection] = useState<ActiveConnection | null>(null);

  // Memoize heavy computations
  const memoizedModules = useMemo(() => modules, [modules]);
  const memoizedConnections = useMemo(() => connections, [connections]);

  // Handle connection start
  const handleStartConnection = useCallback((moduleId: string, point: Vector3, type: ConnectionType) => {
    setActiveConnection({
      sourceModuleId: moduleId,
      sourcePoint: point,
      type
    });
  }, []);

  // Handle connection end
  const handleEndConnection = useCallback((targetModuleId: string, targetPoint: Vector3, type: ConnectionType) => {
    if (!activeConnection) return;

    // Don't connect to same module or different connection types
    if (targetModuleId === activeConnection.sourceModuleId || type !== activeConnection.type) {
      setActiveConnection(null);
      return;
    }

    // Create new connection
    const newConnection: Connection = {
      id: `${activeConnection.sourceModuleId}-${targetModuleId}-${Date.now()}`,
      sourceModuleId: activeConnection.sourceModuleId,
      targetModuleId,
      sourcePoint: activeConnection.sourcePoint,
      targetPoint,
      type: activeConnection.type,
      capacity: 0,
      currentLoad: 0
    };

    setConnections(prev => [...prev, newConnection]);
    setActiveConnection(null);

    toast({
      title: "Connection Created",
      description: `Created new ${type} connection between modules`
    });
  }, [activeConnection, toast]);

  // Handle module drag start
  const handleModuleDragStart = useCallback((module: Module) => {
    const newModule: Module = {
      ...module,
      id: `${module.id}-${Date.now()}`,
      position: [0, module.dimensions.height / 2, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    };
    
    setModules(prev => [...prev, newModule]);
    setSelectedModuleId(newModule.id);
  }, []);

  // Handle module selection
  const handleModuleSelect = useCallback((moduleId: string) => {
    setSelectedModuleId(moduleId);
  }, []);

  // Handle module updates
  const handleModuleUpdate = useCallback((moduleId: string, updates: Partial<Module>) => {
    const startTime = performance.now();
    
    setModules(prev => {
      const newModules = prev.map(module => 
        module.id === moduleId ? { ...module, ...updates } : module
      );
      
      const duration = performance.now() - startTime;
      firebaseMonitor.logPerformanceMetric({
        operationDuration: duration,
        timestamp: Date.now()
      });
      
      return newModules;
    });
  }, []);

  // Handle module deletion
  const handleModuleDelete = useCallback((moduleId: string) => {
    setModules(prev => prev.filter(module => module.id !== moduleId));
    setConnections(prev => prev.filter(conn => 
      conn.sourceModuleId !== moduleId && conn.targetModuleId !== moduleId
    ));
    setSelectedModuleId(undefined);
  }, []);

  // Handle connection updates
  const handleConnectionUpdate = useCallback((connectionId: string, updates: Partial<Connection>) => {
    setConnections(prev => prev.map(connection => 
      connection.id === connectionId ? { ...connection, ...updates } : connection
    ));
  }, []);

  // Handle connection deletion
  const handleConnectionDelete = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(connection => connection.id !== connectionId));
  }, []);

  // Undo handler
  const handleUndo = useCallback(() => {
    if (undoStack.length > 0) {
      isUndoingOrRedoing.current = true;
      const previousState = undoStack[undoStack.length - 1];
      const currentState = { modules, connections };
      
      setUndoStack(prev => prev.slice(0, -1));
      setRedoStack(prev => [...prev, currentState]);
      setModules(previousState.modules);
      setConnections(previousState.connections);
      
      setTimeout(() => {
        isUndoingOrRedoing.current = false;
      }, 50);
    }
  }, [undoStack, modules, connections]);

  // Redo handler
  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      isUndoingOrRedoing.current = true;
      const nextState = redoStack[redoStack.length - 1];
      const currentState = { modules, connections };
      
      setUndoStack(prev => [...prev, currentState]);
      setRedoStack(prev => prev.slice(0, -1));
      setModules(nextState.modules);
      setConnections(nextState.connections);
      
      setTimeout(() => {
        isUndoingOrRedoing.current = false;
      }, 50);
    }
  }, [redoStack, modules, connections]);

  // Debounced save with performance monitoring
  const saveTimeout = useRef<NodeJS.Timeout>();
  const handleSave = useCallback(() => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    const startTime = performance.now();
    saveTimeout.current = setTimeout(() => {
      // Implement save logic here
      const duration = performance.now() - startTime;
      firebaseMonitor.logPerformanceMetric({
        operationDuration: duration,
        timestamp: Date.now()
      });
    }, 1000);
  }, []);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, []);

  // Save state for undo when modules or connections change
  useEffect(() => {
    if (isUndoingOrRedoing.current) return;
    
    const newState = { modules, connections };
    const lastState = undoStack[undoStack.length - 1];
    
    if (!lastState || 
        JSON.stringify(lastState.modules) !== JSON.stringify(newState.modules) ||
        JSON.stringify(lastState.connections) !== JSON.stringify(newState.connections)) {
      setUndoStack(prev => [...prev, newState]);
    }
  }, [modules, connections, undoStack]);

  // Load editor preferences
  useEffect(() => {
    if (user) {
      editorPreferencesService.getPreferences(user.uid)
        .then(prefs => {
          setEditorPreferences(prefs);
        })
        .catch(error => {
          console.error("Failed to load editor preferences:", error);
        });
    }
  }, [user]);

  return (
    <AppLayout>
      <ErrorBoundary>
        <div className="flex min-h-screen w-full">
          <div className="flex-1 relative">
            <SceneContainer
              modules={memoizedModules}
              selectedModuleId={selectedModuleId}
              transformMode={transformMode}
              onModuleSelect={handleModuleSelect}
              onModuleUpdate={handleModuleUpdate}
              onModuleDelete={handleModuleDelete}
              connections={memoizedConnections}
              controlsRef={controlsRef}
              editorPreferences={editorPreferences}
              onStartConnection={handleStartConnection}
              onEndConnection={handleEndConnection}
              activeConnection={activeConnection}
            />
            <div className="absolute top-4 right-4 w-80">
              <ConnectionManager
                connections={memoizedConnections}
                onUpdateConnection={handleConnectionUpdate}
                onDeleteConnection={handleConnectionDelete}
              />
            </div>
            <Toolbox
              onModuleDragStart={handleModuleDragStart}
              onSave={handleSave}
              onUndo={handleUndo}
              onRedo={handleRedo}
              controlsRef={controlsRef}
            />
          </div>
        </div>
      </ErrorBoundary>
    </AppLayout>
  );
}
