
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Box, Power, Network, Cable, Wifi, Server, Battery, Zap } from "lucide-react";
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
  subCategory?: string;
  description: string;
  dimensions: [number, number, number];
  color: string;
  isFoldable?: boolean;
  isOpen?: boolean;
  foldedHeight?: number;
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
    subCategory: "3-phase",
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
    subCategory: "3-phase",
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
    id: "whip-cable",
    name: "Whip Cable",
    type: "power-cable",
    category: "power-cables",
    subCategory: "3-phase",
    description: "Conduit with Multiple Conductors",
    dimensions: [1, 0.15, 0.15],
    color: "#ff0000",
    connectionPoints: [
      { type: "whip", position: [0, 0, 0] },
      { type: "whip", position: [1, 0, 0] }
    ],
    icon: <Power className="h-5 w-5" />
  },
  {
    id: "ups-battery",
    name: "UPS Battery Cable",
    type: "power-cable",
    category: "power-cables",
    subCategory: "ups",
    description: "High-amperage Battery Interconnect",
    dimensions: [1, 0.1, 0.1],
    color: "#ff6b00",
    connectionPoints: [
      { type: "ups-battery", position: [0, 0, 0] },
      { type: "ups-battery", position: [1, 0, 0] }
    ],
    icon: <Battery className="h-5 w-5" />
  },
  {
    id: "ups-output",
    name: "UPS Output Cable",
    type: "power-cable",
    category: "power-cables",
    subCategory: "ups",
    description: "UPS Output Power Distribution",
    dimensions: [1, 0.1, 0.1],
    color: "#ff6b00",
    connectionPoints: [
      { type: "ups-output", position: [0, 0, 0] },
      { type: "ups-output", position: [1, 0, 0] }
    ],
    icon: <Zap className="h-5 w-5" />
  },
  {
    id: "ups-input",
    name: "UPS Input Feeder",
    type: "power-cable",
    category: "power-cables",
    subCategory: "ups",
    description: "Main Power Input to UPS",
    dimensions: [1, 0.12, 0.12],
    color: "#ff6b00",
    connectionPoints: [
      { type: "ups-input", position: [0, 0, 0] },
      { type: "ups-input", position: [1, 0, 0] }
    ],
    icon: <Zap className="h-5 w-5" />
  }
];

const networkCables: ModuleTemplate[] = [
  {
    id: "cat5e",
    name: "Cat5e Ethernet",
    type: "network-cable",
    category: "network-cables",
    subCategory: "copper",
    description: "1 Gbps Ethernet",
    dimensions: [1, 0.05, 0.05],
    color: "#00ff00",
    connectionPoints: [
      { type: "cat5e", position: [0, 0, 0] },
      { type: "cat5e", position: [1, 0, 0] }
    ],
    icon: <Network className="h-5 w-5" />
  },
  {
    id: "cat6",
    name: "Cat6 Ethernet",
    type: "network-cable",
    category: "network-cables",
    subCategory: "copper",
    description: "1 Gbps with Better Performance",
    dimensions: [1, 0.05, 0.05],
    color: "#00ff00",
    connectionPoints: [
      { type: "cat6", position: [0, 0, 0] },
      { type: "cat6", position: [1, 0, 0] }
    ],
    icon: <Network className="h-5 w-5" />
  },
  {
    id: "cat6a",
    name: "Cat6a Ethernet",
    type: "network-cable",
    category: "network-cables",
    subCategory: "copper",
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
    id: "cat8",
    name: "Cat8 Ethernet",
    type: "network-cable",
    category: "network-cables",
    subCategory: "copper",
    description: "25-40 Gbps for Short Distances",
    dimensions: [1, 0.05, 0.05],
    color: "#00ff00",
    connectionPoints: [
      { type: "cat8", position: [0, 0, 0] },
      { type: "cat8", position: [1, 0, 0] }
    ],
    icon: <Network className="h-5 w-5" />
  },
  {
    id: "om3-fiber",
    name: "OM3 Multimode Fiber",
    type: "network-cable",
    category: "network-cables",
    subCategory: "fiber",
    description: "10 Gbps Multimode Fiber",
    dimensions: [1, 0.03, 0.03],
    color: "#00ffff",
    connectionPoints: [
      { type: "om3", position: [0, 0, 0] },
      { type: "om3", position: [1, 0, 0] }
    ],
    icon: <Cable className="h-5 w-5" />
  },
  {
    id: "om4-fiber",
    name: "OM4 Multimode Fiber",
    type: "network-cable",
    category: "network-cables",
    subCategory: "fiber",
    description: "40/100 Gbps Multimode Fiber",
    dimensions: [1, 0.03, 0.03],
    color: "#00ffff",
    connectionPoints: [
      { type: "om4", position: [0, 0, 0] },
      { type: "om4", position: [1, 0, 0] }
    ],
    icon: <Cable className="h-5 w-5" />
  },
  {
    id: "om5-fiber",
    name: "OM5 Multimode Fiber",
    type: "network-cable",
    category: "network-cables",
    subCategory: "fiber",
    description: "100 Gbps+ Multimode Fiber",
    dimensions: [1, 0.03, 0.03],
    color: "#00ffff",
    connectionPoints: [
      { type: "om5", position: [0, 0, 0] },
      { type: "om5", position: [1, 0, 0] }
    ],
    icon: <Cable className="h-5 w-5" />
  },
  {
    id: "os2-fiber",
    name: "OS2 Single-mode Fiber",
    type: "network-cable",
    category: "network-cables",
    subCategory: "fiber",
    description: "Long Distance Fiber",
    dimensions: [1, 0.03, 0.03],
    color: "#00ffff",
    connectionPoints: [
      { type: "os2", position: [0, 0, 0] },
      { type: "os2", position: [1, 0, 0] }
    ],
    icon: <Cable className="h-5 w-5" />
  },
  {
    id: "mtp-mpo",
    name: "MTP/MPO Fiber Trunk",
    type: "network-cable",
    category: "network-cables",
    subCategory: "fiber",
    description: "High-density Connections",
    dimensions: [1, 0.04, 0.04],
    color: "#00ffff",
    connectionPoints: [
      { type: "mtp-mpo", position: [0, 0, 0] },
      { type: "mtp-mpo", position: [1, 0, 0] }
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
  },
  {
    id: "foldable-container-20",
    name: "Foldable Container",
    type: "foldable",
    category: "modules",
    description: "20' Collapsible Container System",
    dimensions: [6.096, 2.591, 2.438],
    color: "#4a5568",
    isFoldable: true,
    isOpen: false,
    foldedHeight: 0.5,
    connectionPoints: [
      { type: "cat6a", position: [3.048, 0.5, 1.219] },
      { type: "400v-3phase", position: [3.048, 0.5, -1.219] }
    ],
    icon: <Box className="h-5 w-5" />
  },
  {
    id: "compact-edge-10",
    name: "Compact EDGE",
    type: "edge",
    category: "modules",
    description: "10' Compact Edge Computing Unit",
    dimensions: [3.048, 2.591, 2.438],
    color: "#2d3748",
    connectionPoints: [
      { type: "cat6a", position: [1.524, 0.5, 1.219] },
      { type: "208v-3phase", position: [1.524, 0.5, -1.219] }
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

function CableSection({ title, cables, subCategories }: { 
  title: string;
  cables: ModuleTemplate[];
  subCategories: string[];
}) {
  return (
    <AccordionItem value={title.toLowerCase()}>
      <AccordionTrigger>{title}</AccordionTrigger>
      <AccordionContent>
        <Accordion type="multiple" className="ml-4">
          {subCategories.map(subCat => (
            <AccordionItem key={subCat} value={subCat}>
              <AccordionTrigger className="text-sm">{subCat}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {cables
                    .filter(cable => cable.subCategory === subCat.toLowerCase())
                    .map(template => (
                      <DraggableModule key={template.id} template={template} />
                    ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </AccordionContent>
    </AccordionItem>
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

        <CableSection 
          title="Power Cables" 
          cables={powerCables}
          subCategories={["3-Phase", "UPS"]}
        />

        <CableSection 
          title="Network Cables" 
          cables={networkCables}
          subCategories={["Copper", "Fiber"]}
        />
      </Accordion>
    </ScrollArea>
  );
}
