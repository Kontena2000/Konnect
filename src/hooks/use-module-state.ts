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
  const initialModules = Array.isArray(param?.initialModules) ? param.initialModules : [];
  const initialConnections = Array.isArray(param?.initialConnections) ? param.initialConnections : [];
  const autoSave = param?.autoSave !== false; // Default to true

  const [modules, setModules] = useState<Module[]>(initialModules);
  const [connections, setConnections] = useState<Connection[]>(initialConnections);
  const [selectedModuleId, setSelectedModuleId] = useState<string | undefined>();
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Safely stringify the initial state
  const safeStringify = (data: any) => {
    try {
      return JSON.stringify(data || []);
    } catch (err) {
      console.warn("Error stringifying data:", err);
      return JSON.stringify([]);
    }
  };
  
  const lastSavedStateRef = useRef<string>(safeStringify({ 
    modules: initialModules, 
    connections: initialConnections 
  }));

  // History management for undo/redo
  const [history, setHistory] = useState<ModuleState[]>([{ 
    modules: initialModules, 
    connections: initialConnections, 
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
    try {
      const currentStateStr = safeStringify({ modules, connections });
      const lastHistoryState = history[historyIndex];
      
      if (!lastHistoryState) {
        // If history is empty or corrupted, reset it
        setHistory([newState]);
        setHistoryIndex(0);
        return;
      }
      
      const lastHistoryStateStr = safeStringify({ 
        modules: lastHistoryState.modules, 
        connections: lastHistoryState.connections 
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
    } catch (error) {
      console.error("Error updating history:", error);
      // Reset history if there's an error
      setHistory([newState]);
      setHistoryIndex(0);
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
      lastSavedStateRef.current = safeStringify({ modules, connections });
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
    try {
      const currentState = safeStringify({ modules, connections });
      const hasChanges = currentState !== lastSavedStateRef.current;
      setHasChanges(hasChanges);

      if (autoSave && hasChanges && !saving && layoutId && user) {
        setSaving(true);
        debouncedSave(modules, connections);
      }
    } catch (error) {
      console.error("Error checking for changes:", error);
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
        
        lastSavedStateRef.current = safeStringify({ modules, connections });
        setHasChanges(false);
        setSaving(false);
      } catch (error) {
        console.error('Error auto-saving layout:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to auto-save layout'
        });
        setSaving(false);
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(saveTimer);
  }, [modules, connections, layoutId, autoSave, hasChanges, user, toast]);

  const updateModule = useCallback((module: Module) => {
    if (!module || !module.id) {
      console.warn("Attempted to update module with invalid data:", module);
      return;
    }
    
    setModules(prev => prev.map(m => 
      m.id === module.id ? { ...m, ...module } : m
    ));
  }, []);

  const addModule = useCallback((module: Module, addToHistory = true) => {
    if (!module) {
      console.warn("Attempted to add invalid module:", module);
      return;
    }
    
    // Ensure module has selected property
    const moduleWithSelected = {
      ...module,
      selected: typeof module.selected === 'boolean' ? module.selected : false
    };
    
    setModules(prev => [...prev, moduleWithSelected]);
  }, []);

  const removeModule = useCallback((moduleId: string) => {
    if (!moduleId) {
      console.warn("Attempted to remove module with invalid ID:", moduleId);
      return;
    }
    
    setModules(prev => prev.filter(m => m.id !== moduleId));
    setConnections(prev => prev.filter(
      c => c.sourceModuleId !== moduleId && c.targetModuleId !== moduleId
    ));
    setSelectedModuleId(prev => (prev === moduleId ? undefined : prev));
  }, []);

  const addConnection = useCallback((connection: Connection, addToHistory = true) => {
    if (!connection || !connection.id) {
      console.warn("Attempted to add invalid connection:", connection);
      return;
    }
    
    setConnections(prev => [...prev, connection]);
  }, []);

  const removeConnection = useCallback((connectionId: string) => {
    if (!connectionId) {
      console.warn("Attempted to remove connection with invalid ID:", connectionId);
      return;
    }
    
    setConnections(prev => prev.filter(c => c.id !== connectionId));
  }, []);

  const clearModules = useCallback(() => {
    setModules([]);
    setConnections([]);
    setSelectedModuleId(undefined);
  }, []);

  const undoLastAction = useCallback(() => {
    if (historyIndex > 0) {
      try {
        setIsUndoRedoAction(true);
        const prevState = history[historyIndex - 1];
        
        if (!prevState) {
          console.warn("Undo failed: Previous state not found");
          return;
        }
        
        setModules(prevState.modules || []);
        setConnections(prevState.connections || []);
        setSelectedModuleId(prevState.selectedModuleId);
        setHistoryIndex(historyIndex - 1);
      } catch (error) {
        console.error("Error during undo:", error);
      }
    }
  }, [history, historyIndex]);

  const redoLastAction = useCallback(() => {
    if (historyIndex < history.length - 1) {
      try {
        setIsUndoRedoAction(true);
        const nextState = history[historyIndex + 1];
        
        if (!nextState) {
          console.warn("Redo failed: Next state not found");
          return;
        }
        
        setModules(nextState.modules || []);
        setConnections(nextState.connections || []);
        setSelectedModuleId(nextState.selectedModuleId);
        setHistoryIndex(historyIndex + 1);
      } catch (error) {
        console.error("Error during redo:", error);
      }
    }
  }, [history, historyIndex]);

  const resetHistory = useCallback(() => {
    try {
      setHistory([{ modules, connections, hasChanges: false }]);
      setHistoryIndex(0);
    } catch (error) {
      console.error("Error resetting history:", error);
    }
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
      lastSavedStateRef.current = safeStringify({ 
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