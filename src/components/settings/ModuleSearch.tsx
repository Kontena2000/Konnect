import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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
    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
      <div className="relative flex-grow">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search modules..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <Select value={categoryFilter} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 p-0 h-4 w-4"
                onClick={(e) => {
                  e.stopPropagation();
                  setCategoryToDelete(category.id);
                }}
              >
                ×
              </Button>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => categoryToDelete && onDeleteCategory(categoryToDelete)}
              disabled={isDeletingCategory}
            >
              {isDeletingCategory ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}