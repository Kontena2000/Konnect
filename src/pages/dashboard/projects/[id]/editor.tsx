
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layout/AppLayout";
import { SceneContainer } from "@/components/three/SceneContainer";
import { ModuleLibrary } from "@/components/three/ModuleLibrary";
import { ModuleDragOverlay } from "@/components/three/DragOverlay";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { DndContext, DragEndEvent, DragStartEvent, useSensor, useSensors, MouseSensor, TouchSensor } from "@dnd-kit/core";
import { useToast } from "@/hooks/use-toast";
import layoutService, { Layout } from '@/services/layout';
import { Module } from '@/types/module';
import { Mesh } from 'three';
import * as THREE from 'three';

const createPreviewMesh = (item: Module) => {
  const geometry = new THREE.BoxGeometry(
    item.dimensions.length,
    item.dimensions.height,
    item.dimensions.width
  );
  geometry.translate(0, item.dimensions.height / 2, 0); // Center Y at ground level
  
  const material = new THREE.MeshStandardMaterial({
    color: item.color,
    transparent: true,
    opacity: 0.5,
    depthWrite: false
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

export default function LayoutEditorPage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const [layout, setLayout] = useState<Layout | null>(null);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gridSnap, setGridSnap] = useState(true);
  const [draggingTemplate, setDraggingTemplate] = useState<Module | null>(null);
  const [previewMesh, setPreviewMesh] = useState<Mesh | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);

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
    saveChanges
  } = useModuleState({
    layoutId: layout?.id,
    initialModules: layout?.modules || [],
    initialConnections: layout?.connections || [],
    autoSave: true
  });

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 10 }
  });
  
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 }
  });
  
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = (event: DragStartEvent) => {
    const draggedItem = modules.find(item => item.id === event.active.id);
    if (draggedItem) {
      setPreviewMesh(createPreviewMesh(draggedItem));
    }
  };

  const handleModuleDragStart = (templateItem: Module) => {
    setDraggingTemplate(templateItem);
    setPreviewMesh(createPreviewMesh(templateItem));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingTemplate(null);
    setPreviewMesh(null);
    
    if (event.over?.id !== 'scene') return;

    if (draggingTemplate) {
      const newItemId = `${draggingTemplate.id}-${Date.now()}`;
      const newItem: Module = {
        ...draggingTemplate,
        id: newItemId,
        position: [0, 0, 0], // Start at ground level
        rotation: [0, rotationAngle, 0],
        scale: [1, 1, 1],
        visibleInEditor: true
      };
      addModule(newItem);
      
      toast({
        title: 'Module Added',
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
      <div className='flex h-screen'>
        <DndContext 
          sensors={sensors}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
        >
          <div className='flex-1 relative'>
            <div className="absolute top-4 left-4 z-10">
              <Button
                onClick={saveChanges}
                disabled={saving || !hasChanges}
                className="bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Layout
                  </>
                )}
              </Button>
            </div>

            <SceneContainer
              modules={modules}
              connections={connections}
              selectedModuleId={selectedModuleId}
              onModuleSelect={setSelectedModuleId}
              onModuleUpdate={updateModule}
              onModuleDelete={deleteModule}
              onDropPoint={(point) => {
                if (draggingTemplate) {
                  const newItem: Module = {
                    ...draggingTemplate,
                    id: `${draggingTemplate.id}-${Date.now()}`,
                    position: point,
                    rotation: [0, rotationAngle, 0],
                    scale: [1, 1, 1],
                    visibleInEditor: true
                  };
                  addModule(newItem);
                  setDraggingTemplate(null);
                }
              }}
              gridSnap={gridSnap}
            />
          </div>

          <div className='w-80 border-l bg-background'>
            <ModuleLibrary onDragStart={handleModuleDragStart} />
          </div>

          {draggingTemplate && (
            <ModuleDragOverlay template={draggingTemplate} />
          )}
        </DndContext>
      </div>
    </AppLayout>
  );
}
