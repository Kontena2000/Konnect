
import { Button } from "@/components/ui/button";
import { CreateModuleDialog } from "./CreateModuleDialog";
import { ModuleSearch } from "./ModuleSearch";

interface ModuleHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  categories: { id: string; name: string }[];
  onCreateCategory: (data: { id: string; name: string }) => Promise<void>;
  isAddingCategory: boolean;
  onDeleteCategory: (id: string) => Promise<void>;
  isDeletingCategory: boolean;
  categoryToDelete: string | null;
  setCategoryToDelete: (id: string | null) => void;
  onCreateModule: (moduleData: any) => Promise<void>;
}

export function ModuleHeader({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  categories,
  onCreateCategory,
  isAddingCategory,
  onDeleteCategory,
  isDeletingCategory,
  categoryToDelete,
  setCategoryToDelete,
  onCreateModule
}: ModuleHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <ModuleSearch
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        categoryFilter={categoryFilter}
        onCategoryChange={onCategoryChange}
        categories={categories}
        onCreateCategory={onCreateCategory}
        isAddingCategory={isAddingCategory}
        onDeleteCategory={onDeleteCategory}
        isDeletingCategory={isDeletingCategory}
        categoryToDelete={categoryToDelete}
        setCategoryToDelete={setCategoryToDelete}
      />
      <CreateModuleDialog onModuleCreate={onCreateModule} />
    </div>
  );
}
