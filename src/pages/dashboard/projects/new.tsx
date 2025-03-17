import { useState } from "react";
import { useRouter } from "next/router";
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

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const defaultValues = {
    name: '',
    description: '',
    companyName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create a project",
      });
      return;
    }

    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Project name is required",
      });
      return;
    }

    try {
      setLoading(true);
      const projectData = {
        name: name.trim(),
        description: description.trim(),
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
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='name'>Project Name</Label>
                    <Input
                      id='name'
                      placeholder='Enter project name'
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full"
                      maxLength={100}
                    />
                    {errors.name && (
                      <p className='text-sm text-destructive'>Project name is required</p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='companyName'>Company Name</Label>
                    <Input
                      id='companyName'
                      placeholder='Enter company name'
                      {...register('companyName')}
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='description'>Description</Label>
                  <Textarea
                    id='description'
                    placeholder='Enter project description'
                    className='min-h-[100px]'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full"
                    maxLength={500}
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='clientEmail'>Client Email</Label>
                    <Input
                      id='clientEmail'
                      type='email'
                      placeholder='Enter client email'
                      {...register('clientEmail')}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='clientPhone'>Client Phone</Label>
                    <Input
                      id='clientPhone'
                      type='tel'
                      placeholder='Enter client phone'
                      {...register('clientPhone')}
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='clientAddress'>Client Address</Label>
                  <Textarea
                    id='clientAddress'
                    placeholder='Enter client address'
                    {...register('clientAddress')}
                  />
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