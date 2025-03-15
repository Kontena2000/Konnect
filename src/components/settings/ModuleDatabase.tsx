
import { useState, useEffect } from "react";
import { ModuleTemplateWithSpecs, TechnicalSpecs } from "@/services/module";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Minus, Save, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import moduleService, { getDefaultSpecs } from "@/services/module";
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
