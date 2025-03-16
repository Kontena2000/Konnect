
import { useState, useEffect, useCallback } from "react";
import { ModuleTemplateWithSpecs } from "@/services/module";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import moduleService from "@/services/module";
import { ModuleCategory } from "@/types/module";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateModuleDialog } from "@/components/settings/CreateModuleDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ConnectionType } from '@/types/connection';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function ModuleManager() {
  const [modules, setModules] = useState<ModuleTemplateWithSpecs[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { toast } = useToast();
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  const loadModules = useCallback(async () => {
    try {
      const loadedModules = await moduleService.getAllModules();
      setModules(loadedModules);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load modules"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Correctly use useEffect for component mount
  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const handleUpdateModule = async (id: string, data: Partial<ModuleTemplateWithSpecs>) => {
    setIsSaving(id);
    try {
      await moduleService.updateModule(id, data);
      setModules(prev => prev.map(module => 
        module.id === id ? { ...module, ...data } : module
      ));
      toast({
        title: "Success",
        description: "Module updated successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update module"
      });
    } finally {
      setIsSaving(null);
    }
  };

  const handleCreateModule = async (moduleData: ModuleTemplateWithSpecs) => {
    try {
      await moduleService.createModule(moduleData);
      setModules(prev => [...prev, moduleData]);
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
    }
  };

  const handleDeleteModule = async (id: string) => {
    setIsDeleting(true);
    try {
      await moduleService.deleteModule(id);
      setModules(prev => prev.filter(module => module.id !== id));
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
    } finally {
      setIsDeleting(false);
      setModuleToDelete(null);
    }
  };

  const filteredModules = modules.filter(module => {
    const matchesSearch = module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || module.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleToggleVisibility = async (module: ModuleTemplateWithSpecs) => {
    const newVisibility = !module.visibleInEditor;
    await handleUpdateModule(module.id, { visibleInEditor: newVisibility });
  };

  const handleToggleExpand = (moduleId: string) => {
    setExpandedModuleId(moduleId === expandedModuleId ? null : moduleId);
  };

  const handleAddConnectionPoint = (moduleId: string, currentModule: ModuleTemplateWithSpecs) => {
    // Enforce connection points to be on the bottom of the module (Z=0)
    const newPoints = [...(currentModule.connectionPoints || []), {
      position: [0, 0, 0] as [number, number, number],
      type: 'power' as ConnectionType
    }];
    handleUpdateModule(moduleId, { connectionPoints: newPoints });
  };

  const validateConnectionPoint = (position: [number, number, number], dimensions: {length: number, width: number, height: number}): boolean => {
    // Check if the connection point is on the bottom of the module
    // Z position should be 0 (bottom of the module)
    // X position should be within the module's length
    // Y position should be within the module's width
    const [x, y, z] = position;
    const halfLength = dimensions.length / 2;
    const halfWidth = dimensions.width / 2;
    
    return z === 0 && 
           x >= -halfLength && 
           x <= halfLength && 
           y >= -halfWidth && 
           y <= halfWidth;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.values(ModuleCategory).map(category => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <CreateModuleDialog onModuleCreate={handleCreateModule} />
      </div>

      <ScrollArea className="h-[700px]">
        <div className="space-y-4">
          {filteredModules.map(module => (
            <Card key={module.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {module.name}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({module.category})
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`visible-${module.id}`} className="text-sm">
                        Show in Editor
                      </Label>
                      <Switch
                        id={`visible-${module.id}`}
                        checked={module.visibleInEditor}
                        onCheckedChange={() => handleToggleVisibility(module)}
                      />
                    </div>
                    <AlertDialog open={moduleToDelete === module.id} onOpenChange={(open) => !open && setModuleToDelete(null)}>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="icon"
                          onClick={() => setModuleToDelete(module.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Module</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this module? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteModule(module.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic">
                  <TabsList>
                    <TabsTrigger value="basic">Basic Properties</TabsTrigger>
                    <TabsTrigger value="technical">Technical Specs</TabsTrigger>
                    <TabsTrigger value="connections">Connection Points</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={module.name}
                          onChange={(e) => handleUpdateModule(module.id, { name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={module.color}
                            onChange={(e) => handleUpdateModule(module.id, { color: e.target.value })}
                            className="w-12 h-12 p-1"
                          />
                          <Input
                            value={module.color}
                            onChange={(e) => handleUpdateModule(module.id, { color: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <Label>Description</Label>
                        <Input
                          value={module.description}
                          onChange={(e) => handleUpdateModule(module.id, { description: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Dimensions (meters)</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(module.dimensions).map(([key, value]) => (
                            <div key={key}>
                              <Label className="text-xs">{key.charAt(0).toUpperCase() + key.slice(1)}</Label>
                              <Input
                                type="number"
                                value={value}
                                onChange={(e) => handleUpdateModule(module.id, {
                                  dimensions: {
                                    ...module.dimensions,
                                    [key]: parseFloat(e.target.value) || 0
                                  }
                                })}
                                step={0.1}
                                min={0.1}
                                required
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="technical" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Empty Weight (kg)</Label>
                        <Input
                          type="number"
                          value={module.technicalSpecs.weight.empty}
                          onChange={(e) => handleUpdateModule(module.id, {
                            technicalSpecs: {
                              ...module.technicalSpecs,
                              weight: {
                                ...module.technicalSpecs.weight,
                                empty: parseFloat(e.target.value) || 0
                              }
                            }
                          })}
                        />
                      </div>
                      <div>
                        <Label>Loaded Weight (kg)</Label>
                        <Input
                          type="number"
                          value={module.technicalSpecs.weight.loaded}
                          onChange={(e) => handleUpdateModule(module.id, {
                            technicalSpecs: {
                              ...module.technicalSpecs,
                              weight: {
                                ...module.technicalSpecs.weight,
                                loaded: parseFloat(e.target.value) || 0
                              }
                            }
                          })}
                        />
                      </div>
                      <div>
                        <Label>Power Consumption (watts)</Label>
                        <Input
                          type="number"
                          value={module.technicalSpecs.powerConsumption.typical}
                          onChange={(e) => handleUpdateModule(module.id, {
                            technicalSpecs: {
                              ...module.technicalSpecs,
                              powerConsumption: {
                                ...module.technicalSpecs.powerConsumption,
                                typical: parseFloat(e.target.value) || 0
                              }
                            }
                          })}
                        />
                      </div>
                      <div>
                        <Label>Maximum Power (watts)</Label>
                        <Input
                          type="number"
                          value={module.technicalSpecs.powerConsumption.maximum}
                          onChange={(e) => handleUpdateModule(module.id, {
                            technicalSpecs: {
                              ...module.technicalSpecs,
                              powerConsumption: {
                                ...module.technicalSpecs.powerConsumption,
                                maximum: parseFloat(e.target.value) || 0
                              }
                            }
                          })}
                        />
                      </div>
                      <div>
                        <Label>Heat Output (BTU/hr)</Label>
                        <Input
                          type="number"
                          value={module.technicalSpecs.cooling.heatOutput.btu}
                          onChange={(e) => handleUpdateModule(module.id, {
                            technicalSpecs: {
                              ...module.technicalSpecs,
                              cooling: {
                                ...module.technicalSpecs.cooling,
                                heatOutput: {
                                  ...module.technicalSpecs.cooling.heatOutput,
                                  btu: parseFloat(e.target.value) || 0
                                }
                              }
                            }
                          })}
                        />
                      </div>
                      <div>
                        <Label>Heat Output (kW)</Label>
                        <Input
                          type="number"
                          value={module.technicalSpecs.cooling.heatOutput.kW}
                          onChange={(e) => handleUpdateModule(module.id, {
                            technicalSpecs: {
                              ...module.technicalSpecs,
                              cooling: {
                                ...module.technicalSpecs.cooling,
                                heatOutput: {
                                  ...module.technicalSpecs.cooling.heatOutput,
                                  kW: parseFloat(e.target.value) || 0
                                }
                              }
                            }
                          })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="connections" className="space-y-4">
                    <div className="space-y-4">
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <p className="text-sm font-medium">Connection Point Guidelines</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Connection points must be placed on the bottom of the module (Z=0). 
                          X and Y coordinates should be within the module's dimensions.
                        </p>
                      </div>
                      
                      {module.connectionPoints?.map((point, index) => {
                        const isValid = validateConnectionPoint(point.position, module.dimensions);
                        
                        return (
                          <div key={index} className={`p-4 border rounded-lg ${!isValid ? 'border-red-500' : ''}`}>
                            {!isValid && (
                              <div className="mb-2 p-2 bg-red-100 text-red-800 rounded text-sm flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Connection point must be on the bottom of the module (Z=0) and within module dimensions</span>
                              </div>
                            )}
                            <div className="grid grid-cols-3 gap-4">
                              {point.position.map((value, i) => (
                                <div key={i}>
                                  <Label>{["X", "Y", "Z"][i]} Position</Label>
                                  <Input
                                    type="number"
                                    value={value}
                                    onChange={(e) => {
                                      const newPoints = [...(module.connectionPoints || [])];
                                      // For Z position, enforce 0 (bottom of module)
                                      if (i === 2) {
                                        newPoints[index].position[i] = 0;
                                      } else {
                                        newPoints[index].position[i] = parseFloat(e.target.value) || 0;
                                      }
                                      handleUpdateModule(module.id, { connectionPoints: newPoints });
                                    }}
                                    step={0.1}
                                    disabled={i === 2} // Disable Z input to enforce bottom placement
                                    className={i === 2 ? "bg-muted" : ""}
                                  />
                                  {i === 2 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Fixed at 0 (bottom of module)
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="mt-2">
                              <Label>Connection Type</Label>
                              <Select
                                value={point.type}
                                onValueChange={(value: ConnectionType) => {
                                  const newPoints = [...(module.connectionPoints || [])];
                                  newPoints[index].type = value;
                                  handleUpdateModule(module.id, { connectionPoints: newPoints });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="power">Power</SelectItem>
                                  <SelectItem value="network">Network</SelectItem>
                                  <SelectItem value="cooling">Cooling</SelectItem>
                                  <SelectItem value="security">Security</SelectItem>
                                  <SelectItem value="cat6a">CAT6A</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="mt-4 flex justify-end">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const newPoints = [...(module.connectionPoints || [])];
                                  newPoints.splice(index, 1);
                                  handleUpdateModule(module.id, { connectionPoints: newPoints });
                                }}
                              >
                                Remove Connection Point
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      
                      <Button
                        variant="outline"
                        onClick={() => handleAddConnectionPoint(module.id, module)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Connection Point
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
                
                {isSaving === module.id && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <p>Saving changes...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
