import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { HexColorPicker } from "react-colorful";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import editorPreferencesService, { EditorPreferences } from "@/services/editor-preferences";

interface EditorSettingsProps {
  userId: string;
}

export function EditorSettings({ userId }: EditorSettingsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [localPreferences, setLocalPreferences] = useState<EditorPreferences>(preferences);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handleSave = async () => {
    try {
      if (!user) return;
      await editorPreferencesService.savePreferences(userId, localPreferences);
      onUpdate(localPreferences);
      toast({
        title: "Settings saved",
        description: "Your editor preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Grid Settings</CardTitle>
          <CardDescription>Customize the appearance of the grid</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Grid Size</Label>
            <Select
              value={String(localPreferences.grid.size)}
              onValueChange={(value) =>
                setLocalPreferences(prev => ({
                  ...prev,
                  grid: { ...prev.grid, size: Number(value) }
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select grid size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">Small</SelectItem>
                <SelectItem value="100">Medium</SelectItem>
                <SelectItem value="200">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Grid Line Weight</Label>
            <Select
              value={localPreferences.grid.weight}
              onValueChange={(value: "0.5" | "1" | "2") =>
                setLocalPreferences(prev => ({
                  ...prev,
                  grid: { ...prev.grid, weight: value }
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select line weight" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">Thin</SelectItem>
                <SelectItem value="1">Normal</SelectItem>
                <SelectItem value="2">Thick</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Grid Color</Label>
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded border cursor-pointer"
                style={{ backgroundColor: localPreferences.grid.color }}
                onClick={() => setShowColorPicker(!showColorPicker)}
              />
              {showColorPicker && (
                <div className="absolute mt-2 z-50">
                  <HexColorPicker
                    color={localPreferences.grid.color}
                    onChange={(color) =>
                      setLocalPreferences(prev => ({
                        ...prev,
                        grid: { ...prev.grid, color }
                      }))
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Object Settings</CardTitle>
          <CardDescription>Customize the appearance of objects in the scene</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Object Transparency</Label>
            <div className="flex flex-col gap-2">
              <Slider
                value={[localPreferences.objects.transparency * 100]}
                onValueChange={(value) =>
                  setLocalPreferences(prev => ({
                    ...prev,
                    objects: { ...prev.objects, transparency: value[0] / 100 }
                  }))
                }
                max={100}
                step={1}
              />
              <span className="text-sm text-muted-foreground">
                {Math.round(localPreferences.objects.transparency * 100)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}