
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { SceneContainer } from '@/components/three/SceneContainer';
import { ModuleLibrary } from '@/components/three/ModuleLibrary';
import { Toolbox } from '@/components/layout/Toolbox';
import { SaveLayoutDialog } from '@/components/layout/SaveLayoutDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Save, Undo, Redo, ZoomIn, ZoomOut, Grid3X3, Cube } from 'lucide-react';
import { debouncedSave } from '@/services/layout';
import layoutService, { Layout } from '@/services/layout';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useModuleState } from '@/hooks/use-module-state';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { ConnectionType } from '@/types/connection';
import { Module } from '@/types/module';

export default function LayoutEditorPage() {
  const router = useRouter();
  const { id: projectId } = router.query;
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [layoutId, setLayoutId] = useState<string | null>(null);
  const [layoutName, setLayoutName] = useState<string>('Untitled Layout');
  const [layoutDescription, setLayoutDescription] = useState<string>('');
  const [is3DView, setIs3DView] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Module state management
  const {
    modules,
    connections,
    addModule,
    updateModule,
    removeModule,
    addConnection,
    removeConnection,
    clearModules,
    undoLastAction,
    redoLastAction,
    canUndo,
    canRedo,
    resetHistory
  } = useModuleState();
  
  // Camera controls ref
  const cameraControlsRef = useRef(null);
  
  // Load layout data if layoutId is provided
  useEffect(() => {
    const loadLayout = async () => {
      if (!projectId || !user || loading) return;
      
      try {
        setIsLoading(true);
        
        // Check if there's a layoutId in the URL query
        const layoutIdFromQuery = router.query.layoutId as string;
        
        if (layoutIdFromQuery) {
          console.log('Loading layout from query parameter:', layoutIdFromQuery);
          const layout = await layoutService.getLayout(layoutIdFromQuery, user);
          
          if (layout) {
            // Verify the layout belongs to this project
            if (layout.projectId !== projectId) {
              console.error('Layout does not belong to this project');
              toast({
                variant: 'destructive',
                title: 'Error',
                description: 'This layout does not belong to the current project'
              });
              // Continue loading but don't set the layout ID
            } else {
              setLayoutId(layoutIdFromQuery);
              setLayoutName(layout.name);
              setLayoutDescription(layout.description || '');
              clearModules();
              
              // Add modules from layout
              if (layout.modules && Array.isArray(layout.modules)) {
                layout.modules.forEach(module => {
                  addModule(module as Module, false);
                });
              }
              
              // Add connections from layout
              if (layout.connections && Array.isArray(layout.connections)) {
                layout.connections.forEach(connection => {
                  addConnection(connection, false);
                });
              }
              
              resetHistory();
              setHasUnsavedChanges(false);
            }
          } else {
            console.error('Layout not found:', layoutIdFromQuery);
            toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Layout not found'
            });
          }
        } else {
          // No layout ID, start with a clean slate
          clearModules();
          setLayoutId(null);
          setLayoutName('Untitled Layout');
          setLayoutDescription('');
          resetHistory();
          setHasUnsavedChanges(false);
        }
      } catch (error) {
        console.error('Error loading layout:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load layout: ' + (error instanceof Error ? error.message : String(error))
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadLayout();
  }, [projectId, user, loading, router.query.layoutId, toast, addModule, addConnection, clearModules, resetHistory]);
  
  // Auto-save changes when modules or connections change
  useEffect(() => {
    const autoSave = async () => {
      if (!layoutId || !projectId || !user || modules.length === 0) return;
      
      try {
        console.log('Auto-saving layout:', layoutId);
        setIsSaving(true);
        
        await debouncedSave(layoutId, {
          modules,
          connections,
          name: layoutName,
          description: layoutDescription
        });
        
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Error auto-saving layout:', error);
        toast({
          variant: 'destructive',
          title: 'Auto-save failed',
          description: 'Changes could not be saved automatically'
        });
      } finally {
        setIsSaving(false);
      }
    };
    
    // Only auto-save if we have an existing layout and there are changes
    if (layoutId && hasUnsavedChanges && !isLoading) {
      autoSave();
    }
  }, [modules, connections, layoutId, projectId, user, hasUnsavedChanges, isLoading, layoutName, layoutDescription, toast]);
  
  // Mark changes as unsaved when modules or connections change
  useEffect(() => {
    if (!isLoading) {
      setHasUnsavedChanges(true);
    }
  }, [modules, connections, isLoading]);
  
  // Handle module changes
  const handleModuleAdded = useCallback((module: Module) => {
    addModule(module);
    setHasUnsavedChanges(true);
  }, [addModule]);
  
  const handleModuleUpdated = useCallback((module: Module) => {
    updateModule(module);
    setHasUnsavedChanges(true);
  }, [updateModule]);
  
  const handleModuleRemoved = useCallback((moduleId: string) => {
    removeModule(moduleId);
    setHasUnsavedChanges(true);
  }, [removeModule]);
  
  // Handle connection changes
  const handleConnectionAdded = useCallback((connection: any) => {
    addConnection(connection);
    setHasUnsavedChanges(true);
  }, [addConnection]);
  
  const handleConnectionRemoved = useCallback((connectionId: string) => {
    removeConnection(connectionId);
    setHasUnsavedChanges(true);
  }, [removeConnection]);
  
  // Handle save completion
  const handleSaveComplete = useCallback((newLayoutId: string) => {
    setLayoutId(newLayoutId);
    setHasUnsavedChanges(false);
    
    // Update URL to include the layout ID without full page reload
    const newUrl = `/dashboard/projects/${projectId}/editor?layoutId=${newLayoutId}`;
    router.push(newUrl, undefined, { shallow: true });
    
    console.log('Layout saved with ID:', newLayoutId);
  }, [projectId, router]);
  
  // Handle camera zoom
  const handleZoomIn = useCallback(() => {
    if (cameraControlsRef.current) {
      // @ts-ignore - we know this exists
      cameraControlsRef.current.zoomIn();
    }
  }, []);
  
  const handleZoomOut = useCallback(() => {
    if (cameraControlsRef.current) {
      // @ts-ignore - we know this exists
      cameraControlsRef.current.zoomOut();
    }
  }, []);
  
  // Register keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+z': () => {
      if (canUndo) undoLastAction();
    },
    'ctrl+y': () => {
      if (canRedo) redoLastAction();
    },
    'ctrl+s': (e) => {
      e.preventDefault();
      // Open save dialog
      document.getElementById('save-layout-button')?.click();
    }
  });
  
  if (loading || !projectId) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  return (
    <>
      <Head>
        <title>Layout Editor | Konnect</title>
      </Head>
      
      <div className="flex flex-col h-screen">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b bg-card p-2">
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIs3DView(true)}
                    className={is3DView ? 'bg-primary/10' : ''}
                  >
                    <Cube className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>3D View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIs3DView(false)}
                    className={!is3DView ? 'bg-primary/10' : ''}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>2D View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div className="h-6 border-l mx-2"></div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={undoLastAction}
                    disabled={!canUndo}
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={redoLastAction}
                    disabled={!canRedo}
                  >
                    <Redo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div className="h-6 border-l mx-2"></div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomIn}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomOut}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex items-center space-x-2">
            <SaveLayoutDialog
              layoutData={{
                id: layoutId || undefined,
                projectId: projectId as string,
                name: layoutName,
                description: layoutDescription,
                modules,
                connections
              }}
              onSaveComplete={handleSaveComplete}
              trigger={
                <Button 
                  id="save-layout-button"
                  className="bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {layoutId ? 'Save' : 'Save As'}
                </Button>
              }
            />
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Module library */}
          <div className="w-64 border-r bg-card overflow-y-auto">
            <ModuleLibrary onAddModule={handleModuleAdded} />
          </div>
          
          {/* 3D Scene */}
          <div className="flex-1 relative">
            <SceneContainer
              modules={modules}
              connections={connections}
              onModuleAdd={handleModuleAdded}
              onModuleUpdate={handleModuleUpdated}
              onModuleRemove={handleModuleRemoved}
              onConnectionAdd={handleConnectionAdded}
              onConnectionRemove={handleConnectionRemoved}
              is3D={is3DView}
              cameraControlsRef={cameraControlsRef}
              readOnly={false}
            />
          </div>
          
          {/* Toolbox */}
          <div className="w-80 border-l bg-card overflow-y-auto">
            <Toolbox 
              selectedModules={modules.filter(m => m.selected)}
              onUpdateModule={handleModuleUpdated}
              onDeleteModule={handleModuleRemoved}
              connectionTypes={Object.values(ConnectionType)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
