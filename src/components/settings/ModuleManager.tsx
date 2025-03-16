import { useState, useEffect } from "react";
import { ModuleTemplateWithSpecs } from "@/services/module";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import moduleService from "@/services/module";
import { ModuleCategory } from "@/types/module";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateModuleDialog } from "@/components/settings/CreateModuleDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

export function ModuleManager() {
  const [modules, setModules] = useState<ModuleTemplateWithSpecs[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { toast } = useToast();
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
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
  };

  const handleUpdateModule = async (id: string, data: Partial<ModuleTemplateWithSpecs>) => {
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
            <Card key={module.id}>
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
                    </div>
                  </TabsContent>

                  <TabsContent value="connections" className="space-y-4">
                    <div className="space-y-4">
                      {module.connectionPoints?.map((point, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="grid grid-cols-3 gap-4">
                            {point.position.map((value, i) => (
                              <div key={i}>
                                <Label>{["X", "Y", "Z"][i]} Position</Label>
                                <Input
                                  type="number"
                                  value={value}
                                  onChange={(e) => {
                                    const newPoints = [...(module.connectionPoints || [])];
                                    newPoints[index].position[i] = parseFloat(e.target.value) || 0;
                                    handleUpdateModule(module.id, { connectionPoints: newPoints });
                                  }}
                                  step={0.1}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => {
                          const newPoints = [...(module.connectionPoints || []), {
                            position: [0, 0, 0] as [number, number, number],
                            type: 'power' as ConnectionType
                          }];
                          handleUpdateModule(module.id, { connectionPoints: newPoints });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Connection Point
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}