
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Tree, 
  Fence, 
  Factory,
  ParkingSquare,
  Lightbulb,
  Building2
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface EnvironmentTemplate {
  id: string;
  name: string;
  type: "vegetation" | "infrastructure" | "utility" | "hardscape";
  category: string;
  description: string;
  model: string;
  icon: React.ReactNode;
  scale: [number, number, number];
}

const environmentTemplates: EnvironmentTemplate[] = [
  {
    id: "tree-large",
    name: "Large Tree",
    type: "vegetation",
    category: "trees",
    description: "Mature shade tree",
    model: "Tree",
    icon: <Tree className="h-5 w-5" />,
    scale: [1, 1, 1]
  },
  {
    id: "security-fence",
    name: "Security Fence",
    type: "infrastructure",
    category: "fencing",
    description: "Perimeter security fence",
    model: "Fence",
    icon: <Fence className="h-5 w-5" />,
    scale: [1, 1, 1]
  },
  {
    id: "transformer",
    name: "Transformer",
    type: "utility",
    category: "electrical",
    description: "Power transformer",
    model: "Transformer",
    icon: <Factory className="h-5 w-5" />,
    scale: [1, 1, 1]
  },
  {
    id: "parking",
    name: "Parking Area",
    type: "hardscape",
    category: "paving",
    description: "Vehicle parking area",
    model: "Parking",
    icon: <ParkingSquare className="h-5 w-5" />,
    scale: [5, 0.1, 5]
  }
];

interface EnvironmentLibraryProps {
  onSelect: (template: EnvironmentTemplate) => void;
}

export function EnvironmentLibrary({ onSelect }: EnvironmentLibraryProps) {
  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">Environment Elements</h2>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {environmentTemplates.map((template) => (
            <Button
              key={template.id}
              variant="outline"
              className="w-full justify-start"
              onClick={() => onSelect(template)}
            >
              {template.icon}
              <div className="ml-2 text-left">
                <div className="font-medium">{template.name}</div>
                <div className="text-xs text-muted-foreground">
                  {template.description}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
