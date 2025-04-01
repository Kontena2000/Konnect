import { useEffect, useState } from "react";
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from "@/contexts/AuthContext";
import projectService, { Project, ProjectError } from "@/services/project";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Plus, Loader2, Trash2, Clock, Calendar, Building2, Mail, Phone, MapPin, Calculator } from 'lucide-react';
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const { toast } = useToast();

  const filteredAndSortedProjects = projects
    .filter(project => 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt.seconds - a.createdAt.seconds;
        case 'oldest':
          return a.createdAt.seconds - b.createdAt.seconds;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const handleDeleteProject = async (projectId: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to delete projects'
      });
      return;
    }
    
    try {
      await projectService.deleteProject(projectId, user.uid);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast({
        title: 'Success',
        description: 'Project deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof ProjectError ? error.message : 'Failed to delete project'
      });
    }
  };

  useEffect(() => {
    const loadProjects = async () => {
      if (!user) return;
      
      try {
        const userProjects = await projectService.getUserProjects(user.uid);
        setProjects(userProjects);
      } catch (error) {
        console.error('Error loading projects:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load projects. Please try again.'
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadProjects();
    }
  }, [user, authLoading, toast]);

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className='h-screen flex items-center justify-center'>
          <div className='flex items-center gap-2'>
            <Loader2 className='h-6 w-6 animate-spin' />
            <p>Loading projects...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <div className='space-y-8'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
          <h1 className='text-2xl md:text-3xl font-bold tracking-tight'>Projects</h1>
          <Link href='/dashboard/projects/new'>
            <Button className='bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-colors'>
              <Plus className='h-4 w-4 mr-2' />
              New Project
            </Button>
          </Link>
        </div>

        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4' />
            <Input
              placeholder='Search projects...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10 w-full'
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className='w-full sm:w-[180px]'>
              <SelectValue placeholder='Sort by' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='newest'>Newest First</SelectItem>
              <SelectItem value='oldest'>Oldest First</SelectItem>
              <SelectItem value='name'>Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredAndSortedProjects.length === 0 && !loading ? (
          <div className='text-center py-12'>
            <div className='rounded-lg border-2 border-dashed p-8 md:p-12 max-w-2xl mx-auto'>
              <h3 className='text-lg font-semibold mb-2'>No projects found</h3>
              <p className='text-muted-foreground mb-6'>
                {searchQuery ? 'No projects match your search criteria.' : 'Get started by creating your first project.'}
              </p>
              <Link href='/dashboard/projects/new'>
                <Button className='bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-colors'>
                  <Plus className='h-4 w-4 mr-2' />
                  Create Project
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className='grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {filteredAndSortedProjects.map((project) => (
              <Card key={project.id} className='flex flex-col h-full shadow-sm hover:shadow-md transition-shadow'>
                <CardHeader className='pb-4'>
                  <div className='flex justify-between items-start'>
                    <div className='space-y-2'>
                      <CardTitle className='text-xl'>{project.name}</CardTitle>
                      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                        <Calendar className='h-4 w-4' />
                        {format(project.createdAt.toDate(), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant='ghost' size='icon' className='text-red-500 hover:text-red-600 hover:bg-red-100'>
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Project</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this project? This action cannot be undone and all layouts will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteProject(project.id)}
                            className='bg-red-500 hover:bg-red-600'
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent className='flex-1 space-y-6 p-6'>
                  <div className='space-y-4'>
                    <p className='text-sm text-muted-foreground min-h-[2.5rem]'>
                      {project.description || 'No description'}
                    </p>
                    
                    {/* Client Details Section */}
                    <div className='space-y-2 border-t pt-4'>
                      {project.clientInfo?.name && (
                        <div className='flex items-center gap-2 text-sm'>
                          <Building2 className='h-4 w-4 text-muted-foreground' />
                          <span>{project.clientInfo.name}</span>
                        </div>
                      )}
                      {project.clientInfo?.email && (
                        <div className='flex items-center gap-2 text-sm'>
                          <Mail className='h-4 w-4 text-muted-foreground' />
                          <span>{project.clientInfo.email}</span>
                        </div>
                      )}
                      {project.clientInfo?.phone && (
                        <div className='flex items-center gap-2 text-sm'>
                          <Phone className='h-4 w-4 text-muted-foreground' />
                          <span>{project.clientInfo.phone}</span>
                        </div>
                      )}
                      {project.clientInfo?.address && (
                        <div className='flex items-center gap-2 text-sm'>
                          <MapPin className='h-4 w-4 text-muted-foreground' />
                          <span>{project.clientInfo.address}</span>
                        </div>
                      )}
                    </div>

                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                      <Clock className='h-4 w-4' />
                      Last modified: {format(project.updatedAt.toDate(), 'MMM d, yyyy')}
                    </div>
                    <div className='flex gap-2'>
                      <Badge variant='outline'>{(project.layouts || []).length} Layouts</Badge>
                      <Badge variant='outline'>{(project.calculations || []).length || 0} Calculations</Badge>
                      {project.status && (
                        <Badge variant='secondary'>{project.status}</Badge>
                      )}
                    </div>
                  </div>
                  <div className='flex flex-col gap-4'>
                    <Link href={`/dashboard/projects/${project.id}`} className='block'>
                      <Button variant='outline' className='w-full bg-background hover:bg-accent'>
                        Open Project
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}