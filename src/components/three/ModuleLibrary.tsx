
import { Card } from "@/components/ui/card";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

export interface ModuleTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  dimensions: [number, number, number];
  color: string;
  icon?: React.ReactNode;
}

interface ModuleItemProps {
  template: ModuleTemplate;
}

function ModuleItem({ template }: ModuleItemProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: template.id,
    data: template
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform)
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 border rounded-lg cursor-move hover:bg-accent transition-colors"
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-12 h-12 rounded"
          style={{ backgroundColor: template.color }}
        />
        <div>
          <h3 className="font-medium">{template.name}</h3>
          <p className="text-sm text-muted-foreground">{template.description}</p>
        </div>
      </div>
    </div>
  );
}

export function ModuleLibrary() {
  const moduleTemplates: ModuleTemplate[] = [
    {
      id: "datacenter-40ft",
      name: "40ft Data Center",
      type: "datacenter",
      description: "Standard 40ft container data center",
      dimensions: [12, 2.6, 2.4],
      color: "#2196F3"
    },
    {
      id: "ups-20ft",
      name: "20ft UPS Room",
      type: "ups",
      description: "UPS system in 20ft container",
      dimensions: [6, 2.6, 2.4],
      color: "#4CAF50"
    },
    {
      id: "chiller-pad",
      name: "Chiller Pad",
      type: "cooling",
      description: "External chiller unit",
      dimensions: [3, 1, 2],
      color: "#9C27B0"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {moduleTemplates.map((template) => (
          <ModuleItem key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}
