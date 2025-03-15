import { useState, useEffect } from "react";
import { ModuleTemplateWithSpecs, TechnicalSpecs } from '@/services/module';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Minus, Save, Trash2, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import moduleService, { getDefaultSpecs } from '@/services/module';
import { ModuleCategory, moduleTemplates, ModuleTemplate } from '@/types/module';
import { ConnectionType } from '@/types/connection';
import { auth } from '@/lib/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { nanoid } from "nanoid";

interface CreateModuleFormData {
  name: string;
  description: string;
  category: ModuleCategory;
  color: string;
  dimensions: [number, number, number];
  connectionPoints: Array<{
    position: [number, number, number];
    type: ConnectionType;
  }>;
}

interface ModuleFormProps {
  module: ModuleTemplateWithSpecs;
  onUpdate: (id: string, data: Partial<ModuleTemplateWithSpecs>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function CreateModuleDialog({ onModuleCreate }: { onModuleCreate: (module: ModuleTemplateWithSpecs) => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<CreateModuleFormData>({
    name: "",
    description: "",
    category: "konnect",
    color: "#808080",
    dimensions: [1, 1, 1],
    connectionPoints: []
  });
  const [connectionPoints, setConnectionPoints] = useState<Array<{
    position: [number, number, number];
    type: ConnectionType;
  }>>([]);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleAddConnectionPoint = () => {
    setConnectionPoints(prev => [...prev, {
      position: [0, 0, 0],
      type: 'cat6a'
    }]);
  };

  const handleRemoveConnectionPoint = (index: number) => {
    setConnectionPoints(prev => prev.filter((_, i) => i !== index));
  };

  const handleConnectionPointChange = (index: number, field: 'position' | 'type', value: any) => {
    setConnectionPoints(prev => prev.map((point, i) => {
      if (i === index) {
        if (field === 'position') {
          const [axis, val] = value;
          const newPosition = [...point.position];
          newPosition[axis] = parseFloat(val) || 0;
          return { ...point, position: newPosition as [number, number, number] };
        }
        return { ...point, [field]: value };
      }
      return point;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const moduleId = nanoid();
      const newModule: ModuleTemplateWithSpecs = {
        id: moduleId,
        type: moduleId,
        ...formData,
        technicalSpecs: getDefaultSpecs(formData.category),
        connectionPoints
      };

      await onModuleCreate(newModule);
      setIsOpen(false);
      toast({
        title: "Success",
        description: "Module created successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create module"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Module
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Module</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value: ModuleCategory) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="konnect">Konnect Modules</SelectItem>
                <SelectItem value="power">Power Cables</SelectItem>
                <SelectItem value="network">Network Cables</SelectItem>
                <SelectItem value="cooling">Cooling Tubes</SelectItem>
                <SelectItem value="environment">Environment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
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

          <div className="space-y-2">
            <Label>Dimensions (meters)</Label>
            <div className="grid grid-cols-3 gap-2">
              {["Length", "Width", "Height"].map((dim, i) => (
                <div key={dim}>
                  <Label className="text-xs">{dim}</Label>
                  <Input
                    type="number"
                    value={formData.dimensions[i]}
                    onChange={(e) => {
                      const newDimensions = [...formData.dimensions];
                      newDimensions[i] = parseFloat(e.target.value) || 0;
                      setFormData(prev => ({ ...prev, dimensions: newDimensions as [number, number, number] }));
                    }}
                    step={0.1}
                    min={0.1}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className='space-y-2'>
            <Label>Connection Points</Label>
            <div className='space-y-4'>
              {connectionPoints.map((point, index) => (
                <div key={index} className='space-y-2 p-2 border rounded-lg relative'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='absolute top-2 right-2'
                    onClick={() => handleRemoveConnectionPoint(index)}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                  
                  <div className='grid grid-cols-3 gap-2'>
                    {['X', 'Y', 'Z'].map((axis, i) => (
                      <div key={axis}>
                        <Label className='text-xs'>{axis}</Label>
                        <Input
                          type='number'
                          value={point.position[i]}
                          onChange={(e) => handleConnectionPointChange(index, 'position', [i, e.target.value])}
                          step={0.1}
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label>Type</Label>
                    <Select
                      value={point.type}
                      onValueChange={(value: ConnectionType) => handleConnectionPointChange(index, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='208v-3phase'>208V 3-Phase Power</SelectItem>
                        <SelectItem value='400v-3phase'>400V 3-Phase Power</SelectItem>
                        <SelectItem value='cat6a'>CAT6A Network</SelectItem>
                        <SelectItem value='om4'>OM4 Fiber</SelectItem>
                        <SelectItem value='chilled-water'>Chilled Water</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}

              <Button
                type='button'
                variant='outline'
                onClick={handleAddConnectionPoint}
                className='w-full'
              >
                <Plus className='h-4 w-4 mr-2' />
                Add Connection Point
              </Button>
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

function ModuleForm({ module, onUpdate, onDelete }: ModuleFormProps) {
  const [specs, setSpecs] = useState<TechnicalSpecs>(module.technicalSpecs);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleSpecsChange = (field: string, value: any) => {
    setSpecs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(module.id, { technicalSpecs: specs });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Module specifications updated"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update module specifications"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(module.id);
      toast({
        title: "Success",
        description: "Module deleted successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete module"
      });
      setIsDeleting(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{module.name}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              disabled={isSaving}
            >
              {isEditing ? "Cancel" : "Edit"}
            </Button>
            {isEditing && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="physical">
          <TabsList className="w-full">
            <TabsTrigger value="physical">Physical</TabsTrigger>
            <TabsTrigger value="power">Power</TabsTrigger>
            <TabsTrigger value="cooling">Cooling</TabsTrigger>
            <TabsTrigger value="connectivity">Connectivity</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="environmental">Environmental</TabsTrigger>
          </TabsList>

          <TabsContent value="physical" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Empty Weight (kg)</Label>
                <Input
                  type="number"
                  value={specs.weight.empty}
                  onChange={(e) => handleSpecsChange("weight.empty", parseFloat(e.target.value))}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label>Loaded Weight (kg)</Label>
                <Input
                  type="number"
                  value={specs.weight.loaded}
                  onChange={(e) => handleSpecsChange("weight.loaded", parseFloat(e.target.value))}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label>Rack Units</Label>
                <Input
                  type="number"
                  value={specs.formFactor.rackUnits}
                  onChange={(e) => handleSpecsChange("formFactor.rackUnits", parseFloat(e.target.value))}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label>Containment Type</Label>
                <Input
                  value={specs.formFactor.containmentType}
                  onChange={(e) => handleSpecsChange("formFactor.containmentType", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="power" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Typical Power (W)</Label>
                <Input
                  type="number"
                  value={specs.powerConsumption.typical}
                  onChange={(e) => handleSpecsChange("powerConsumption.typical", parseFloat(e.target.value))}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label>Maximum Power (W)</Label>
                <Input
                  type="number"
                  value={specs.powerConsumption.maximum}
                  onChange={(e) => handleSpecsChange("powerConsumption.maximum", parseFloat(e.target.value))}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cooling" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Heat Output (BTU/hr)</Label>
                <Input
                  type="number"
                  value={specs.cooling.heatOutput.btu}
                  onChange={(e) => handleSpecsChange("cooling.heatOutput.btu", parseFloat(e.target.value))}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label>Heat Output (kW)</Label>
                <Input
                  type="number"
                  value={specs.cooling.heatOutput.kW}
                  onChange={(e) => handleSpecsChange("cooling.heatOutput.kW", parseFloat(e.target.value))}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export function ModuleDatabase() {
  const [modules, setModules] = useState<ModuleTemplateWithSpecs[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initializeModuleDatabase = async () => {
      try {
        if (!auth.currentUser) {
          throw new Error("Authentication required");
        }

        const existingModules = await moduleService.getAllModules();
        
        if (existingModules.length === 0) {
          const modulesToAdd = Object.values(moduleTemplates).flat().map(template => ({
            ...template,
            technicalSpecs: getDefaultSpecs(template.category)
          }));

          for (const moduleData of modulesToAdd) {
            await moduleService.createModule(moduleData);
          }

          toast({
            title: "Success",
            description: "Module database initialized with default modules"
          });
          
          const updatedModules = await moduleService.getAllModules();
          setModules(updatedModules);
        } else {
          setModules(existingModules);
        }
      } catch (error) {
        console.error("Error initializing module database:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to initialize module database"
        });
      } finally {
        setLoading(false);
      }
    };

    initializeModuleDatabase();
  }, [toast]);

  const handleCreateModule = async (moduleData: ModuleTemplateWithSpecs) => {
    try {
      await moduleService.createModule(moduleData);
      setModules(prev => [...prev, moduleData]);
    } catch (error) {
      console.error("Error creating module:", error);
      throw error;
    }
  };

  const handleUpdateModule = async (id: string, data: Partial<ModuleTemplateWithSpecs>) => {
    try {
      await moduleService.updateModule(id, data);
      setModules(prev => prev.map(module => 
        module.id === id ? { ...module, ...data } : module
      ));
    } catch (error) {
      console.error("Error updating module:", error);
      throw error;
    }
  };

  const handleDeleteModule = async (id: string) => {
    try {
      await moduleService.deleteModule(id);
      setModules(prev => prev.filter(module => module.id !== id));
    } catch (error) {
      console.error("Error deleting module:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Module Database</h2>
        <CreateModuleDialog onModuleCreate={handleCreateModule} />
      </div>
      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-4">
          {modules.map(module => (
            <ModuleForm
              key={module.id}
              module={module}
              onUpdate={handleUpdateModule}
              onDelete={handleDeleteModule}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}