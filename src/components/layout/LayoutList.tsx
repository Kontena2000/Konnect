
import { useState, useEffect } from 'react';
import { Layout } from '@/services/layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/router';
import { Edit, Eye, Calendar, Save } from 'lucide-react';
import { DeleteLayoutDialog } from './DeleteLayoutDialog';
import { formatDistanceToNow } from 'date-fns';
import layoutService from '@/services/layout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface LayoutListProps {
  projectId: string;
  onRefresh?: () => void;
}

export function LayoutList({ projectId, onRefresh }: LayoutListProps) {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchLayouts = async () => {
      if (!projectId) return;
      
      try {
        setLoading(true);
        const projectLayouts = await layoutService.getProjectLayouts(projectId);
        setLayouts(projectLayouts);
      } catch (error) {
        console.error('Error fetching layouts:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load layouts'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchLayouts();
  }, [projectId, toast]);

  const handleDeleteComplete = async () => {
    // Refresh layouts after deletion
    try {
      const projectLayouts = await layoutService.getProjectLayouts(projectId);
      setLayouts(projectLayouts);
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error refreshing layouts:', error);
    }
  };

  const handleEditLayout = (layoutId: string) => {
    router.push(`/dashboard/projects/${projectId}/editor?layoutId=${layoutId}`);
  };

  const handleViewLayout = (layoutId: string) => {
    router.push(`/view/${layoutId}`);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (layouts.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground mb-4">No layouts found for this project</p>
          <Button 
            onClick={() => router.push(`/dashboard/projects/${projectId}/editor`)}
            className="bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black"
          >
            <Save className="mr-2 h-4 w-4" />
            Create New Layout
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {layouts.map((layout) => (
        <Card key={layout.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{layout.name}</CardTitle>
              <DeleteLayoutDialog 
                layoutId={layout.id}
                layoutName={layout.name}
                onDeleteComplete={handleDeleteComplete}
              />
            </div>
            <CardDescription className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                Updated {formatDistanceToNow(new Date(layout.updatedAt), { addSuffix: true })}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {layout.description || 'No description provided'}
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="font-medium">{layout.modules?.length || 0}</span> modules, 
              <span className="font-medium ml-1">{layout.connections?.length || 0}</span> connections
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => handleViewLayout(layout.id)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View
            </Button>
            <Button 
              size="sm" 
              className="flex-1 bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black"
              onClick={() => handleEditLayout(layout.id)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
