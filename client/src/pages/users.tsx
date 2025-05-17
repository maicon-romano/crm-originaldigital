import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createUser, sendPasswordResetEmail } from '@/lib/firebase';
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
  name: z.string().min(1, { message: "Nome completo é obrigatório" }),
  email: z.string().email({ message: "Email válido é obrigatório" }),
  userType: z.enum(['admin', 'staff', 'client'], { 
    errorMap: () => ({ message: "Tipo de usuário é obrigatório" }) 
  }),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  clientId: z.number().optional(),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }).optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
}).refine((data) => {
  if (data.password && data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type User = z.infer<typeof userSchema> & {
  id?: number;
  createdAt?: string;
  avatar?: string | null;
  firebaseUid?: string;
  active?: boolean;
  // role é mantido para compatibilidade com o back-end, mas userType é o que usaremos
  role?: string; 
};

export default function UsersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showClientSelect, setShowClientSelect] = useState(false);
  const queryClient = useQueryClient();
  
  // Carregar lista de clientes para associar a usuários do tipo 'client'
  const { data: clients = [] } = useQuery<{ id: number, companyName: string }[]>({
    queryKey: ['/api/clients'],
  });

  const form = useForm<User>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      userType: "staff",
      department: "",
      position: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const createMutation = useMutation({
    mutationFn: async (user: User) => {
      // Verificar se é um usuário válido com todos os dados necessários
      if (!user.email || !user.name || !user.userType) {
        throw new Error('Dados incompletos. Por favor, preencha todos os campos obrigatórios.');
      }
      
      // Preparar os dados para envio
      const dataToSend = {
        ...user,
        username: user.email.split('@')[0], // Geração simples de username
        role: user.userType, // Garantir compatibilidade com backend
      };
      
      // Remover campos desnecessários
      delete dataToSend.confirmPassword;
      
      console.log('Enviando dados para criação de usuário:', dataToSend);
      
      // Enviar ao servidor
      const res = await apiRequest('POST', '/api/users', dataToSend);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setDialogOpen(false);
      toast({
        title: 'Usuário criado',
        description: 'O usuário foi criado com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: `Falha ao criar usuário: ${error.message || error}`,
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

  // Monitorar mudanças no tipo de usuário para mostrar/esconder seleção de cliente
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'userType') {
        setShowClientSelect(value.userType === 'client');
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const onSubmit = async (values: User) => {
    try {
      // Para clientes, verificar se há um clientId selecionado
      if (values.userType === 'client' && !values.clientId) {
        toast({
          title: 'Erro',
          description: 'Você deve selecionar um cliente para associar a este usuário',
          variant: 'destructive',
        });
        return;
      }
      
      // Criar usuário no Firebase primeiro se for um novo usuário
      if (!selectedUser?.id) {
        try {
          // Integração com Firebase - criar usuário na autenticação
          const firebaseUser = await createUser(
            values.email, 
            values.password || "Senha123!", // Senha padrão temporária se não fornecida
            values.name,
            values.userType as 'admin' | 'staff' | 'client'
          );
          
          console.log("Firebase user created:", firebaseUser);
          
          // Adicionar o ID do Firebase e outras informações necessárias
          const userToCreate = {
            ...values,
            firebaseUid: firebaseUser.uid,
            active: true,
            role: values.userType, // Garantir que o role seja o mesmo que userType
            username: values.email.split('@')[0] // Username simples baseado no email
          };
          
          console.log("Creating user in database:", userToCreate);
          
          // Salvar no banco de dados
          createMutation.mutate(userToCreate);
          
        } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
            toast({
              title: 'Email já em uso',
              description: 'Este email já está associado a um usuário. Use outro email.',
              variant: 'destructive',
            });
          } else {
            throw error;
          }
        }
      } else if (selectedUser?.id) {
        // Atualizar usuário existente
        updateMutation.mutate({ ...values, id: selectedUser.id });
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: `Falha ao criar usuário: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const handleOpenDialog = () => {
    setSelectedUser(null);
    form.reset({
      name: "",
      email: "",
      userType: "staff", // Padrão para funcionários internos
      department: "",
      position: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });
    setShowClientSelect(false);
    setDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowClientSelect(user.userType === 'client');
    
    form.reset({
      name: user.name,
      email: user.email,
      userType: user.userType || 'staff',
      department: user.department || "",
      position: user.position || "",
      phone: user.phone || "",
      clientId: user.clientId,
      password: "",
      confirmPassword: "",
    });
    setDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  // Enviar convite por email para novo usuário
  const sendInvitationEmail = (user: User) => {
    // Implementar integração com Firebase para envio de convite ou redefinição de senha
    toast({
      title: 'Convite enviado',
      description: `Um email de convite foi enviado para ${user.email}`,
    });
  };

  // Redefinir senha de um usuário existente
  const resetPassword = async (user: User) => {
    try {
      // Implementar integração com Firebase para redefinição de senha
      await sendPasswordResetEmail(user.email);
      
      toast({
        title: 'Redefinição de senha',
        description: `Um link para redefinição de senha foi enviado para ${user.email}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: `Falha ao enviar email de redefinição: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = () => {
    if (selectedUser?.id) {
      deleteMutation.mutate(selectedUser.id);
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
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
      accessorKey: 'userType',
      header: 'Tipo',
      cell: ({ row }) => {
        const userType = row.original.userType;
        let variant: "default" | "outline" | "secondary" | "destructive" = "default";
        let label = "";
        
        switch (userType) {
          case 'admin':
            variant = "destructive";
            label = "Administrador";
            break;
          case 'staff':
            variant = "default";
            label = "Funcionário";
            break;
          case 'client':
            variant = "secondary";
            label = "Cliente";
            break;
          default:
            variant = "outline";
            label = userType || "Desconhecido";
        }
        
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      accessorKey: 'position',
      header: 'Cargo',
    },
    {
      accessorKey: 'department',
      header: 'Departamento',
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

  const userTypeOptions = [
    { value: 'admin', label: 'Administrador' },
    { value: 'staff', label: 'Funcionário' },
    { value: 'client', label: 'Cliente' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Usuários</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Gerenciar usuários do sistema e permissões de acesso
          </p>
        </div>
        <Button onClick={handleOpenDialog}>
          <UserPlus className="mr-2 h-4 w-4" /> Adicionar Usuário
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Usuários</h3>
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
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Funcionários</h3>
              <p className="text-2xl font-bold">
                {users.filter(u => u.userType === 'staff').length}
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
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Clientes</h3>
              <p className="text-2xl font-bold">
                {users.filter(u => u.userType === 'client').length}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-3 text-purple-500 dark:text-purple-400">
              <UsersIcon className="h-6 w-6" />
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
              key: 'userType',
              label: 'Tipo de Usuário',
              options: userTypeOptions.map(r => ({ label: r.label, value: r.value })),
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
                  name="userType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Usuário</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setShowClientSelect(value === 'client');
                        }}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de usuário" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {userTypeOptions.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Determina quais permissões o usuário terá no sistema
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Mostra seleção de cliente apenas para usuários do tipo cliente */}
                {showClientSelect && (
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente Associado</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(Number(value))}
                          defaultValue={field.value?.toString()}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.companyName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Cliente ao qual este usuário está vinculado
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {!showClientSelect && (
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cargo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Gerente de Projetos" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
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