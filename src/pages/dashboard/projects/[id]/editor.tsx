import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layout/AppLayout";
import { SceneContainer } from "@/components/three/SceneContainer";
import { ModuleLibrary } from "@/components/three/ModuleLibrary";
import { ModuleDragOverlay } from "@/components/three/DragOverlay";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, Undo, Redo, ZoomIn, ZoomOut, Loader2, Grid } from "lucide-react";
import { DndContext, DragEndEvent, DragStartEvent, useSensor, useSensors, MouseSensor, TouchSensor } from "@dnd-kit/core";
import { ModuleProperties } from "@/components/three/ModuleProperties";
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
import { Module } from '@/types/module';
import { ConnectionType } from '@/types/connection';
import { useEditorSensors } from '@/hooks/use-editor-sensors';
import layoutService, { Layout, Connection } from '@/services/layout';
import { motion } from "framer-motion";
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { Mesh } from 'three';
import { useHotkeys } from 'react-hotkeys-hook';

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
  const [draggingTemplate, setDraggingTemplate] = useState<Module | null>(null);
  const [draggingModule, setDraggingModule] = useState<Module | null>(null);
  const [transformMode, setTransformMode] = useState<"translate" | "rotate" | "scale">("translate");
  const [previewMesh, setPreviewMesh] = useState<Mesh | null>(null);

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
      distance: 10,
    },
  });
  
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });
  
  const sensors = useSensors(mouseSensor, touchSensor);
  // Alternative: use the custom hook
  // const sensors = useEditorSensors();

  useKeyboardShortcuts({
    onSave: saveChanges,
    onDelete: () => selectedModuleId && deleteModule(selectedModuleId)
  });

  // Add rotation hotkey
  useHotkeys('r', () => {
    if (selectedModuleId) {
      const module = modules.find(m => m.id === selectedModuleId);
      if (module) {
        const newRotation: [number, number, number] = [
          module.rotation[0],
          (module.rotation[1] + Math.PI / 2) % (Math.PI * 2),
          module.rotation[2]
        ];
        updateModule(selectedModuleId, { rotation: newRotation });
      }
    }
  });

  const handleDragStart = (event: DragStartEvent) => {
    const draggedModule = modules.find(m => m.id === event.active.id);
    setDraggingModule(draggedModule || null);
    
    if (draggedModule) {
      const geometry = new THREE.BoxGeometry(
        draggedModule.dimensions.length,
        draggedModule.dimensions.height,
        draggedModule.dimensions.width
      );
      const material = new THREE.MeshStandardMaterial({
        color: draggedModule.color,
        transparent: true,
        opacity: 0.5
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 0, 0);
      setPreviewMesh(mesh);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingTemplate(null);
    setDraggingModule(null);
    setPreviewMesh(null);
    
    // Only handle drops over the scene
    if (event.over?.id !== "scene") return;

    // Create a new module from the template
    if (draggingTemplate) {
      const newModuleId = `${draggingTemplate.id}-${Date.now()}`;
      const newModule: Module = {
        ...draggingTemplate,
        id: newModuleId,
        position: [0, 0, 0], // Default position, will be updated by SceneContainer
        rotation: [0, 0, 0], // Apply current rotation
        scale: [1, 1, 1],
        visibleInEditor: true
      };
      addModule(newModule);
      
      toast({
        title: "Module Added",
        description: `${draggingTemplate.name} has been added to the scene`
      });
    }
  };

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
        <DndContext 
          sensors={sensors}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
        >
          <div className='flex-1 relative'>
            <SceneContainer
              modules={modules}
              connections={connections}
              selectedModuleId={selectedModuleId}
              onModuleSelect={selectModule}
              onModuleUpdate={updateModule}
              onModuleDelete={deleteModule}
              onDropPoint={(point) => {
                if (draggingTemplate) {
                  const newModule: Module = {
                    ...draggingTemplate,
                    id: `${draggingTemplate.id}-${Date.now()}`,
                    position: point,
                    rotation: [0, 0, 0],
                    scale: [1, 1, 1],
                    visibleInEditor: true
                  };
                  addModule(newModule);
                  setDraggingTemplate(null);
                }
              }}
              cameraZoom={cameraZoom}
              gridSnap={gridSnap}
            />
          </div>

          <div className='w-80 border-l bg-background'>
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