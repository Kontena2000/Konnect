import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Loader2, Box } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Module } from "@/types/module";
import { ConnectionType, ConnectionPoint } from "@/types/connection";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";
import moduleService from "@/services/module";

interface CreateModuleDialogProps {
  onModuleCreate: (module: Module) => Promise<void>;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface FormData {
  name: string;
  description: string;
  category: string;
  type: string; // Add type property to FormData interface
  color: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  connectionPoints: Array<{
    position: [number, number, number];
    type: ConnectionType;
  }>;
  visibleInEditor: boolean;
}

export function CreateModuleDialog({ 
  onModuleCreate, 
  isOpen: propIsOpen, 
  onOpenChange: propOnOpenChange 
}: CreateModuleDialogProps) {
  const [isOpen, setIsOpen] = useState(propIsOpen || false);
  const [categories, setCategories] = useState<{ id: string; name: string; }[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category: 'basic',
    type: 'module', // Initialize type property
    color: '#808080',
    dimensions: {
      length: 1,
      width: 1,
      height: 1
    },
    connectionPoints: [],
    visibleInEditor: true
  });
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (propOnOpenChange) {
      propOnOpenChange(open);
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
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
    };
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen, toast]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'basic',
      type: 'module', // Reset type property
      color: '#808080',
      dimensions: {
        length: 1,
        width: 1,
        height: 1
      },
      connectionPoints: [],
      visibleInEditor: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const moduleId = nanoid();
      
      // Convert form connection points to proper ConnectionPoint objects
      const connectionPoints: ConnectionPoint[] = formData.connectionPoints.map((point, index) => ({
        id: `${moduleId}-conn-${index}`,
        moduleId: moduleId,
        side: "north", // Default side
        types: [point.type],
        position: point.position,
        isInput: true,
        isOutput: false
      }));
      
      const newModule: Module = {
        id: moduleId,
        name: formData.name,
        description: formData.description || '',
        category: formData.category,
        type: formData.type,
        color: formData.color,
        dimensions: {
          length: parseFloat(formData.dimensions.length.toString()),
          width: parseFloat(formData.dimensions.width.toString()),
          height: parseFloat(formData.dimensions.height.toString())
        },
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        connectionPoints: connectionPoints.map(cp => ({
          id: cp.id,
          type: cp.type || '',
          position: cp.position
        })),
        visibleInEditor: formData.visibleInEditor
      };

      await onModuleCreate(newModule);
      onOpenChange(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Module created successfully'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create module'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddConnectionPoint = () => {
    setFormData((prev: FormData) => ({
      ...prev,
      connectionPoints: [
        ...prev.connectionPoints,
        {
          position: [0, 0, 0],
          type: "power"
        }
      ]
    }));
  };

  const handleRemoveConnectionPoint = (index: number) => {
    setFormData((prev: FormData) => ({
      ...prev,
      connectionPoints: prev.connectionPoints.filter((_, i) => i !== index)
    }));
  };

  const handleConnectionPointChange = (index: number, field: "position" | "type", value: any) => {
    setFormData((prev: FormData) => ({
      ...prev,
      connectionPoints: prev.connectionPoints.map((point, i) => {
        if (i === index) {
          if (field === "position") {
            const [axis, val] = value;
            const newPosition = [...point.position] as [number, number, number];
            newPosition[axis] = parseFloat(val) || 0;
            return { ...point, position: newPosition };
          }
          return { ...point, [field]: value };
        }
        return point;
      })
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Module
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create New Module</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div>
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
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

              <div>
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <Label>Dimensions (meters)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["length", "width", "height"] as const).map((dim) => (
                    <div key={dim}>
                      <Label className="text-xs">{dim.charAt(0).toUpperCase() + dim.slice(1)}</Label>
                      <Input
                        type="number"
                        value={formData.dimensions[dim]}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          dimensions: {
                            ...prev.dimensions,
                            [dim]: parseFloat(e.target.value) || 0
                          }
                        }))}
                        step={0.1}
                        min={0.1}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Connection Points</Label>
                <div className="space-y-4 border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                  {formData.connectionPoints.map((point, index) => (
                    <div key={index} className="space-y-2 p-2 border rounded-lg relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => handleRemoveConnectionPoint(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      
                      <div className="grid grid-cols-3 gap-2">
                        {["X", "Y", "Z"].map((axis, i) => (
                          <div key={axis}>
                            <Label className="text-xs">{axis}</Label>
                            <Input
                              type="number"
                              value={point.position[i]}
                              onChange={(e) => handleConnectionPointChange(index, "position", [i, e.target.value])}
                              step={0.1}
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <Label>Type</Label>
                        <Select
                          value={point.type}
                          onValueChange={(value: ConnectionType) => handleConnectionPointChange(index, "type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="power">Power</SelectItem>
                            <SelectItem value="network">Network</SelectItem>
                            <SelectItem value="cooling">Cooling</SelectItem>
                            <SelectItem value="water">Water</SelectItem>
                            <SelectItem value="gas">Gas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddConnectionPoint}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Connection Point
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg p-4 h-[200px] flex items-center justify-center bg-muted">
                <div className="text-center text-muted-foreground">
                  <Box className="h-16 w-16 mx-auto mb-2" />
                  <p>Module Preview</p>
                  <p className="text-xs">(Coming soon)</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Module"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}