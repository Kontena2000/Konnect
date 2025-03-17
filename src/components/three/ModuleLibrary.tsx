
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Module } from "@/types/module";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Eye, EyeOff, Loader2, RefreshCcw } from "lucide-react";
import moduleService from "@/services/module";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface ModuleLibraryProps {
  onDragStart?: (module: Module | null) => void;
}

export function ModuleLibrary({ onDragStart }: ModuleLibraryProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    basic: true
  });
  const [visibleCategories, setVisibleCategories] = useState<Record<string, boolean>>({
    basic: true,
    konnect: true,
    network: true,
    piping: true,
    environment: true
  });
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadLibraryData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Starting module library initialization...');

      let [fetchedModules, fetchedCategories] = await Promise.all([
        moduleService.getAllModules(),
        moduleService.getCategories()
      ]);

      console.log('Initial fetch:', { modules: fetchedModules, categories: fetchedCategories });

      if (fetchedModules.length === 0) {
        console.log('No modules found, initializing defaults...');
        await Promise.all([
          moduleService.initializeBasicCategory(),
          moduleService.initializeDefaultModules()
        ]);

        [fetchedModules, fetchedCategories] = await Promise.all([
          moduleService.getAllModules(),
          moduleService.getCategories()
        ]);
        
        console.log('After initialization:', { modules: fetchedModules, categories: fetchedCategories });
      }

      setAllModules(fetchedModules);
      setCategories(fetchedCategories);
      
      const initialExpanded = fetchedCategories.reduce((acc, category) => ({
        ...acc,
        [category.id]: true
      }), {});
      setExpanded(initialExpanded);
      
      setVisibleCategories(prev => ({
        ...prev,
        ...fetchedCategories.reduce((acc, cat) => ({
          ...acc,
          [cat.id]: true
        }), {})
      }));
      
    } catch (error) {
      console.error('Error loading module library:', error);
      setError('Failed to load module library');
      
      if (retryCount < 2) {
        const nextRetry = retryCount + 1;
        console.log(`Retrying... Attempt ${nextRetry}/2`);
        setRetryCount(nextRetry);
        setTimeout(loadLibraryData, 1000);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load modules. Please try again later.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    if (mounted) {
      loadLibraryData();
    }

    return () => {
      mounted = false;
    };
  }, [user, retryCount]);

  const handleRetry = () => {
    setRetryCount(0);
    loadLibraryData();
  };

  const modulesByCategory = allModules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    if (visibleCategories[module.category]) {
      acc[module.category].push(module);
    }
    return acc;
  }, {} as Record<string, Module[]>);

  const toggleCategory = (categoryId: string) => {
    setExpanded(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const toggleCategoryVisibility = (categoryId: string) => {
    setVisibleCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleDragStart = (module: Module) => {
    console.log("Starting drag for module:", module.id);
    onDragStart?.(module);
  };

  if (!user) {
    return (
      <Card className="h-full border-0 rounded-none">
        <CardHeader className="px-4 py-3 border-b">
          <CardTitle className="text-lg">Module Library</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[calc(100vh-10rem)]">
          <p className="text-sm text-muted-foreground">Please log in to view modules</p>
        </CardContent>
      </Card>
    );
  }

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

  if (error) {
    return (
      <Card className="h-full border-0 rounded-none">
        <CardHeader className="px-4 py-3 border-b">
          <CardTitle className="text-lg">Module Library</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[calc(100vh-10rem)]">
          <div className="flex flex-col items-center gap-4 text-destructive">
            <p className="text-sm">{error}</p>
            <Button 
              variant="outline" 
              onClick={handleRetry}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Retry Loading
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (allModules.length === 0) {
    return (
      <Card className="h-full border-0 rounded-none">
        <CardHeader className="px-4 py-3 border-b">
          <CardTitle className="text-lg">Module Library</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[calc(100vh-10rem)]">
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">No modules available</p>
            <Button 
              variant="outline" 
              onClick={handleRetry}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Reload Library
            </Button>
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

              return (
                <Collapsible
                  key={category.id}
                  open={expanded[category.id]}
                  onOpenChange={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex-1 justify-start hover:bg-accent hover:text-accent-foreground"
                      >
                        {expanded[category.id] ? (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-2" />
                        )}
                        {category.name}
                      </Button>
                    </CollapsibleTrigger>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => toggleCategoryVisibility(category.id)}
                    >
                      {visibleCategories[category.id] ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
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
