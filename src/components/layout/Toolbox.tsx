import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronLeft, ChevronRight, Box, Settings, Layers, Save, Undo, Redo, View, Grid } from 'lucide-react';
import { ModuleLibrary } from '@/components/three/ModuleLibrary';
import { cn } from '@/lib/utils';
import { Module } from '@/types/module';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { SaveLayoutDialog } from './SaveLayoutDialog';
import { useRouter } from 'next/router';

interface ToolboxProps {
  onModuleDragStart: (module: Module) => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  controlsRef: React.RefObject<any>;
  currentLayout?: {
    id?: string;
    projectId?: string;
    name?: string;
    description?: string;
  };
  modules?: any[];
  connections?: any[];
}

export function Toolbox({ 
  onModuleDragStart, 
  onSave, 
  onUndo, 
  onRedo, 
  controlsRef,
  currentLayout,
  modules = [],
  connections = []
}: ToolboxProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string>('modules');
  const router = useRouter();
  const { id: projectId } = router.query;

  const sections = [
    {
      id: 'modules',
      title: 'Module Library',
      icon: <Box className='h-5 w-5' />,
      content: <ModuleLibrary onDragStart={onModuleDragStart} />
    },
    {
      id: 'layers',
      title: 'Layers',
      icon: <Layers className='h-5 w-5' />,
      content: <div className='p-4 text-sm text-muted-foreground'>Layer management coming soon</div>
    },
    {
      id: 'settings',
      title: 'Scene Settings',
      icon: <Settings className='h-5 w-5' />,
      content: <div className='p-4 text-sm text-muted-foreground'>Scene settings coming soon</div>
    }
  ];

  const handleSaveComplete = (layoutId: string) => {
    toast({
      title: 'Layout Saved',
      description: 'Your layout has been saved successfully.',
      duration: 2000
    });
    
    if (projectId) {
      // Refresh the page with the new layout ID
      router.push(`/dashboard/projects/${projectId}/editor?layoutId=${layoutId}`, undefined, { shallow: true });
    }
  };

  const handleSave = () => {
    // If we have a current layout, show the save dialog
    if (currentLayout?.id) {
      // Auto-save the current layout
      if (modules.length > 0 || connections.length > 0) {
        onSave();
        toast({
          title: 'Layout Saved',
          description: 'Your layout changes have been saved automatically.',
          duration: 2000
        });
      } else {
        toast({
          title: 'Nothing to Save',
          description: 'Add some modules to your layout before saving.',
          duration: 2000
        });
      }
    } else {
      // No current layout, show a message to create one first
      toast({
        variant: 'destructive',
        title: 'No Layout Selected',
        description: 'Please create or select a layout first.',
        duration: 2000
      });
    }
  };

  const handle2DView = () => {
    console.log('2D View button clicked', controlsRef?.current);
    if (controlsRef?.current) {
      // Call the reset method which sets the camera to 2D top-down view
      controlsRef.current.reset();
      toast({
        title: '2D View',
        description: 'Switched to 2D top-down view',
        duration: 1500
      });
    } else {
      console.error('Controls reference is not available');
      toast({
        title: 'Error',
        description: 'Could not switch to 2D view',
        variant: 'destructive',
        duration: 1500
      });
    }
  };

  const handle3DView = () => {
    console.log('3D View button clicked', controlsRef?.current);
    if (controlsRef?.current) {
      // Use the set3DView method for isometric view
      if (typeof controlsRef.current.set3DView === 'function') {
        controlsRef.current.set3DView();
        toast({
          title: '3D View',
          description: 'Switched to 3D isometric view',
          duration: 1500
        });
      } else {
        console.error('set3DView method is not available');
        toast({
          title: 'Error',
          description: 'Could not switch to 3D view',
          variant: 'destructive',
          duration: 1500
        });
      }
    } else {
      console.error('Controls reference is not available');
      toast({
        title: 'Error',
        description: 'Could not switch to 3D view',
        variant: 'destructive',
        duration: 1500
      });
    }
  };

  return (
    <div 
      className={cn(
        'fixed top-0 right-0 h-screen bg-background border-l transition-all duration-200 z-50 flex flex-col',
        collapsed ? 'w-16' : 'w-80'
      )}
      style={{ marginLeft: 'auto' }}
    >
      {/* Header */}
      <div className='flex h-16 items-center justify-between px-4 border-b'>
        {collapsed ? (
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setCollapsed(false)}
            className='w-full text-muted-foreground hover:text-foreground'
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>
        ) : (
          <div className='flex items-center justify-between w-full'>
            <h2 className='text-lg font-medium'>Toolbox</h2>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setCollapsed(true)}
              className='text-muted-foreground hover:text-foreground'
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className='flex-1 overflow-hidden'>
        <ScrollArea className='h-full'>
          {collapsed ? (
            <div className='p-2 space-y-2'>
              {sections.map((section) => (
                <TooltipProvider key={section.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        className={cn(
                          'w-full',
                          expandedSection === section.id && 'bg-accent'
                        )}
                        onClick={() => {
                          setCollapsed(false);
                          setExpandedSection(section.id);
                        }}
                      >
                        {section.icon}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side='left'>
                      <p>{section.title}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          ) : (
            <div className='p-2'>
              {sections.map((section) => (
                <Collapsible
                  key={section.id}
                  open={expandedSection === section.id}
                  onOpenChange={() => setExpandedSection(section.id)}
                >
                  <CollapsibleTrigger className='flex items-center w-full p-2 hover:bg-accent rounded-md'>
                    {section.icon}
                    <span className='ml-2'>{section.title}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {section.content}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Bottom toolbar */}
      <div className='border-t p-2 bg-background/80 backdrop-blur-sm'>
        <TooltipProvider>
          <div className='space-y-2'>
            {/* Save button - Always visible and prominent */}
            <SaveLayoutDialog
              layoutData={{
                id: currentLayout?.id,
                projectId: (projectId as string) || '',
                name: currentLayout?.name || '',
                description: currentLayout?.description || '',
                modules: modules,
                connections: connections
              }}
              onSaveComplete={handleSaveComplete}
              trigger={
                <Button 
                  variant='default' 
                  size={collapsed ? 'icon' : 'default'}
                  className='w-full bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black'
                >
                  <Save className='h-4 w-4' />
                  {!collapsed && <span className='ml-2'>Save Layout</span>}
                </Button>
              }
            />

            <Separator />

            <div className={cn(
              'grid gap-2',
              collapsed ? 'grid-cols-1' : 'grid-cols-2'
            )}>
              {/* Undo/Redo group */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant='secondary' 
                    size={collapsed ? 'icon' : 'default'}
                    onClick={onUndo}
                    className='w-full'
                  >
                    <Undo className='h-4 w-4' />
                    {!collapsed && <span className='ml-2'>Undo</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='left'>
                  <p>Undo last action</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant='secondary' 
                    size={collapsed ? 'icon' : 'default'}
                    onClick={onRedo}
                    className='w-full'
                  >
                    <Redo className='h-4 w-4' />
                    {!collapsed && <span className='ml-2'>Redo</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='left'>
                  <p>Redo last action</p>
                </TooltipContent>
              </Tooltip>

              {/* View controls */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant='outline' 
                    size={collapsed ? 'icon' : 'default'}
                    onClick={handle2DView}
                    className='w-full'
                  >
                    <View className='h-4 w-4' />
                    {!collapsed && <span className='ml-2'>2D View</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='left'>
                  <p>Switch to 2D top view</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant='outline' 
                    size={collapsed ? 'icon' : 'default'}
                    onClick={handle3DView}
                    className='w-full'
                  >
                    <Grid className='h-4 w-4' />
                    {!collapsed && <span className='ml-2'>3D View</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='left'>
                  <p>Switch to 3D isometric view</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}