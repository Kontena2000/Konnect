
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import userService, { User } from "@/services/user";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Search, Shield, ShieldAlert, ShieldCheck, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import authService from "@/services/auth";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "editor", "viewer"]),
});

export function UserManagement() {
  const { user, role } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "editor",
    },
  });

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user || role !== "admin") return;

      try {
        setLoading(true);
        const fetchedUsers = await userService.getUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load users. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, role, toast]);

  const handleAddUser = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsUpdating(true);
      await authService.register(values.email, values.password, values.role);
      
      // Refresh user list
      const fetchedUsers = await userService.getUsers();
      setUsers(fetchedUsers);
      
      setIsAddUserOpen(false);
      form.reset();
      
      toast({
        title: "Success",
        description: `User ${values.email} has been created successfully.`,
      });
    } catch (error: any) {
      console.error("Error adding user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create user. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: User["role"]) => {
    try {
      await userService.updateUserRole(userId, newRole);
      
      // Update local state
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      
      toast({
        title: "Success",
        description: "User role updated successfully.",
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user role. Please try again.",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await userService.deleteUser(userId);
      
      // Update local state
      setUsers(users.filter((u) => u.id !== userId));
      
      setUserToDelete(null);
      toast({
        title: "Success",
        description: "User deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user. Please try again.",
      });
    }
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: User["role"]) => {
    switch (role) {
      case "admin":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <ShieldAlert className="h-3 w-3" />
            Admin
          </Badge>
        );
      case "editor":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Editor
          </Badge>
        );
      case "viewer":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Viewer
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {role}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold">User Management</h2>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-colors">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account with the specified role.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddUser)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="user@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormDescription>
                        Minimum 6 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Admin: Full access | Editor: Can edit | Viewer: Read-only
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddUserOpen(false)}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create User"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search users by email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full max-w-md"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Select
                        defaultValue={user.role}
                        onValueChange={(value) => 
                          handleUpdateRole(user.id, value as User["role"])
                        }
                        disabled={user.email === "ruud@kontena.eu"}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder={getRoleBadge(user.role)} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <ShieldAlert className="h-4 w-4" />
                              Admin
                            </div>
                          </SelectItem>
                          <SelectItem value="editor">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4" />
                              Editor
                            </div>
                          </SelectItem>
                          <SelectItem value="viewer">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Viewer
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {format(user.createdAt, "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog
                        open={userToDelete === user.id}
                        onOpenChange={(open) => {
                          if (!open) setUserToDelete(null);
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-100"
                            onClick={() => setUserToDelete(user.id)}
                            disabled={user.email === "ruud@kontena.eu"}
                          >
                            <Trash2 className="h-4 w-4" />
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
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 max-w-3xl">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
        <div>
          <h3 className="font-medium text-amber-800">Important Note</h3>
          <p className="text-sm text-amber-700 mt-1">
            The default admin user (ruud@kontena.eu) cannot be deleted or have its role changed. 
            This is a system safeguard to ensure there is always at least one admin user.
          </p>
        </div>
      </div>
    </div>
  );
}
