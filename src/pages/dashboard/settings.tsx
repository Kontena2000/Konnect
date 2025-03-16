import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppLayout } from "@/components/layout/AppLayout";
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import userService, { User } from '@/services/user';
import { Trash2, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ThemeEditor } from '@/components/settings/ThemeEditor';
import { ModuleManager } from '@/components/settings/ModuleManager';
import { moduleTemplates, ModuleTemplate, ModuleCategory, moduleTemplatesByCategory } from '@/types/module';

interface ModuleInputProps {
  module: ModuleTemplate;
}

function ModuleInput({ module }: ModuleInputProps) {
  return (
    <Card key={module.id}>
      <CardContent className='pt-6'>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <Label>Name</Label>
            <Input defaultValue={module.name} />
          </div>
          <div>
            <Label>Type</Label>
            <Input defaultValue={module.type} />
          </div>
          <div>
            <Label>Dimensions (m)</Label>
            <Input 
              defaultValue={`${module.dimensions.length} x ${module.dimensions.width} x ${module.dimensions.height}`} 
            />
          </div>
          <div>
            <Label>Color</Label>
            <Input defaultValue={module.color} />
          </div>
          {module.description && (
            <div className='col-span-2'>
              <Label>Description</Label>
              <Input defaultValue={module.description} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'editor' | 'admin' | 'viewer'>('editor');
  const [loading, setLoading] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const { toast } = useToast();

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const loadedUsers = await userService.getUsers();
      setUsers(loadedUsers);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load users'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleAddUser = async () => {
    if (!newUserEmail) return;
    
    setAddingUser(true);
    try {
      const newUser = await userService.addUser(newUserEmail, newUserRole);
      setUsers(prev => [...prev, newUser]);
      setNewUserEmail('');
      toast({
        title: 'Success',
        description: 'User added successfully'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add user'
      });
    } finally {
      setAddingUser(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: User['role']) => {
    try {
      await userService.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      toast({
        title: 'Success',
        description: 'User role updated'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update user role'
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await userService.deleteUser(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
      toast({
        title: 'Success',
        description: 'User deleted'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete user'
      });
    }
  };

  return (
    <AppLayout>
      <div className='container py-8 space-y-6'>
        <h1 className='text-3xl font-bold'>Settings</h1>

        <Tabs defaultValue='profile'>
          <TabsList>
            <TabsTrigger value='profile'>Profile</TabsTrigger>
            <TabsTrigger value='theme'>Theme</TabsTrigger>
            <TabsTrigger value='preferences'>Preferences</TabsTrigger>
            <TabsTrigger value='modules'>Module Management</TabsTrigger>
            <TabsTrigger value='users'>Users</TabsTrigger>
          </TabsList>

          <TabsContent value='theme'>
            <ThemeEditor />
          </TabsContent>

          <TabsContent value='profile'>
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Your email" />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='preferences'>
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select defaultValue="system">
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Layout Grid Size</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue placeholder="Select grid size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (0.5m)</SelectItem>
                      <SelectItem value="medium">Medium (1m)</SelectItem>
                      <SelectItem value="large">Large (2m)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button>Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='modules'>
            <Card>
              <CardHeader>
                <CardTitle>Module Management</CardTitle>
                <p className='text-muted-foreground'>
                  Create and manage your module library, including technical specifications, 
                  visual properties, and connection points. Configure which modules are visible 
                  in the editor and organize them by category.
                </p>
              </CardHeader>
              <CardContent>
                <div className='mb-6 p-4 bg-muted rounded-lg'>
                  <h3 className='font-semibold mb-2'>Unified Module Management</h3>
                  <ul className='list-disc pl-4 space-y-1 text-sm text-muted-foreground'>
                    <li>Create and edit modules with detailed specifications</li>
                    <li>Configure visual properties and connection points</li>
                    <li>Organize modules by category</li>
                    <li>Control module visibility in the editor</li>
                    <li>Search and filter your module library</li>
                  </ul>
                </div>
                <ModuleManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='users'>
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-center gap-4'>
                    <Input 
                      placeholder='Email address' 
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                    />
                    <Select 
                      value={newUserRole}
                      onValueChange={(value: 'admin' | 'editor' | 'viewer') => setNewUserRole(value)}
                    >
                      <SelectTrigger className='w-[200px]'>
                        <SelectValue placeholder='Select role' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='admin'>Admin</SelectItem>
                        <SelectItem value='editor'>Editor</SelectItem>
                        <SelectItem value='viewer'>Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddUser} disabled={addingUser || !newUserEmail}>
                      {addingUser ? (
                        <>
                          <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                          Adding...
                        </>
                      ) : (
                        'Add User'
                      )}
                    </Button>
                  </div>

                  <div className='border rounded-lg'>
                    <div className='grid grid-cols-3 gap-4 p-4 font-medium border-b'>
                      <div>Email</div>
                      <div>Role</div>
                      <div>Actions</div>
                    </div>
                    <div className='divide-y'>
                      {loading ? (
                        <div className='p-4 text-center'>
                          <Loader2 className='h-6 w-6 animate-spin mx-auto' />
                        </div>
                      ) : users.length === 0 ? (
                        <div className='p-4 text-center text-muted-foreground'>
                          No users found
                        </div>
                      ) : (
                        users.map((user) => (
                          <div key={user.id} className='grid grid-cols-3 gap-4 p-4 items-center'>
                            <div>{user.email}</div>
                            <div>
                              <Select
                                value={user.role}
                                onValueChange={(value: User['role']) => handleUpdateRole(user.id, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value='admin'>Admin</SelectItem>
                                  <SelectItem value='editor'>Editor</SelectItem>
                                  <SelectItem value='viewer'>Viewer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant='destructive' size='icon'>
                                    <Trash2 className='h-4 w-4' />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this user? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}