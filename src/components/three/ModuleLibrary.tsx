
import { useCallback } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";

type PowerCableType = "208v-3phase" | "400v-3phase" | "whip" | "ups-battery" | "ups-output" | "ups-input";
type NetworkCableType = "cat5e" | "cat6" | "cat6a" | "cat8" | "om3" | "om4" | "om5" | "os2" | "mtp-mpo";
type ConnectionType = PowerCableType | NetworkCableType;

export interface ModuleTemplate {
  id: string;
  type: string;
  name: string;
  description?: string;
  color: string;
  dimensions: [number, number, number];
  connectionPoints?: Array<{
    position: [number, number, number];
    type: ConnectionType;
  }>;
}

interface NetworkCables {
  copper: ModuleTemplate[];
  fiber: ModuleTemplate[];
}

interface ModuleTemplates {
  modules: ModuleTemplate[];
  "power-cables": ModuleTemplate[];
  "network-cables": NetworkCables;
}

export const moduleTemplates: ModuleTemplates = {
  modules: [
    {
      id: "edge-container",
      type: "edge-container",
      name: "Edge Container",
      description: "Standard Edge Computing Container",
      color: "#808080",
      dimensions: [6.1, 2.9, 2.44],
      connectionPoints: [
        { position: [3.05, 1.45, 0], type: "208v-3phase" },
        { position: [-3.05, 1.45, 0], type: "cat6a" }
      ]
    },
    {
      id: "network-cabinet",
      type: "network-cabinet",
      name: "Network Cabinet",
      description: "Standard Network Equipment Cabinet",
      color: "#404040",
      dimensions: [0.8, 2.1, 1.2],
      connectionPoints: [
        { position: [0.4, 1.05, 0], type: "cat6a" },
        { position: [-0.4, 1.05, 0], type: "om4" }
      ]
    }
  ],
  "power-cables": [
    {
      id: "208v-3phase",
      type: "208v-3phase",
      name: "208V 3-Phase",
      description: "208V Three Phase Power Cable",
      color: "#ff0000",
      dimensions: [0.1, 0.1, 0.1]
    },
    {
      id: "400v-3phase",
      type: "400v-3phase",
      name: "400V 3-Phase",
      description: "400V Three Phase Power Cable",
      color: "#ff0000",
      dimensions: [0.1, 0.1, 0.1]
    }
  ],
  "network-cables": {
    copper: [
      {
        id: "cat6a",
        type: "cat6a",
        name: "CAT6A",
        description: "Category 6A Network Cable",
        color: "#00ff00",
        dimensions: [0.1, 0.1, 0.1]
      },
      {
        id: "cat8",
        type: "cat8",
        name: "CAT8",
        description: "Category 8 Network Cable",
        color: "#00ff00",
        dimensions: [0.1, 0.1, 0.1]
      }
    ],
    fiber: [
      {
        id: "om4",
        type: "om4",
        name: "OM4",
        description: "OM4 Multimode Fiber Cable",
        color: "#00ffff",
        dimensions: [0.1, 0.1, 0.1]
      },
      {
        id: "os2",
        type: "os2",
        name: "OS2",
        description: "OS2 Single Mode Fiber Cable",
        color: "#00ffff",
        dimensions: [0.1, 0.1, 0.1]
      }
    ]
  }
};

function ModuleItem({ template }: { template: ModuleTemplate }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: template.id,
    data: template
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`p-2 mb-2 rounded-lg border cursor-move transition-colors hover:bg-accent ${
        isDragging ? "opacity-50" : ""
      }`}
      style={{ touchAction: "none" }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-4 h-4 rounded"
          style={{ backgroundColor: template.color }}
        />
        <span>{template.name}</span>
      </div>
    </div>
  );
}

export function ModuleLibrary() {
  const renderModules = useCallback((templates: ModuleTemplate[]) => {
    return templates.map((template) => (
      <ModuleItem key={template.id} template={template} />
    ));
  }, []);

  return (
    <div className="space-y-4">
      <Collapsible defaultOpen>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="flex w-full justify-between">
            <span>Modules</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {renderModules(moduleTemplates.modules)}
        </CollapsibleContent>
      </Collapsible>

      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="flex w-full justify-between">
            <span>Power Cables</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {renderModules(moduleTemplates["power-cables"])}
        </CollapsibleContent>
      </Collapsible>

      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="flex w-full justify-between">
            <span>Network Cables</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4">
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex w-full justify-between pl-4"
              >
                <span>Copper</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4">
              {renderModules(moduleTemplates["network-cables"].copper)}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex w-full justify-between pl-4"
              >
                <span>Fiber</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4">
              {renderModules(moduleTemplates["network-cables"].fiber)}
            </CollapsibleContent>
          </Collapsible>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
