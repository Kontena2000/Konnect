
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Home,
  Sun,
  Layers
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function ViewControls() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>View Controls</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Home className="h-4 w-4" />
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Show Grid</Label>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Shadows</Label>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Sun Path</Label>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Terrain</Label>
              <Switch />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Button variant="outline" className="w-full">
              <Sun className="h-4 w-4 mr-2" />
              Time of Day
            </Button>
            <Button variant="outline" className="w-full">
              <Layers className="h-4 w-4 mr-2" />
              Layer Manager
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
