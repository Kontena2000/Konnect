
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronLeft, ChevronRight, Box, Settings, Layers } from "lucide-react";
import { ModuleLibrary } from "@/components/three/ModuleLibrary";
import { cn } from "@/lib/utils";
import { Module } from "@/types/module";

interface ToolboxProps {
  onModuleDragStart: (module: Module) => void;
}

export function Toolbox({ onModuleDragStart }: ToolboxProps) {
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

  return (
    <div 
      className={cn(
        "fixed top-0 right-0 h-screen bg-background border-l transition-all duration-200 z-50",
        collapsed ? "w-16" : "w-80"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {collapsed ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(false)}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <h2 className="text-lg font-medium">Toolbox</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-4rem)]">
        {collapsed ? (
          <div className="p-2 space-y-2">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant="ghost"
                size="icon"
                className={cn(
                  "w-full",
                  expandedSection === section.id && "bg-accent"
                )}
                onClick={() => {
                  setCollapsed(false);
                  setExpandedSection(section.id);
                }}
              >
                {section.icon}
              </Button>
            ))}
          </div>
        ) : (
          <div className="p-2">
            {sections.map((section) => (
              <Collapsible
                key={section.id}
                open={expandedSection === section.id}
                onOpenChange={() => setExpandedSection(section.id)}
              >
                <CollapsibleTrigger className="flex items-center w-full p-2 hover:bg-accent rounded-md">
                  {section.icon}
                  <span className="ml-2">{section.title}</span>
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
  );
}
