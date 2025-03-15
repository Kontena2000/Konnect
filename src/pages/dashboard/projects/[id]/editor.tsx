import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layout/AppLayout";
import { SceneContainer } from "@/components/three/SceneContainer";
import { ModuleLibrary, ModuleTemplate } from "@/components/three/ModuleLibrary";
import { ModuleDragOverlay } from "@/components/three/DragOverlay";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, Undo, Redo, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { DndContext, DragEndEvent, DragStartEvent, useSensor, useSensors, PointerSensor, MouseSensor, TouchSensor } from "@dnd-kit/core";
import { nanoid } from "nanoid";
import { ModuleProperties } from "@/components/three/ModuleProperties";
import layoutService, { Layout, Module, Connection } from "@/services/layout";
import { ConnectionManager } from "@/components/three/ConnectionManager";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"; // Added import for Collapsible
import { ChevronDown } from "lucide-react"; // Added import for ChevronDown
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'; // Added import for Sheet
import { Menu } from 'lucide-react'; // Added import for Menu
import projectService from '@/services/project';

type PowerCableType = "208v-3phase" | "400v-3phase" | "whip" | "ups-battery" | "ups-output" | "ups-input";
type NetworkCableType = "cat5e" | "cat6" | "cat6a" | "cat8" | "om3" | "om4" | "om5" | "os2" | "mtp-mpo";
type ConnectionType = PowerCableType | NetworkCableType;

export default function LayoutEditorPage() {
  const router = useRouter();
  const { id } = router.query;
  const [layout, setLayout] = useState<Layout | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [draggingTemplate, setDraggingTemplate] = useState<ModuleTemplate | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | undefined>();
  const [transformMode, setTransformMode] = useState<"translate" | "rotate" | "scale">("translate");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeConnection, setActiveConnection] = useState<{
    sourceModuleId: string;
    sourcePoint: [number, number, number];
    type: ConnectionType;
  } | null>(null);
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<{past: Module[][], future: Module[][]}>({
    past: [],
    future: []
  });
  const [cameraZoom, setCameraZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const lastSavedState = useRef<string>('');

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    const loadProjectAndLayout = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        // First load the project to verify it exists
        const project = await projectService.getProject(id as string);
        if (!project) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Project not found'
          });
          router.push('/dashboard/projects');
          return;
        }

        // Then load all layouts for this project
        const layouts = await layoutService.getProjectLayouts(id as string);
        
        // Use the first layout or create a new one
        let currentLayout = layouts[0];
        if (!currentLayout) {
          const layoutId = await layoutService.createLayout({
            projectId: id as string,
            name: 'Default Layout',
            modules: [],
            connections: []
          });
          currentLayout = await layoutService.getLayout(layoutId) as Layout;
        }

        setLayout(currentLayout);
        setModules(currentLayout.modules || []);
        setConnections(currentLayout.connections || []);
        lastSavedState.current = JSON.stringify({ 
          modules: currentLayout.modules, 
          connections: currentLayout.connections 
        });
      } catch (error) {
        console.error('Load error:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load project'
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadProjectAndLayout();
  }, [id, router, toast]);

  useEffect(() => {
    const currentState = JSON.stringify({ modules, connections });
    setHasChanges(currentState !== lastSavedState.current);
  }, [modules, connections]);

  const handleUndo = () => {
    if (history.past.length === 0) return;
    
    const newPast = [...history.past];
    const lastState = newPast.pop()!;
    
    setHistory({
      past: newPast,
      future: [modules, ...history.future]
    });
    
    setModules(lastState);
  };

  const handleRedo = () => {
    if (history.future.length === 0) return;
    
    const newFuture = [...history.future];
    const nextState = newFuture.shift()!;
    
    setHistory({
      past: [...history.past, modules],
      future: newFuture
    });
    
    setModules(nextState);
  };

  const handleZoomIn = () => {
    setCameraZoom(prev => Math.min(prev * 1.2, 2));
  };

  const handleZoomOut = () => {
    setCameraZoom(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const template = active.data.current as ModuleTemplate;
    if (template) {
      setDraggingTemplate(template);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && over.id === 'scene-container' && draggingTemplate) {
      const dropPosition: [number, number, number] = [0, 0, 0];
      
      // Calculate drop position based on pointer coordinates
      if (event.activatorEvent instanceof MouseEvent) {
        const rect = (event.activatorEvent.target as HTMLElement).getBoundingClientRect();
        const x = (event.activatorEvent.clientX - rect.left) / 50 - 10;
        const z = (event.activatorEvent.clientY - rect.top) / 50 - 10;
        dropPosition[0] = x;
        dropPosition[2] = z;
      }
      
      createModule(dropPosition);
    }
    
    setDraggingTemplate(null);
  };

  const createModule = useCallback((position: [number, number, number]) => {
    if (!draggingTemplate) return;
    
    const newModule: Module = {
      id: nanoid(),
      type: draggingTemplate.type,
      position,
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: draggingTemplate.color,
      dimensions: {
        length: draggingTemplate.dimensions[0],
        height: draggingTemplate.dimensions[1],
        width: draggingTemplate.dimensions[2]
      },
      connectionPoints: draggingTemplate.connectionPoints
    };
    
    setModules((prev) => [...prev, newModule]);
    
    toast({
      title: "Success",
      description: `Added new ${draggingTemplate.name}`,
    });
  }, [draggingTemplate, toast]);

  const handleModuleUpdate = (moduleId: string, updates: Partial<Module>) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId ? { ...module, ...updates } : module
      )
    );
  };

  const handleModuleDelete = (moduleId: string) => {
    setModules((prev) => prev.filter((module) => module.id !== moduleId));
    setConnections((prev) =>
      prev.filter(
        (conn) => conn.sourceModuleId !== moduleId && conn.targetModuleId !== moduleId
      )
    );
    setSelectedModuleId(undefined);
    
    toast({
      title: "Success",
      description: "Module deleted",
    });
  };

  const handleConnectPoint = (
    moduleId: string,
    point: [number, number, number],
    type: ConnectionType
  ) => {
    if (!activeConnection) {
      setActiveConnection({
        sourceModuleId: moduleId,
        sourcePoint: point,
        type
      });
    } else {
      if (activeConnection.sourceModuleId !== moduleId) {
        const newConnection: Connection = {
          id: nanoid(),
          sourceModuleId: activeConnection.sourceModuleId,
          targetModuleId: moduleId,
          sourcePoint: activeConnection.sourcePoint,
          targetPoint: point,
          type: activeConnection.type
        };
        setConnections((prev) => [...prev, newConnection]);
        toast({
          title: "Success",
          description: "Connection created",
        });
      }
      setActiveConnection(null);
    }
  };

  const handleUpdateConnection = (connectionId: string, updates: Partial<Connection>) => {
    setConnections((prev) =>
      prev.map((conn) =>
        conn.id === connectionId ? { ...conn, ...updates } : conn
      )
    );
  };

  const handleDeleteConnection = (connectionId: string) => {
    setConnections((prev) =>
      prev.filter((conn) => conn.id !== connectionId)
    );
    toast({
      title: "Success",
      description: "Connection deleted",
    });
  };

  const handleSave = async () => {
    if (!layout?.id || !hasChanges) return;
    
    setSaving(true);
    try {
      await layoutService.updateLayout(layout.id, {
        modules,
        connections,
        updatedAt: new Date()
      });
      
      lastSavedState.current = JSON.stringify({ modules, connections });
      setHasChanges(false);
      
      toast({
        title: 'Success',
        description: 'Layout saved successfully',
      });
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
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className='h-screen flex items-center justify-center'>
          <div className='flex items-center gap-2'>
            <Loader2 className='h-6 w-6 animate-spin' />
            <p>Loading project...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <TooltipProvider>
        <AppLayout>
          <div className='h-screen flex flex-col'>
            <div className='flex items-center justify-between p-4 border-b'>
              <h1 className='text-2xl font-bold'>Layout Editor</h1>
              <div className='flex items-center gap-2'>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleUndo}
                      disabled={history.past.length === 0}
                    >
                      <Undo className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Undo last change (Ctrl+Z)</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleRedo}
                      disabled={history.future.length === 0}
                    >
                      <Redo className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Redo last change (Ctrl+Y)</p>
                  </TooltipContent>
                </Tooltip>

                <Separator orientation='vertical' className='h-6' />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleZoomIn}
                      disabled={cameraZoom >= 2}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Zoom in (+)</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleZoomOut}
                      disabled={cameraZoom <= 0.5}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Zoom out (-)</p>
                  </TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="h-6" />
                <Button onClick={handleSave} disabled={saving || !hasChanges}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {hasChanges ? 'Save Changes' : 'Saved'}
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className='flex-1 relative'>
              <SceneContainer
                modules={modules}
                selectedModuleId={selectedModuleId}
                transformMode={transformMode}
                onModuleSelect={setSelectedModuleId}
                onModuleUpdate={handleModuleUpdate}
                onDropPoint={createModule}
                connections={connections}
                activeConnection={activeConnection}
                onConnectPoint={handleConnectPoint}
                cameraZoom={cameraZoom}
              />

              <div className='absolute top-4 left-4'>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant='outline' size='icon'>
                      <Menu className='h-4 w-4' />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side='left' className='w-[300px]'>
                    <ModuleLibrary />
                  </SheetContent>
                </Sheet>
              </div>

              {selectedModuleId && (
                <div className='absolute top-4 right-4 w-[300px] bg-background/5 backdrop-blur-[2px] rounded-lg border p-4'>
                  <ModuleProperties
                    module={modules.find(m => m.id === selectedModuleId)!}
                    onUpdate={handleModuleUpdate}
                    onDelete={handleModuleDelete}
                    onTransformModeChange={setTransformMode}
                  />
                </div>
              )}
            </div>
          </div>
        </AppLayout>
      </TooltipProvider>
    </DndContext>
  );
}