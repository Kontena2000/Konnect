import { useState, useEffect } from 'react';
import { Layout } from "@/services/layout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Settings, Loader2, Trash2 } from "lucide-react";
import layoutService from "@/services/layout";
import { useToast } from "@/hooks/use-toast";
import { DeleteLayoutDialog } from './DeleteLayoutDialog';
import { useAuth } from "@/contexts/AuthContext";

interface LayoutSelectorProps {
  projectId: string;
  layouts: Layout[];
  currentLayout: Layout | null;
  onLayoutChange: (layout: Layout) => void;
  onLayoutCreate: (layout: Layout) => void;
  onDeleteComplete?: () => void;
}

export function LayoutSelector({
  projectId,
  layouts,
  currentLayout,
  onLayoutChange,
  onLayoutCreate,
  onDeleteComplete
}: LayoutSelectorProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState("");
  const [newLayoutDescription, setNewLayoutDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isCreateOpen) {
      setNewLayoutName("");
      setNewLayoutDescription("");
    }
  }, [isCreateOpen]);

  const handleCreateLayout = async () => {
    if (!newLayoutName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a name for your layout'
      });
      return;
    }

    try {
      setIsCreating(true);
      const layoutId = await layoutService.createLayout({
        projectId,
        name: newLayoutName,
        description: newLayoutDescription,
        modules: [],
        connections: []
      });

      const newLayout = await layoutService.getLayout(layoutId);
      if (newLayout) {
        onLayoutCreate(newLayout);
        setIsCreateOpen(false);
        toast({
          title: 'Success',
          description: 'New layout created successfully'
        });
      }
    } catch (error) {
      console.error('Error creating layout:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create layout'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteComplete = async () => {
    try {
      // Call parent's onDeleteComplete if provided
      if (onDeleteComplete) {
        onDeleteComplete();
      } else {
        // Fallback: refresh layouts after deletion
        const updatedLayouts = await layoutService.getProjectLayouts(projectId);
        
        // If the current layout was deleted, select another one if available
        if (currentLayout && !updatedLayouts.some(l => l.id === currentLayout.id)) {
          if (updatedLayouts.length > 0) {
            onLayoutChange(updatedLayouts[0]);
          } else {
            // No layouts left, create empty state
            onLayoutChange({
              id: '',
              projectId,
              name: '',
              modules: [],
              connections: [],
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      }
      
      toast({
        title: 'Success',
        description: 'Layout deleted successfully'
      });
    } catch (error) {
      console.error('Error refreshing layouts after deletion:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to refresh layouts'
      });
    }
  };

  return (
    <div className='flex items-center gap-2'>
      <Select
        value={currentLayout?.id || ''}
        onValueChange={(value) => {
          const layout = layouts.find((l) => l.id === value);
          if (layout) onLayoutChange(layout);
        }}
      >
        <SelectTrigger className='w-[200px]'>
          <SelectValue placeholder='Select layout' />
        </SelectTrigger>
        <SelectContent>
          {layouts.length === 0 ? (
            <div className='p-2 text-sm text-muted-foreground text-center'>
              No layouts found
            </div>
          ) : (
            layouts.map((layout) => (
              <SelectItem key={layout.id} value={layout.id} className='flex justify-between items-center'>
                <span>{layout.name}</span>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button variant='outline' size='icon' title='Create new layout'>
            <Plus className='h-4 w-4' />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Layout</DialogTitle>
            <DialogDescription>
              Create a new layout for your project
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='name'>Name</Label>
              <Input
                id='name'
                value={newLayoutName}
                onChange={(e) => setNewLayoutName(e.target.value)}
                placeholder='Layout name'
              />
            </div>
            <div>
              <Label htmlFor='description'>Description</Label>
              <Input
                id='description'
                value={newLayoutDescription}
                onChange={(e) => setNewLayoutDescription(e.target.value)}
                placeholder='Layout description (optional)'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateLayout} 
              disabled={isCreating || !newLayoutName.trim()}
              className='bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black'
            >
              {isCreating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating...
                </>
              ) : (
                'Create Layout'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {currentLayout?.id && (
        <DeleteLayoutDialog 
          layoutId={currentLayout.id}
          layoutName={currentLayout.name}
          onDeleteComplete={handleDeleteComplete}
        />
      )}
    </div>
  );
}