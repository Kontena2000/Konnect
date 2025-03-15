
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RulerSquare, LineIcon, BoxIcon, Delete } from "lucide-react";

export function ViewMeasurements() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Measurements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <LineIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <RulerSquare className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <BoxIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Delete className="h-4 w-4" />
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
          </div>

          <div className="text-sm text-muted-foreground">
            Click and drag to measure distances. Double click to finish area measurements.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
