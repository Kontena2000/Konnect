
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Module, ModuleCategory, defaultModules } from "@/types/module";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

export interface ModuleLibraryProps {
  onDragStart?: (module: Module | null) => void;
}

export function ModuleLibrary({ onDragStart }: ModuleLibraryProps) {
  const [expanded, setExpanded] = useState<Record<ModuleCategory, boolean>>({
    [ModuleCategory.Basic]: true
  });

  const modulesByCategory = defaultModules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<ModuleCategory, Module[]>);

  const toggleCategory = (category: ModuleCategory) => {
    setExpanded(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleDragStart = (module: Module) => {
    onDragStart?.(module);
  };

  return (
    <Card className="h-full border-0 rounded-none">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-lg">Module Library</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="p-4 space-y-4">
            {Object.entries(modulesByCategory).map(([category, modules]) => (
              <Collapsible
                key={category}
                open={expanded[category as ModuleCategory]}
                onOpenChange={() => toggleCategory(category as ModuleCategory)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:bg-accent hover:text-accent-foreground"
                  >
                    {expanded[category as ModuleCategory] ? (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2" />
                    )}
                    {category}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-2 mt-2">
                    {modules.map((module) => (
                      <div
                        key={module.id}
                        className="p-2 rounded-lg hover:bg-accent cursor-move"
                        draggable
                        onDragStart={() => handleDragStart(module)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded"
                            style={{ backgroundColor: module.color }}
                          />
                          <div>
                            <h3 className="font-medium text-sm">{module.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {module.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
