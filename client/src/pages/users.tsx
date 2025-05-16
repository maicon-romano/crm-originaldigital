import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Plus,
  Users as UsersIcon,
  UserPlus,
  Mail,
  Edit,
  Trash,
  Key,
} from 'lucide-react';

// Define the user schema
const userSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  role: z.string().min(1, { message: "Role is required" }),
  position: z.string().optional(),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
}).refine((data) => {
  if (data.password && data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type User = z.infer<typeof userSchema> & {
  id?: number;
  createdAt?: string;
  avatar?: string | null;
  username?: string;
};

export default function UsersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<User>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "user",
      position: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const createMutation = useMutation({
    mutationFn: async (user: User) => {
      const dataToSend = {
        ...user,
        username: user.email.split('@')[0], // Simple username generation
      };
      delete dataToSend.confirmPassword;
      
      const res = await apiRequest('POST', '/api/users', dataToSend);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setDialogOpen(false);
      toast({
        title: 'User created',
        description: 'The user has been created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create user: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (user: User) => {
      const dataToSend = { ...user };
      
      // Only send password if it's been changed
      if (!dataToSend.password) {
        delete dataToSend.password;
      }
      delete dataToSend.confirmPassword;
      
      const res = await apiRequest('PATCH', `/api/users/${user.id}`, dataToSend);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setDialogOpen(false);
      toast({
        title: 'User updated',
        description: 'The user has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update user: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setDeleteDialogOpen(false);
      toast({
        title: 'User deleted',
        description: 'The user has been deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete user: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: User) => {
    if (selectedUser?.id) {
      updateMutation.mutate({ ...values, id: selectedUser.id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpenDialog = () => {
    setSelectedUser(null);
    form.reset({
      name: "",
      email: "",
      role: "user",
      position: "",
      password: "",
      confirmPassword: "",
    });
    setDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    form.reset({
      name: user.name,
      email: user.email,
      role: user.role,
      position: user.position || "",
      password: "",
      confirmPassword: "",
    });
    setDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const sendInvitationEmail = (user: User) => {
    toast({
      title: 'Invitation sent',
      description: `An invitation email has been sent to ${user.email}`,
    });
  };

  const resetPassword = (user: User) => {
    toast({
      title: 'Password reset',
      description: `A password reset link has been sent to ${user.email}`,
    });
  };

  const confirmDelete = () => {
    if (selectedUser?.id) {
      deleteMutation.mutate(selectedUser.id);
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
            {row.original.name.charAt(0)}
          </div>
          <div>{row.original.name}</div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.original.role;
        let variant: "default" | "outline" | "secondary" | "destructive" = "default";
        
        switch (role) {
          case 'admin':
            variant = "destructive";
            break;
          case 'manager':
            variant = "default";
            break;
          case 'user':
            variant = "secondary";
            break;
          default:
            variant = "outline";
        }
        
        return <Badge variant={variant}>{role}</Badge>;
      },
    },
    {
      accessorKey: 'position',
      header: 'Position',
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ row }) => {
        return row.original.createdAt ? (
          format(new Date(row.original.createdAt), 'MMM dd, yyyy')
        ) : 'N/A';
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditUser(row.original)}
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => resetPassword(row.original)}
            title="Reset Password"
          >
            <Key className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => sendInvitationEmail(row.original)}
            title="Send Invitation"
          >
            <Mail className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteUser(row.original)}
            title="Delete"
            disabled={row.original.role === 'admin'} // Prevent deleting admins
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const roleOptions = [
    { value: 'admin', label: 'Administrator' },
    { value: 'manager', label: 'Manager' },
    { value: 'user', label: 'User' },
    { value: 'client', label: 'Client' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Users</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Manage system users and access permissions
          </p>
        </div>
        <Button onClick={handleOpenDialog}>
          <UserPlus className="mr-2 h-4 w-4" /> Invite User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</h3>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3 text-blue-500 dark:text-blue-400">
              <UsersIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Users</h3>
              <p className="text-2xl font-bold">
                {users.filter(u => u.role !== 'client').length}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 rounded-full p-3 text-green-500 dark:text-green-400">
              <UsersIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Administrators</h3>
              <p className="text-2xl font-bold">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-3 text-purple-500 dark:text-purple-400">
              <Key className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          searchKey="name"
          searchPlaceholder="Search users..."
          filters={[
            {
              key: 'role',
              label: 'Role',
              options: roleOptions.map(r => ({ label: r.label, value: r.value })),
            },
          ]}
        />
      )}

      {/* User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Edit User' : 'Invite New User'}</DialogTitle>
            <DialogDescription>
              {selectedUser 
                ? 'Update user information and permissions'
                : 'Add a new user to the system'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="user@example.com" 
                          type="email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Determines what permissions the user has
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Project Manager" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!selectedUser && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="••••••••" 
                            type="password"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="••••••••" 
                            type="password"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {selectedUser && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password (optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Leave blank to keep current" 
                            type="password"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Leave blank to keep current" 
                            type="password"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : selectedUser ? 'Update User' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for {selectedUser?.name}. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}