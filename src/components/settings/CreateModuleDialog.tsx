import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ChromePicker } from "react-color";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ModuleTemplate, ModuleDimensions } from "@/types/module";
import moduleService from "@/services/module";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Plus } from "lucide-react";

interface CreateModuleDialogProps {
  onModuleCreated?: () => void;
  categories?: { id: string; name: string }[];
}

export function CreateModuleDialog({ onModuleCreated, categories = [] }: CreateModuleDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState<{
    name: string;
    type: string;
    category: string;
    description: string;
    color: string;
    dimensions: {
      width: number;
      height: number;
      depth: number;
    };
  }>({
    name: "",
    type: "",
    category: "",
    description: "",
    color: "#8884d8",
    dimensions: {
      width: 1,
      height: 1,
      depth: 1,
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleColorChange = (color: { hex: string }) => {
    setFormData((prev) => ({
      ...prev,
      color: color.hex,
    }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create modules",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name || !formData.type || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      // Create module template
      const moduleTemplate: ModuleTemplate = {
        id: formData.type.toLowerCase().replace(/\s+/g, "-"),
        name: formData.name,
        type: formData.type.toLowerCase(),
        category: formData.category,
        description: formData.description,
        color: formData.color,
        dimensions: {
          width: parseFloat(formData.dimensions.width.toString()),
          height: parseFloat(formData.dimensions.height.toString()),
          depth: parseFloat(formData.dimensions.depth.toString())
        },
        connectionPoints: [],
      };

      // Save module to Firestore
      await moduleService.createModule(moduleTemplate, user.uid);

      toast({
        title: "Success",
        description: "Module created successfully",
      });

      // Reset form
      setFormData({
        name: "",
        type: "",
        category: "",
        description: "",
        color: "#8884d8",
        dimensions: {
          width: 1,
          height: 1,
          depth: 1,
        },
      });

      // Close dialog
      setOpen(false);

      // Callback
      if (onModuleCreated) {
        onModuleCreated();
      }
    } catch (error) {
      console.error("Error creating module:", error);
      toast({
        title: "Error",
        description: "Failed to create module",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black">
          <Plus className="mr-2 h-4 w-4" />
          Create Module
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Module</DialogTitle>
          <DialogDescription>
            Add a new module to your library. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Module Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Standard Rack"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Module Type</Label>
              <Input
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                placeholder="e.g. rack"
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='category'>Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleSelectChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select a category' />
              </SelectTrigger>
              <SelectContent>
                {categories && categories.length > 0 ? (
                  categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the module..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dimensions.width">Width (m)</Label>
              <Input
                id="dimensions.width"
                name="dimensions.width"
                type="number"
                step="0.1"
                min="0.1"
                value={formData.dimensions.width}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dimensions.height">Height (m)</Label>
              <Input
                id="dimensions.height"
                name="dimensions.height"
                type="number"
                step="0.1"
                min="0.1"
                value={formData.dimensions.height}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dimensions.depth">Depth (m)</Label>
              <Input
                id="dimensions.depth"
                name="dimensions.depth"
                type="number"
                step="0.1"
                min="0.1"
                value={formData.dimensions.depth}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-2">
              <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[100px] h-[36px] border-2"
                    style={{ backgroundColor: formData.color }}
                  />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-none">
                  <ChromePicker
                    color={formData.color}
                    onChange={handleColorChange}
                    disableAlpha
                  />
                </PopoverContent>
              </Popover>
              <Input
                id="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="font-mono"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Module"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}