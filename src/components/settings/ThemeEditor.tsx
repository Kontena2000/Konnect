
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ColorConfig {
  hue: number;
  saturation: number;
  lightness: number;
}

interface ThemeColors {
  background: ColorConfig;
  foreground: ColorConfig;
  primary: ColorConfig;
  secondary: ColorConfig;
  accent: ColorConfig;
  muted: ColorConfig;
}

export function ThemeEditor() {
  const [radius, setRadius] = useState("0.5");
  const [colors, setColors] = useState<ThemeColors>({
    background: { hue: 0, saturation: 0, lightness: 100 },
    foreground: { hue: 0, saturation: 0, lightness: 0 },
    primary: { hue: 45, saturation: 100, lightness: 50 },
    secondary: { hue: 0, saturation: 0, lightness: 96 },
    accent: { hue: 45, saturation: 100, lightness: 50 },
    muted: { hue: 0, saturation: 0, lightness: 96 },
  });

  const updateColor = (key: keyof ThemeColors, type: keyof ColorConfig, value: number) => {
    setColors(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [type]: value
      }
    }));
  };

  const ColorPicker = ({ label, colorKey }: { label: string; colorKey: keyof ThemeColors }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="text-xs">Hue</Label>
          <Input
            type="number"
            min="0"
            max="360"
            value={colors[colorKey].hue}
            onChange={(e) => updateColor(colorKey, "hue", Number(e.target.value))}
          />
        </div>
        <div>
          <Label className="text-xs">Saturation</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={colors[colorKey].saturation}
            onChange={(e) => updateColor(colorKey, "saturation", Number(e.target.value))}
          />
        </div>
        <div>
          <Label className="text-xs">Lightness</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={colors[colorKey].lightness}
            onChange={(e) => updateColor(colorKey, "lightness", Number(e.target.value))}
          />
        </div>
      </div>
      <div 
        className="h-6 rounded-md border"
        style={{
          backgroundColor: `hsl(${colors[colorKey].hue}deg ${colors[colorKey].saturation}% ${colors[colorKey].lightness}%)`
        }}
      />
    </div>
  );

  const handleSave = () => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(
        `--${key}`,
        `${value.hue} ${value.saturation}% ${value.lightness}%`
      );
    });
    root.style.setProperty("--radius", `${radius}rem`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Editor</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="colors">
          <TabsList>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="radius">Border Radius</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-6">
            <ColorPicker label="Background" colorKey="background" />
            <ColorPicker label="Foreground" colorKey="foreground" />
            <ColorPicker label="Primary" colorKey="primary" />
            <ColorPicker label="Secondary" colorKey="secondary" />
            <ColorPicker label="Accent" colorKey="accent" />
            <ColorPicker label="Muted" colorKey="muted" />
          </TabsContent>

          <TabsContent value="radius">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Border Radius</Label>
                <Select value={radius} onValueChange={setRadius}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Square (0)</SelectItem>
                    <SelectItem value="0.3">Small (0.3rem)</SelectItem>
                    <SelectItem value="0.5">Medium (0.5rem)</SelectItem>
                    <SelectItem value="0.75">Large (0.75rem)</SelectItem>
                    <SelectItem value="1.0">Extra Large (1.0rem)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <Button onClick={handleSave} className="w-full bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black">
            Apply Theme
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
