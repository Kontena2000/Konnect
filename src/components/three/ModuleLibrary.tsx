
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Module } from "@/types/module";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Eye, EyeOff, Loader2, RefreshCcw } from "lucide-react";
import moduleService from "@/services/module";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Filter, Box, Truck, Trees, Database, Server, Leaf } from 'lucide-react';

// Rest of the component code remains the same, just update the icon usage:

// Update in getCategoryIcon function:
const getCategoryIcon = (categoryId: string) => {
  switch (categoryId.toLowerCase()) {
    case 'konnect':
      return <Server className='h-4 w-4 mr-2' />;
    case 'network':
      return <Database className='h-4 w-4 mr-2' />;
    case 'piping':
      return <Box className='h-4 w-4 mr-2' />;
    case 'environment':
      return <Trees className='h-4 w-4 mr-2' />;
    default:
      return <Truck className='h-4 w-4 mr-2' />;
  }
};

// Update in the module rendering section:
{module.type === 'container' && <Truck className='h-5 w-5 text-white' />}
{module.type === 'vegetation' && <Leaf className='h-5 w-5 text-white' />}

// Rest of the ModuleLibrary component implementation remains exactly the same...
