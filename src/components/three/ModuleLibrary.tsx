
import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Box, Truck, Trees, Database, Server, Leaf } from "lucide-react";
import moduleService from "@/services/module";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Module } from "@/types/module";
import { cn } from "@/lib/utils";

interface ModuleLibraryProps {
  onDragStart: (module: Module) => void;
}

const getCategoryIcon = (categoryId: string) => {
  switch (categoryId.toLowerCase()) {
    case "konnect":
      return <Server className="h-4 w-4" />;
    case "network":
      return <Database className="h-4 w-4" />;
    case "piping":
      return <Box className="h-4 w-4" />;
    case "environment":
      return <Trees className="h-4 w-4" />;
    default:
      return <Truck className="h-4 w-4" />;
  }
};

export function ModuleLibrary({ onDragStart }: ModuleLibraryProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { user } = useAuth();

  useEffect(() => {
    const loadModules = async () => {
      if (!user) return;
      try {
        const moduleData = await moduleService.getAllModules();
        setModules(moduleData);
        
        const uniqueCategories = Array.from(new Set(moduleData.map(m => m.category || "uncategorized")));
        setCategories(["all", ...uniqueCategories]);
      } catch (error) {
        console.error("Error loading modules:", error);
      }
    };

    loadModules();
  }, [user]);

  const filteredModules = useMemo(() => {
    return modules.filter(module => 
      selectedCategory === "all" || module.category === selectedCategory
    );
  }, [modules, selectedCategory]);

  return (
    <div className="space-y-4">
      <Select
        value={selectedCategory}
        onValueChange={setSelectedCategory}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map(category => (
            <SelectItem key={category} value={category}>
              <div className="flex items-center gap-2">
                {getCategoryIcon(category)}
                <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="grid grid-cols-1 gap-2">
        {filteredModules.map((module) => (
          <Card
            key={module.id}
            className="p-3 cursor-move hover:bg-accent/50 transition-colors"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              onDragStart(module);
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="flex-shrink-0 w-12 h-12 rounded bg-muted flex items-center justify-center"
                style={{ backgroundColor: module.color || "#666" }}
              >
                {module.type === "container" && <Truck className="h-6 w-6 text-background" />}
                {module.type === "vegetation" && <Leaf className="h-6 w-6 text-background" />}
                {!module.type && <Box className="h-6 w-6 text-background" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{module.name}</p>
                <p className="text-sm text-muted-foreground">
                  {module.dimensions.length}m × {module.dimensions.width}m × {module.dimensions.height}m
                </p>
                {module.description && (
                  <p className="text-sm text-muted-foreground truncate">
                    {module.description}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
