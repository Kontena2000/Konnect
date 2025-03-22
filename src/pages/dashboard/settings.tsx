
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import editorPreferencesService, { EditorPreferences } from "@/services/editor-preferences";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<EditorPreferences | null>(null);

  useEffect(() => {
    if (user) {
      editorPreferencesService.getPreferences(user.uid)
        .then(prefs => {
          setPreferences(prefs);
        })
        .catch(error => {
          console.error("Failed to load editor preferences:", error);
          toast({
            title: "Error",
            description: "Failed to load preferences",
            variant: "destructive"
          });
        });
    }
  }, [user, toast]);

  const handleSave = async () => {
    if (!user || !preferences) return;

    try {
      await editorPreferencesService.savePreferences(preferences, user);
      toast({
        title: "Success",
        description: "Editor preferences saved successfully",
      });
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive"
      });
    }
  };

  if (!preferences) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Editor Settings</CardTitle>
            <CardDescription>Customize your editor experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Grid Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Grid Settings</h3>
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Grid Size</Label>
                  <Select
                    value={preferences.grid.size}
                    onValueChange={(value: "small" | "medium" | "large") => 
                      setPreferences(prev => prev ? {
                        ...prev,
                        grid: { ...prev.grid, size: value }
                      } : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grid size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Grid Line Weight</Label>
                  <Select
                    value={preferences.grid.weight}
                    onValueChange={(value: "0.5" | "1" | "2") =>
                      setPreferences(prev => prev ? {
                        ...prev,
                        grid: { ...prev.grid, weight: value }
                      } : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select line weight" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">Thin</SelectItem>
                      <SelectItem value="1">Medium</SelectItem>
                      <SelectItem value="2">Thick</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Grid Color</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[200px] justify-start"
                        style={{
                          backgroundColor: preferences.grid.color,
                          color: preferences.grid.color === "#ffffff" ? "#000000" : "#ffffff"
                        }}
                      >
                        {preferences.grid.color}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <HexColorPicker
                        color={preferences.grid.color}
                        onChange={(color) =>
                          setPreferences(prev => prev ? {
                            ...prev,
                            grid: { ...prev.grid, color }
                          } : null)
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Object Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Object Settings</h3>
              
              <div className="space-y-2">
                <Label>Object Transparency</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[preferences.objects.transparency * 100]}
                    onValueChange={(value) =>
                      setPreferences(prev => prev ? {
                        ...prev,
                        objects: { ...prev.objects, transparency: value[0] / 100 }
                      } : null)
                    }
                    max={100}
                    step={1}
                  />
                  <span className="min-w-[4rem] text-sm">
                    {Math.round(preferences.objects.transparency * 100)}%
                  </span>
                </div>
              </div>
            </div>

            <Button onClick={handleSave}>Save Settings</Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
