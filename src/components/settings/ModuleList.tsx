import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Module } from '@/types/module';
import { Loader2, Edit, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditModuleDialog } from './EditModuleDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import moduleService from '@/services/module';
import { useToast } from '@/hooks/use-toast';

interface ModuleListProps {
  modules: Module[];
  loading: boolean;
  onModuleUpdated: () => Promise<void>;
  userRole?: string;
}

export function ModuleList({
  modules,
  loading,
  onModuleUpdated,
  userRole
}: ModuleListProps) {
  const [moduleToEdit, setModuleToEdit] = useState<Module | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleUpdateModule = async (updatedModule: Module) => {
    try {
      // Fix: Pass the module ID as the second argument
      await moduleService.updateModule(updatedModule, updatedModule.id);
      await onModuleUpdated();
      setShowEditDialog(false);
      toast({
        title: 'Success',
        description: 'Module updated successfully'
      });
    } catch (error) {
      console.error('Error updating module:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update module'
      });
    }
  };

  const handleDeleteModule = async (id: string) => {
    setIsDeleting(true);
    try {
      await moduleService.deleteModule(id);
      await onModuleUpdated();
      toast({
        title: 'Success',
        description: 'Module deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting module:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete module'
      });
    } finally {
      setIsDeleting(false);
      setModuleToDelete(null);
    }
  };

  const handleDuplicateModule = async (module: Module) => {
    try {
      const duplicatedModule: Module = {
        ...module,
        id: `${module.id}-copy-${Date.now()}`,
        name: `${module.name} (Copy)`,
      };
      await moduleService.createModule(duplicatedModule);
      await onModuleUpdated();
      toast({
        title: 'Success',
        description: 'Module duplicated successfully'
      });
    } catch (error) {
      console.error('Error duplicating module:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to duplicate module'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading modules...</span>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">No modules found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {modules.map((module) => (
          <Card key={module.id} className='overflow-hidden'>
            <CardContent className='p-4'>
              <div className='flex flex-col gap-2'>
                <h3 className='text-lg font-medium'>{module.name}</h3>
                <p className='text-sm text-muted-foreground line-clamp-2'>
                  {module.description || 'No description'}
                </p>
                <div className='flex justify-between items-center mt-2'>
                  {module.category && (
                    <Badge variant='secondary' className='text-xs'>
                      {module.category}
                    </Badge>
                  )}
                  <div className='flex gap-1'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => {
                        setModuleToEdit(module);
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleDuplicateModule(module)}
                    >
                      <Copy className='h-4 w-4' />
                    </Button>
                    <AlertDialog
                      open={moduleToDelete === module.id}
                      onOpenChange={(open) => !open && setModuleToDelete(null)}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => setModuleToDelete(module.id)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Module</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete '{module.name}'? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteModule(module.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {moduleToEdit && (
        <EditModuleDialog
          module={moduleToEdit}
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSubmit={handleUpdateModule}
          categories={[]} // Add the missing categories prop
          onModuleUpdate={async (data) => {
            // Add the missing onModuleUpdate prop
            await moduleService.updateModule({
              ...moduleToEdit,
              ...data
            });
            await onModuleUpdated();
          }}
        />
      )}
    </>
  );
}