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
}

interface ProjectSelectorProps {
  selectedProjectId?: string;
  onSelect: (projectId: string) => void;
  className?: string;
  showCreateButton?: boolean;
}

export function ProjectSelector({ 
  selectedProjectId, 
  onSelect, 
  className = "", 
  showCreateButton = true 
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        
        // Get Firestore instance safely
        const safeDb = getFirestoreSafely() || db;
        if (!safeDb) {
          throw new Error('Firestore is not available');
        }
        
        // Query projects owned by the user
        const userProjectsQuery = query(
          collection(safeDb, "projects"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        
        const userProjectsSnapshot = await getDocs(userProjectsQuery);
        
        // Query projects shared with the user (if user has email)
        const sharedProjectsDocs: QueryDocumentSnapshot<DocumentData>[] = [];
        if (user.email) {
          const sharedProjectsQuery = query(
            collection(safeDb, "projects"),
            where("sharedWith", "array-contains", user.email),
            orderBy("createdAt", "desc")
          );
          
          const sharedProjectsSnapshot = await getDocs(sharedProjectsQuery);
          sharedProjectsSnapshot.docs.forEach(doc => sharedProjectsDocs.push(doc));
        }
        
        // Combine both sets of projects
        const projectsList = [
          ...userProjectsSnapshot.docs,
          ...sharedProjectsDocs
        ].map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];
        
        setProjects(projectsList);
        
        // If no project is selected and we have projects, select the first one
        if (!selectedProjectId && projectsList.length > 0) {
          onSelect(projectsList[0].id);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        setError(error instanceof Error ? error.message : 'Failed to fetch projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user, selectedProjectId, onSelect]);

  const handleCreateProject = () => {
    router.push("/dashboard/projects/new");
  };

  if (loading) {
    return <Skeleton className={`h-10 w-full ${className}`} />;
  }

  if (error) {
    return <div className='text-sm text-red-500'>{error}</div>;
  }

  return (
    <div className={`flex gap-2 items-center ${className}`}>
      {projects.length > 0 ? (
        <Select 
          value={selectedProjectId} 
          onValueChange={onSelect}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="text-sm text-muted-foreground">No projects found</div>
      )}
      
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