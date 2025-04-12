import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronLeft, ChevronRight, Box, Settings, Layers, Save, Undo, Redo, View, Grid } from "lucide-react";
import { ModuleLibrary } from "@/components/three/ModuleLibrary";
import { cn } from "@/lib/utils";
import { Module } from "@/types/module";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { toast } from '@/hooks/use-toast';

interface ToolboxProps {
  onModuleDragStart: (module: Module) => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  controlsRef?: React.RefObject<any>;
}

export function Toolbox({ 
  onModuleDragStart, 
  onSave, 
  onUndo, 
  onRedo,
  controlsRef
}: ToolboxProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string>("modules");

  const sections = [
    {
      id: "modules",
      title: "Module Library",
      icon: <Box className="h-5 w-5" />,
      content: <ModuleLibrary onDragStart={onModuleDragStart} />
    },
    {
      id: "layers",
      title: "Layers",
      icon: <Layers className="h-5 w-5" />,
      content: <div className="p-4 text-sm text-muted-foreground">Layer management coming soon</div>
    },
    {
      id: "settings",
      title: "Scene Settings",
      icon: <Settings className="h-5 w-5" />,
      content: <div className="p-4 text-sm text-muted-foreground">Scene settings coming soon</div>
    }
  ];

  const handleSave = () => {
    if (onSave) {
      onSave();
      toast({
        title: 'Layout Saved',
        description: 'Your layout changes have been saved successfully.',
        duration: 2000
      });
    } else {
      toast({
        title: 'Save Failed',
        description: 'Could not save the layout. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handle2DView = () => {
    if (controlsRef?.current) {
      try {
        controlsRef.current.reset();
        toast({
          title: '2D View',
          description: 'Switched to 2D top view',
          duration: 1000
        });
      } catch (error) {
        console.error('Error switching to 2D view:', error);
        toast({
          title: 'View Change Failed',
          description: 'Could not switch to 2D view',
          variant: 'destructive'
        });
      }
    }
  };

  const handle3DView = () => {
    if (controlsRef?.current) {
      try {
        console.log('3D View button clicked, controlsRef:', controlsRef.current);
        
        // Get camera and target from controls
        const camera = controlsRef.current.object;
        const target = controlsRef.current.target;
        
        // Set fixed isometric position (45° angles)
        const distance = 20;
        
        // Calculate position using equal angles for isometric view
        // This creates a true isometric view at 45° angles
        const x = distance * Math.sqrt(1/3);
        const y = distance * Math.sqrt(1/3);
        const z = distance * Math.sqrt(1/3);
        
        // Set camera position and look at target
        camera.position.set(x, y, z);
        camera.lookAt(target);
        
        // Force update controls
        controlsRef.current.update();
        
        toast({
          title: '3D View',
          description: 'Switched to 3D isometric view',
          duration: 1000
        });
      } catch (error) {
        console.error('Error switching to 3D view:', error);
        toast({
          title: 'View Change Failed',
          description: 'Could not switch to 3D view: ' + (error instanceof Error ? error.message : 'Unknown error'),
          variant: 'destructive'
        });
      }
    } else {
      console.error('Controls reference is not available');
      toast({
        title: 'View Change Failed',
        description: 'Camera controls not available',
        variant: 'destructive'
      });
    }
  };

  const handleUndo = () => {
    if (onUndo) {
      onUndo();
      toast({
        title: 'Undo',
        description: 'Undid last action',
        duration: 1000
      });
    }
  };

  const handleRedo = () => {
    if (onRedo) {
      onRedo();
      toast({
        title: 'Redo',
        description: 'Redid last action',
        duration: 1000
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant='default' 
                  size={collapsed ? 'icon' : 'default'}
                  onClick={handleSave}
                  className='w-full bg-primary hover:bg-primary/90'
                >
                  <Save className='h-4 w-4' />
                  {!collapsed && <span className='ml-2'>Save Layout</span>}
                </Button>
              </TooltipTrigger>
              <TooltipContent side='left'>
                <p>Save current layout</p>
              </TooltipContent>
            </Tooltip>

            <Separator />

            <div className={cn(
              'grid gap-2',
              collapsed ? 'grid-cols-1' : 'grid-cols-2'
            )}>
              {/* Undo/Redo group */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant='outline' 
                    size={collapsed ? 'icon' : 'default'}
                    onClick={handleUndo}
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
                    variant='outline' 
                    size={collapsed ? 'icon' : 'default'}
                    onClick={handleRedo}
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