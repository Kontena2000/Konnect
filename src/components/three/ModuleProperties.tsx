
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2, Move, RotateCw, Maximize } from "lucide-react";

interface ModulePropertiesProps {
  module: {
    id: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    color: string;
    type: string;
  };
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  onTransformModeChange: (mode: "translate" | "rotate" | "scale") => void;
}

export function ModuleProperties({ module, onUpdate, onDelete, onTransformModeChange }: ModulePropertiesProps) {
  const [position, setPosition] = useState(module.position);
  const [rotation, setRotation] = useState(module.rotation);
  const [scale, setScale] = useState(module.scale);

  useEffect(() => {
    setPosition(module.position);
    setRotation(module.rotation);
    setScale(module.scale);
  }, [module]);

  const handlePositionChange = (index: number, value: string) => {
    const newPosition = [...position];
    newPosition[index] = parseFloat(value) || 0;
    setPosition(newPosition as [number, number, number]);
    onUpdate(module.id, { position: newPosition });
  };

  const handleRotationChange = (index: number, value: string) => {
    const newRotation = [...rotation];
    newRotation[index] = parseFloat(value) || 0;
    setRotation(newRotation as [number, number, number]);
    onUpdate(module.id, { rotation: newRotation });
  };

  const handleScaleChange = (index: number, value: string) => {
    const newScale = [...scale];
    newScale[index] = parseFloat(value) || 1;
    setScale(newScale as [number, number, number]);
    onUpdate(module.id, { scale: newScale });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Module Properties</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onTransformModeChange("translate")}
            >
              <Move className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onTransformModeChange("rotate")}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onTransformModeChange("scale")}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Position</Label>
            <div className="grid grid-cols-3 gap-2">
              {["X", "Y", "Z"].map((axis, i) => (
                <div key={axis}>
                  <Label className="text-xs">{axis}</Label>
                  <Input
                    type="number"
                    value={position[i]}
                    onChange={(e) => handlePositionChange(i, e.target.value)}
                    step={0.1}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rotation</Label>
            <div className="grid grid-cols-3 gap-2">
              {["X", "Y", "Z"].map((axis, i) => (
                <div key={axis}>
                  <Label className="text-xs">{axis}</Label>
                  <Input
                    type="number"
                    value={rotation[i]}
                    onChange={(e) => handleRotationChange(i, e.target.value)}
                    step={0.1}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Scale</Label>
            <div className="grid grid-cols-3 gap-2">
              {["X", "Y", "Z"].map((axis, i) => (
                <div key={axis}>
                  <Label className="text-xs">{axis}</Label>
                  <Input
                    type="number"
                    value={scale[i]}
                    onChange={(e) => handleScaleChange(i, e.target.value)}
                    step={0.1}
                    min={0.1}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <Button
            variant="destructive"
            className="w-full"
            onClick={() => onDelete(module.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Module
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
