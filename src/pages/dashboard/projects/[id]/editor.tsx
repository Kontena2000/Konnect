
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layout/AppLayout";
import { SceneContainer } from "@/components/three/SceneContainer";
import { Toolbox } from '@/components/layout/Toolbox';
import { useAuth } from '@/contexts/AuthContext';
import editorPreferencesService, { EditorPreferences } from '@/services/editor-preferences';
import { Module } from '@/types/module';
import { Connection } from '@/services/layout';

interface EditorState {
  modules: Module[];
  connections: Connection[];
}

export default function LayoutEditorPage() {
  const router = useRouter();
  const { user } = useAuth();
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

  // Handle module drag start
  const handleModuleDragStart = useCallback((module: Module) => {
    // Create a new module instance with unique ID
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
    setModules(prev => prev.map(module => 
      module.id === moduleId ? { ...module, ...updates } : module
    ));
  }, []);

  // Handle module deletion
  const handleModuleDelete = useCallback((moduleId: string) => {
    setModules(prev => prev.filter(module => module.id !== moduleId));
    setSelectedModuleId(undefined);
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
      <div className="h-screen relative">
        <SceneContainer
          modules={modules}
          selectedModuleId={selectedModuleId}
          transformMode={transformMode}
          onModuleSelect={handleModuleSelect}
          onModuleUpdate={handleModuleUpdate}
          onModuleDelete={handleModuleDelete}
          connections={connections}
          controlsRef={controlsRef}
          editorPreferences={editorPreferences}
        />
        <Toolbox
          onModuleDragStart={handleModuleDragStart}
          onSave={() => {}}
          onUndo={handleUndo}
          onRedo={handleRedo}
          controlsRef={controlsRef}
        />
      </div>
    </AppLayout>
  );
}
