
import { useEffect, useState, useCallback } from "react";
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
    const loadLayout = async () => {
      if (!id) return;
      try {
        const loadedLayout = await layoutService.getLayout(id as string);
        if (loadedLayout) {
          setLayout(loadedLayout);
          setModules(loadedLayout.modules || []);
          setConnections(loadedLayout.connections || []);
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load layout",
        });
      }
    };
    loadLayout();
  }, [id, toast]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const template = active.data.current as ModuleTemplate;
    if (template) {
      setDraggingTemplate(template);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && over.id === "scene-container" && draggingTemplate) {
      // Get the client offset from the event
      const clientOffset = {
        x: event.activatorEvent.clientX,
        y: event.activatorEvent.clientY,
      };
      
      // Convert client coordinates to scene coordinates
      // This will be handled by SceneContainer's onDropPoint
      const dropPosition: [number, number, number] = [
        (clientOffset.x / window.innerWidth) * 20 - 10,
        0,
        (clientOffset.y / window.innerHeight) * 20 - 10,
      ];
      
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
    if (!id || !layout) return;
    
    setSaving(true);
    try {
      await layoutService.updateLayout(id as string, {
        ...layout,
        modules,
        connections,
        updatedAt: new Date()
      });
      
      toast({
        title: "Success",
        description: "Layout saved successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save layout",
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
      <AppLayout>
        <div className="h-[calc(100vh-2rem)] flex flex-col gap-4">
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

          <div className="flex-1 grid grid-cols-[300px_1fr_300px] gap-4">
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-4">Module Library</h2>
                <ModuleLibrary />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 h-full">
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
                />
              </CardContent>
            </Card>

            <div className="space-y-4">
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
      </AppLayout>
    </DndContext>
  );
}
