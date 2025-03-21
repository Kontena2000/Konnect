import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Module } from "@/types/module";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Copy, ChevronDown, ChevronRight, Eye, EyeOff, Loader2, RefreshCcw, Search, Filter, Box, Truck, Trees, Database, Server, Leaf } from "lucide-react";
import moduleService from "@/services/module";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ModuleLibraryProps {
  onDragStart: (module: Module) => void;
}

const getCategoryIcon = (categoryId: string) => {
  switch (categoryId.toLowerCase()) {
    case "konnect":
      return <Server className="h-4 w-4 mr-2" />;
    case "network":
      return <Database className="h-4 w-4 mr-2" />;
    case "piping":
      return <Box className="h-4 w-4 mr-2" />;
    case "environment":
      return <Trees className="h-4 w-4 mr-2" />;
    default:
      return <Truck className="h-4 w-4 mr-2" />;
  }
};

export function ModuleLibrary({ onDragStart }: ModuleLibraryProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadModules = useCallback(async () => {
    try {
      setLoading(true);
      const data = await moduleService.getAllModules();
      setModules(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load modules"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredModules = modules.filter(module =>
    module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const modulesByCategory = filteredModules.reduce((acc, module) => {
    const category = module.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  const handleDragStart = (module: Module) => {
    onDragStart(module);
  };

  const handleDuplicate = async (module: Module, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await moduleService.duplicateModule(module.id);
      await loadModules();
      toast({
        title: "Success",
        description: "Module duplicated successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to duplicate module"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="h-full border-0 rounded-none">
      <CardHeader className="space-y-2 px-4">
        <CardTitle className="text-lg font-medium">Module Library</CardTitle>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="space-y-2 p-4">
            {Object.entries(modulesByCategory).map(([category, categoryModules]) => (
              <Collapsible
                key={category}
                open={expandedCategories.includes(category)}
                onOpenChange={() => toggleCategory(category)}
              >
                <CollapsibleTrigger className="flex items-center w-full hover:bg-accent rounded-md p-2">
                  {expandedCategories.includes(category) ? (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2" />
                  )}
                  <span className="flex items-center">
                    {getCategoryIcon(category)}
                    {category}
                  </span>
                  <Badge variant="secondary" className="ml-auto">
                    {categoryModules.length}
                  </Badge>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {categoryModules.map((module) => (
                    <div
                      key={module.id}
                      draggable
                      onDragStart={() => handleDragStart(module)}
                      className="group flex items-center gap-2 p-2 hover:bg-accent rounded-md cursor-move"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded bg-muted flex items-center justify-center" style={{ backgroundColor: module.color }}>
                        {module.type === "container" && <Truck className="h-5 w-5 text-background" />}
                        {module.type === "vegetation" && <Leaf className="h-5 w-5 text-background" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{module.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {module.dimensions.length}m × {module.dimensions.width}m × {module.dimensions.height}m
                        </div>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100"
                              onClick={(e) => handleDuplicate(module, e)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Duplicate module</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}