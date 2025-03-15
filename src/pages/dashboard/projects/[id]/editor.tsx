
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layout/AppLayout";
import { SceneContainer } from "@/components/three/SceneContainer";
import { ModuleLibrary, ModuleTemplate, ConnectionType } from "@/components/three/ModuleLibrary";
import { ModuleDragOverlay } from "@/components/three/DragOverlay";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, Undo, Redo, ZoomIn, ZoomOut, Loader2, Grid } from "lucide-react";
import { DndContext, DragEndEvent, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { nanoid } from "nanoid";
import { ModuleProperties } from "@/components/three/ModuleProperties";
import layoutService, { Layout, Module, Connection } from "@/services/layout";
import { ConnectionManager } from "@/components/three/ConnectionManager";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import projectService from "@/services/project";
import { LayoutSelector } from "@/components/layout/LayoutSelector";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useModuleState } from "@/hooks/use-module-state";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export default function LayoutEditorPage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const [layout, setLayout] = useState<Layout | null>(null);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraZoom, setCameraZoom] = useState(1);
  const [gridSnap, setGridSnap] = useState(true);
  const [connectionMode, setConnectionMode] = useState<"cable" | "pipe">("cable");
  const [draggingTemplate, setDraggingTemplate] = useState<ModuleTemplate | null>(null);
  const [transformMode, setTransformMode] = useState<"translate" | "rotate" | "scale">("translate");

  const [activeConnection, setActiveConnection] = useState<{
    sourceModuleId: string;
    sourcePoint: [number, number, number];
    type: ConnectionType;
  } | null>(null);

  const {
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
  } = useModuleState({
    layoutId: layout?.id,
    initialModules: layout?.modules || [],
    initialConnections: layout?.connections || [],
    autoSave: true
  });

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10
    }
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5
    }
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  useKeyboardShortcuts({
    onSave: saveChanges,
    onDelete: () => selectedModuleId && deleteModule(selectedModuleId)
  });

  useEffect(() => {
    const loadLayoutData = async () => {
      if (!id) return;

      try {
        const projectLayouts = await layoutService.getProjectLayouts(id as string);
        setLayouts(projectLayouts);

        const layoutId = router.query.layout as string;
        if (layoutId) {
          const layoutData = await layoutService.getLayout(layoutId);
          if (layoutData) {
            setLayout(layoutData);
            setModules(layoutData.modules);
            setConnections(layoutData.connections);
          }
        }
      } catch (error) {
        console.error("Error loading layout data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load layout data"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadLayoutData();
  }, [id, router.query.layout, setModules, setConnections, toast]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="h-screen flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p>Loading editor...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex h-screen">
        <DndContext sensors={sensors}>
          <div className="flex-1 relative">
            <SceneContainer
              modules={modules}
              connections={connections}
              selectedModuleId={selectedModuleId}
              onModuleSelect={selectModule}
              onModuleUpdate={updateModule}
              onModuleDelete={deleteModule}
              gridSnap={gridSnap}
              zoom={cameraZoom}
            />
          </div>

          <div className="w-80 border-l bg-background">
            <ModuleLibrary onDragStart={setDraggingTemplate} />
          </div>

          {draggingTemplate && (
            <ModuleDragOverlay template={draggingTemplate} />
          )}
        </DndContext>
      </div>
    </AppLayout>
  );
}
