import { DragOverlay } from "@dnd-kit/core";
import { Module } from "@/types/module";
import { motion } from 'framer-motion';

export interface DragOverlayProps {
  template: Module | null;
}

export function ModuleDragOverlay({ template }: DragOverlayProps) {
  if (!template) return null;

  return (
    <DragOverlay dropAnimation={null}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className='p-4 border rounded-lg bg-background/30 backdrop-blur-[2px] shadow-lg'
      >
        <div className='flex items-center gap-3'>
          <div 
            className='w-12 h-12 rounded shadow-sm'
            style={{ backgroundColor: template.color }}
          />
          <div>
            <h3 className='font-medium'>{template.name}</h3>
            <p className='text-sm text-muted-foreground'>{template.description}</p>
            <div className='mt-2 text-xs text-muted-foreground'>
              {template.dimensions.length}m × {template.dimensions.width}m × {template.dimensions.height}m
            </div>
          </div>
        </div>
      </motion.div>
    </DragOverlay>
  );
}