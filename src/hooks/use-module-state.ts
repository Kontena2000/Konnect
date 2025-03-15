
import { useState, useCallback, useRef, useEffect } from "react";
import { Module, Connection } from "@/services/layout";
import { useToast } from "@/hooks/use-toast";
import debounce from "lodash/debounce";
import layoutService from "@/services/layout";

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

export function useModuleState({
  layoutId,
  initialModules = [],
  initialConnections = [],
  autoSave = true
}: UseModuleStateProps) {
  const [state, setState] = useState<ModuleState>({
    modules: initialModules,
    connections: initialConnections,
    hasChanges: false
  });
  
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const lastSavedState = useRef<string>(JSON.stringify({ modules: initialModules, connections: initialConnections }));

  const debouncedSave = useCallback(
    debounce(async (modules: Module[], connections: Connection[]) => {
      if (!layoutId) return;
      
      try {
        await layoutService.updateLayout(layoutId, {
          modules,
          connections,
          updatedAt: new Date()
        });
        lastSavedState.current = JSON.stringify({ modules, connections });
        setState(prev => ({ ...prev, hasChanges: false }));
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
    }, 2000),
    [layoutId, toast]
  );

  useEffect(() => {
    const currentState = JSON.stringify({ modules: state.modules, connections: state.connections });
    const hasChanges = currentState !== lastSavedState.current;
    setState(prev => ({ ...prev, hasChanges }));

    if (autoSave && hasChanges && !saving) {
      setSaving(true);
      debouncedSave(state.modules, state.connections);
    }
  }, [state.modules, state.connections, autoSave, saving, debouncedSave]);

  const updateModule = useCallback((moduleId: string, updates: Partial<Module>) => {
    setState(prev => ({
      ...prev,
      modules: prev.modules.map(module =>
        module.id === moduleId ? { ...module, ...updates } : module
      )
    }));
  }, []);

  const addModule = useCallback((module: Module) => {
    setState(prev => ({
      ...prev,
      modules: [...prev.modules, module]
    }));
  }, []);

  const deleteModule = useCallback((moduleId: string) => {
    setState(prev => ({
      ...prev,
      modules: prev.modules.filter(m => m.id !== moduleId),
      connections: prev.connections.filter(
        c => c.sourceModuleId !== moduleId && c.targetModuleId !== moduleId
      ),
      selectedModuleId: prev.selectedModuleId === moduleId ? undefined : prev.selectedModuleId
    }));
  }, []);

  const addConnection = useCallback((connection: Connection) => {
    setState(prev => ({
      ...prev,
      connections: [...prev.connections, connection]
    }));
  }, []);

  const updateConnection = useCallback((connectionId: string, updates: Partial<Connection>) => {
    setState(prev => ({
      ...prev,
      connections: prev.connections.map(conn =>
        conn.id === connectionId ? { ...conn, ...updates } : conn
      )
    }));
  }, []);

  const deleteConnection = useCallback((connectionId: string) => {
    setState(prev => ({
      ...prev,
      connections: prev.connections.filter(c => c.id !== connectionId)
    }));
  }, []);

  const selectModule = useCallback((moduleId: string | undefined) => {
    setState(prev => ({
      ...prev,
      selectedModuleId: moduleId
    }));
  }, []);

  const saveChanges = useCallback(async () => {
    if (!layoutId || !state.hasChanges) return;
    
    setSaving(true);
    try {
      await layoutService.updateLayout(layoutId, {
        modules: state.modules,
        connections: state.connections,
        updatedAt: new Date()
      });
      lastSavedState.current = JSON.stringify({ 
        modules: state.modules, 
        connections: state.connections 
      });
      setState(prev => ({ ...prev, hasChanges: false }));
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
  }, [layoutId, state.modules, state.connections, state.hasChanges, toast]);

  return {
    ...state,
    saving,
    updateModule,
    addModule,
    deleteModule,
    addConnection,
    updateConnection,
    deleteConnection,
    selectModule,
    saveChanges
  };
}
