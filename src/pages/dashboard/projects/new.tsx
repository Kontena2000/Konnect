
import { useState } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import projectService from "@/services/project";
import { Building2, Mail, Phone, MapPin } from 'lucide-react';

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().max(500).optional(),
  companyName: z.string().max(100).optional(),
  clientEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  clientPhone: z.string().max(20).optional(),
  clientAddress: z.string().max(200).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      companyName: "",
      clientEmail: "",
      clientPhone: "",
      clientAddress: "",
    },
  });

  const { register, handleSubmit, formState: { errors } } = form;

  const onSubmit = async (data: ProjectFormData) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create a project",
      });
      return;
    }

    try {
      setLoading(true);
      const projectData = {
        ...data,
        ownerId: user.uid,
      };

      const projectId = await projectService.createProject(projectData);
      
      toast({
        title: "Success",
        description: "Project created successfully",
      });

      router.push(`/dashboard/projects/${projectId}`);
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Create New Project</h1>
        <Card className="shadow-lg">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter project name"
                      {...register("name")}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      placeholder="Enter company name"
                      {...register("companyName")}
                    />
                    {errors.companyName && (
                      <p className="text-sm text-destructive">{errors.companyName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter project description"
                    className="min-h-[100px]"
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Client Email
                      </span>
                    </Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      placeholder="Enter client email"
                      {...register("clientEmail")}
                    />
                    {errors.clientEmail && (
                      <p className="text-sm text-destructive">{errors.clientEmail.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientPhone">
                      <span className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Client Phone
                      </span>
                    </Label>
                    <Input
                      id="clientPhone"
                      type="tel"
                      placeholder="Enter client phone"
                      {...register("clientPhone")}
                    />
                    {errors.clientPhone && (
                      <p className="text-sm text-destructive">{errors.clientPhone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientAddress">
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Client Address
                    </span>
                  </Label>
                  <Textarea
                    id="clientAddress"
                    placeholder="Enter client address"
                    {...register("clientAddress")}
                  />
                  {errors.clientAddress && (
                    <p className="text-sm text-destructive">{errors.clientAddress.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Project"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
