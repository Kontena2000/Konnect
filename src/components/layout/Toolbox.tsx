
import { useState, useCallback } from 'react';
import { ModuleLibrary } from '@/components/three/ModuleLibrary';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Module } from '@/types/module';
import { Connection, Layout } from '@/services/layout';
import { cn } from '@/lib/utils';
import { 
  Undo2, 
  Redo2, 
  Save, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Grid3X3, 
  Grid, 
  Eye, 
  EyeOff
} from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface ToolboxProps {
  onModuleDragStart: (module: Module) => void;
  onUndo: () => void;
  onRedo: () => void;
  controlsRef: React.RefObject<any>;
  currentLayout?: Layout;
  modules: Module[];
  connections: Connection[];
}

export function Toolbox({ 
  onModuleDragStart, 
  onUndo, 
  onRedo, 
  controlsRef,
  currentLayout,
  modules,
  connections
}: ToolboxProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [view, setView] = useState<'3d' | '2d'>('3d');
  const { toast } = useToast();

  const handleSave = useCallback(async () => {
    if (!currentLayout) {
      toast({
        title: 'Error',
        description: 'No layout selected. Please create or select a layout first.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await fetch(`/api/layouts/${currentLayout.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...currentLayout,
          modules,
          connections,
          updatedAt: new Date().toISOString()
        }),
      });

      toast({
        title: 'Success',
        description: 'Layout saved successfully'
      });
    } catch (error) {
      console.error('Error saving layout:', error);
      toast({
        title: 'Error',
        description: 'Failed to save layout',
        variant: 'destructive'
      });
    }
  }, [currentLayout, modules, connections, toast]);

  const handleViewToggle = useCallback(() => {
    if (!controlsRef.current) return;
    
    if (view === '3d') {
      // Switch to 2D top-down view
      controlsRef.current.setPosition(0, 20, 0);
      controlsRef.current.setTarget(0, 0, 0);
      setView('2d');
    } else {
      // Switch back to 3D view
      controlsRef.current.setPosition(10, 10, 10);
      controlsRef.current.setTarget(0, 0, 0);
      setView('3d');
    }
  }, [view, controlsRef]);

  const handleZoomToFit = useCallback(() => {
    if (!controlsRef.current) return;
    
    // Find the bounds of all modules
    if (modules.length === 0) {
      controlsRef.current.setPosition(10, 10, 10);
      controlsRef.current.setTarget(0, 0, 0);
      return;
    }
    
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    
    modules.forEach(module => {
      const width = module.dimensions.width || 1;
      const height = module.dimensions.height || 1;
      const depth = module.dimensions.depth || 1;
      
      const x = module.position[0];
      const y = module.position[1];
      const z = module.position[2];
      
      minX = Math.min(minX, x - width / 2);
      maxX = Math.max(maxX, x + width / 2);
      minY = Math.min(minY, y - height / 2);
      maxY = Math.max(maxY, y + height / 2);
      minZ = Math.min(minZ, z - depth / 2);
      maxZ = Math.max(maxZ, z + depth / 2);
    });
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;
    
    const sizeX = maxX - minX;
    const sizeY = maxY - minY;
    const sizeZ = maxZ - minZ;
    
    const maxSize = Math.max(sizeX, sizeY, sizeZ);
    const distance = maxSize * 1.5;
    
    if (view === '2d') {
      controlsRef.current.setPosition(centerX, centerY + distance, centerZ);
    } else {
      controlsRef.current.setPosition(
        centerX + distance,
        centerY + distance,
        centerZ + distance
      );
    }
    
    controlsRef.current.setTarget(centerX, centerY, centerZ);
  }, [modules, controlsRef, view]);

  return (
    <TooltipProvider>
      <div 
        className={cn(
          'fixed right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-lg shadow-lg transition-all duration-300 z-10',
          isCollapsed ? 'w-12' : 'w-64'
        )}
      >
        <div className="p-2 flex flex-col h-full max-h-[80vh]">
          {/* Header */}
          <div className='flex items-center justify-between mb-2'>
            {!isCollapsed && <h2 className='text-lg font-medium'>Toolbox</h2>}
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setIsCollapsed(!isCollapsed)}
              className='text-muted-foreground hover:text-foreground ml-auto'
            >
              {isCollapsed ? <Maximize2 className='h-4 w-4' /> : <Minimize2 className='h-4 w-4' />}
            </Button>
          </div>

          {/* Main content area */}
          <div className='flex-1 overflow-hidden mb-2'>
            <ScrollArea className='h-full pr-3'>
              {!isCollapsed && (
                <div className='space-y-4'>
                  <div>
                    <h3 className='text-sm font-medium mb-2'>Modules</h3>
                    <ModuleLibrary onDragStart={onModuleDragStart} />
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Bottom toolbar */}
          <div className='border-t pt-2 bg-background/80 backdrop-blur-sm mt-auto'>
            <div className='space-y-2'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant='default' 
                    size={isCollapsed ? 'icon' : 'default'}
                    onClick={handleSave}
                    className='w-full bg-primary hover:bg-primary/90'
                  >
                    <Save className='h-4 w-4' />
                    {!isCollapsed && <span className='ml-2'>Save Layout</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='left'>
                  <p>Save current layout</p>
                </TooltipContent>
              </Tooltip>

              <Separator />

              <div className={cn(
                'grid gap-2',
                isCollapsed ? 'grid-cols-1' : 'grid-cols-2'
              )}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant='outline' 
                      size={isCollapsed ? 'icon' : 'default'}
                      onClick={onUndo}
                      className='w-full'
                    >
                      <Undo2 className='h-4 w-4' />
                      {!isCollapsed && <span className='ml-2'>Undo</span>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side='left'>
                    <p>Undo last action</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant='outline' 
                      size={isCollapsed ? 'icon' : 'default'}
                      onClick={onRedo}
                      className='w-full'
                    >
                      <Redo2 className='h-4 w-4' />
                      {!isCollapsed && <span className='ml-2'>Redo</span>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side='left'>
                    <p>Redo last action</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant='outline' 
                      size={isCollapsed ? 'icon' : 'default'}
                      onClick={handleViewToggle}
                      className='w-full'
                    >
                      {view === '2d' ? <Eye className='h-4 w-4' /> : <EyeOff className='h-4 w-4' />}
                      {!isCollapsed && <span className='ml-2'>{view === '2d' ? '2D View' : '3D View'}</span>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side='left'>
                    <p>Toggle between 2D and 3D views</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant='outline' 
                      size={isCollapsed ? 'icon' : 'default'}
                      onClick={handleZoomToFit}
                      className='w-full'
                    >
                      <Grid className='h-4 w-4' />
                      {!isCollapsed && <span className='ml-2'>Zoom to Fit</span>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side='left'>
                    <p>Zoom to fit all modules</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
