
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Box, Power, Network, Cable, Wifi, Server } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type PowerCableType = "208v-3phase" | "400v-3phase" | "whip" | "ups-battery" | "ups-output" | "ups-input";
type NetworkCableType = "cat5e" | "cat6" | "cat6a" | "cat8" | "om3" | "om4" | "om5" | "os2" | "mtp-mpo";
type ConnectionType = PowerCableType | NetworkCableType;

export interface ModuleTemplate {
  id: string;
  name: string;
  type: string;
  category: "modules" | "power-cables" | "network-cables";
  description: string;
  dimensions: [number, number, number];
  color: string;
  connectionPoints: Array<{
    type: ConnectionType;
    position: [number, number, number];
  }>;
  icon: React.ReactNode;
}

const powerCables: ModuleTemplate[] = [
  {
    id: "208v-3phase",
    name: "208V 3-Phase Cable",
    type: "power-cable",
    category: "power-cables",
    description: "3-Phase 208V AC Power Distribution",
    dimensions: [1, 0.1, 0.1],
    color: "#ff0000",
    connectionPoints: [
      { type: "208v-3phase", position: [0, 0, 0] },
      { type: "208v-3phase", position: [1, 0, 0] }
    ],
    icon: <Power className="h-5 w-5" />
  },
  {
    id: "400v-3phase",
    name: "400V 3-Phase Cable",
    type: "power-cable",
    category: "power-cables",
    description: "3-Phase 400V AC Power Distribution",
    dimensions: [1, 0.1, 0.1],
    color: "#ff0000",
    connectionPoints: [
      { type: "400v-3phase", position: [0, 0, 0] },
      { type: "400v-3phase", position: [1, 0, 0] }
    ],
    icon: <Power className="h-5 w-5" />
  },
  {
    id: "ups-battery",
    name: "UPS Battery Cable",
    type: "power-cable",
    category: "power-cables",
    description: "High-amperage Battery Interconnect",
    dimensions: [1, 0.1, 0.1],
    color: "#ff0000",
    connectionPoints: [
      { type: "ups-battery", position: [0, 0, 0] },
      { type: "ups-battery", position: [1, 0, 0] }
    ],
    icon: <Power className="h-5 w-5" />
  }
];

const networkCables: ModuleTemplate[] = [
  {
    id: "cat6a",
    name: "Cat6a Ethernet",
    type: "network-cable",
    category: "network-cables",
    description: "10 Gbps up to 100m",
    dimensions: [1, 0.05, 0.05],
    color: "#00ff00",
    connectionPoints: [
      { type: "cat6a", position: [0, 0, 0] },
      { type: "cat6a", position: [1, 0, 0] }
    ],
    icon: <Network className="h-5 w-5" />
  },
  {
    id: "om4-fiber",
    name: "OM4 Multimode Fiber",
    type: "network-cable",
    category: "network-cables",
    description: "40/100 Gbps Multimode Fiber",
    dimensions: [1, 0.05, 0.05],
    color: "#00ff00",
    connectionPoints: [
      { type: "om4", position: [0, 0, 0] },
      { type: "om4", position: [1, 0, 0] }
    ],
    icon: <Cable className="h-5 w-5" />
  }
];

const modules: ModuleTemplate[] = [
  {
    id: "edge-container-20",
    name: "EDGE Container",
    type: "edge",
    category: "modules",
    description: "20' Standard Edge Computing Container",
    dimensions: [6.096, 2.591, 2.438],
    color: "#2d3748",
    connectionPoints: [
      { type: "cat6a", position: [3.048, 0.5, 1.219] },
      { type: "400v-3phase", position: [3.048, 0.5, -1.219] }
    ],
    icon: <Server className="h-5 w-5" />
  }
];

interface DraggableModuleProps {
  template: ModuleTemplate;
}

function DraggableModule({ template }: DraggableModuleProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: template.id,
    data: template
  });

  return (
    <Button
      ref={setNodeRef}
      variant="outline"
      className={`w-full justify-start ${isDragging ? "opacity-50" : ""}`}
      {...listeners}
      {...attributes}
    >
      {template.icon}
      <div className="ml-2 text-left">
        <div className="font-medium">{template.name}</div>
        <div className="text-xs text-muted-foreground">
          {template.description}
        </div>
      </div>
    </Button>
  );
}

export function ModuleLibrary() {
  return (
    <ScrollArea className="h-[400px] pr-4">
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="modules">
          <AccordionTrigger>Modules</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {modules.map((template) => (
                <DraggableModule key={template.id} template={template} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="power-cables">
          <AccordionTrigger>Power Cables</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {powerCables.map((template) => (
                <DraggableModule key={template.id} template={template} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="network-cables">
          <AccordionTrigger>Network Cables</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {networkCables.map((template) => (
                <DraggableModule key={template.id} template={template} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </ScrollArea>
  );
}
