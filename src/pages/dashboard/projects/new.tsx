import { useState } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import projectService from "@/services/project";
import { Building2, Mail, Phone, MapPin } from 'lucide-react';

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

export default function NewProjectPage() {
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
    }
  });

  const { register, handleSubmit, formState: { errors } } = form;

  const onSubmit = async (data: ProjectFormData) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to create a project',
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Creating project with data:', data);
      
      const projectData = {
        ...data,
        ownerId: user.uid,
        status: data.status || 'planning'
      };

      const projectId = await projectService.createProject(projectData);
      
      toast({
        title: 'Success',
        description: 'Project created successfully',
      });

      router.push(`/dashboard/projects/${projectId}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create project. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-4xl'>
        <div className='flex items-center justify-between mb-8'>
          <h1 className='text-3xl font-bold'>Create New Project</h1>
          <Button variant='outline' onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
              <div className='space-y-4'>
                <div>
                  <Label htmlFor='name'>Project Name</Label>
                  <Input
                    id='name'
                    placeholder='Enter project name'
                    {...register('name')}
                    aria-describedby='name-error'
                  />
                  {errors.name && (
                    <p id='name-error' className='text-sm text-destructive mt-1'>
                      {errors.name.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor='description'>Description</Label>
                  <Textarea
                    id='description'
                    placeholder='Enter project description'
                    {...register('description')}
                    rows={4}
                  />
                  {errors.description && (
                    <p className='text-sm text-destructive mt-1'>
                      {errors.description.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor='status'>Status</Label>
                  <Select
                    {...register('status')}
                    onValueChange={(value) => form.setValue('status', value as any)}
                    value={form.watch('status')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='planning'>Planning</SelectItem>
                      <SelectItem value='in-progress'>In Progress</SelectItem>
                      <SelectItem value='completed'>Completed</SelectItem>
                      <SelectItem value='on-hold'>On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Client Information Section */}
                <div className='pt-4 border-t'>
                  <h3 className='text-lg font-medium mb-4'>Client Information</h3>
                  
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='companyName' className='flex items-center gap-2'>
                        <Building2 className='h-4 w-4' />
                        Company Name
                      </Label>
                      <Input
                        id='companyName'
                        placeholder='Enter company name'
                        {...register('companyName')}
                      />
                      {errors.companyName && (
                        <p className='text-sm text-destructive mt-1'>
                          {errors.companyName.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor='clientEmail' className='flex items-center gap-2'>
                        <Mail className='h-4 w-4' />
                        Client Email
                      </Label>
                      <Input
                        id='clientEmail'
                        placeholder='Enter client email'
                        type='email'
                        {...register('clientEmail')}
                      />
                      {errors.clientEmail && (
                        <p className='text-sm text-destructive mt-1'>
                          {errors.clientEmail.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor='clientPhone' className='flex items-center gap-2'>
                        <Phone className='h-4 w-4' />
                        Client Phone
                      </Label>
                      <Input
                        id='clientPhone'
                        placeholder='Enter client phone'
                        {...register('clientPhone')}
                      />
                      {errors.clientPhone && (
                        <p className='text-sm text-destructive mt-1'>
                          {errors.clientPhone.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor='clientAddress' className='flex items-center gap-2'>
                        <MapPin className='h-4 w-4' />
                        Client Address
                      </Label>
                      <Input
                        id='clientAddress'
                        placeholder='Enter client address'
                        {...register('clientAddress')}
                      />
                      {errors.clientAddress && (
                        <p className='text-sm text-destructive mt-1'>
                          {errors.clientAddress.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className='flex justify-end'>
                <Button 
                  type='submit' 
                  className='bg-[#F1B73A] hover:bg-[#F1B73A]/90 text-black'
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}