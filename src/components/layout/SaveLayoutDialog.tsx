import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle } from "lucide-react";
import { ProjectSelector } from "@/components/common/ProjectSelector";
import layoutService, { Layout } from "@/services/layout";
import { AuthUser } from "@/services/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SaveLayoutDialogProps {
  layoutData: {
    id?: string;
    projectId: string;
    name?: string;
    description?: string;
    modules?: any[];
    connections?: any[];
  };
  onSaveComplete?: (layoutId: string) => void;
  trigger: React.ReactNode;
}

export function SaveLayoutDialog({ 
  layoutData, 
  onSaveComplete, 
  trigger 
}: SaveLayoutDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(layoutData.name || '');
  const [description, setDescription] = useState(layoutData.description || '');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(layoutData.projectId || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Update form values when layoutData changes or dialog opens
  useEffect(() => {
    if (open) {
      setName(layoutData.name || '');
      setDescription(layoutData.description || '');
      setSelectedProjectId(layoutData.projectId || '');
      setError(null);
    }
  }, [layoutData, open]);
  
  const validateForm = () => {
    if (!user) {
      setError('You must be logged in to save layouts');
      return false;
    }
    
    if (!selectedProjectId) {
      setError('Please select a project to save to');
      return false;
    }
    
    if (!name.trim()) {
      setError('Please enter a name for your layout');
      return false;
    }
    
    return true;
  };

  // Validate modules and connections
  const validateData = () => {
    // Check if modules is an array
    if (layoutData.modules && !Array.isArray(layoutData.modules)) {
      setError('Invalid modules data format');
      return false;
    }
    
    // Check if connections is an array
    if (layoutData.connections && !Array.isArray(layoutData.connections)) {
      setError('Invalid connections data format');
      return false;
    }
    
    return true;
  };
  
  const handleSave = async () => {
    setError(null);
    
    if (!validateForm() || !validateData()) {
      return;
    }
    
    try {
      setSaving(true);
      
      // Prepare layout data
      const saveData = {
        ...layoutData,
        projectId: selectedProjectId,
        name: name.trim(),
        description: description || `Created on ${new Date().toLocaleDateString()}`,
        modules: layoutData.modules || [],
        connections: layoutData.connections || []
      };
      
      console.log('Saving layout with data:', { 
        ...saveData, 
        modules: saveData.modules?.length || 0, 
        connections: saveData.connections?.length || 0 
      });
      
      // Save or update layout
      let layoutId;
      if (layoutData.id && layoutData.projectId === selectedProjectId) {
        // Update existing layout if we're saving to the same project
        try {
          await layoutService.updateLayout(layoutData.id, saveData, user as AuthUser);
          layoutId = layoutData.id;
          console.log('Layout updated successfully:', layoutId);
          toast({
            title: 'Success',
            description: 'Layout updated successfully'
          });
        } catch (updateError) {
          console.error('Error updating layout:', updateError);
          throw new Error(updateError instanceof Error ? updateError.message : 'Failed to update layout');
        }
      } else {
        // Create new layout if it's a new layout or we're saving to a different project
        try {
          layoutId = await layoutService.createLayout(saveData as Omit<Layout, 'id' | 'createdAt' | 'updatedAt'>);
          console.log('New layout created successfully:', layoutId);
          toast({
            title: 'Success',
            description: 'New layout created successfully'
          });
        } catch (createError) {
          console.error('Error creating layout:', createError);
          throw new Error(createError instanceof Error ? createError.message : 'Failed to create new layout');
        }
      }
      
      if (onSaveComplete && layoutId) {
        onSaveComplete(layoutId);
      }
      
      setOpen(false);
      
    } catch (error) {
      console.error('Error saving layout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save layout';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Save Layout</DialogTitle>
          <DialogDescription>
            Save this layout to a project for future reference.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant='destructive' className='mt-2'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <Label htmlFor='project'>Project</Label>
            <ProjectSelector
              selectedProjectId={selectedProjectId}
              onSelect={setSelectedProjectId}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='name'>Name</Label>
            <Input
              id='name'
              placeholder='Layout name'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              placeholder='Layout description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !name.trim() || !selectedProjectId}
            className='bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black'
          >
            {saving ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Saving...
              </>
            ) : (
              'Save Layout'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}