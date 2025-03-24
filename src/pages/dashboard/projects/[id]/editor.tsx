
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
import layoutService from "@/services/layout";

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
  const { id: projectId } = router.query;

  // State
  const [modules, setModules] = useState<Module[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [undoStack, setUndoStack] = useState<EditorState[]>([]);
  const [redoStack, setRedoStack] = useState<EditorState[]>([]);
  const [editorPreferences, setEditorPreferences] = useState<EditorPreferences | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string>();
  const [transformMode, setTransformMode] = useState<"translate" | "rotate" | "scale">("translate");
  const [activeConnection, setActiveConnection] = useState<ActiveConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize heavy computations
  const memoizedModules = useMemo(() => modules, [modules]);
  const memoizedConnections = useMemo(() => connections, [connections]);

  // Load initial data
  useEffect(() => {
    if (projectId && user) {
      setIsLoading(true);
      layoutService.getLayout(projectId as string)
        .then(layout => {
          setModules(layout.modules || []);
          setConnections(layout.connections || []);
          setIsLoading(false);
        })
        .catch(error => {
          console.error("Failed to load layout:", error);
          toast({
            title: "Error",
            description: "Failed to load layout data",
            variant: "destructive"
          });
          setIsLoading(false);
        });
    }
  }, [projectId, user, toast]);

  // Convert Vector3 to tuple
  const vectorToTuple = (vector: Vector3): [number, number, number] => {
    return [vector.x, vector.y, vector.z];
  };

  // Handle module selection
  const handleModuleSelect = useCallback((moduleId: string) => {
    setSelectedModuleId(moduleId);
  }, []);

  // Handle module updates
  const handleModuleUpdate = useCallback((moduleId: string, updates: Partial<Module>) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId ? { ...module, ...updates } : module
    ));
  }, []);

  // Handle module deletion
  const handleModuleDelete = useCallback((moduleId: string) => {
    setModules(prev => prev.filter(module => module.id !== moduleId));
    setConnections(prev => prev.filter(conn => 
      conn.sourceModuleId !== moduleId && conn.targetModuleId !== moduleId
    ));
    setSelectedModuleId(undefined);
  }, []);

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

    if (targetModuleId === activeConnection.sourceModuleId || type !== activeConnection.type) {
      setActiveConnection(null);
      return;
    }

    const newConnection: Connection = {
      id: `${activeConnection.sourceModuleId}-${targetModuleId}-${Date.now()}`,
      sourceModuleId: activeConnection.sourceModuleId,
      targetModuleId,
      sourcePoint: vectorToTuple(activeConnection.sourcePoint),
      targetPoint: vectorToTuple(targetPoint),
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

  // Save handler
  const handleSave = useCallback(async () => {
    if (!projectId) return;

    try {
      await layoutService.saveLayout(projectId as string, {
        modules,
        connections
      });

      toast({
        title: "Success",
        description: "Layout saved successfully"
      });
    } catch (error) {
      console.error("Failed to save layout:", error);
      toast({
        title: "Error",
        description: "Failed to save layout",
        variant: "destructive"
      });
    }
  }, [projectId, modules, connections, toast]);

  // Undo handler
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;

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
  }, [undoStack, modules, connections]);

  // Redo handler
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;

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
  }, [redoStack, modules, connections]);

  // Save state for undo when modules or connections change
  useEffect(() => {
    if (isUndoingOrRedoing.current) return;
    
    const newState = { modules, connections };
    const lastState = undoStack[undoStack.length - 1];
    
    if (!lastState || 
        JSON.stringify(lastState.modules) !== JSON.stringify(newState.modules) ||
        JSON.stringify(lastState.connections) !== JSON.stringify(newState.connections)) {
      setUndoStack(prev => [...prev, newState]);
      setRedoStack([]);
    }
  }, [modules, connections, undoStack]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading layout...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

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
