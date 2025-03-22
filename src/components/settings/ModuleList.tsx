
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Module } from "@/types/module";
import { ModuleCard } from "./ModuleCard";

interface ModuleListProps {
  modules: Module[];
  categories: { id: string; name: string; }[];
  onUpdateModule: (id: string, data: Partial<Module>) => Promise<void>;
  onDeleteModule: (id: string) => Promise<void>;
  onDuplicateModule: (id: string) => Promise<void>;
  isSaving: string | null;
  isDeleting: boolean;
  moduleToDelete: string | null;
  setModuleToDelete: (id: string | null) => void;
  searchTerm: string;
  categoryFilter: string;
}

export function ModuleList({
  modules,
  categories,
  onUpdateModule,
  onDeleteModule,
  onDuplicateModule,
  isSaving,
  isDeleting,
  moduleToDelete,
  setModuleToDelete,
  searchTerm,
  categoryFilter
}: ModuleListProps) {
  const filteredModules = modules.filter(module => {
    const matchesSearch = module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || module.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <ScrollArea className="h-[700px]">
      <div className="space-y-4">
        {filteredModules.map(module => (
          <ModuleCard
            key={module.id}
            module={module}
            onUpdate={onUpdateModule}
            onDelete={onDeleteModule}
            onDuplicate={onDuplicateModule}
            categories={categories}
            isSaving={isSaving === module.id}
            isDeleting={isDeleting && moduleToDelete === module.id}
            moduleToDelete={moduleToDelete}
            setModuleToDelete={setModuleToDelete}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
