import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2, Move, RotateCw, Maximize } from "lucide-react";
import { Module } from "@/types/module";

interface ModulePropertiesProps {
  module: Module;
  onUpdate: (id: string, updates: Partial<Module>) => void;
  onDelete: (id: string) => void;
  onTransformModeChange: (mode: "translate" | "rotate" | "scale") => void;
}

export function ModuleProperties({ module, onUpdate, onDelete, onTransformModeChange }: ModulePropertiesProps) {
  const [position, setPosition] = useState(module.position || [0, 0, 0]);
  const [rotation, setRotation] = useState(module.rotation || [0, 0, 0]);
  const [scale, setScale] = useState(module.scale || [1, 1, 1]);

  useEffect(() => {
    setPosition(module.position || [0, 0, 0]);
    setRotation(module.rotation || [0, 0, 0]);
    setScale(module.scale || [1, 1, 1]);
  }, [module]);

  const handlePositionChange = (index: number, value: string) => {
    const newPosition = [...position] as [number, number, number];
    newPosition[index] = parseFloat(value) || 0;
    setPosition(newPosition);
    onUpdate(module.id, { position: newPosition });
  };

  const handleRotationChange = (index: number, value: string) => {
    const newRotation = [...rotation] as [number, number, number];
    newRotation[index] = parseFloat(value) || 0;
    setRotation(newRotation);
    onUpdate(module.id, { rotation: newRotation });
  };

  const handleScaleChange = (index: number, value: string) => {
    const newScale = [...scale] as [number, number, number];
    newScale[index] = parseFloat(value) || 1;
    setScale(newScale);
    onUpdate(module.id, { scale: newScale });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Module Properties</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{module.name}</h3>
            <Button variant="destructive" size="sm" onClick={() => onDelete(module.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

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

            <div className="space-y-2">
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

            <div className="space-y-2">
              <Label>Dimensions</Label>
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
                    />
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="destructive"
              className="w-full"
              onClick={() => onDelete(module.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Module
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}