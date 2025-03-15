import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModuleTemplate, ModuleCategory, moduleTemplates } from "@/types/module";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

export interface ModuleLibraryProps {
  onDragStart?: (template: ModuleTemplate | null) => void;
}

export function ModuleLibrary({ onDragStart }: ModuleLibraryProps) {
  const [expanded, setExpanded] = useState<Record<ModuleCategory, boolean>>({
    [ModuleCategory.Container]: true,
    [ModuleCategory.Power]: false,
    [ModuleCategory.Cooling]: false,
    [ModuleCategory.Network]: false,
    [ModuleCategory.Security]: false,
    [ModuleCategory.Storage]: false,
    [ModuleCategory.Konnect]: false,
    [ModuleCategory.Environment]: false
  });

  const modulesByCategory = moduleTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<ModuleCategory, ModuleTemplate[]>);

  const toggleCategory = (category: ModuleCategory) => {
    setExpanded(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleDragStart = (template: ModuleTemplate) => {
    onDragStart?.(template);
  };

  return (
    <Card className="h-full border-0 rounded-none">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-lg">Module Library</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="p-4 space-y-4">
            {Object.entries(modulesByCategory).map(([category, templates]) => (
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
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="p-2 rounded-lg hover:bg-accent cursor-move"
                        draggable
                        onDragStart={() => handleDragStart(template)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded"
                            style={{ backgroundColor: template.color }}
                          />
                          <div>
                            <h3 className="font-medium text-sm">{template.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {template.description}
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