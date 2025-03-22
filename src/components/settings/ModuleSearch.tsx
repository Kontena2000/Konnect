
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryDialog } from "./CategoryDialog";

interface ModuleSearchProps {
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
}

export function ModuleSearch({
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
  setCategoryToDelete
}: ModuleSearchProps) {
  return (
    <div className="flex items-center gap-4 flex-1">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search modules..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={categoryFilter} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Filter by category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map(category => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
          <CategoryDialog 
            onCreateCategory={onCreateCategory}
            isLoading={isAddingCategory}
          />
        </SelectContent>
      </Select>
    </div>
  );
}
