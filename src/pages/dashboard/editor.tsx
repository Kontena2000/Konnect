import { useEffect, useState, useRef } from "react";
import Head from "next/head";
import { AppLayout } from "@/components/layout/AppLayout";
import { SceneContainer } from "@/components/three/SceneContainer";
import { Toolbox } from "@/components/layout/Toolbox";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Undo2, Redo2, Save } from "lucide-react";
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

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [user, loading, router]);

  // Save current state to history when modules or connections change
  useEffect(() => {
    if (modules.length > 0 || connections.length > 0) {
      // Don't save if we're in the middle of an undo/redo operation
      if (historyIndex >= 0 && JSON.stringify(history[historyIndex].modules) === JSON.stringify(modules) &&
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

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setModules([...history[newIndex].modules]);
      setConnections([...history[newIndex].connections]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setModules([...history[newIndex].modules]);
      setConnections([...history[newIndex].connections]);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      await layoutService.createLayout({
        name: 'Blank Layout',
        description: 'Created from blank editor',
        modules,
        connections,
        projectId: 'default', // You might want to change this to a real project ID
        createdAt: new Date(),
        updatedAt: new Date()
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
    // Handle module drag start logic here
    console.log("Module drag started:", module);
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
    <AppLayout>
      <Head>
        <title>Blank Layout Editor | Konnect</title>
        <meta name="description" content="Create a new layout from scratch" />
      </Head>
      
      <div className="flex h-full">
        <Toolbox 
          onModuleDragStart={handleModuleDragStart}
          onSave={handleSave}
          onUndo={handleUndo}
          onRedo={handleRedo}
          controlsRef={controlsRef}
        />
        
        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b p-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleUndo}
                disabled={historyIndex <= 0}
              >
                <Undo2 className="h-4 w-4 mr-1" />
                Undo
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
              >
                <Redo2 className="h-4 w-4 mr-1" />
                Redo
              </Button>
            </div>
            
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Layout
            </Button>
          </div>
          
          <div className="flex-1 relative">
            <SceneContainer
              modules={modules}
              onModuleSelect={handleModuleSelect}
              selectedModuleId={selectedModuleId}
              onModuleUpdate={handleModuleUpdate}
              connections={connections}
              controlsRef={controlsRef}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}