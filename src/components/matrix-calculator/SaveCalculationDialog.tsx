import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getFirestoreSafely } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, setDoc, Timestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { ProjectSelector } from "@/components/common/ProjectSelector";
import { CalculationOptions } from "@/services/matrixCalculatorService";
import { useRouter } from 'next/router';

interface SaveCalculationDialogProps {
  config: {
    kwPerRack: number;
    coolingType: string;
    totalRacks: number;
  };
  results: any;
  options: CalculationOptions;
  onSaveComplete?: (calculationId: string, projectId: string) => void;
  trigger: React.ReactNode;
}

export function SaveCalculationDialog({ 
  config, 
  results, 
  options, 
  onSaveComplete, 
  trigger 
}: SaveCalculationDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  
  // If we're on a project page, pre-select that project
  useEffect(() => {
    const { projectId } = router.query;
    if (projectId && typeof projectId === 'string') {
      setSelectedProjectId(projectId);
      console.log('Pre-selected project ID from URL:', projectId);
    }
  }, [router.query]);
  
  const handleSave = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to save calculations'
      });
      return;
    }
    
    if (!selectedProjectId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a project to save to'
      });
      return;
    }
    
    try {
      setSaving(true);
      console.log('Saving calculation with config:', config);
      console.log('Results to save:', results);
      console.log('Selected project ID:', selectedProjectId);
      
      // Get Firestore instance safely
      const safeDb = getFirestoreSafely();
      if (!safeDb) {
        throw new Error('Firestore is not available');
      }

      // First, ensure the matrix_calculator/user_configurations document exists
      try {
        const configsRef = doc(safeDb, 'matrix_calculator', 'user_configurations');
        await setDoc(configsRef, {
          created: serverTimestamp(),
          description: 'User calculation configurations'
        }, { merge: true });
        console.log('Ensured user_configurations document exists');
      } catch (error) {
        console.error('Error ensuring user_configurations document exists:', error);
        // Continue anyway as the collection might already exist
      }

      // Create a timestamp for createdAt and updatedAt
      const now = Timestamp.now();

      // Prepare calculation data - ensure all data is serializable
      const calculationData = {
        name: name || `${config.kwPerRack}kW ${config.coolingType} configuration`,
        description: description || `${config.totalRacks} racks at ${config.kwPerRack}kW per rack`,
        userId: user.uid,
        projectId: selectedProjectId,
        createdAt: now,
        updatedAt: now,
        kwPerRack: config.kwPerRack,
        coolingType: config.coolingType,
        totalRacks: config.totalRacks,
        options: JSON.parse(JSON.stringify(options)), // Ensure serializable
        results: JSON.parse(JSON.stringify(results))  // Ensure serializable
      };
      
      // Create calculation document
      const calculationsRef = collection(safeDb, 'matrix_calculator', 'user_configurations', 'configs');
      const docRef = await addDoc(calculationsRef, calculationData);
      
      console.log('Calculation saved successfully with ID:', docRef.id);
      
      toast({
        title: 'Success',
        description: 'Calculation saved successfully'
      });
      
      if (onSaveComplete) {
        // Always pass a string for projectId
        onSaveComplete(docRef.id, selectedProjectId);
      }
      
      // Reset form and close dialog
      setName('');
      setDescription('');
      setOpen(false);
      
    } catch (error) {
      console.error('Error saving calculation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to save calculation: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={() => setOpen(true)}>
        {trigger}
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Save Calculation</DialogTitle>
          <DialogDescription>
            Save this calculation to a project for future reference.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <Label htmlFor='project'>Project</Label>
            <ProjectSelector
              selectedProjectId={selectedProjectId}
              onSelect={setSelectedProjectId}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='name'>Name</Label>
            <Input
              id='name'
              placeholder={`${config.kwPerRack}kW ${config.coolingType} configuration`}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              placeholder={`${config.totalRacks} racks at ${config.kwPerRack}kW per rack`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Saving...
              </>
            ) : (
              'Save Calculation'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}