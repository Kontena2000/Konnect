import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useRouter } from "next/router";
import { db, getFirestoreSafely } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

interface Project {
  id: string;
  name: string;
  description?: string;
  userId: string;
  sharedWith?: string[];
}

interface ProjectSelectorProps {
  selectedProjectId: string;
  onSelect: (projectId: string) => void;
  excludeCurrentProject?: boolean;
  className?: string;
  showCreateButton?: boolean;
}

export function ProjectSelector({ 
  selectedProjectId, 
  onSelect, 
  excludeCurrentProject = false, 
  className = "", 
  showCreateButton = true 
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const db = getFirestoreSafely();
        
        if (!db) {
          console.error('Firestore is not available');
          return;
        }
        
        // Query projects owned by the user
        const userProjectsQuery = query(
          collection(db, 'projects'),
          where('userId', '==', user.uid)
        );
        
        const userProjectsSnapshot = await getDocs(userProjectsQuery);
        const userProjects = userProjectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Project));
        
        // Query projects shared with the user
        const sharedProjectsQuery = query(
          collection(db, 'projects'),
          where('sharedWith', 'array-contains', user.email)
        );
        
        const sharedProjectsSnapshot = await getDocs(sharedProjectsQuery);
        const sharedProjects = sharedProjectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Project));
        
        // Combine and filter out the current project if needed
        let allProjects = [...userProjects, ...sharedProjects];
        
        if (excludeCurrentProject) {
          allProjects = allProjects.filter(project => project.id !== selectedProjectId);
        }
        
        setProjects(allProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, [user, selectedProjectId, excludeCurrentProject]);

  const handleCreateProject = () => {
    router.push("/dashboard/projects/new");
  };

  if (loading) {
    return <Skeleton className={`h-10 w-full ${className}`} />;
  }

  return (
    <div className={`flex gap-2 items-center ${className}`}>
      <Select
        value={selectedProjectId}
        onValueChange={onSelect}
        disabled={loading}
      >
        <SelectTrigger className='w-full'>
          <SelectValue placeholder='Select a project' />
        </SelectTrigger>
        <SelectContent>
          {projects.length === 0 ? (
            <div className='p-2 text-sm text-muted-foreground text-center'>
              {loading ? 'Loading projects...' : 'No projects found'}
            </div>
          ) : (
            projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      
      {showCreateButton && (
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleCreateProject}
          title="Create new project"
        >
          <PlusCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}