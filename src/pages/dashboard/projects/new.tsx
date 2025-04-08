import { useState } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import projectService from "@/services/project";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Mail, Phone, MapPin } from "lucide-react";

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(500).optional().or(z.literal('')),
  status: z.enum(['planning', 'in-progress', 'completed', 'on-hold']).default('planning'),
  companyName: z.string().max(100).optional().or(z.literal('')),
  clientEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  clientPhone: z.string().max(20).optional().or(z.literal('')),
  clientAddress: z.string().max(200).optional().or(z.literal('')),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function NewProjectModal({ open, setOpen }: { open: boolean, setOpen: (value: boolean) => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'planning',
      companyName: '',
      clientEmail: '',
      clientPhone: '',
      clientAddress: '',
    },
  });

  const { register, handleSubmit, formState: { errors, isValid } } = form;

  const onSubmit = async (data: ProjectFormData) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to create a project", variant: "destructive" });
      return;
    }

    if (!isValid) {
      toast({ title: "Error", description: "Please fix the form errors before submitting", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const projectId = await projectService.createProject({ ...data, userId: user.uid });
      toast({ title: "Success", description: "Project created successfully", variant: "default" });
      setOpen(false);
      router.push(`/dashboard/projects/${projectId}`);
    } catch (error) {
      toast({ title: "Error", description: "Failed to create project. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Project Name</Label>
              <Input id="name" placeholder="Enter project name" {...register("name")} />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Enter project description" {...register("description")} rows={4} />
              {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value) => form.setValue("status", value as any)} value={form.watch("status")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client Information */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company Name
                  </Label>
                  <Input id="companyName" placeholder="Enter company name" {...register("companyName")} />
                </div>

                <div>
                  <Label htmlFor="clientEmail" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Client Email
                  </Label>
                  <Input id="clientEmail" placeholder="Enter client email" type="email" {...register("clientEmail")} />
                </div>

                <div>
                  <Label htmlFor="clientPhone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Client Phone
                  </Label>
                  <Input id="clientPhone" placeholder="Enter client phone" {...register("clientPhone")} />
                </div>

                <div>
                  <Label htmlFor="clientAddress" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Client Address
                  </Label>
                  <Input id="clientAddress" placeholder="Enter client address" {...register("clientAddress")} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
