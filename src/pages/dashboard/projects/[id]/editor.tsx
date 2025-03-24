
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

  // Convert Vector3 to tuple
  const vectorToTuple = (vector: Vector3): [number, number, number] => {
    return [vector.x, vector.y, vector.z];
  };

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

    // Create new connection with converted Vector3 to tuple
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

  // Rest of the component implementation...
  // (Previous implementation remains the same)

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
