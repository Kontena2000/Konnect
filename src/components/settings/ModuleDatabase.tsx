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
import { ModuleCategory, moduleTemplates } from '@/components/three/ModuleLibrary';
import { auth } from '@/lib/firebase';

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
            <Button 
              variant='outline' 
              size='sm'
              onClick={() => setIsEditing(!isEditing)}
              disabled={isSaving || isDeleting}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
            {isEditing && (
              <Button 
                size='sm'
                onClick={handleSave}
                disabled={isSaving}
                className='bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black'
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className='h-4 w-4 mr-2' />
                    Save
                  </>
                )}
              </Button>
            )}
            <Button 
              variant='destructive' 
              size='sm'
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className='h-4 w-4' />
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Weight (kg)</Label>
              <Input
                type="number"
                value={specs.weight}
                onChange={(e) => handleSpecsChange("weight", parseFloat(e.target.value))}
                disabled={!isEditing || isSaving}
              />
            </div>
            <div>
              <Label>Power Consumption (Watts)</Label>
              <Input
                type="number"
                value={specs.powerConsumption.watts}
                onChange={(e) => handlePowerChange("watts", e.target.value)}
                disabled={!isEditing || isSaving}
              />
            </div>
            <div>
              <Label>Power Consumption (kWh)</Label>
              <Input
                type="number"
                value={specs.powerConsumption.kWh}
                onChange={(e) => handlePowerChange("kWh", e.target.value)}
                disabled={!isEditing || isSaving}
              />
            </div>
          </div>

          <div>
            <Label>Wire Configurations</Label>
            {specs.wireConfigurations.map((config, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 mt-2">
                <Input
                  placeholder="Type"
                  value={config.type}
                  onChange={(e) => handleWireConfigChange(index, "type", e.target.value)}
                  disabled={!isEditing || isSaving}
                />
                <Input
                  placeholder="Gauge"
                  value={config.gauge}
                  onChange={(e) => handleWireConfigChange(index, "gauge", e.target.value)}
                  disabled={!isEditing || isSaving}
                />
                <Input
                  type="number"
                  placeholder="Length"
                  value={config.length}
                  onChange={(e) => handleWireConfigChange(index, "length", parseFloat(e.target.value))}
                  disabled={!isEditing || isSaving}
                />
                {isEditing && (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeWireConfig(index)}
                    disabled={isSaving}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {isEditing && (
              <Button
                variant="outline"
                className="mt-2"
                onClick={addWireConfig}
                disabled={isSaving}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Wire Configuration
              </Button>
            )}
          </div>
        </div>
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
        }

        const allModules = await moduleService.getAllModules();
        setModules(allModules);
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
  );
}