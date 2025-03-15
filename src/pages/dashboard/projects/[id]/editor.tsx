
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layout/AppLayout";
import { SceneContainer } from "@/components/three/SceneContainer";
import { ModuleLibrary, ModuleTemplate } from "@/components/three/ModuleLibrary";
import { ModuleDragOverlay } from "@/components/three/DragOverlay";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, Undo, Redo, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { nanoid } from "nanoid";
import { ModuleProperties } from "@/components/three/ModuleProperties";
import layoutService, { Layout, Module, Connection } from "@/services/layout";
import { ConnectionManager } from "@/components/three/ConnectionManager";
import { useToast } from "@/hooks/use-toast";

export default function LayoutEditorPage() {
  const router = useRouter();
  const { id } = router.query;
  const [modules, setModules] = useState<Module[]>([]);
  const [draggingTemplate, setDraggingTemplate] = useState<ModuleTemplate | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | undefined>();
  const [transformMode, setTransformMode] = useState<"translate" | "rotate" | "scale">("translate");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeConnection, setActiveConnection] = useState<{
    sourceModuleId: string;
    sourcePoint: [number, number, number];
    type: "power" | "network" | "cooling";
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

  const handleDragStart = (event: DragEndEvent) => {
    const { active } = event;
    const template = active.data.current as ModuleTemplate;
    setDraggingTemplate(template);
  };

  const handleDragEnd = () => {
    setDraggingTemplate(null);
  };

  const handleDropPoint = (position: [number, number, number], template: ModuleTemplate) => {
    const newModule: Module = {
      id: nanoid(),
      type: template.type,
      position,
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: template.color,
      dimensions: {
        length: template.dimensions[0],
        height: template.dimensions[1],
        width: template.dimensions[2]
      },
      connectionPoints: template.connectionPoints
    };
    setModules((prev) => [...prev, newModule]);
  };

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
  };

  const handleConnectPoint = (
    moduleId: string,
    point: [number, number, number],
    type: "power" | "network" | "cooling"
  ) => {
    if (!activeConnection) {
      setActiveConnection({
        sourceModuleId: moduleId,
        sourcePoint: point,
        type,
      });
    } else {
      if (activeConnection.sourceModuleId !== moduleId) {
        const newConnection: Connection = {
          id: nanoid(),
          sourceModuleId: activeConnection.sourceModuleId,
          targetModuleId: moduleId,
          sourcePoint: activeConnection.sourcePoint,
          targetPoint: point,
          type: activeConnection.type,
        };
        setConnections((prev) => [...prev, newConnection]);
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
  };

  const handleSave = async () => {
    if (!id) return;
    
    setSaving(true);
    try {
      await layoutService.updateLayout(id as string, {
        modules,
        connections,
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
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
                  onDropPoint={handleDropPoint}
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
        <ModuleDragOverlay draggingTemplate={draggingTemplate} />
      </AppLayout>
    </DndContext>
  );
}
