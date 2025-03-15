
import { DragOverlay } from "@dnd-kit/core";
import { ModuleTemplate } from "./ModuleLibrary";

interface DragPreviewProps {
  draggingTemplate: ModuleTemplate | null;
}

export function ModuleDragOverlay({ draggingTemplate }: DragPreviewProps) {
  if (!draggingTemplate) return null;

  return (
    <DragOverlay>
      <div className="p-4 border rounded-lg bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded"
            style={{ backgroundColor: draggingTemplate.color }}
          />
          <div>
            <h3 className="font-medium">{draggingTemplate.name}</h3>
            <p className="text-sm text-muted-foreground">{draggingTemplate.description}</p>
          </div>
        </div>
      </div>
    </DragOverlay>
  );
}
