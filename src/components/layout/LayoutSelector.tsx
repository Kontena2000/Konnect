
import { useState } from "react";
import { Layout } from "@/services/layout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import layoutService from "@/services/layout";
import { useToast } from "@/hooks/use-toast";

interface LayoutSelectorProps {
  projectId: string;
  layouts: Layout[];
  currentLayout: Layout | null;
  onLayoutChange: (layout: Layout) => void;
  onLayoutCreate: (layout: Layout) => void;
}

export function LayoutSelector({
  projectId,
  layouts,
  currentLayout,
  onLayoutChange,
  onLayoutCreate
}: LayoutSelectorProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState("");
  const [newLayoutDescription, setNewLayoutDescription] = useState("");
  const { toast } = useToast();

  const handleCreateLayout = async () => {
    try {
      const layoutId = await layoutService.createLayout({
        projectId,
        name: newLayoutName,
        description: newLayoutDescription,
        modules: [],
        connections: []
      });

      // Fetch the complete layout with all fields
      const layouts = await layoutService.getProjectLayouts(projectId);
      const newLayout = layouts.find(l => l.id === layoutId);
      
      if (newLayout) {
        onLayoutCreate(newLayout);
        setIsCreateOpen(false);
        setNewLayoutName("");
        setNewLayoutDescription("");
        toast({
          title: "Success",
          description: "New layout created"
        });
      }
    } catch (error) {
      console.error("Layout creation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create layout"
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentLayout?.id}
        onValueChange={(value) => {
          const layout = layouts.find((l) => l.id === value);
          if (layout) onLayoutChange(layout);
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select layout" />
        </SelectTrigger>
        <SelectContent>
          {layouts.map((layout) => (
            <SelectItem key={layout.id} value={layout.id}>
              {layout.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Layout</DialogTitle>
            <DialogDescription>
              Create a new layout for your project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newLayoutName}
                onChange={(e) => setNewLayoutName(e.target.value)}
                placeholder="Layout name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newLayoutDescription}
                onChange={(e) => setNewLayoutDescription(e.target.value)}
                placeholder="Layout description (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateLayout} 
              disabled={!newLayoutName}
              className="bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black"
            >
              Create Layout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
