import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Loader2, Box } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Module, ModuleCategory } from "@/types/module";
import { ConnectionType } from "@/types/connection";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";

interface CreateModuleDialogProps {
  onModuleCreate: (module: Module) => Promise<void>;
}

interface FormData {
  name: string;
  description: string;
  category: ModuleCategory;
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

export function CreateModuleDialog({ onModuleCreate }: CreateModuleDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category: ModuleCategory.Basic,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const moduleId = nanoid();
      const newModule: Module = {
        id: moduleId,
        type: 'basic', // Add type field
        ...formData,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };

      await onModuleCreate(newModule);
      setIsOpen(false);
      setFormData({
        name: '',
        description: '',
        category: ModuleCategory.Basic,
        color: '#808080',
        dimensions: {
          length: 1,
          width: 1,
          height: 1
        },
        connectionPoints: [],
        visibleInEditor: true
      });
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
    setFormData(prev => ({
      ...prev,
      connectionPoints: [
        ...prev.connectionPoints,
        {
          position: [0, 0, 0],
          type: "cat6a"
        }
      ]
    }));
  };

  const handleRemoveConnectionPoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      connectionPoints: prev.connectionPoints.filter((_, i) => i !== index)
    }));
  };

  const handleConnectionPointChange = (index: number, field: "position" | "type", value: any) => {
    setFormData(prev => ({
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                  onValueChange={(value: ModuleCategory) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ModuleCategory).map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
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
                            <SelectItem value="208v-3phase">208V 3-Phase Power</SelectItem>
                            <SelectItem value="400v-3phase">400V 3-Phase Power</SelectItem>
                            <SelectItem value="cat6a">CAT6A Network</SelectItem>
                            <SelectItem value="om4">OM4 Fiber</SelectItem>
                            <SelectItem value="chilled-water">Chilled Water</SelectItem>
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