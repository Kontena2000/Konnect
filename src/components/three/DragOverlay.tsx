
import { DragOverlay } from "@dnd-kit/core";
import { Module } from "@/types/module";
import { motion, AnimatePresence } from 'framer-motion';

export interface DragOverlayProps {
  template: Module | null;
}

export function ModuleDragOverlay({ template }: DragOverlayProps) {
  if (!template) return null;

  return (
    <AnimatePresence>
      <DragOverlay dropAnimation={null}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 25
            }
          }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className='fixed p-6 border rounded-lg bg-background/95 backdrop-blur-md shadow-2xl'
          style={{
            width: "320px",
            pointerEvents: "none",
            transform: "translate(-50%, -50%)"
          }}
        >
          <div className='space-y-4'>
            <div className='flex items-center gap-4'>
              <motion.div 
                className='w-16 h-16 rounded-md shadow-lg'
                style={{ backgroundColor: template.color }}
                animate={{
                  scale: [1, 1.05, 1],
                  transition: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              />
              <div>
                <h3 className='text-lg font-semibold'>{template.name}</h3>
                <p className='text-sm text-muted-foreground'>{template.description}</p>
              </div>
            </div>
            
            <div className='grid grid-cols-3 gap-2 text-center text-sm'>
              <div className='p-2 rounded-md bg-muted'>
                <div className='font-medium'>{template.dimensions.length}m</div>
                <div className='text-xs text-muted-foreground'>Length</div>
              </div>
              <div className='p-2 rounded-md bg-muted'>
                <div className='font-medium'>{template.dimensions.width}m</div>
                <div className='text-xs text-muted-foreground'>Width</div>
              </div>
              <div className='p-2 rounded-md bg-muted'>
                <div className='font-medium'>{template.dimensions.height}m</div>
                <div className='text-xs text-muted-foreground'>Height</div>
              </div>
            </div>

            <div className='flex items-center justify-center gap-2 text-xs text-muted-foreground'>
              <motion.div
                animate={{
                  opacity: [0.5, 1, 0.5],
                  transition: { duration: 1.5, repeat: Infinity }
                }}
              >
                Press R to rotate
              </motion.div>
              <span>•</span>
              <motion.div
                animate={{
                  opacity: [0.5, 1, 0.5],
                  transition: { duration: 1.5, repeat: Infinity, delay: 0.5 }
                }}
              >
                Hold Shift for guides
              </motion.div>
            </div>
          </div>
        </motion.div>
      </DragOverlay>
    </AnimatePresence>
  );
}
