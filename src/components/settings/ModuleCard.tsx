import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Loader2, Trash2, Copy, Box } from "lucide-react";
import { Module } from "@/types/module";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EditModuleDialog } from "./EditModuleDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface ModuleCardProps {
  module: Module;
  onUpdate: (id: string, data: Partial<Module>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  categories: { id: string; name: string; }[];
  isSaving: boolean;
  isDeleting: boolean;
  moduleToDelete: string | null;
  setModuleToDelete: (id: string | null) => void;
}

export function ModuleCard({
  module,
  onUpdate,
  onDelete,
  onDuplicate,
  categories,
  isSaving,
  isDeleting,
  moduleToDelete,
  setModuleToDelete
}: ModuleCardProps) {
  const [localSaving, setLocalSaving] = useState(false);

  const handleToggleVisibility = async () => {
    const newVisibility = !module.visibleInEditor;
    await onUpdate(module.id, { visibleInEditor: newVisibility });
  };

  return (
    <Card className="relative overflow-hidden group transition-all duration-200 hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded flex items-center justify-center shadow-sm transition-transform group-hover:scale-105"
              style={{ backgroundColor: module.color }}
            >
              <Box className="h-4 w-4 text-background" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span>{module.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {module.category}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-normal">
                {module.description}
              </p>
            </div>
          </CardTitle>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <EditModuleDialog
                    module={module}
                    onModuleUpdate={(data) => onUpdate(module.id, data)}
                    categories={categories}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit module</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDuplicate(module.id)}
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Duplicate module</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex items-center gap-2">
              <Label htmlFor={`visible-${module.id}`} className="text-sm">
                Show in Editor
              </Label>
              <Switch
                id={`visible-${module.id}`}
                checked={module.visibleInEditor}
                onCheckedChange={handleToggleVisibility}
              />
            </div>

            <AlertDialog 
              open={moduleToDelete === module.id} 
              onOpenChange={(open) => !open && setModuleToDelete(null)}
            >
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
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
                    onClick={() => onDelete(module.id)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete'
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
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={module.name}
                  onChange={(e) => onUpdate(module.id, { name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={module.color}
                    onChange={(e) => onUpdate(module.id, { color: e.target.value })}
                    className="w-12 h-12 p-1"
                  />
                  <Input
                    value={module.color}
                    onChange={(e) => onUpdate(module.id, { color: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Input
                  value={module.description}
                  onChange={(e) => onUpdate(module.id, { description: e.target.value })}
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
                        onChange={(e) => onUpdate(module.id, {
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

          <TabsContent value="advanced" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label>Connection Points</Label>
                <div className="text-sm text-muted-foreground">
                  Connection point management coming soon
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {isSaving && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Saving changes...</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}