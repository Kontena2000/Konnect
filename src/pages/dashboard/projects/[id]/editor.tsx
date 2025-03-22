
{/* Updating editor.tsx with fixed dependencies and imports */}
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layout/AppLayout";
import { SceneContainer } from "@/components/three/SceneContainer";
import { ModuleLibrary } from "@/components/three/ModuleLibrary";
import { ModuleDragOverlay } from "@/components/three/DragOverlay";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, Undo, Redo, Loader2, Grid } from "lucide-react";
import { DndContext, DragEndEvent, DragStartEvent, useSensor, useSensors, MouseSensor, TouchSensor } from "@dnd-kit/core";
import { ModuleProperties } from "@/components/three/ModuleProperties";
import { ConnectionManager } from "@/components/three/ConnectionManager";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import projectService from "@/services/project";
import { LayoutSelector } from "@/components/layout/LayoutSelector";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useModuleState } from "@/hooks/use-module-state";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { Module } from '@/types/module';
import { ConnectionType } from '@/types/connection';
import { useEditorSensors } from '@/hooks/use-editor-sensors';
import layoutService, { Layout, Connection } from '@/services/layout';
import { motion } from "framer-motion";
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { Mesh } from 'three';
import { useHotkeys } from 'react-hotkeys-hook';
import { Toolbox } from '@/components/layout/Toolbox';
import { useAuth } from '@/contexts/AuthContext';
import editorPreferencesService, { EditorPreferences } from '@/services/editor-preferences';

{/* Rest of the file content remains the same, just updating the imports and dependencies */}

// Update handleUndo with correct dependencies
const handleUndo = useCallback(() => {
  if (undoStack.length > 0) {
    isUndoingOrRedoing.current = true;
    const previousState = undoStack[undoStack.length - 1];
    const currentState = { modules, connections };
    
    const newUndoStack = undoStack.slice(0, -1);
    const newRedoStack = [...redoStack, currentState];
    
    setUndoStack(newUndoStack);
    setRedoStack(newRedoStack);
    setModules(previousState.modules);
    setConnections(previousState.connections);
    
    setTimeout(() => {
      isUndoingOrRedoing.current = false;
    }, 50);
  }
}, [undoStack, redoStack, modules, connections, setModules, setConnections]);

// Update handleRedo with correct dependencies
const handleRedo = useCallback(() => {
  if (redoStack.length > 0) {
    isUndoingOrRedoing.current = true;
    const nextState = redoStack[redoStack.length - 1];
    const currentState = { modules, connections };
    
    const newUndoStack = [...undoStack, currentState];
    const newRedoStack = redoStack.slice(0, -1);
    
    setUndoStack(newUndoStack);
    setRedoStack(newRedoStack);
    setModules(nextState.modules);
    setConnections(nextState.connections);
    
    setTimeout(() => {
      isUndoingOrRedoing.current = false;
    }, 50);
  }
}, [undoStack, redoStack, modules, connections, setModules, setConnections]);

{/* Rest of the file content remains the same */}
