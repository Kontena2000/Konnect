
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Box, Power, Network, Cable, Wifi, Server, Battery, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export type PowerCableType = "208v-3phase" | "400v-3phase" | "whip" | "ups-battery" | "ups-output" | "ups-input";
export type NetworkCableType = "cat5e" | "cat6" | "cat6a" | "cat8" | "om3" | "om4" | "om5" | "os2" | "mtp-mpo";
export type ConnectionType = PowerCableType | NetworkCableType;

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

// Keep existing module data arrays but export them
export const powerCables: ModuleTemplate[] = [/* existing power cables data */];
export const networkCables: ModuleTemplate[] = [/* existing network cables data */];
export const modules: ModuleTemplate[] = [/* existing modules data */];

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
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`relative border-r transition-all duration-200 ${collapsed ? "w-12" : "w-80"}`}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-4 top-2 z-10"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>
      
      {!collapsed ? (
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
      ) : (
        <div className="flex flex-col items-center pt-2 space-y-4">
          <Button variant="ghost" size="icon">
            <Server className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Power className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Network className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
