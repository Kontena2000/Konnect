import { useEffect, useState, useRef } from "react";
import Head from "next/head";
import { AppLayout } from "@/components/layout/AppLayout";
import { SceneContainer } from "@/components/three/SceneContainer";
import { Toolbox } from "@/components/layout/Toolbox";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { useToast } from "@/hooks/use-toast";
import layoutService from "@/services/layout";
import { Module } from "@/types/module";
import { Connection } from "@/types/connection";

export default function BlankEditorPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [modules, setModules] = useState<Module[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [history, setHistory] = useState<Array<{ modules: Module[], connections: Connection[] }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [saving, setSaving] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | undefined>(undefined);
  const controlsRef = useRef(null);
  const [draggedModule, setDraggedModule] = useState<Module | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [user, loading, router]);

  // Save current state to history when modules or connections change
  useEffect(() => {
    if (modules.length > 0 || connections.length > 0) {
      // Don't save if we're in the middle of an undo/redo operation
      if (historyIndex >= 0 && 
          history.length > 0 &&
          JSON.stringify(history[historyIndex].modules) === JSON.stringify(modules) &&
          JSON.stringify(history[historyIndex].connections) === JSON.stringify(connections)) {
        return;
      }
      
      // If we're not at the end of the history, truncate it
      const newHistory = historyIndex < history.length - 1 
        ? history.slice(0, historyIndex + 1) 
        : [...history];
      
      newHistory.push({ modules: [...modules], connections: [...connections] });
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [modules, connections, history, historyIndex]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      await layoutService.createLayout({
        name: 'Blank Layout',
        description: 'Created from blank editor',
        modules,
        connections,
        projectId: 'default' // You might want to change this to a real project ID
      });
      
      toast({
        title: 'Layout saved',
        description: 'Your layout has been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving layout:', error);
      toast({
        title: 'Error saving layout',
        description: 'There was a problem saving your layout.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleModuleDragStart = (module: Module) => {
    console.log("Module drag started:", module);
    setDraggedModule(module);
  };

  const handleDropPoint = (point: [number, number, number]) => {
    if (!draggedModule) return;
    
    // Create a new module instance with unique ID
    const newModule: Module = {
      ...draggedModule,
      id: `${draggedModule.id}-${Date.now()}`,
      position: point,
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    };
    
    setModules(prev => [...prev, newModule]);
    setSelectedModuleId(newModule.id);
    setDraggedModule(null);
  };

  const handleModuleSelect = (moduleId: string) => {
    setSelectedModuleId(moduleId === selectedModuleId ? undefined : moduleId);
  };

  const handleModuleUpdate = (moduleId: string, updates: Partial<Module>) => {
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, ...updates } : m));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <AppLayout fullWidth noPadding>
      <Head>
        <title>Blank Layout Editor | Konnect</title>
        <meta name="description" content="Create a new layout from scratch" />
      </Head>
      
      <div className="flex h-screen">
        <Toolbox 
          onModuleDragStart={handleModuleDragStart}
          onSave={handleSave}
          onUndo={() => historyIndex > 0 && setHistoryIndex(historyIndex - 1)}
          onRedo={() => historyIndex < history.length - 1 && setHistoryIndex(historyIndex + 1)}
          controlsRef={controlsRef}
        />
        
        <div className="flex-1 relative">
          <SceneContainer
            modules={modules}
            onModuleSelect={handleModuleSelect}
            selectedModuleId={selectedModuleId}
            onModuleUpdate={handleModuleUpdate}
            connections={connections}
            controlsRef={controlsRef}
            onDropPoint={handleDropPoint}
          />
        </div>
      </div>
    </AppLayout>
  );
}