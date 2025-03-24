
{/* Updated SceneContainer.tsx with fixed memory performance monitoring */}
import { Canvas, useThree } from "@react-three/fiber";
import { useDroppable } from "@dnd-kit/core";
import { Module } from "@/types/module";
import { Connection } from "@/services/layout";
import { ConnectionType } from "@/types/connection";
import type { EnvironmentalElement as ElementType, TerrainData } from "@/services/environment";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Vector2, Vector3, Box3, Line3, Material, Mesh } from "three";
import { cn } from "@/lib/utils";
import { SceneElements } from "./SceneElements";
import { Html } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { SceneContent } from './SceneContent';
import { useToast } from '@/hooks/use-toast';
import { GridHelper } from './GridHelper';
import { EditorPreferences } from '@/services/editor-preferences';
import firebaseMonitor from '@/services/firebase-monitor';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
}

const getMemoryUsage = (): number => {
  try {
    if (typeof window !== 'undefined' && 
        window.performance && 
        'memory' in performance && 
        typeof (performance as any).memory?.usedJSHeapSize === 'number' && 
        typeof (performance as any).memory?.jsHeapSizeLimit === 'number') {
      return ((performance as any).memory.usedJSHeapSize / 
              (performance as any).memory.jsHeapSizeLimit) * 100;
    }
    return 0;
  } catch {
    return 0;
  }
};

// Rest of the file remains unchanged...
