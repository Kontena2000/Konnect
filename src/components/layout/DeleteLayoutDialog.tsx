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
import { LoadingDialog } from "@/components/ui/loading-dialog";

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
  const [showLoadingDialog, setShowLoadingDialog] = useState(false);
  
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
      setShowLoadingDialog(true);
      setOpen(false); // Close the confirmation dialog
      
      console.log(`Attempting to delete layout: ${layoutId} (${layoutName})`);
      
      await layoutService.deleteLayout(layoutId, user as AuthUser);
      
      toast({
        title: 'Success',
        description: 'Layout deleted successfully'
      });
      
      if (onDeleteComplete) {
        onDeleteComplete();
      }
    } catch (error) {
      console.error('Error deleting layout:', error);
      
      // Extract more specific error message if available
      let errorMessage = 'Failed to delete layout';
      
      if (error instanceof Error) {
        if ('code' in error && typeof (error as any).code === 'string') {
          const errorCode = (error as any).code;
          
          // Provide more user-friendly error messages based on error code
          switch (errorCode) {
            case 'UNAUTHORIZED':
              errorMessage = 'You do not have permission to delete this layout';
              break;
            case 'PERMISSION_DENIED':
              errorMessage = 'You have access to this project but not permission to delete layouts';
              break;
            case 'NOT_FOUND':
              errorMessage = 'Layout not found. It may have been already deleted';
              break;
            case 'PROJECT_NOT_FOUND':
              errorMessage = 'The project associated with this layout was not found';
              break;
            case 'DELETE_OPERATION_FAILED':
              errorMessage = 'Database operation failed. Please try again later';
              break;
            default:
              errorMessage = `Failed to delete layout: ${error.message}`;
          }
        } else {
          errorMessage = `Failed to delete layout: ${error.message}`;
        }
      }
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      });
    } finally {
      setDeleting(false);
      setShowLoadingDialog(false);
    }
  };
  
  return (
    <>
      {/* Loading dialog that appears during deletion process */}
      <LoadingDialog 
        open={showLoadingDialog} 
        title='Deleting Layout' 
        description={`Please wait while we delete the layout '${layoutName}'...`}
      />
      
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
    </>
  );
}