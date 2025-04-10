import { useState } from 'react';
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Trash2 } from "lucide-react";
import layoutService from "@/services/layout";
import { AuthUser } from "@/services/auth";

interface DeleteLayoutDialogProps {
  layoutId: string;
  layoutName: string;
  onDeleteComplete?: () => void;
  trigger?: React.ReactNode;
}

export function DeleteLayoutDialog({ 
  layoutId, 
  layoutName,
  onDeleteComplete, 
  trigger 
}: DeleteLayoutDialogProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  const handleDelete = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to delete layouts'
      });
      return;
    }
    
    try {
      setDeleting(true);
      
      await layoutService.deleteLayout(layoutId, user as AuthUser);
      
      toast({
        title: 'Success',
        description: 'Layout deleted successfully'
      });
      
      if (onDeleteComplete) {
        onDeleteComplete();
      }
      
      setOpen(false);
    } catch (error) {
      console.error('Error deleting layout:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete layout'
      });
    } finally {
      setDeleting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="destructive" 
            size="icon"
            title="Delete layout"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Layout</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the layout "{layoutName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Layout"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}