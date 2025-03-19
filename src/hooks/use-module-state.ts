
import { useState, useCallback, useEffect } from "react";
import { Module } from "@/types/module";
import { Connection } from "@/services/layout";
import layoutService from "@/services/layout";
import { useToast } from "@/hooks/use-toast";

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
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const addModule = useCallback((module: Module) => {
    setModules(prev => [...prev, module]);
    setHasChanges(true);
  }, []);

  const updateModule = useCallback((moduleId: string, updates: Partial<Module>) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId ? { ...module, ...updates } : module
    ));
    setHasChanges(true);
  }, []);

  const deleteModule = useCallback((moduleId: string) => {
    setModules(prev => prev.filter(module => module.id !== moduleId));
    setConnections(prev => prev.filter(conn => 
      conn.sourceModuleId !== moduleId && conn.targetModuleId !== moduleId
    ));
    setSelectedModuleId(null);
    setHasChanges(true);
  }, []);

  const addConnection = useCallback((connection: Connection) => {
    setConnections(prev => [...prev, connection]);
    setHasChanges(true);
  }, []);

  const updateConnection = useCallback((connectionId: string, updates: Partial<Connection>) => {
    setConnections(prev => prev.map(conn => 
      conn.id === connectionId ? { ...conn, ...updates } : conn
    ));
    setHasChanges(true);
  }, []);

  const deleteConnection = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
    setHasChanges(true);
  }, []);

  const selectModule = useCallback((moduleId: string | null) => {
    setSelectedModuleId(moduleId);
  }, []);

  const saveChanges = useCallback(async () => {
    if (!layoutId || !hasChanges) return;

    try {
      setSaving(true);
      await layoutService.updateLayout(layoutId, {
        modules,
        connections
      });
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Layout saved successfully"
      });
    } catch (error) {
      console.error("Error saving layout:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save layout"
      });
    } finally {
      setSaving(false);
    }
  }, [layoutId, hasChanges, modules, connections, toast]);

  // Auto-save when changes occur
  useEffect(() => {
    if (autoSave && hasChanges) {
      const timeoutId = setTimeout(saveChanges, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [autoSave, hasChanges, saveChanges]);

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
