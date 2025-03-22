import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layout/AppLayout";
import { SceneContainer } from "@/components/three/SceneContainer";
import { ModuleLibrary } from "@/components/three/ModuleLibrary";
import { ModuleDragOverlay } from "@/components/three/DragOverlay";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, Undo, Redo, Loader2, Grid } from "lucide-react";
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
import { Toolbox } from '@/components/layout/Toolbox';
import { useAuth } from '@/contexts/AuthContext';
import gridPreferencesService, { GridPreferences } from '@/services/grid-preferences';

const createPreviewMesh = (item: Module) => {
  const geometry = new THREE.BoxGeometry(
    item.dimensions.length,
    item.dimensions.height,
    item.dimensions.width
  );
  const material = new THREE.MeshStandardMaterial({
    color: item.color,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    side: THREE.DoubleSide
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
  const { user } = useAuth(); // Get user from AuthContext
  const [layout, setLayout] = useState<Layout | null>(null);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cameraZoom, setCameraZoom] = useState(1);
  const [gridSnap, setGridSnap] = useState(true);
  const [connectionMode, setConnectionMode] = useState<"cable" | "pipe">("cable");
  const [draggingTemplate, setDraggingTemplate] = useState<Module | null>(null);
  const [draggingItem, setDraggingItem] = useState<Module | null>(null);
  const [transformMode, setTransformMode] = useState<"translate" | "rotate" | "scale">("translate");
  const [previewMesh, setPreviewMesh] = useState<Mesh | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [saving, setSaving] = useState(false); // Added saving state
  const [gridPreferences, setGridPreferences] = useState<GridPreferences | null>(null);
  const controlsRef = useRef<any>(null);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  const {
    modules,
    connections,
    selectedModuleId,
    hasChanges,
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

  useKeyboardShortcuts({
    onSave: saveChanges,
    onDelete: () => selectedModuleId && deleteModule(selectedModuleId)
  });

  useHotkeys('r', () => {
    if (selectedModuleId) {
      const selectedItem = modules.find(m => m.id === selectedModuleId);
      if (selectedItem) {
        const newRotation: [number, number, number] = [
          selectedItem.rotation[0],
          (selectedItem.rotation[1] + Math.PI / 2) % (Math.PI * 2),
          selectedItem.rotation[2]
        ];
        updateModule(selectedModuleId, { rotation: newRotation });
      }
    }
  });

  const handleSave = async () => {
    try {
      if (!layout?.id) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No layout selected to save'
        });
        return;
      }

      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'You must be logged in to save layouts'
        });
        return;
      }

      setSaving(true);
      await layoutService.updateLayout(layout.id, {
        modules,
        connections,
        updatedAt: new Date()
      }, user);

      toast({
        title: 'Success',
        description: 'Layout saved successfully'
      });
    } catch (error) {
      console.error('Error saving layout:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save layout'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = useCallback(() => {
    if (undoStack.length > 1) { // Keep at least one state in the stack
      const currentState = { modules, connections };
      const previousState = undoStack[undoStack.length - 2]; // Get second to last state
      
      setRedoStack(prev => [...prev, currentState]);
      setUndoStack(prev => prev.slice(0, -1));
      setModules(previousState.modules);
      setConnections(previousState.connections);
    }
  }, [undoStack, modules, connections, setModules, setConnections]);

  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      const currentState = { modules, connections };
      
      setUndoStack(prev => [...prev, currentState]);
      setRedoStack(prev => prev.slice(0, -1));
      setModules(nextState.modules);
      setConnections(nextState.connections);
    }
  }, [redoStack, modules, connections, setModules, setConnections]);

  // Save state for undo when modules or connections change
  useEffect(() => {
    const newState = { modules, connections };
    const lastState = undoStack[undoStack.length - 1];
    
    // Only save state if it's different from the last one
    if (!lastState || 
        JSON.stringify(lastState.modules) !== JSON.stringify(newState.modules) ||
        JSON.stringify(lastState.connections) !== JSON.stringify(newState.connections)) {
      setUndoStack(prev => [...prev, newState]);
      // Clear redo stack when new changes are made
      setRedoStack([]);
    }
  }, [modules, connections]);

  const handleDragStart = (event: DragStartEvent) => {
    const draggedItem = event.active.data.current as Module;
    setDraggingTemplate(draggedItem);
    setPreviewMesh(createPreviewMesh(draggedItem));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.over?.id === 'scene' && draggingTemplate) {
      const newItemId = `${draggingTemplate.id}-${Date.now()}`;
      const newItem: Module = {
        ...draggingTemplate,
        id: newItemId,
        position: [0, draggingTemplate.dimensions.height / 2, 0],
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
    
    setDraggingTemplate(null);
    setPreviewMesh(null);
  };

  const handleModuleSelect = useCallback((moduleId?: string) => {
    setSelectedModuleId(moduleId || undefined);  // Fixed null assignment
  }, [setSelectedModuleId]);

  const handleModuleDragStart = useCallback((module: Module) => {
    setDraggingTemplate(module);
    setPreviewMesh(createPreviewMesh(module));
  }, []);

  useEffect(() => {
    const loadLayoutData = async () => {
      if (!id || !user) return;

      try {
        setIsLoading(true);
        setLoadError(null);
        console.log('Loading layouts for project:', id);
        
        const projectLayouts = await layoutService.getProjectLayouts(id as string);
        console.log('Loaded project layouts:', projectLayouts);
        setLayouts(projectLayouts);

        const layoutId = router.query.layout as string;
        if (layoutId) {
          console.log('Loading specific layout:', layoutId);
          const layoutData = await layoutService.getLayout(layoutId, user);
          if (layoutData) {
            console.log('Loaded layout data:', layoutData);
            setLayout(layoutData);
            setModules(layoutData.modules || []);
            setConnections(layoutData.connections || []);
          } else {
            setLoadError('Layout not found');
          }
        } else if (projectLayouts.length > 0) {
          // Load first layout if none specified
          const defaultLayout = projectLayouts[0];
          console.log('Loading default layout:', defaultLayout.id);
          router.replace({
            query: { ...router.query, layout: defaultLayout.id }
          });
        }
      } catch (error) {
        console.error('Error loading layout data:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load layout data');
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
  }, [id, user, router.query.layout, setModules, setConnections, toast, router]);

  // Add grid preferences loading
  useEffect(() => {
    const loadGridPreferences = async () => {
      if (!user) return;
      try {
        const prefs = await gridPreferencesService.getPreferences(user.uid);
        if (prefs) {
          setGridPreferences(prefs);
        }
      } catch (error) {
        console.error('Error loading grid preferences:', error);
      }
    };

    loadGridPreferences();
  }, [user]);

  if (!user) {
    return (
      <AppLayout>
        <div className='h-screen flex items-center justify-center'>
          <div className='text-center space-y-4'>
            <h2 className='text-2xl font-bold'>Authentication Required</h2>
            <p className='text-muted-foreground'>Please sign in to access the editor</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className='h-screen flex items-center justify-center'>
          <div className='flex items-center gap-2'>
            <Loader2 className='h-6 w-6 animate-spin' />
            <p>Loading editor...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (loadError) {
    return (
      <AppLayout>
        <div className='h-screen flex items-center justify-center'>
          <div className='text-center space-y-4'>
            <h2 className='text-2xl font-bold text-destructive'>Error Loading Editor</h2>
            <p className='text-muted-foreground'>{loadError}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
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
            <SceneContainer
              modules={modules}
              connections={connections}
              selectedModuleId={selectedModuleId}
              onModuleSelect={handleModuleSelect}
              onModuleUpdate={updateModule}
              onModuleDelete={deleteModule}
              transformMode={transformMode}
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
              cameraZoom={cameraZoom}
              gridSnap={gridSnap}
              gridPreferences={gridPreferences}
              controlsRef={controlsRef}
            />
          </div>

          <Toolbox 
            onModuleDragStart={handleModuleDragStart}
            onSave={handleSave}
            onUndo={handleUndo}
            onRedo={handleRedo}
            controlsRef={controlsRef}
          />

          {draggingTemplate && (
            <ModuleDragOverlay template={draggingTemplate} />
          )}
        </DndContext>
      </div>
    </AppLayout>
  );
}