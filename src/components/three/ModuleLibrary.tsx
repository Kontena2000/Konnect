
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Module } from "@/types/module";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import moduleService from "@/services/module";
import { useToast } from "@/hooks/use-toast";

export interface ModuleLibraryProps {
  onDragStart?: (module: Module | null) => void;
}

export function ModuleLibrary({ onDragStart }: ModuleLibraryProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    basic: true
  });
  const [modules, setModules] = useState<Module[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; }[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedModules, fetchedCategories] = await Promise.all([
          moduleService.getAllModules(),
          moduleService.getCategories()
        ]);
        setModules(fetchedModules);
        setCategories(fetchedCategories);
        
        // Initialize expanded state for all categories
        const initialExpanded = fetchedCategories.reduce((acc, category) => ({
          ...acc,
          [category.id]: category.id === "basic"
        }), {});
        setExpanded(initialExpanded);
      } catch (error) {
        console.error("Error loading module library data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load module library"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const modulesByCategory = modules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  const toggleCategory = (categoryId: string) => {
    setExpanded(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleDragStart = (module: Module) => {
    onDragStart?.(module);
  };

  if (loading) {
    return (
      <Card className="h-full border-0 rounded-none">
        <CardHeader className="px-4 py-3 border-b">
          <CardTitle className="text-lg">Module Library</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[calc(100vh-10rem)]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading modules...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-0 rounded-none">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-lg">Module Library</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="p-4 space-y-4">
            {categories.map(category => {
              const categoryModules = modulesByCategory[category.id] || [];
              if (categoryModules.length === 0) return null;

              return (
                <Collapsible
                  key={category.id}
                  open={expanded[category.id]}
                  onOpenChange={() => toggleCategory(category.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start hover:bg-accent hover:text-accent-foreground"
                    >
                      {expanded[category.id] ? (
                        <ChevronDown className="h-4 w-4 mr-2" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-2" />
                      )}
                      {category.name}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2 mt-2">
                      {categoryModules.map((module) => (
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
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
