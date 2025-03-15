
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Box, Power, Network } from "lucide-react";

export interface ModuleTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  dimensions: [number, number, number];
  color: string;
  connectionPoints: Array<{
    type: "power" | "network" | "cooling";
    position: [number, number, number];
  }>;
  icon: React.ReactNode;
}

const moduleTemplates: ModuleTemplate[] = [
  {
    id: "edge-container-20",
    name: "EDGE Container",
    type: "edge",
    description: "20' Standard Edge Computing Container",
    dimensions: [6.096, 2.591, 2.438], // Length, Height, Width in meters
    color: "#2d3748",
    connectionPoints: [
      { type: "power", position: [3.048, 0.5, 1.219] }, // Front right
      { type: "network", position: [3.048, 0.5, -1.219] }, // Front left
    ],
    icon: <Box className="h-5 w-5" />
  }
];

interface ModuleLibraryProps {
  onSelect?: (template: ModuleTemplate) => void;
}

export function ModuleLibrary({ onSelect }: ModuleLibraryProps) {
  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-2">
        {moduleTemplates.map((template) => (
          <Button
            key={template.id}
            variant="outline"
            className="w-full justify-start"
            onClick={() => onSelect?.(template)}
          >
            {template.icon}
            <div className="ml-2 text-left">
              <div className="font-medium">{template.name}</div>
              <div className="text-xs text-muted-foreground">
                {template.description}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span>{template.dimensions[0]}m × {template.dimensions[2]}m × {template.dimensions[1]}m</span>
                <div className="flex gap-1">
                  <Power className="h-3 w-3" />
                  <Network className="h-3 w-3" />
                </div>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}
