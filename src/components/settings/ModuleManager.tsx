import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, Loader2, Trash2, FolderPlus, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import moduleService, { ModuleError } from "@/services/module";
import { Module, ModuleCategory } from "@/types/module";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateModuleDialog } from "@/components/settings/CreateModuleDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { auth, getAuthSafely } from '@/lib/firebase';
import { CategoryDialog } from '@/components/settings/CategoryDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Box, Badge } from 'lucide-react';
import { Badge as UIBadge } from '@/components/ui/badge';
import { EditModuleDialog } from '@/components/settings/EditModuleDialog';
import { ModuleHeader } from './ModuleHeader';
import { ModuleList } from './ModuleList';
import { ModuleSearch } from './ModuleSearch';

interface ModuleManagerProps {
  userId: string;
  userRole?: string;
}

export function ModuleManager({ userId, userRole }: ModuleManagerProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const loadCategories = useCallback(async () => {
    try {
      const fetchedCategories = await moduleService.getCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load categories'
      });
    }
  }, [toast]);

  const handleCreateCategory = async (data: { id: string; name: string }) => {
    setIsAddingCategory(true);
    try {
      await moduleService.createCategory(data);
      await loadCategories();
      toast({
        title: 'Success',
        description: 'Category created successfully'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create category'
      });
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setIsDeletingCategory(true);
    try {
      await moduleService.deleteCategory(id);
      await loadCategories();
      toast({
        title: 'Success',
        description: 'Category deleted successfully'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete category'
      });
    } finally {
      setIsDeletingCategory(false);
      setCategoryToDelete(null);
    }
  };

  const loadModules = useCallback(async () => {
    try {
      const safeAuth = getAuthSafely();
      if (!safeAuth?.currentUser) {
        toast({
          variant: 'destructive',
          title: 'Authentication Required',
          description: 'Please log in to manage modules.'
        });
        return;
      }

      setLoading(true);
      const loadedModules = await moduleService.getAllModules();
      setModules(loadedModules);
    } catch (error) {
      console.error('Error loading modules:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load modules'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadModules();
    loadCategories();
  }, [loadModules, loadCategories]);

  const handleCreateModule = async (moduleData: Module) => {
    try {
      await moduleService.createModule(moduleData);
      await loadModules();
      setShowCreateDialog(false);
      toast({
        title: 'Success',
        description: 'Module created successfully'
      });
    } catch (error) {
      console.error('Error creating module:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create module'
      });
    }
  };

  const filteredModules = modules.filter(module =>
    module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <ModuleSearch 
          searchTerm={searchQuery}
          onSearchChange={setSearchQuery}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          categories={categories}
          onCreateCategory={handleCreateCategory}
          isAddingCategory={isAddingCategory}
          onDeleteCategory={handleDeleteCategory}
          isDeletingCategory={isDeletingCategory}
          categoryToDelete={categoryToDelete}
          setCategoryToDelete={setCategoryToDelete}
        />
        <div className='flex gap-2'>
          <Button onClick={() => setShowCategoryDialog(true)}>
            Add Category
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className='h-4 w-4 mr-2' />
            Add Module
          </Button>
        </div>
      </div>

      <ModuleList 
        modules={filteredModules} 
        loading={loading} 
        onModuleUpdated={loadModules}
        userRole={userRole}
      />

      <CreateModuleDialog
        isOpen={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateModule}
      />

      <CategoryDialog
        isOpen={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        onSubmit={handleCreateCategory}
      />
    </div>
  );
}