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
import { auth } from '@/lib/firebase';
import { CategoryDialog } from '@/components/settings/CategoryDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ModuleManager() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { toast } = useToast();
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string; }[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  const loadModules = useCallback(async () => {
    try {
      if (!auth.currentUser) {
        toast({
          variant: 'destructive',
          title: 'Authentication Required',
          description: 'You must be logged in to view modules'
        });
        setLoading(false);
        return;
      }

      const modules = await moduleService.getAllModules();
      setModules(modules);
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

  useEffect(() => {
    loadModules();
    loadCategories();
  }, [loadModules, loadCategories]);

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

  const handleDeleteCategory = async (categoryId: string) => {
    setIsDeletingCategory(true);
    try {
      await moduleService.deleteCategory(categoryId);
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

  const handleUpdateModule = async (id: string, data: Partial<Module>) => {
    setIsSaving(id);
    try {
      // Show saving feedback
      toast({
        title: 'Saving changes...',
        description: 'Please wait while we update the module'
      });

      // Optimistic update
      setModules(prev => prev.map(module => 
        module.id === id ? { ...module, ...data } : module
      ));
      
      await moduleService.updateModule(id, data);
      toast({
        title: 'Success',
        description: 'Module updated successfully'
      });
    } catch (error) {
      // Revert optimistic update on error
      await loadModules();
      
      const errorMessage = error instanceof ModuleError 
        ? error.message 
        : 'Failed to update module';
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      });
    } finally {
      setIsSaving(null);
    }
  };

  const handleDuplicate = async (moduleId: string) => {
    try {
      toast({
        title: 'Duplicating module...',
        description: 'Please wait while we create a copy'
      });

      await moduleService.duplicateModule(moduleId);
      await loadModules();
      
      toast({
        title: 'Success',
        description: 'Module duplicated successfully'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to duplicate module'
      });
    }
  };

  const handleCreateModule = async (moduleData: Module) => {
    try {
      console.log('Creating module:', moduleData);
      await moduleService.createModule(moduleData);
      console.log('Module created, reloading modules...');
      await loadModules(); // Reload the full module list
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

  const handleDeleteModule = async (id: string) => {
    setIsDeleting(true);
    try {
      // Optimistic update
      setModules(prev => prev.filter(module => module.id !== id));
      
      await moduleService.deleteModule(id);
      toast({
        title: 'Success',
        description: 'Module deleted successfully'
      });
    } catch (error) {
      // Revert optimistic update on error
      await loadModules();
      
      const errorMessage = error instanceof ModuleError 
        ? error.message 
        : 'Failed to delete module';
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      });
    } finally {
      setIsDeleting(false);
      setModuleToDelete(null);
    }
  };

  const filteredModules = modules.filter(module => {
    const matchesSearch = module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || module.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleToggleVisibility = async (module: Module) => {
    const newVisibility = !module.visibleInEditor;
    await handleUpdateModule(module.id, { visibleInEditor: newVisibility });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4 flex-1'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
            <Input
              placeholder='Search modules...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className='w-[200px]'>
              <SelectValue placeholder='Filter by category' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  <div className='flex items-center justify-between w-full'>
                    <span>{category.name}</span>
                    {category.id !== 'basic' && (
                      <AlertDialog
                        open={categoryToDelete === category.id}
                        onOpenChange={(open) => !open && setCategoryToDelete(null)}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-6 w-6'
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoryToDelete(category.id);
                            }}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Category</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this category? This will not delete the modules in this category.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCategory(category.id)}
                              disabled={isDeletingCategory}
                            >
                              {isDeletingCategory ? (
                                <>
                                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                  Deleting...
                                </>
                              ) : (
                                'Delete'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </SelectItem>
              ))}
              <CategoryDialog 
                onCreateCategory={handleCreateCategory}
                isLoading={isAddingCategory}
              />
            </SelectContent>
          </Select>
        </div>
        <CreateModuleDialog onModuleCreate={handleCreateModule} />
      </div>

      <ScrollArea className='h-[700px]'>
        <div className='space-y-4'>
          {filteredModules.map(module => (
            <Card key={module.id} className='relative overflow-hidden'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='flex items-center gap-2'>
                    {module.name}
                    <span className='text-sm font-normal text-muted-foreground'>
                      ({module.category})
                    </span>
                  </CardTitle>
                  <div className='flex items-center gap-2'>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => handleDuplicate(module.id)}
                            className='h-8 w-8'
                          >
                            <Copy className='h-4 w-4' />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Duplicate module</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <div className='flex items-center gap-2'>
                      <Label htmlFor={`visible-${module.id}`} className='text-sm'>
                        Show in Editor
                      </Label>
                      <Switch
                        id={`visible-${module.id}`}
                        checked={module.visibleInEditor}
                        onCheckedChange={() => handleToggleVisibility(module)}
                      />
                    </div>

                    <AlertDialog open={moduleToDelete === module.id} onOpenChange={(open) => !open && setModuleToDelete(null)}>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant='destructive' 
                          size='icon'
                          onClick={() => setModuleToDelete(module.id)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Module</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this module? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteModule(module.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue='basic'>
                  <TabsList>
                    <TabsTrigger value='basic'>Basic Properties</TabsTrigger>
                    <TabsTrigger value='advanced'>Advanced</TabsTrigger>
                  </TabsList>

                  <TabsContent value='basic' className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={module.name}
                          onChange={(e) => handleUpdateModule(module.id, { name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Color</Label>
                        <div className='flex gap-2'>
                          <Input
                            type='color'
                            value={module.color}
                            onChange={(e) => handleUpdateModule(module.id, { color: e.target.value })}
                            className='w-12 h-12 p-1'
                          />
                          <Input
                            value={module.color}
                            onChange={(e) => handleUpdateModule(module.id, { color: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className='col-span-2'>
                        <Label>Description</Label>
                        <Input
                          value={module.description}
                          onChange={(e) => handleUpdateModule(module.id, { description: e.target.value })}
                        />
                      </div>
                      <div className='col-span-2'>
                        <Label>Dimensions (meters)</Label>
                        <div className='grid grid-cols-3 gap-2'>
                          {Object.entries(module.dimensions).map(([key, value]) => (
                            <div key={key}>
                              <Label className='text-xs'>{key.charAt(0).toUpperCase() + key.slice(1)}</Label>
                              <Input
                                type='number'
                                value={value}
                                onChange={(e) => handleUpdateModule(module.id, {
                                  dimensions: {
                                    ...module.dimensions,
                                    [key]: parseFloat(e.target.value) || 0
                                  }
                                })}
                                step={0.1}
                                min={0.1}
                                required
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value='advanced' className='space-y-4'>
                    <div className='grid gap-4'>
                      <div>
                        <Label>Connection Points</Label>
                        <div className='text-sm text-muted-foreground'>
                          Connection point management coming soon
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                {isSaving === module.id && (
                  <div className='absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center'>
                    <div className='flex flex-col items-center gap-2'>
                      <Loader2 className='h-8 w-8 animate-spin' />
                      <p>Saving changes...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}