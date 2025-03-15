import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SceneContainer } from "@/components/three/SceneContainer";
import { ModuleLibrary, ModuleTemplate } from "@/components/three/ModuleLibrary";
import { ModuleDragOverlay } from "@/components/three/DragOverlay";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, Undo, Redo, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { nanoid } from "nanoid";
import { ModuleProperties } from '@/components/three/ModuleProperties';
import layoutService, { Layout, Module, Connection } from '@/services/layout';
import { ConnectionManager } from '@/components/three/ConnectionManager';
import { useToast } from '@/hooks/use-toast';

export default function LayoutEditorPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [modules, setModules] = useState<Module[]>([
    {
      id: "1",
      type: "datacenter",
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [2, 1, 3],
      color: "#4CAF50"
    },
    {
      id: "2",
      type: "ups",
      position: [3, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: "#2196F3"
    }
  ]);

  const [draggingTemplate, setDraggingTemplate] = useState<ModuleTemplate | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | undefined>();
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeConnection, setActiveConnection] = useState<{
    sourceModuleId: string;
    sourcePoint: [number, number, number];
    type: 'power' | 'network' | 'cooling';
  } | null>(null);
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [layout, setLayout] = useState<Layout | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    const loadLayout = async () => {
      if (id) {
        try {
          // First try to load existing layout
          const existingLayout = await layoutService.getLayout(id as string);
          if (existingLayout) {
            setLayout(existingLayout);
            setModules(existingLayout.modules);
            setConnections(existingLayout.connections);
          } else {
            // Create new layout if none exists
            const newLayoutId = await layoutService.createLayout(id as string);
            setLayout({ id: newLayoutId, projectId: id as string, modules: [], connections: [], lastModified: null as any });
          }
        } catch (error) {
          console.error('Error loading layout:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load project layout.'
          });
        }
      }
    };
    loadLayout();
  }, [id]);

  const handleDragStart = (event: any) => {
    const template = event.active.data.current;
    if (template) {
      setDraggingTemplate(template);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingTemplate(null);
    
    // Get drop point in 3D space
    const dropPoint = [0, 0, 0]; // TODO: Get actual drop point from three.js
    
    // Create new module
    const template = event.active.data.current as ModuleTemplate;
    if (template) {
      const newModule: Module = {
        id: nanoid(),
        type: template.type,
        position: dropPoint as [number, number, number],
        rotation: [0, 0, 0],
        scale: template.dimensions,
        color: template.color
      };
      
      setModules([...modules, newModule]);
    }
  };

  const handleModuleUpdate = (moduleId: string, updates: Partial<Module>) => {
    setModules(modules.map(module => 
      module.id === moduleId ? { ...module, ...updates } : module
    ));
  };

  const handleModuleDelete = (moduleId: string) => {
    setModules(modules.filter(module => module.id !== moduleId));
    setSelectedModuleId(undefined);
  };

  const handleDropPoint = (point: [number, number, number]) => {
    if (draggingTemplate) {
      const newModule: Module = {
        id: nanoid(),
        type: draggingTemplate.type,
        position: point,
        rotation: [0, 0, 0],
        scale: draggingTemplate.dimensions,
        color: draggingTemplate.color
      };
      
      setModules([...modules, newModule]);
      setDraggingTemplate(null);
    }
  };

  const handleConnectPoint = (moduleId: string, point: [number, number, number], type: string) => {
    if (!activeConnection) {
      setActiveConnection({
        sourceModuleId: moduleId,
        sourcePoint: point,
        type: type as 'power' | 'network' | 'cooling'
      });
    } else {
      if (moduleId !== activeConnection.sourceModuleId && type === activeConnection.type) {
        const newConnection: Connection = {
          id: nanoid(),
          sourceModuleId: activeConnection.sourceModuleId,
          targetModuleId: moduleId,
          sourcePoint: activeConnection.sourcePoint,
          targetPoint: point,
          type: activeConnection.type
        };
        setConnections([...connections, newConnection]);
      }
      setActiveConnection(null);
    }
  };

  const handleUpdateConnection = (id: string, updates: Partial<Connection>) => {
    setConnections(connections.map(conn => 
      conn.id === id ? { ...conn, ...updates } : conn
    ));
  };

  const handleDeleteConnection = (id: string) => {
    setConnections(connections.filter(conn => conn.id !== id));
  };

  const handleSave = async () => {
    if (!layout) return;
    
    try {
      setSaving(true);
      await layoutService.updateLayout(layout.id, {
        modules,
        connections
      });
      toast({
        title: 'Success',
        description: 'Layout saved successfully.'
      });
    } catch (error) {
      console.error('Error saving layout:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save layout changes.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <DashboardLayout>
        <div className='h-[calc(100vh-2rem)] flex flex-col gap-4'>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Layout Editor</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <Undo className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Redo className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="outline" size="icon">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Layout
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className='flex-1 grid grid-cols-[300px_1fr_300px] gap-4'>
            <Card>
              <CardContent className='p-4'>
                <h2 className='text-lg font-semibold mb-4'>Module Library</h2>
                <ModuleLibrary />
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-4 h-full'>
                <SceneContainer
                  modules={modules}
                  selectedModuleId={selectedModuleId}
                  transformMode={transformMode}
                  onModuleSelect={setSelectedModuleId}
                  onModuleUpdate={handleModuleUpdate}
                  onDropPoint={handleDropPoint}
                  connections={connections}
                  activeConnection={activeConnection}
                  onConnectPoint={handleConnectPoint}
                />
              </CardContent>
            </Card>

            <div className='space-y-4'>
              {selectedModuleId && (
                <ModuleProperties
                  module={modules.find(m => m.id === selectedModuleId)!}
                  onUpdate={handleModuleUpdate}
                  onDelete={handleModuleDelete}
                  onTransformModeChange={setTransformMode}
                />
              )}
              <ConnectionManager
                connections={connections}
                onUpdateConnection={handleUpdateConnection}
                onDeleteConnection={handleDeleteConnection}
              />
            </div>
          </div>
        </div>
        <ModuleDragOverlay draggingTemplate={draggingTemplate} />
      </DashboardLayout>
    </DndContext>
  );
}