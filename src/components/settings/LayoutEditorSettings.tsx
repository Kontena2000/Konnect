
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModuleManager } from "@/components/settings/ModuleManager";
import { EditorPreferences } from "@/services/editor-preferences";
import editorPreferencesService from "@/services/editor-preferences";

interface LayoutEditorSettingsProps {
  preferences: EditorPreferences;
  onUpdate: (preferences: EditorPreferences) => void;
  userId: string;
}

export function LayoutEditorSettings({ preferences, onUpdate, userId }: LayoutEditorSettingsProps) {
  const { toast } = useToast();
  const [localPreferences, setLocalPreferences] = useState<EditorPreferences>(preferences);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handleSavePreferences = async () => {
    setSaving(true);
    
    try {
      await editorPreferencesService.savePreferences(userId, localPreferences);
      onUpdate(localPreferences);
      
      toast({
        title: "Settings saved",
        description: "Your editor preferences have been updated successfully.",
      });
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your preferences.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGridSizeChange = (value: number[]) => {
    setLocalPreferences(prev => ({
      ...prev,
      grid: {
        ...prev.grid,
        size: value[0]
      }
    }));
  };

  const handleGridDivisionsChange = (value: number[]) => {
    setLocalPreferences(prev => ({
      ...prev,
      grid: {
        ...prev.grid,
        divisions: value[0]
      }
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Layout Editor Settings</CardTitle>
          <CardDescription>Customize your layout editor experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Grid Size</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[localPreferences.grid.size]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={handleGridSizeChange}
                  className="flex-1"
                />
                <span className="w-12 text-center">{localPreferences.grid.size}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Grid Divisions</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[localPreferences.grid.divisions]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={handleGridDivisionsChange}
                  className="flex-1"
                />
                <span className="w-12 text-center">{localPreferences.grid.divisions}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showGrid">Show Grid</Label>
                <p className="text-sm text-muted-foreground">
                  Display grid in the editor
                </p>
              </div>
              <Switch
                id="showGrid"
                checked={localPreferences.grid.visible}
                onCheckedChange={(checked) => 
                  setLocalPreferences(prev => ({
                    ...prev,
                    grid: {
                      ...prev.grid,
                      visible: checked
                    }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showAxes">Show Axes</Label>
                <p className="text-sm text-muted-foreground">
                  Display X, Y, Z axes in the editor
                </p>
              </div>
              <Switch
                id="showAxes"
                checked={localPreferences.grid.showAxes}
                onCheckedChange={(checked) => 
                  setLocalPreferences(prev => ({
                    ...prev,
                    grid: {
                      ...prev.grid,
                      showAxes: checked
                    }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="snapToGrid">Snap to Grid</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically align modules to grid
                </p>
              </div>
              <Switch
                id="snapToGrid"
                checked={localPreferences.grid.snap}
                onCheckedChange={(checked) => 
                  setLocalPreferences(prev => ({
                    ...prev,
                    grid: {
                      ...prev.grid,
                      snap: checked
                    }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoSave">Auto Save</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically save layout changes
                </p>
              </div>
              <Switch
                id="autoSave"
                checked={localPreferences.autoSave}
                onCheckedChange={(checked) => 
                  setLocalPreferences(prev => ({
                    ...prev,
                    autoSave: checked
                  }))
                }
              />
            </div>
          </div>

          <Button 
            onClick={handleSavePreferences} 
            disabled={saving}
            className="w-full md:w-auto"
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="modules">
        <TabsList>
          <TabsTrigger value="modules">Module Manager</TabsTrigger>
        </TabsList>
        
        <TabsContent value="modules">
          <ModuleManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
