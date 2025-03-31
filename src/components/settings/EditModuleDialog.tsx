import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Module } from "@/types/module";
import { Edit2, Loader2 } from "lucide-react";
import moduleService from "@/services/module";
import { useToast } from "@/hooks/use-toast";

interface EditModuleDialogProps {
  module: Module;
  onModuleUpdate: (data: Partial<Module>) => Promise<void>;
  categories: { id: string; name: string; }[];
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit?: (updatedModule: Module) => Promise<void>;
}

export function EditModuleDialog({ 
  module, 
  onModuleUpdate, 
  categories, 
  isOpen = false, 
  onClose = () => {}, 
  onSubmit
}: EditModuleDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(isOpen);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: module.name,
    description: module.description,
    category: module.category,
    color: module.color,
    dimensions: {
      length: module.dimensions.length,
      width: module.dimensions.width,
      height: module.dimensions.height
    }
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isDialogOpen) {
      // Reset form data when dialog opens
      setFormData({
        name: module.name,
        description: module.description,
        category: module.category,
        color: module.color,
        dimensions: {
          length: module.dimensions.length,
          width: module.dimensions.width,
          height: module.dimensions.height
        }
      });
    }
  }, [isDialogOpen, module]);

  const handleDimensionChange = (key: keyof typeof formData.dimensions, value: string) => {
    const numValue = Math.max(0.1, parseFloat(value) || 0);
    setFormData(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [key]: numValue
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const updatedModule: Module = {
        ...module,
        ...formData
      };
      
      if (onSubmit) {
        await onSubmit(updatedModule);
      } else {
        await onModuleUpdate(formData);
      }
      
      setIsDialogOpen(false);
      if (onClose) onClose();
      
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
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity'
        onClick={() => setIsDialogOpen(true)}
      >
        <Edit2 className='h-4 w-4' />
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open && onClose) onClose();
      }}>
        <DialogContent className='max-w-2xl'>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Module</DialogTitle>
              <DialogDescription>
                Update the module's properties. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Dimensions (meters)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(formData.dimensions) as Array<keyof typeof formData.dimensions>).map((key) => (
                    <div key={key}>
                      <Label className="text-xs">{key.charAt(0).toUpperCase() + key.slice(1)}</Label>
                      <Input
                        type="number"
                        value={formData.dimensions[key]}
                        onChange={(e) => handleDimensionChange(key, e.target.value)}
                        step={0.1}
                        min={0.1}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}