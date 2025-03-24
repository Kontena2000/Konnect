
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronLeft, ChevronRight, Box, Settings, Layers, Save, Undo, Redo, View, Grid, Power, Snowflake } from "lucide-react";
import { ModuleLibrary } from "@/components/three/ModuleLibrary";
import { cn } from "@/lib/utils";
import { Module } from "@/types/module";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { toast } from '@/hooks/use-toast';
import { ConnectionType } from "@/types/connection";

interface ToolboxProps {
  onModuleDragStart: (module: Module) => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  controlsRef?: React.RefObject<any>;
  onConnectionTypeSelect?: (type: ConnectionType | null) => void;
  activeConnectionType?: ConnectionType | null;
}

const connectionTypes: { type: ConnectionType; icon: React.ReactNode; label: string; color: string }[] = [
  { type: "power", icon: <Power className="h-5 w-5" />, label: "Power", color: "text-green-500" },
  { type: "cooling", icon: <Snowflake className="h-5 w-5" />, label: "Cooling", color: "text-cyan-500" }
];

export function Toolbox({ 
  onModuleDragStart, 
  onSave, 
  onUndo, 
  onRedo,
  controlsRef,
  onConnectionTypeSelect,
  activeConnectionType
}: ToolboxProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string>("connections");

  const sections = [
    {
      id: "connections",
      title: "Connections",
      icon: <Power className="h-5 w-5" />,
      content: (
        <div className="p-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {connectionTypes.map(({ type, icon, label, color }) => (
              <Button
                key={type}
                variant={activeConnectionType === type ? "default" : "outline"}
                className={cn(
                  "w-full flex items-center gap-2",
                  activeConnectionType === type ? "bg-accent" : "",
                  color
                )}
                onClick={() => onConnectionTypeSelect?.(activeConnectionType === type ? null : type)}
              >
                {icon}
                <span className="text-sm">{label}</span>
              </Button>
            ))}
          </div>
          {activeConnectionType && (
            <div className="text-sm text-muted-foreground mt-4 p-2 bg-muted rounded-md">
              Click on connection points to create a {activeConnectionType} connection between modules
            </div>
          )}
        </div>
      )
    },
    {
      id: "modules",
      title: "Module Library",
      icon: <Box className="h-5 w-5" />,
      content: <ModuleLibrary onDragStart={onModuleDragStart} />
    }
  ];

  const handleSave = () => {
    onSave?.();
    toast({
      title: 'Layout Saved',
      description: 'Your layout changes have been saved successfully.',
      duration: 2000
    });
  };

  return (
    <div 
      className={cn(
        'fixed top-0 right-0 h-screen bg-background border-l transition-all duration-200 z-50 flex flex-col',
        collapsed ? 'w-16' : 'w-80'
      )}
      style={{ marginLeft: 'auto' }}
    >
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

      <div className='border-t p-2 bg-background/80 backdrop-blur-sm'>
        <TooltipProvider>
          <div className='space-y-2'>
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

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant='outline' 
                    size={collapsed ? 'icon' : 'default'}
                    onClick={() => {
                      if (controlsRef?.current) {
                        controlsRef.current.reset();
                      }
                    }}
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
                    onClick={() => {
                      if (controlsRef?.current) {
                        controlsRef.current.setAzimuthalAngle(Math.PI / 4);
                        controlsRef.current.setPolarAngle(Math.PI / 4);
                      }
                    }}
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
