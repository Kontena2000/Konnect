
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Ruler, 
  Square, 
  Box, 
  Trash2,
  Minus
} from "lucide-react";

export function ViewMeasurements() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Measurements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="icon" title="Line Measurement">
              <Minus className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" title="Area Measurement">
              <Square className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" title="Volume Measurement">
              <Box className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" title="Clear Measurements">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <div>
              <Label>Distance</Label>
              <Input type="text" value="12.5m" readOnly />
            </div>
            <div>
              <Label>Area</Label>
              <Input type="text" value="150m²" readOnly />
            </div>
            <div>
              <Label>Volume</Label>
              <Input type="text" value="450m³" readOnly />
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Click and drag to measure distances. Double click to finish area/volume measurements.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
