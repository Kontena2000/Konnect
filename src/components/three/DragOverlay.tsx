
import { DragOverlay } from "@dnd-kit/core";
import { ModuleTemplate } from '@/types/module';

export interface DragOverlayProps {
  template: ModuleTemplate | null;
}

export function ModuleDragOverlay({ template }: DragOverlayProps) {
  if (!template) return null;

  return (
    <DragOverlay>
      <div className='p-4 border rounded-lg bg-background/30 backdrop-blur-[2px]'>
        <div className='flex items-center gap-3'>
          <div 
            className='w-12 h-12 rounded'
            style={{ backgroundColor: template.color }}
          />
          <div>
            <h3 className='font-medium'>{template.name}</h3>
            <p className='text-sm text-muted-foreground'>{template.description}</p>
          </div>
        </div>
      </div>
    </DragOverlay>
  );
}
