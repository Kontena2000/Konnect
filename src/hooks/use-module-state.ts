import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import debounce from "lodash/debounce";
import layoutService from "@/services/layout";
import { Module } from "@/types/module";
import type { Connection, Layout } from "@/services/layout";

interface ModuleState {
  modules: Module[];
  connections: Connection[];
  selectedModuleId?: string;
  hasChanges: boolean;
}

interface UseModuleStateProps {
  layoutId?: string;
  initialModules?: Module[];
  initialConnections?: Connection[];
  autoSave?: boolean;
}

export function useModuleState(param?: UseModuleStateProps) {
  // Provide default values if param is undefined
  const layoutId = param?.layoutId;
  const initialModules = param?.initialModules || [];
  const initialConnections = param?.initialConnections || [];
  const autoSave = param?.autoSave !== false; // Default to true

  const [modules, setModules] = useState<Module[]>(initialModules);
  const [connections, setConnections] = useState<Connection[]>(initialConnections);
  const [selectedModuleId, setSelectedModuleId] = useState<string | undefined>();
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const lastSavedStateRef = useRef<string>(JSON.stringify({ 
    modules: initialModules || [], 
    connections: initialConnections || [] 
  }));

  // History management for undo/redo
  const [history, setHistory] = useState<ModuleState[]>([{ 
    modules: initialModules || [], 
    connections: initialConnections || [], 
    hasChanges: false 
  }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false);

  // Save current state to history when modules or connections change
  useEffect(() => {
    if (isUndoRedoAction) {
      setIsUndoRedoAction(false);
      return;
    }

    const newState = { 
      modules, 
      connections, 
      selectedModuleId, 
      hasChanges 
    };
    
    // Only add to history if something actually changed
    const currentStateStr = JSON.stringify({ modules, connections });
    const lastHistoryStateStr = JSON.stringify({ 
      modules: history[historyIndex].modules, 
      connections: history[historyIndex].connections 
    });
    
    if (currentStateStr !== lastHistoryStateStr) {
      // Remove any future history states if we're not at the end
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newState);
      
      // Limit history size to prevent memory issues
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [modules, connections, selectedModuleId, hasChanges, history, historyIndex, isUndoRedoAction]);

  const saveToLayout = useCallback(async (modules: Module[], connections: Connection[]) => {
    if (!layoutId || !user) return;
    
    try {
      await layoutService.updateLayout(layoutId, {
        modules,
        connections,
        updatedAt: new Date()
      }, user);
      lastSavedStateRef.current = JSON.stringify({ modules, connections });
      setHasChanges(false);
    } catch (error) {
      console.error("Save error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save layout"
      });
    } finally {
      setSaving(false);
    }
  }, [layoutId, user, toast]);

  const debouncedSave = useMemo(
    () => debounce(saveToLayout, 2000),
    [saveToLayout]
  );

  useEffect(() => {
    const currentState = JSON.stringify({ modules, connections });
    const hasChanges = currentState !== lastSavedStateRef.current;
    setHasChanges(hasChanges);

    if (autoSave && hasChanges && !saving && layoutId && user) {
      setSaving(true);
      debouncedSave(modules, connections);
    }
  }, [modules, connections, autoSave, saving, layoutId, user, debouncedSave]);

  // Add autosave effect
  useEffect(() => {
    if (!autoSave || !layoutId || !hasChanges || !user) return;

    const saveTimer = setTimeout(async () => {
      try {
        await layoutService.updateLayout(layoutId, {
          modules,
          connections,
          updatedAt: new Date()
        }, user);
        
        setHasChanges(false);
        setSaving(false);
      } catch (error) {
        console.error('Error auto-saving layout:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to auto-save layout'
        });
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(saveTimer);
  }, [modules, connections, layoutId, autoSave, hasChanges, user, toast]);

  const updateModule = useCallback((module: Module) => {
    setModules(prev => prev.map(m => 
      m.id === module.id ? { ...m, ...module } : m
    ));
  }, []);

  const addModule = useCallback((module: Module, addToHistory = true) => {
    setModules(prev => [...prev, module]);
  }, []);

  const removeModule = useCallback((moduleId: string) => {
    setModules(prev => prev.filter(m => m.id !== moduleId));
    setConnections(prev => prev.filter(
      c => c.sourceModuleId !== moduleId && c.targetModuleId !== moduleId
    ));
    setSelectedModuleId(prev => (prev === moduleId ? undefined : prev));
  }, []);

  const addConnection = useCallback((connection: Connection, addToHistory = true) => {
    setConnections(prev => [...prev, connection]);
  }, []);

  const removeConnection = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connectionId));
  }, []);

  const clearModules = useCallback(() => {
    setModules([]);
    setConnections([]);
    setSelectedModuleId(undefined);
  }, []);

  const undoLastAction = useCallback(() => {
    if (historyIndex > 0) {
      setIsUndoRedoAction(true);
      const prevState = history[historyIndex - 1];
      setModules(prevState.modules);
      setConnections(prevState.connections);
      setSelectedModuleId(prevState.selectedModuleId);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  const redoLastAction = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setIsUndoRedoAction(true);
      const nextState = history[historyIndex + 1];
      setModules(nextState.modules);
      setConnections(nextState.connections);
      setSelectedModuleId(nextState.selectedModuleId);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  const resetHistory = useCallback(() => {
    setHistory([{ modules, connections, hasChanges: false }]);
    setHistoryIndex(0);
  }, [modules, connections]);

  // Computed properties for undo/redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const saveChanges = useCallback(async () => {
    if (!layoutId || !hasChanges || !user) return;
    
    setSaving(true);
    try {
      await layoutService.updateLayout(layoutId, {
        modules,
        connections,
        updatedAt: new Date()
      }, user);
      lastSavedStateRef.current = JSON.stringify({ 
        modules, 
        connections 
      });
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Layout saved successfully"
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save layout"
      });
    } finally {
      setSaving(false);
    }
  }, [layoutId, modules, connections, hasChanges, user, toast]);

  return {
    modules,
    connections,
    selectedModuleId,
    hasChanges,
    saving,
    setModules,
    setConnections,
    setSelectedModuleId,
    updateModule,
    addModule,
    removeModule,
    addConnection,
    removeConnection,
    clearModules,
    undoLastAction,
    redoLastAction,
    canUndo,
    canRedo,
    resetHistory,
    saveChanges
  };
}