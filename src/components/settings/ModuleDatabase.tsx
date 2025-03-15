import { useState, useEffect } from "react";
import { ModuleTemplateWithSpecs, TechnicalSpecs } from "@/services/module";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Minus, Save, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import moduleService from "@/services/module";
import { ModuleCategory, moduleTemplates, ModuleTemplate, ConnectionType } from '@/components/three/ModuleLibrary';
import { auth } from '@/lib/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ModuleFormProps {
  module: ModuleTemplateWithSpecs;
  onUpdate: (id: string, data: Partial<ModuleTemplateWithSpecs>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
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

  const handlePowerChange = (field: "watts" | "kWh", value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setSpecs(prev => ({
        ...prev,
        powerConsumption: {
          ...prev.powerConsumption,
          [field]: numValue
        }
      }));
    }
  };

  const handleWireConfigChange = (index: number, field: string, value: any) => {
    setSpecs(prev => ({
      ...prev,
      wireConfigurations: prev.wireConfigurations.map((config, i) => 
        i === index ? { ...config, [field]: value } : config
      )
    }));
  };

  const addWireConfig = () => {
    setSpecs(prev => ({
      ...prev,
      wireConfigurations: [
        ...prev.wireConfigurations,
        { type: "", gauge: "", length: 0 }
      ]
    }));
  };

  const removeWireConfig = (index: number) => {
    setSpecs(prev => ({
      ...prev,
      wireConfigurations: prev.wireConfigurations.filter((_, i) => i !== index)
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
    <Card className='mb-4'>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span>{module.name}</span>
          <div className='flex gap-2'>
            {/* Existing buttons */}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue='physical' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='physical'>Physical</TabsTrigger>
            <TabsTrigger value='power'>Power</TabsTrigger>
            <TabsTrigger value='cooling'>Cooling</TabsTrigger>
            <TabsTrigger value='connectivity'>Connectivity</TabsTrigger>
            <TabsTrigger value='performance'>Performance</TabsTrigger>
            <TabsTrigger value='environmental'>Environmental</TabsTrigger>
          </TabsList>

          <TabsContent value='physical' className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label>Empty Weight (kg)</Label>
                <Input
                  type='number'
                  value={specs.weight.empty}
                  onChange={(e) => handleSpecsChange('weight.empty', parseFloat(e.target.value))}
                  disabled={!isEditing || isSaving}
                />
              </div>
              <div>
                <Label>Loaded Weight (kg)</Label>
                <Input
                  type='number'
                  value={specs.weight.loaded}
                  onChange={(e) => handleSpecsChange('weight.loaded', parseFloat(e.target.value))}
                  disabled={!isEditing || isSaving}
                />
              </div>
              <div>
                <Label>Rack Units</Label>
                <Input
                  type='number'
                  value={specs.formFactor.rackUnits}
                  onChange={(e) => handleSpecsChange('formFactor.rackUnits', parseFloat(e.target.value))}
                  disabled={!isEditing || isSaving}
                />
              </div>
              <div>
                <Label>Containment Type</Label>
                <Input
                  value={specs.formFactor.containmentType}
                  onChange={(e) => handleSpecsChange('formFactor.containmentType', e.target.value)}
                  disabled={!isEditing || isSaving}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value='power' className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label>Typical Power (W)</Label>
                <Input
                  type='number'
                  value={specs.powerConsumption.typical}
                  onChange={(e) => handleSpecsChange('powerConsumption.typical', parseFloat(e.target.value))}
                  disabled={!isEditing || isSaving}
                />
              </div>
              <div>
                <Label>Maximum Power (W)</Label>
                <Input
                  type='number'
                  value={specs.powerConsumption.maximum}
                  onChange={(e) => handleSpecsChange('powerConsumption.maximum', parseFloat(e.target.value))}
                  disabled={!isEditing || isSaving}
                />
              </div>
              <div>
                <Label>Voltage Range</Label>
                <div className='flex gap-2'>
                  <Input
                    type='number'
                    placeholder='Min'
                    value={specs.powerConsumption.voltage.min}
                    onChange={(e) => handleSpecsChange('powerConsumption.voltage.min', parseFloat(e.target.value))}
                    disabled={!isEditing || isSaving}
                  />
                  <Input
                    type='number'
                    placeholder='Max'
                    value={specs.powerConsumption.voltage.max}
                    onChange={(e) => handleSpecsChange('powerConsumption.voltage.max', parseFloat(e.target.value))}
                    disabled={!isEditing || isSaving}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Similar TabsContent sections for cooling, connectivity, performance, and environmental */}
        </Tabs>
      </CardContent>
    </Card>
  );
}

export function ModuleDatabase() {
  const [modules, setModules] = useState<ModuleTemplateWithSpecs[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreateModule = async (moduleData: Omit<ModuleTemplateWithSpecs, 'id'>) => {
    try {
      await moduleService.createModule(moduleData);
      const updatedModules = await moduleService.getAllModules();
      setModules(updatedModules);
      toast({
        title: 'Success',
        description: 'New module created successfully'
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create module'
      });
    }
  };

  useEffect(() => {
    const initializeModuleDatabase = async () => {
      try {
        if (!auth.currentUser) {
          throw new Error('Authentication required');
        }

        const existingModules = await moduleService.getAllModules();
        
        if (existingModules.length === 0) {
          const modulesToAdd: Omit<ModuleTemplateWithSpecs, 'id'>[] = Object.entries(moduleTemplates)
            .flatMap(([category, templates]) => 
              templates.map(template => ({
                ...template,
                technicalSpecs: {
                  weight: template.category === 'konnect' ? 2500 : 
                         template.category === 'power' ? 5 :
                         template.category === 'network' ? 0.5 :
                         template.category === 'cooling' ? 2 : 10,
                  powerConsumption: {
                    watts: template.category === 'konnect' ? 15000 : 0,
                    kWh: template.category === 'konnect' ? 360 : 0
                  },
                  wireConfigurations: [
                    {
                      type: template.type,
                      gauge: template.category === 'power' ? 'AWG 8' : 
                             template.category === 'network' ? template.type : 'N/A',
                      length: template.category === 'konnect' ? 10 :
                              template.category === 'power' ? 5 :
                              template.category === 'network' ? 3 : 1
                    }
                  ]
                }
              }))
            );

          for (const moduleData of modulesToAdd) {
            await moduleService.createModule(moduleData);
          }

          toast({
            title: 'Success',
            description: 'Module database initialized with default modules'
          });
          
          // Fetch all modules after initialization
          const updatedModules = await moduleService.getAllModules();
          setModules(updatedModules);
        } else {
          setModules(existingModules);
        }
      } catch (error) {
        console.error('Error initializing module database:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to initialize module database'
        });
      } finally {
        setLoading(false);
      }
    };

    initializeModuleDatabase();
  }, [toast]);

  const handleUpdateModule = async (id: string, data: Partial<ModuleTemplateWithSpecs>) => {
    try {
      await moduleService.updateModule(id, data);
      setModules(prev => prev.map(module => 
        module.id === id ? { ...module, ...data } : module
      ));
    } catch (error) {
      console.error('Error updating module:', error);
      throw error;
    }
  };

  const handleDeleteModule = async (id: string) => {
    try {
      await moduleService.deleteModule(id);
      setModules(prev => prev.filter(module => module.id !== id));
    } catch (error) {
      console.error('Error deleting module:', error);
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
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h2 className='text-2xl font-bold'>Module Database</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='h-4 w-4 mr-2' />
              Create New Module
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Module</DialogTitle>
            </DialogHeader>
            <CreateModuleForm onSubmit={handleCreateModule} onCancel={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <ScrollArea className='h-[600px] pr-4'>
        <div className='space-y-4'>
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

interface CreateModuleFormProps {
  onSubmit: (data: Omit<ModuleTemplateWithSpecs, 'id'>) => Promise<void>;
  onCancel: () => void;
}

function CreateModuleForm({ onSubmit, onCancel }: CreateModuleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'konnect' as ModuleCategory,
    type: '',
    description: '',
    color: '#808080',
    dimensions: [1, 1, 1] as [number, number, number],
    connectionPoints: [] as Array<{
      position: [number, number, number];
      type: ConnectionType;
    }>,
    technicalSpecs: getDefaultSpecs('konnect')
  });

  const handleAddConnectionPoint = () => {
    setFormData(prev => ({
      ...prev,
      connectionPoints: [
        ...prev.connectionPoints,
        {
          position: [0, 0, 0],
          type: '208v-3phase' as ConnectionType
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

  const handleConnectionPointChange = (index: number, field: 'position' | 'type', value: any) => {
    setFormData(prev => ({
      ...prev,
      connectionPoints: prev.connectionPoints.map((point, i) => 
        i === index 
          ? { 
              ...point, 
              [field]: field === 'position' 
                ? value.map((v: string) => parseFloat(v) || 0) as [number, number, number]
                : value 
            }
          : point
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='space-y-2'>
        <Label>Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>
      
      <div className='space-y-2'>
        <Label>Category</Label>
        <Select
          value={formData.category}
          onValueChange={(value: ModuleCategory) => 
            setFormData(prev => ({ ...prev, category: value }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='konnect'>Konnect Modules</SelectItem>
            <SelectItem value='power'>Power Cables</SelectItem>
            <SelectItem value='network'>Network Cables</SelectItem>
            <SelectItem value='cooling'>Cooling Tubes</SelectItem>
            <SelectItem value='environment'>Environment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-2'>
        <Label>Color</Label>
        <Input
          type='color'
          value={formData.color}
          onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
        />
      </div>

      <div className='space-y-2'>
        <Label>Dimensions [Length, Height, Width]</Label>
        <div className='grid grid-cols-3 gap-2'>
          {['Length', 'Height', 'Width'].map((dim, i) => (
            <div key={dim}>
              <Label className='text-xs'>{dim}</Label>
              <Input
                type='number'
                value={formData.dimensions[i]}
                onChange={(e) => {
                  const newDims = [...formData.dimensions];
                  newDims[i] = parseFloat(e.target.value) || 0;
                  setFormData(prev => ({ ...prev, dimensions: newDims as [number, number, number] }));
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
        {formData.connectionPoints.map((point, index) => (
          <div key={index} className='space-y-2 p-2 border rounded'>
            <div className='grid grid-cols-3 gap-2'>
              {['X', 'Y', 'Z'].map((axis, i) => (
                <div key={axis}>
                  <Label className='text-xs'>{axis}</Label>
                  <Input
                    type='number'
                    value={point.position[i]}
                    onChange={(e) => {
                      const newPosition = [...point.position];
                      newPosition[i] = parseFloat(e.target.value) || 0;
                      handleConnectionPointChange(index, 'position', newPosition);
                    }}
                    step={0.1}
                  />
                </div>
              ))}
            </div>
            <div className='flex gap-2 items-end'>
              <div className='flex-1'>
                <Label>Type</Label>
                <Select
                  value={point.type}
                  onValueChange={(value: ConnectionType) => 
                    handleConnectionPointChange(index, 'type', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='208v-3phase'>208V 3-Phase</SelectItem>
                    <SelectItem value='400v-3phase'>400V 3-Phase</SelectItem>
                    <SelectItem value='cat6a'>CAT6A</SelectItem>
                    <SelectItem value='om4'>OM4 Fiber</SelectItem>
                    <SelectItem value='chilled-water'>Chilled Water</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type='button'
                variant='destructive',
                size='icon'
                onClick={() => handleRemoveConnectionPoint(index)}
              >
                <Minus className='h-4 w-4' />
              </Button>
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

      <div className='flex justify-end gap-2'>
        <Button variant='outline' onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              Creating...
            </>
          ) : (
            'Create Module'
          )}
        </Button>
      </div>
    </form>
  );
}