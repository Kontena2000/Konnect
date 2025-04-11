import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { SceneContainer } from '@/components/three/SceneContainer';
import { Toolbox } from '@/components/layout/Toolbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import editorPreferencesService, { EditorPreferences } from '@/services/editor-preferences';
import { Module } from '@/types/module';
import { Connection, Layout } from '@/services/layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import firebaseMonitor from '@/services/firebase-monitor';
import { getFirestoreSafely } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import layoutService from '@/services/layout';
import projectService from '@/services/project';
import { waitForFirebaseBootstrap } from '@/utils/firebaseBootstrap';
import { LayoutSelector } from '@/components/layout/LayoutSelector';
import { AuthUser } from '@/services/auth';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share } from 'lucide-react';

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
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);
  const isUndoingOrRedoing = useRef(false);
  const [shareEmail, setShareEmail] = useState<string>('');

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

  // Handle share project
  const handleShareProject = async () => {
    if (!projectId || !shareEmail) return;
    
    try {
      await projectService.shareProject(projectId as string, shareEmail);
      toast({
        title: 'Success',
        description: `Project shared with ${shareEmail}`
      });
      setShareEmail('');
    } catch (error) {
      console.error('Error sharing project:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to share project'
      });
    }
  };

  // Handle layout change
  const handleLayoutChange = useCallback((layout: Layout) => {
    setCurrentLayout(layout);
    
    // Ensure all module positions and rotations are properly converted to numbers
    if (layout.modules && Array.isArray(layout.modules)) {
      const processedModules = layout.modules.map(module => {
        // Create a deep copy to avoid modifying the original
        const moduleCopy = JSON.parse(JSON.stringify(module));
        
        // Ensure position values are numbers
        moduleCopy.position = moduleCopy.position.map(Number) as [number, number, number];
        
        // Ensure rotation values are numbers
        moduleCopy.rotation = moduleCopy.rotation.map(Number) as [number, number, number];
        
        // Ensure scale values are numbers
        moduleCopy.scale = moduleCopy.scale.map(Number) as [number, number, number];
        
        return moduleCopy;
      });
      
      console.log('Setting modules with processed rotations:', processedModules.map(m => ({ id: m.id, rotation: m.rotation })));
      setModules(processedModules);
    } else {
      setModules([]);
    }
    
    setConnections(layout.connections || []);
    
    // Update URL to reflect the selected layout
    if (projectId && layout.id) {
      router.push(`/dashboard/projects/${projectId}/editor?layoutId=${layout.id}`, undefined, { shallow: true });
    } else if (projectId) {
      // If no layout ID (empty layout), just show the editor without layout ID in URL
      router.push(`/dashboard/projects/${projectId}/editor`, undefined, { shallow: true });
    }
  }, [projectId, router]);
  
  // Refresh layouts when needed
  const refreshLayouts = useCallback(async () => {
    if (!projectId || !user) return;
    
    try {
      console.log('Refreshing layouts for project:', projectId);
      const projectLayouts = await layoutService.getProjectLayouts(projectId as string);
      console.log('Fetched layouts:', projectLayouts.length);
      setLayouts(projectLayouts);
      
      // If current layout was deleted, select another one
      if (currentLayout && !projectLayouts.some(l => l.id === currentLayout.id)) {
        console.log('Current layout was deleted, selecting another one');
        if (projectLayouts.length > 0) {
          handleLayoutChange(projectLayouts[0]);
        } else {
          // No layouts left, create empty state
          console.log('No layouts left, creating empty state');
          setCurrentLayout(null);
          setModules([]);
          setConnections([]);
          router.push(`/dashboard/projects/${projectId}/editor`, undefined, { shallow: true });
        }
      }
    } catch (error) {
      console.error('Error refreshing layouts:', error);
    }
  }, [projectId, user, currentLayout, handleLayoutChange, router]);

  // Handle layout create
  const handleLayoutCreate = useCallback((layout: Layout) => {
    setLayouts(prev => [...prev, layout]);
    setCurrentLayout(layout);
    
    // Ensure all module positions and rotations are properly converted to numbers
    if (layout.modules && Array.isArray(layout.modules)) {
      const processedModules = layout.modules.map(module => {
        // Create a deep copy to avoid modifying the original
        const moduleCopy = JSON.parse(JSON.stringify(module));
        
        // Ensure position values are numbers
        moduleCopy.position = moduleCopy.position.map(Number) as [number, number, number];
        
        // Ensure rotation values are numbers
        moduleCopy.rotation = moduleCopy.rotation.map(Number) as [number, number, number];
        
        // Ensure scale values are numbers
        moduleCopy.scale = moduleCopy.scale.map(Number) as [number, number, number];
        
        return moduleCopy;
      });
      
      setModules(processedModules);
    } else {
      setModules([]);
    }
    
    setConnections(layout.connections || []);
  }, []);

  // Memoize heavy computations
  const memoizedModules = useMemo(() => modules, [modules]);
  const memoizedConnections = useMemo(() => connections, [connections]);

  // Handle module drag start
  const handleModuleDragStart = useCallback((module: Module) => {
    // Log dimensi modul saat mulai drag
    console.log('Module drag start with original dimensions:', module.dimensions);
    
    // Create a new module instance with unique ID
    const newModule: Module = {
      ...module,
      id: `${module.id}-${Date.now()}`,
      position: [0, module.dimensions.height / 2, 0], // Gunakan setengah tinggi modul untuk posisi Y awal
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    };
    
    // Pastikan dimensi modul tetap sama seperti aslinya
    newModule.dimensions = { ...module.dimensions };
    
    console.log('New module created with dimensions:', newModule.dimensions);
    
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
      const newModules = prev.map(module => {
        if (module.id === moduleId) {
          // Create a new module object with the updates
          const updatedModule = { ...module };
          
          // Ensure position, rotation, and scale are properly formatted as numbers
          if (updates.position) {
            updatedModule.position = updates.position.map(Number) as [number, number, number];
          }
          
          if (updates.rotation) {
            updatedModule.rotation = updates.rotation.map(Number) as [number, number, number];
            console.log('Updated module rotation:', updatedModule.rotation);
          }
          
          if (updates.scale) {
            updatedModule.scale = updates.scale.map(Number) as [number, number, number];
          }
          
          return { ...updatedModule, ...updates };
        }
        return module;
      });
      
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
                  // Ensure all module positions and rotations are properly converted to numbers
                  const processedModules = layoutData.modules.map((module: any) => {
                    // Create a deep copy to avoid modifying the original
                    const moduleCopy = JSON.parse(JSON.stringify(module));
                    
                    // Ensure position values are numbers
                    moduleCopy.position = moduleCopy.position.map(Number) as [number, number, number];
                    
                    // Ensure rotation values are numbers
                    moduleCopy.rotation = moduleCopy.rotation.map(Number) as [number, number, number];
                    
                    // Ensure scale values are numbers
                    moduleCopy.scale = moduleCopy.scale.map(Number) as [number, number, number];
                    
                    return moduleCopy;
                  });
                  
                  setModules(processedModules);
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
      <div className="flex items-center justify-center h-screen w-full">
        <div className="space-y-4 text-center">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-[calc(100vh-120px)] w-[90vw] max-w-5xl" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="bg-destructive/10 p-6 rounded-md max-w-md">
          <h2 className="text-lg font-medium text-destructive mb-2">Error</h2>
          <p className="mb-4">{error}</p>
          <Button 
            variant="outline" 
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
          
          {/* Layout selector with project actions */}
          <div className='fixed top-4 left-0 right-0 z-10'>
            <div className='max-w-2xl mx-auto'>
              <div className='bg-background/80 backdrop-blur-sm p-3 rounded-md shadow-md flex items-center justify-center flex-wrap gap-4'>
                <div className='flex items-center justify-center flex-grow sm:flex-grow-0'>
                  <LayoutSelector
                    projectId={projectId as string}
                    layouts={layouts}
                    currentLayout={currentLayout}
                    onLayoutChange={handleLayoutChange}
                    onLayoutCreate={handleLayoutCreate}
                    onDeleteComplete={refreshLayouts}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Add Toolbox component */}
          <Toolbox 
            onModuleDragStart={handleModuleDragStart}
            onUndo={handleUndo}
            onRedo={handleRedo}
            controlsRef={controlsRef}
            currentLayout={currentLayout || undefined}
            modules={modules}
            connections={connections}
          />
        </ErrorBoundary>
      </div>
    </AppLayout>
  );
}