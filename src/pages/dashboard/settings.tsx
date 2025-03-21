
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
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import userService, { User } from '@/services/user';
import { Trash2, Loader2, RefreshCw } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ThemeEditor } from '@/components/settings/ThemeEditor';
import { ModuleManager } from '@/components/settings/ModuleManager';
import { Module } from '@/types/module';
import { FirebaseMonitor } from '@/components/settings/FirebaseMonitor';

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'editor' | 'admin' | 'viewer'>('editor');
  const [loading, setLoading] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [gridWeight, setGridWeight] = useState("1");
  const [gridColor, setGridColor] = useState("#808080");
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

  const handleResetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Success',
        description: 'Password reset email sent'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send password reset email'
      });
    }
  };

  return (
    <AppLayout>
      <div className='container py-8 space-y-6'>
        <h1 className='text-3xl font-bold'>Settings</h1>

        <Tabs defaultValue='theme'>
          <TabsList>
            <TabsTrigger value='theme'>Theme</TabsTrigger>
            <TabsTrigger value='grid-preferences'>Grid Preferences</TabsTrigger>
            <TabsTrigger value='modules'>Module Management</TabsTrigger>
            <TabsTrigger value='users'>Users</TabsTrigger>
            <TabsTrigger value='system'>System</TabsTrigger>
          </TabsList>

          <TabsContent value='theme'>
            <ThemeEditor />
          </TabsContent>

          <TabsContent value='grid-preferences'>
            <Card>
              <CardHeader>
                <CardTitle>Grid Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Grid Size</Label>
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
                <div className="space-y-2">
                  <Label>Grid Line Weight</Label>
                  <Select value={gridWeight} onValueChange={setGridWeight}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select line weight" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">Thin (0.5px)</SelectItem>
                      <SelectItem value="1">Normal (1px)</SelectItem>
                      <SelectItem value="2">Bold (2px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Grid Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={gridColor}
                      onChange={(e) => setGridColor(e.target.value)}
                      className="w-12 h-12 p-1"
                    />
                    <Input
                      value={gridColor}
                      onChange={(e) => setGridColor(e.target.value)}
                    />
                  </div>
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
                  visual properties, and connection points.
                </p>
              </CardHeader>
              <CardContent>
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
                    <div className='grid grid-cols-4 gap-4 p-4 font-medium border-b'>
                      <div>Email</div>
                      <div>Role</div>
                      <div>Actions</div>
                      <div>Password Reset</div>
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
                          <div key={user.id} className='grid grid-cols-4 gap-4 p-4 items-center'>
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
                            <div>
                              <Button 
                                variant='outline' 
                                size='icon'
                                onClick={() => handleResetPassword(user.email)}
                              >
                                <RefreshCw className='h-4 w-4' />
                              </Button>
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

          <TabsContent value='system' className='space-y-6'>
            <FirebaseMonitor />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
