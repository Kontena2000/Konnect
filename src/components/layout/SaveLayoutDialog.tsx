
import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { ProjectSelector } from "@/components/common/ProjectSelector";
import layoutService from "@/services/layout";

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
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  const handleSave = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to save layouts'
      });
      return;
    }
    
    if (!selectedProjectId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a project to save to'
      });
      return;
    }
    
    try {
      setSaving(true);
      
      // Prepare layout data
      const saveData = {
        ...layoutData,
        projectId: selectedProjectId,
        name: name || 'Untitled Layout',
        description: description || `Created on ${new Date().toLocaleDateString()}`,
        modules: layoutData.modules || [],
        connections: layoutData.connections || []
      };
      
      // Save or update layout
      let layoutId;
      if (layoutData.id) {
        // Update existing layout
        await layoutService.updateLayout(layoutData.id, saveData);
        layoutId = layoutData.id;
      } else {
        // Create new layout
        layoutId = await layoutService.createLayout(saveData);
      }
      
      toast({
        title: 'Success',
        description: 'Layout saved successfully'
      });
      
      if (onSaveComplete && layoutId) {
        onSaveComplete(layoutId);
      }
      
      setOpen(false);
      
    } catch (error) {
      console.error('Error saving layout:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save layout'
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save Layout</DialogTitle>
          <DialogDescription>
            Save this layout to a project for future reference.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="project">Project</Label>
            <ProjectSelector
              selectedProjectId={selectedProjectId}
              onSelect={setSelectedProjectId}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Layout name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Layout description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Layout"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
