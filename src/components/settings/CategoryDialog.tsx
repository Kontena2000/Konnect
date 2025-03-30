import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderPlus, Loader2 } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { getIdTokenResult } from 'firebase/auth';

interface CategoryDialogProps {
  onSubmit: (data: { id: string; name: string }) => Promise<void>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryDialog({ onSubmit, isOpen, onOpenChange }: CategoryDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      if (!user) {
        console.error('No user logged in');
        setError('You must be logged in to create categories');
        return;
      }

      const tokenResult = await getIdTokenResult(user, true);
      console.log('User token claims:', tokenResult.claims);
      console.log('Creating category as user:', user.email, 'Role:', tokenResult.claims.role);

      const trimmedName = name.trim();
      if (!trimmedName) {
        setError('Category name is required');
        return;
      }

      if (trimmedName.length < 2) {
        setError('Category name must be at least 2 characters');
        return;
      }

      const id = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      console.log('Submitting category:', { id, name: trimmedName });
      await onSubmit({ id, name: trimmedName });
      console.log('Category created successfully');
      onOpenChange(false);
      setName('');
      setError(null);
    } catch (error) {
      console.error('Error creating category:', error);
      setError(error instanceof Error ? error.message : 'Failed to create category');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>Create a new category for organizing modules.</DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label>Category Name</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder='Enter category name'
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className='text-sm text-red-500'>{error}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isLoading || !name.trim()}>
            {isLoading ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                Creating...
              </>
            ) : (
              'Create Category'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}