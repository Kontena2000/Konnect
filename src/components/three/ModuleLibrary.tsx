import { useCallback, useEffect, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import moduleService from '@/services/module';

export type ModuleCategory = "konnect" | "power" | "network" | "cooling" | "environment";

type PowerCableType = "208v-3phase" | "400v-3phase" | "whip" | "ups-battery" | "ups-output" | "ups-input";
type NetworkCableType = "cat5e" | "cat6" | "cat6a" | "cat8" | "om3" | "om4" | "om5" | "os2" | "mtp-mpo";
type CoolingType = "chilled-water" | "refrigerant" | "air-duct";
export type ConnectionType = PowerCableType | NetworkCableType | CoolingType;

export interface ModuleTemplate {
  id: string;
  type: string;
  category: ModuleCategory;
  name: string;
  description?: string;
  color: string;
  dimensions: [number, number, number];
  connectionPoints?: Array<{
    position: [number, number, number];
    type: ConnectionType;
  }>;
}

export const moduleTemplates: Record<ModuleCategory, ModuleTemplate[]> = {
  konnect: [
    {
      id: 'edge-container',
      type: 'edge-container',
      category: 'konnect',
      name: 'Edge Container',
      description: 'Standard Edge Computing Container',
      color: '#808080',
      dimensions: [6.1, 2.9, 2.44],
      connectionPoints: [
        { position: [3.05, 1.45, 0], type: '208v-3phase' },
        { position: [-3.05, 1.45, 0], type: 'cat6a' }
      ]
    },
    {
      id: 'network-cabinet',
      type: 'network-cabinet',
      category: 'konnect',
      name: 'Network Cabinet',
      description: 'Standard Network Equipment Cabinet',
      color: '#404040',
      dimensions: [0.8, 2.1, 1.2],
      connectionPoints: [
        { position: [0.4, 1.05, 0], type: 'cat6a' },
        { position: [-0.4, 1.05, 0], type: 'om4' }
      ]
    }
  ],
  power: [
    {
      id: '208v-3phase',
      type: '208v-3phase',
      category: 'power',
      name: '208V 3-Phase',
      description: '208V Three Phase Power Cable',
      color: '#F1B73A',
      dimensions: [0.1, 0.1, 0.1]
    },
    {
      id: '400v-3phase',
      type: '400v-3phase',
      category: 'power',
      name: '400V 3-Phase',
      description: '400V Three Phase Power Cable',
      color: '#F1B73A',
      dimensions: [0.1, 0.1, 0.1]
    }
  ],
  network: [
    {
      id: 'cat6a',
      type: 'cat6a',
      category: 'network',
      name: 'CAT6A',
      description: 'Category 6A Network Cable',
      color: '#00ff00',
      dimensions: [0.1, 0.1, 0.1]
    },
    {
      id: 'om4',
      type: 'om4',
      category: 'network',
      name: 'OM4',
      description: 'OM4 Multimode Fiber Cable',
      color: '#00ffff',
      dimensions: [0.1, 0.1, 0.1]
    }
  ],
  cooling: [
    {
      id: 'chilled-water',
      type: 'chilled-water',
      category: 'cooling',
      name: 'Chilled Water',
      description: 'Chilled Water Cooling Pipe',
      color: '#0088ff',
      dimensions: [0.1, 0.1, 0.1]
    }
  ],
  environment: [
    {
      id: 'air-handler',
      type: 'air-handler',
      category: 'environment',
      name: 'Air Handler',
      description: 'Environmental Air Handler Unit',
      color: '#888888',
      dimensions: [1.2, 1.8, 0.6]
    }
  ]
};

function ModuleItem({ template, specs }: { template: ModuleTemplate; specs?: TechnicalSpecs }) {
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
      {specs && <div className="mt-2 text-sm text-gray-500">{JSON.stringify(specs)}</div>}
    </div>
  );
}

export function ModuleLibrary() {
  const [technicalSpecs, setTechnicalSpecs] = useState<Record<string, TechnicalSpecs>>({});

  useEffect(() => {
    const loadTechnicalSpecs = async () => {
      try {
        const modules = await moduleService.getAllModules();
        const specs = modules.reduce((acc, module) => {
          acc[module.type] = module.technicalSpecs;
          return acc;
        }, {} as Record<string, TechnicalSpecs>);
        setTechnicalSpecs(specs);
      } catch (error) {
        console.error('Error loading technical specs:', error);
      }
    };
    loadTechnicalSpecs();
  }, []);

  const renderModules = useCallback((templates: ModuleTemplate[]) => {
    return templates.map((template) => (
      <ModuleItem 
        key={template.id} 
        template={template}
        specs={technicalSpecs[template.type]}
      />
    ));
  }, [technicalSpecs]);

  const categories = [
    { id: "konnect" as ModuleCategory, name: "Konnect Modules" },
    { id: "power" as ModuleCategory, name: "Power Cables" },
    { id: "network" as ModuleCategory, name: "Network Cables" },
    { id: "cooling" as ModuleCategory, name: "Cooling Tubes" },
    { id: "environment" as ModuleCategory, name: "Environment" }
  ];

  return (
    <div className="space-y-4">
      {categories.map(category => (
        <Collapsible key={category.id}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex w-full justify-between">
              <span>{category.name}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {renderModules(moduleTemplates[category.id] || [])}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}