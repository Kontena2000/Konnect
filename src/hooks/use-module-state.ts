import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Module, Connection } from "@/services/layout";
import { useToast } from "@/hooks/use-toast";
import debounce from "lodash/debounce";
import layoutService from "@/services/layout";
import { debouncedSave } from '@/services/layout';

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
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [connections, setConnections] = useState<Connection[]>(initialConnections);
  const [selectedModuleId, setSelectedModuleId] = useState<string>();
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const lastSavedState = useRef<string>(JSON.stringify({ 
    modules: initialModules, 
    connections: initialConnections 
  }));

  const debouncedSaveCallback = useCallback(
    async (modules: Module[], connections: Connection[]) => {
      if (!layoutId) return;
      try {
        await layoutService.updateLayout(layoutId, {
          modules,
          connections,
          updatedAt: new Date()
        });
        lastSavedState.current = JSON.stringify({ modules, connections });
        setHasChanges(false);
      } catch (error) {
        console.error('Save error:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save layout'
        });
      } finally {
        setSaving(false);
      }
    },
    [layoutId, toast]
  );

  const debouncedSave = useMemo(
    () => debounce(debouncedSaveCallback, 2000),
    [debouncedSaveCallback]
  );

  useEffect(() => {
    const currentState = JSON.stringify({ modules, connections });
    const hasChanges = currentState !== lastSavedState.current;
    setHasChanges(hasChanges);

    if (autoSave && hasChanges && !saving && layoutId) {
      setSaving(true);
      debouncedSave(modules, connections);
    }
  }, [modules, connections, autoSave, saving, layoutId, debouncedSave]);

  const updateModule = useCallback((moduleId: string, updates: Partial<Module>) => {
    setModules(prev => prev.map(module =>
      module.id === moduleId ? { ...module, ...updates } : module
    ));
  }, []);

  const addModule = useCallback((module: Module) => {
    setModules(prev => [...prev, module]);
  }, []);

  const deleteModule = useCallback((moduleId: string) => {
    setModules(prev => prev.filter(m => m.id !== moduleId));
    setConnections(prev => prev.filter(
      c => c.sourceModuleId !== moduleId && c.targetModuleId !== moduleId
    ));
    setSelectedModuleId(prev => (prev === moduleId ? undefined : prev));
  }, []);

  const addConnection = useCallback((connection: Connection) => {
    setConnections(prev => [...prev, connection]);
  }, []);

  const updateConnection = useCallback((connectionId: string, updates: Partial<Connection>) => {
    setConnections(prev => prev.map(conn =>
      conn.id === connectionId ? { ...conn, ...updates } : conn
    ));
  }, []);

  const deleteConnection = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connectionId));
  }, []);

  const selectModule = useCallback((moduleId: string | undefined) => {
    setSelectedModuleId(moduleId);
  }, []);

  const saveChanges = useCallback(async () => {
    if (!layoutId || !hasChanges) return;
    
    setSaving(true);
    try {
      await layoutService.updateLayout(layoutId, {
        modules,
        connections,
        updatedAt: new Date()
      });
      lastSavedState.current = JSON.stringify({ 
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
  }, [layoutId, modules, connections, hasChanges, toast]);

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
    deleteModule,
    addConnection,
    updateConnection,
    deleteConnection,
    selectModule,
    saveChanges
  };
}