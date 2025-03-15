
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TerrainData } from "@/services/environment";
import { Grid3X3, Maximize, Mountain, Paintbrush } from "lucide-react";

interface TerrainEditorProps {
  terrain: TerrainData;
  onUpdate: (updates: Partial<TerrainData>) => void;
}

export function TerrainEditor({ terrain, onUpdate }: TerrainEditorProps) {
  const [editMode, setEditMode] = useState<"height" | "material" | "resolution">("height");
  const [brushSize, setBrushSize] = useState(1);
  const [brushStrength, setBrushStrength] = useState(0.5);

  const handleDimensionChange = (axis: 0 | 1, value: string) => {
    const newDimensions = [...terrain.dimensions] as [number, number];
    newDimensions[axis] = parseFloat(value) || terrain.dimensions[axis];
    onUpdate({ dimensions: newDimensions });
  };

  const handleResolutionChange = (value: number) => {
    // Recalculate points when resolution changes
    const newResolution = value;
    const gridSize = terrain.dimensions;
    const points = [];
    
    for (let i = 0; i < newResolution; i++) {
      for (let j = 0; j < newResolution; j++) {
        points.push({
          x: (i * gridSize[0]) / (newResolution - 1) - gridSize[0] / 2,
          y: 0,
          z: (j * gridSize[1]) / (newResolution - 1) - gridSize[1] / 2
        });
      }
    }
    
    onUpdate({ 
      resolution: newResolution,
      points: points
    });
  };

  const handleHeightChange = (value: number) => {
    const newPoints = terrain.points.map((point) => ({
      ...point,
      y: Math.max(0, point.y + value * brushStrength)
    }));
    onUpdate({ points: newPoints });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Terrain Editor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={editMode === "height" ? "default" : "outline"}
              size="icon"
              onClick={() => setEditMode("height")}
            >
              <Mountain className="h-4 w-4" />
            </Button>
            <Button
              variant={editMode === "material" ? "default" : "outline"}
              size="icon"
              onClick={() => setEditMode("material")}
            >
              <Paintbrush className="h-4 w-4" />
            </Button>
            <Button
              variant={editMode === "resolution" ? "default" : "outline"}
              size="icon"
              onClick={() => setEditMode("resolution")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>

          {editMode === "height" && (
            <div className="space-y-4">
              <div>
                <Label>Brush Size</Label>
                <Slider
                  value={[brushSize]}
                  onValueChange={(value) => setBrushSize(value[0])}
                  min={0.5}
                  max={5}
                  step={0.5}
                />
              </div>
              <div>
                <Label>Brush Strength</Label>
                <Slider
                  value={[brushStrength]}
                  onValueChange={(value) => setBrushStrength(value[0])}
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleHeightChange(0.1)}
                >
                  Raise
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleHeightChange(-0.1)}
                >
                  Lower
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => onUpdate({ points: terrain.points.map(p => ({ ...p, y: 0 })) })}
                >
                  Flatten
                </Button>
              </div>
            </div>
          )}

          {editMode === "material" && (
            <div className="space-y-4">
              <div>
                <Label>Ground Material</Label>
                <Select
                  onValueChange={(value: "soil" | "concrete" | "grass") => onUpdate({ materialType: value })}
                  defaultValue={terrain.materialType || "soil"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soil">Soil</SelectItem>
                    <SelectItem value="grass">Grass</SelectItem>
                    <SelectItem value="concrete">Concrete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {editMode === "resolution" && (
            <div className="space-y-4">
              <div>
                <Label>Width (m)</Label>
                <Input
                  type="number"
                  value={terrain.dimensions[0]}
                  onChange={(e) => handleDimensionChange(0, e.target.value)}
                  min={10}
                  step={1}
                />
              </div>
              <div>
                <Label>Length (m)</Label>
                <Input
                  type="number"
                  value={terrain.dimensions[1]}
                  onChange={(e) => handleDimensionChange(1, e.target.value)}
                  min={10}
                  step={1}
                />
              </div>
              <div>
                <Label>Resolution</Label>
                <Slider
                  value={[terrain.resolution]}
                  onValueChange={(value) => handleResolutionChange(value[0])}
                  min={10}
                  max={100}
                  step={10}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
