
import { useEffect, useCallback } from "react";

interface UseKeyboardShortcutsProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
}

export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onSave,
  onDelete
}: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key, ctrlKey, metaKey } = event;
    
    // Save - Ctrl/Cmd + S
    if ((ctrlKey || metaKey) && key === "s") {
      event.preventDefault();
      onSave?.();
    }
    
    // Undo - Ctrl/Cmd + Z
    if ((ctrlKey || metaKey) && key === "z" && !event.shiftKey) {
      event.preventDefault();
      onUndo?.();
    }
    
    // Redo - Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
    if ((ctrlKey || metaKey) && ((key === "z" && event.shiftKey) || key === "y")) {
      event.preventDefault();
      onRedo?.();
    }
    
    // Delete - Delete/Backspace
    if (key === "Delete" || key === "Backspace") {
      onDelete?.();
    }
  }, [onUndo, onRedo, onSave, onDelete]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
