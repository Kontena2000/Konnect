import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Module } from "@/types/module";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Eye, EyeOff, Loader2, RefreshCcw } from "lucide-react";
import moduleService from "@/services/module";
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Filter, Box, Truck, Trees, Database, Server, Leaf } from 'lucide-react';

export interface ModuleLibraryProps {
  onDragStart: (module: Module) => void;
}

export function ModuleLibrary({ onDragStart }: ModuleLibraryProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [categories, setCategories] = useState<{id: string; name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["konnect"]));
  const { toast } = useToast();

  const loadModules = async () => {
    try {
      setLoading(true);
      const [fetchedModules, fetchedCategories] = await Promise.all([
        moduleService.getAllModules(),
        moduleService.getCategories()
      ]);
      setModules(fetchedModules);
      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Error loading modules:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load modules. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const toggleModuleVisibility = async (moduleId: string, currentVisibility: boolean) => {
    try {
      await moduleService.updateModule(moduleId, {
        visibleInEditor: !currentVisibility
      });
      
      setModules(prev => prev.map(mod => 
        mod.id === moduleId 
          ? { ...mod, visibleInEditor: !currentVisibility }
          : mod
      ));
      
      toast({
        title: "Success",
        description: `Module ${!currentVisibility ? "shown" : "hidden"} in editor`
      });
    } catch (error) {
      console.error("Error updating module visibility:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update module visibility"
      });
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId.toLowerCase()) {
      case 'konnect':
        return <Server className='h-4 w-4 mr-2' />;
      case 'network':
        return <Database className='h-4 w-4 mr-2' />;
      case 'piping':
        return <Box className='h-4 w-4 mr-2' />;
      case 'environment':
        return <Trees className='h-4 w-4 mr-2' />;
      default:
        return <Truck className='h-4 w-4 mr-2' />;
    }
  };

  const filteredModules = modules.filter(module => 
    module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const modulesByCategory = categories.reduce((acc, category) => {
    acc[category.id] = filteredModules.filter(
      module => module.category === category.id
    );
    return acc;
  }, {} as Record<string, Module[]>);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Module Library</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Module Library</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadModules}
            title="Refresh modules"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className='h-[400px] pr-4'>
          <div className='space-y-4'>
            {categories.map((category) => (
              <Collapsible
                key={category.id}
                open={expandedCategories.has(category.id)}
                onOpenChange={() => toggleCategory(category.id)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                  >
                    {expandedCategories.has(category.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    {getCategoryIcon(category.id)}
                    <span>{category.name}</span>
                    <Badge variant="outline" className="ml-auto">
                      {modulesByCategory[category.id]?.length || 0}
                    </Badge>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className='space-y-2 mt-2'>
                  {modulesByCategory[category.id]?.map((module) => (
                    <div
                      key={module.id}
                      className='p-2 rounded-lg hover:bg-accent cursor-move relative group'
                      draggable
                      onDragStart={() => onDragStart(module)}
                    >
                      <div className='flex items-center gap-3'>
                        <div
                          className='w-12 h-12 rounded flex items-center justify-center'
                          style={{ backgroundColor: module.color }}
                        >
                          {module.type === 'container' && <Truck className='h-5 w-5 text-white' />}
                          {module.type === 'vegetation' && <Leaf className='h-5 w-5 text-white' />}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <h3 className='font-medium text-sm truncate'>{module.name}</h3>
                          <p className='text-xs text-muted-foreground truncate'>
                            {module.description}
                          </p>
                        </div>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='opacity-0 group-hover:opacity-100 transition-opacity'
                          onClick={() => toggleModuleVisibility(module.id, module.visibleInEditor || false)}
                        >
                          {module.visibleInEditor ? (
                            <Eye className='h-4 w-4' />
                          ) : (
                            <EyeOff className='h-4 w-4' />
                          )}
                        </Button>
                      </div>
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