import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { SceneContainer } from '@/components/three/SceneContainer';
import { Toolbox } from '@/components/layout/Toolbox';
import { useAuth } from '@/contexts/AuthContext';
import editorPreferencesService, { EditorPreferences } from '@/services/editor-preferences';
import { Module } from '@/types/module';
import { Connection, Layout } from '@/services/layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import firebaseMonitor from '@/services/firebase-monitor';
import { getFirestoreSafely } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { SaveLayoutDialog } from '@/components/layout/SaveLayoutDialog';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import layoutService from '@/services/layout';
import { waitForFirebaseBootstrap } from '@/utils/firebaseBootstrap';
import { LayoutSelector } from '@/components/layout/LayoutSelector';

interface EditorState {
  modules: Module[];
  connections: Connection[];
}

export default function LayoutEditorPage() {
  const router = useRouter();
  const { id: projectId, layoutId } = router.query;
  const [project, setProject] = useState<any>(null);
  const [layout, setLayout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);
  const isUndoingOrRedoing = useRef(false);

  // State
  const [modules, setModules] = useState<Module[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [undoStack, setUndoStack] = useState<EditorState[]>([]);
  const [redoStack, setRedoStack] = useState<EditorState[]>([]);
  const [editorPreferences, setEditorPreferences] = useState<EditorPreferences | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string>();
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [currentLayout, setCurrentLayout] = useState<Layout | null>(null);
  
  // Handle save layout
  const handleSaveLayout = useCallback((layoutId: string) => {
    // Refresh layouts list
    if (projectId) {
      // Fetch all layouts for this project
      layoutService.getProjectLayouts(projectId as string)
        .then(projectLayouts => {
          setLayouts(projectLayouts);
          
          // Find the newly saved layout
          const savedLayout = projectLayouts.find(l => l.id === layoutId);
          if (savedLayout) {
            setCurrentLayout(savedLayout);
            
            // Update modules and connections from the saved layout
            if (savedLayout.modules) {
              setModules(savedLayout.modules);
            }
            
            if (savedLayout.connections) {
              setConnections(savedLayout.connections);
            }
          }
        })
        .catch(err => {
          console.error('Error refreshing layouts:', err);
        });
      
      // Redirect to the layout editor with the saved layout
      router.push(`/dashboard/projects/${projectId}/editor?layoutId=${layoutId}`, undefined, { shallow: true });
    }
  }, [projectId, router]);

  // Handle layout change
  const handleLayoutChange = useCallback((layout: Layout) => {
    setCurrentLayout(layout);
    setModules(layout.modules || []);
    setConnections(layout.connections || []);
    
    // Update URL to reflect the selected layout
    if (projectId) {
      router.push(`/dashboard/projects/${projectId}/editor?layoutId=${layout.id}`, undefined, { shallow: true });
    }
  }, [projectId, router]);

  // Handle layout create
  const handleLayoutCreate = useCallback((layout: Layout) => {
    setLayouts(prev => [...prev, layout]);
    setCurrentLayout(layout);
    setModules(layout.modules || []);
    setConnections(layout.connections || []);
  }, []);

  // Memoize heavy computations
  const memoizedModules = useMemo(() => modules, [modules]);
  const memoizedConnections = useMemo(() => connections, [connections]);

  // Handle module drag start
  const handleModuleDragStart = useCallback((module: Module) => {
    // Create a new module instance with unique ID
    const newModule: Module = {
      ...module,
      id: `${module.id}-${Date.now()}`,
      position: [0, module.dimensions.height / 2, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    };
    
    setModules(prev => [...prev, newModule]);
    setSelectedModuleId(newModule.id);
  }, []);

  // Handle module selection
  const handleModuleSelect = useCallback((moduleId: string) => {
    setSelectedModuleId(moduleId);
  }, []);

  // Handle module updates
  const handleModuleUpdate = useCallback((moduleId: string, updates: Partial<Module>) => {
    const startTime = performance.now();
    
    setModules(prev => {
      const newModules = prev.map(module => 
        module.id === moduleId ? { ...module, ...updates } : module
      );
      
      const duration = performance.now() - startTime;
      firebaseMonitor.logPerformanceMetric({
        operationDuration: duration,
        timestamp: Date.now()
      });
      
      return newModules;
    });
  }, []);

  // Handle module deletion
  const handleModuleDelete = useCallback((moduleId: string) => {
    setModules(prev => prev.filter(module => module.id !== moduleId));
    setSelectedModuleId(undefined);
  }, []);

  // Undo handler
  const handleUndo = useCallback(() => {
    if (undoStack.length > 0) {
      isUndoingOrRedoing.current = true;
      const previousState = undoStack[undoStack.length - 1];
      const currentState = { modules, connections };
      
      setUndoStack(prev => prev.slice(0, -1));
      setRedoStack(prev => [...prev, currentState]);
      setModules(previousState.modules);
      setConnections(previousState.connections);
      
      setTimeout(() => {
        isUndoingOrRedoing.current = false;
      }, 50);
    }
  }, [undoStack, modules, connections]);

  // Redo handler
  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      isUndoingOrRedoing.current = true;
      const nextState = redoStack[redoStack.length - 1];
      const currentState = { modules, connections };
      
      setUndoStack(prev => [...prev, currentState]);
      setRedoStack(prev => prev.slice(0, -1));
      setModules(nextState.modules);
      setConnections(nextState.connections);
      
      setTimeout(() => {
        isUndoingOrRedoing.current = false;
      }, 50);
    }
  }, [redoStack, modules, connections]);

  // Debounced save with performance monitoring
  const saveTimeout = useRef<NodeJS.Timeout>();
  const handleSave = useCallback(() => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    const startTime = performance.now();
    saveTimeout.current = setTimeout(() => {
      // Implement save logic here
      const duration = performance.now() - startTime;
      firebaseMonitor.logPerformanceMetric({
        operationDuration: duration,
        timestamp: Date.now()
      });
    }, 1000);
  }, []);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, []);

  // Save state for undo when modules or connections change
  useEffect(() => {
    if (isUndoingOrRedoing.current) return;
    
    const newState = { modules, connections };
    const lastState = undoStack[undoStack.length - 1];
    
    if (!lastState || 
        JSON.stringify(lastState.modules) !== JSON.stringify(newState.modules) ||
        JSON.stringify(lastState.connections) !== JSON.stringify(newState.connections)) {
      setUndoStack(prev => [...prev, newState]);
    }
  }, [modules, connections, undoStack]);

  // Load editor preferences
  useEffect(() => {
    if (user) {
      editorPreferencesService.getPreferences(user.uid)
        .then(prefs => {
          setEditorPreferences(prefs);
        })
        .catch(error => {
          console.error('Failed to load editor preferences:', error);
        });
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId || !user) return;
      
      try {
        setLoading(true);
        
        // Ensure Firebase is initialized
        await waitForFirebaseBootstrap();
        const db = getFirestoreSafely();
        
        if (!db) {
          setError('Firebase database is not available');
          return;
        }
        
        // Fetch project data
        const projectRef = doc(db, 'projects', projectId as string);
        const projectSnap = await getDoc(projectRef);
        
        if (!projectSnap.exists()) {
          setError('Project not found');
          return;
        }
        
        const projectData = {
          id: projectSnap.id,
          ...projectSnap.data()
        } as any; // Cast to any to avoid TypeScript errors
        
        // Check if user has access to this project
        const projectUserId = projectData.userId || '';
        const projectSharedWith = projectData.sharedWith || [];
        
        if (projectUserId !== user.uid && 
            (!projectSharedWith.includes(user.email)) && 
            user.email !== 'ruud@kontena.eu') {
          setError('You do not have access to this project');
          return;
        }
        
        setProject(projectData);
        
        // Fetch all layouts for this project
        const projectLayouts = await layoutService.getProjectLayouts(projectId as string);
        setLayouts(projectLayouts);
        
        // If layoutId is provided, fetch the layout
        if (layoutId) {
          try {
            const layoutRef = doc(db, 'layouts', layoutId as string);
            const layoutSnap = await getDoc(layoutRef);
            
            if (layoutSnap.exists()) {
              const layoutData = {
                id: layoutSnap.id,
                ...layoutSnap.data()
              } as any; // Cast to any to avoid TypeScript errors
              
              // Verify this layout belongs to the current project
              if (layoutData.projectId === projectId) {
                setLayout(layoutData);
                setCurrentLayout(layoutData);
                
                // Set modules and connections from layout data
                if (layoutData.modules) {
                  setModules(layoutData.modules);
                }
                
                if (layoutData.connections) {
                  setConnections(layoutData.connections);
                }
              } else {
                console.error('Layout does not belong to this project:', {
                  layoutId,
                  layoutProjectId: layoutData.projectId,
                  currentProjectId: projectId
                });
                setError('Layout does not belong to this project');
              }
            } else {
              setError('Layout not found');
            }
          } catch (layoutError) {
            console.error('Error fetching layout:', layoutError);
            setError('Failed to load layout data');
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load project data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [projectId, layoutId, user]);
  
  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen w-full'>
        <div className='space-y-4 text-center'>
          <Skeleton className='h-8 w-64 mx-auto' />
          <Skeleton className='h-[calc(100vh-120px)] w-[90vw] max-w-5xl' />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className='flex items-center justify-center h-screen w-full'>
        <div className='bg-destructive/10 p-6 rounded-md max-w-md'>
          <h2 className='text-lg font-medium text-destructive mb-2'>Error</h2>
          <p className='mb-4'>{error}</p>
          <Button 
            variant='outline' 
            onClick={() => router.push('/dashboard/projects')}
          >
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <AppLayout fullWidth noPadding>
      <div className='h-screen w-screen overflow-hidden'>
        <ErrorBoundary>
          <div className='absolute inset-0'>
            <SceneContainer
              modules={memoizedModules}
              selectedModuleId={selectedModuleId}
              transformMode={transformMode}
              onModuleSelect={handleModuleSelect}
              onModuleUpdate={handleModuleUpdate}
              onModuleDelete={handleModuleDelete}
              connections={memoizedConnections}
              controlsRef={controlsRef}
              editorPreferences={editorPreferences}
            />
          </div>
          
          {/* Layout selector - Updated positioning for better responsiveness */}
          <div className='fixed top-4 left-0 right-0 z-10 mx-auto flex justify-center'>
            <div className='bg-background/80 backdrop-blur-sm p-2 rounded-md shadow-md flex items-center gap-4'>
              <LayoutSelector
                projectId={projectId as string}
                layouts={layouts}
                currentLayout={currentLayout}
                onLayoutChange={handleLayoutChange}
                onLayoutCreate={handleLayoutCreate}
              />
              
              <SaveLayoutDialog
                layoutData={{
                  id: currentLayout?.id,
                  projectId: projectId as string,
                  name: currentLayout?.name || '',
                  description: currentLayout?.description || '',
                  modules: modules,
                  connections: connections
                }}
                onSaveComplete={handleSaveLayout}
                trigger={
                  <Button size='sm' className='bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black'>
                    <Save className='h-4 w-4 mr-2' />
                    {currentLayout?.id ? 'Save As' : 'Save Layout'}
                  </Button>
                }
              />
            </div>
          </div>
          
          {/* Add Toolbox component */}
          <Toolbox 
            onModuleDragStart={handleModuleDragStart}
            onSave={handleSave}
            onUndo={handleUndo}
            onRedo={handleRedo}
            controlsRef={controlsRef}
            currentLayout={currentLayout || undefined}
            modules={modules}
            connections={connections}
            onSaveComplete={handleSaveLayout}
          />
        </ErrorBoundary>
      </div>
    </AppLayout>
  );
}