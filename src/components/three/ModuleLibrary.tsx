import { useState, useEffect, useCallback, useMemo } from "react";
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
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

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

const ModuleItem = ({ module, onDragStart, onDuplicate }: { 
  module: Module; 
  onDragStart: (module: Module) => void;
  onDuplicate: (module: Module, e: React.MouseEvent) => void;
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: module.id,
    data: module
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'group relative flex items-center gap-2 p-2 hover:bg-accent/50 rounded-md cursor-move transition-colors',
        isDragging && 'opacity-50'
      )}
    >
      <div 
        className='flex-shrink-0 w-12 h-12 rounded bg-muted flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 group-active:scale-95' 
        style={{ backgroundColor: module.color }}
      >
        {module.type === 'container' && <Truck className='h-6 w-6 text-background' />}
        {module.type === 'vegetation' && <Leaf className='h-6 w-6 text-background' />}
        {!module.type && <Box className='h-6 w-6 text-background' />}
      </div>
      <div className='flex-1 min-w-0'>
        <div className='text-sm font-medium truncate'>{module.name}</div>
        <div className='text-xs text-muted-foreground'>
          {module.dimensions.length}m × {module.dimensions.width}m × {module.dimensions.height}m
        </div>
        <div className='text-xs text-muted-foreground truncate'>
          {module.description}
        </div>
      </div>
      <div className='absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 hover:bg-background/50'
                onClick={(e) => onDuplicate(module, e)}
              >
                <Copy className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent side='left'>
              <p>Duplicate module</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className='absolute inset-0 rounded-md border-2 border-primary opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity' />
    </div>
  );
};

export function ModuleLibrary({ onDragStart }: ModuleLibraryProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const loadModules = async () => {
      if (!user) return;
      try {
        const moduleData = await moduleService.getModules();
        setModules(moduleData);
        
        // Get unique categories
        const uniqueCategories = Array.from(new Set(moduleData.map(m => m.category)));
        setCategories(['all', ...uniqueCategories]);
      } catch (error) {
        console.error('Error loading modules:', error);
      }
    };

    loadModules();
  }, [user]);

  const filteredModules = useMemo(() => {
    return modules.filter(module => 
      selectedCategory === 'all' || module.category === selectedCategory
    );
  }, [modules, selectedCategory]);

  return (
    <div className='space-y-4 p-2'>
      <Select
        value={selectedCategory}
        onValueChange={setSelectedCategory}
      >
        <SelectTrigger>
          <SelectValue placeholder='Select category' />
        </SelectTrigger>
        <SelectContent>
          {categories.map(category => (
            <SelectItem key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className='grid grid-cols-2 gap-2'>
        {filteredModules.map((module) => (
          <Card
            key={module.id}
            className='p-2 cursor-move hover:bg-accent transition-colors'
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move';
              onDragStart(module);
            }}
          >
            <div className='aspect-square relative bg-muted rounded-sm overflow-hidden'>
              {module.thumbnail ? (
                <Image
                  src={module.thumbnail}
                  alt={module.name}
                  fill
                  className='object-cover'
                />
              ) : (
                <div className='w-full h-full flex items-center justify-center'>
                  <Box className='h-8 w-8 text-muted-foreground' />
                </div>
              )}
            </div>
            <div className='mt-2'>
              <p className='text-sm font-medium truncate'>{module.name}</p>
              <p className='text-xs text-muted-foreground truncate'>
                {module.dimensions.length}x{module.dimensions.width}x{module.dimensions.height}m
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}