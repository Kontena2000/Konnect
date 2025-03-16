
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Upload, RefreshCw } from "lucide-react";

interface ColorConfig {
  hue: number;
  saturation: number;
  lightness: number;
  hex: string;
}

interface ThemeColors {
  background: ColorConfig;
  foreground: ColorConfig;
  primary: ColorConfig;
  secondary: ColorConfig;
  accent: ColorConfig;
  muted: ColorConfig;
}

interface Theme {
  colors: ThemeColors;
  radius: string;
  font?: string;
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Remove the # from the beginning
  hex = hex.replace('#', '');

  // Parse the hex string
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export function ThemeEditor() {
  const { toast } = useToast();
  const [radius, setRadius] = useState("0.5");
  const [customFont, setCustomFont] = useState<string | null>(null);
  const [colors, setColors] = useState<ThemeColors>({
    background: { hue: 0, saturation: 0, lightness: 100, hex: "#FFFFFF" },
    foreground: { hue: 0, saturation: 0, lightness: 0, hex: "#000000" },
    primary: { hue: 45, saturation: 100, lightness: 50, hex: "#F1B73A" },
    secondary: { hue: 0, saturation: 0, lightness: 96, hex: "#F5F5F5" },
    accent: { hue: 45, saturation: 100, lightness: 50, hex: "#F1B73A" },
    muted: { hue: 0, saturation: 0, lightness: 96, hex: "#F5F5F5" },
  });

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      const theme = JSON.parse(savedTheme);
      setColors(theme.colors);
      setRadius(theme.radius);
      if (theme.font) {
        setCustomFont(theme.font);
      }
    }
  }, []);

  const updateColor = (key: keyof ThemeColors, type: keyof ColorConfig, value: any) => {
    setColors(prev => {
      const newColors = { ...prev };
      if (type === 'hex') {
        const hsl = hexToHsl(value);
        newColors[key] = {
          ...newColors[key],
          hex: value,
          hue: hsl.h,
          saturation: hsl.s,
          lightness: hsl.l
        };
      } else {
        newColors[key] = {
          ...newColors[key],
          [type]: value,
          hex: hslToHex(
            type === 'hue' ? value : newColors[key].hue,
            type === 'saturation' ? value : newColors[key].saturation,
            type === 'lightness' ? value : newColors[key].lightness
          )
        };
      }
      return newColors;
    });
  };

  const handleFontUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Font = e.target?.result as string;
        setCustomFont(base64Font);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    try {
      // Apply colors
      const root = document.documentElement;
      Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(
          `--${key}`,
          `${value.hue} ${value.saturation}% ${value.lightness}%`
        );
      });

      // Apply radius
      root.style.setProperty("--radius", `${radius}rem`);

      // Apply custom font if uploaded
      if (customFont) {
        const style = document.createElement('style');
        style.textContent = `
          @font-face {
            font-family: 'CustomFont';
            src: url(${customFont}) format('woff2');
          }
          :root {
            --font-sans: 'CustomFont', system-ui, sans-serif;
          }
        `;
        document.head.appendChild(style);
      }

      // Save to localStorage
      const theme: Theme = {
        colors,
        radius,
        font: customFont || undefined
      };
      localStorage.setItem('theme', JSON.stringify(theme));

      toast({
        title: "Theme Updated",
        description: "Your theme changes have been saved and applied.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save theme changes. Please try again.",
      });
    }
  };

  const handleReset = () => {
    localStorage.removeItem('theme');
    window.location.reload();
  };

  const ColorPicker = ({ label, colorKey }: { label: string; colorKey: keyof ThemeColors }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Label className="text-xs">HEX Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={colors[colorKey].hex}
              onChange={(e) => updateColor(colorKey, "hex", e.target.value)}
              className="w-12 h-12 p-1"
            />
            <Input
              value={colors[colorKey].hex}
              onChange={(e) => updateColor(colorKey, "hex", e.target.value)}
              placeholder="#000000"
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
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
      </div>
      <div className="h-8 rounded-md border" style={{ backgroundColor: colors[colorKey].hex }} />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Editor</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="colors">
          <TabsList>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
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

          <TabsContent value="typography">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Custom Font</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept=".woff2,.ttf,.otf"
                    onChange={handleFontUpload}
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload a custom font file (WOFF2, TTF, or OTF format)
                </p>
              </div>
            </div>
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

        <div className="mt-6 space-y-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Preview</h3>
            <div className="space-y-4">
              <Button>Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <div className="p-4 bg-muted rounded-lg">
                Muted Background
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              className="flex-1 bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black"
            >
              <Save className="h-4 w-4 mr-2" />
              Save & Apply Theme
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
