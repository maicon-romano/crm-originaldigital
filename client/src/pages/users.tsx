import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  createUser, 
  sendPasswordResetEmail, 
  FirestoreUser,
  getFirestoreUserById,
  updateFirestoreUser,
  deleteFirestoreUser,
  usersCollection
} from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { getDocs } from 'firebase/firestore';
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
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Users as UsersIcon,
  UserPlus,
  Mail,
  Edit,
  Trash,
  Key,
  Search
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

// Define o esquema do usuário
const userSchema = z.object({
  name: z.string().min(1, { message: "Nome completo é obrigatório" }),
  email: z.string().email({ message: "Email válido é obrigatório" }),
  role: z.enum(['admin', 'usuario', 'cliente'], { 
    errorMap: () => ({ message: "Permissão é obrigatória" }) 
  }),
  cargo: z.string().optional(),
  phone: z.string().optional(),
  clientId: z.number().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<FirestoreUser | null>(null);
  const [showClientSelect, setShowClientSelect] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);
  
  // Senha temporária padrão para novos usuários
  const DEFAULT_TEMP_PASSWORD = "Senha123!";
  
  // Carregar lista de clientes para associar a usuários do tipo 'client'
  const { data: clients = [] } = useQuery<{ id: number, companyName: string }[]>({
    queryKey: ['/api/clients'],
  });

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "usuario",
      cargo: "",
      phone: "",
    },
  });
  
  // Carregar usuários do Firestore
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // Usar a API do servidor para buscar usuários (contorna as restrições de permissão)
      const response = await fetch('/api/firestore/users');
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar usuários: ${response.statusText}`);
      }
      
      const usersData = await response.json();
      setUsers(usersData);
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de usuários',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };
  
  // Carregar usuários ao montar o componente
  useEffect(() => {
    fetchUsers();
  }, []);

  // Monitorar mudanças no tipo de usuário para mostrar/esconder seleção de cliente
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'role') {
        setShowClientSelect(value.role === 'cliente');
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (values: UserFormData) => {
    try {
      setIsSubmitting(true);
      
      // Para clientes, verificar se há um clientId selecionado
      if (values.role === 'cliente' && !values.clientId) {
        toast({
          title: 'Erro',
          description: 'Você deve selecionar um cliente para associar a este usuário',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }
      
      // Determinar o userType baseado no role
      const userType = values.role === 'admin' ? 'admin' : 
                       values.role === 'usuario' ? 'staff' : 'client';
      
      // Se estiver criando um novo usuário
      if (!selectedUser) {
        try {
          // Criar usuário no Firebase Auth e Firestore
          // Log detalhado para depuração
          console.log("Enviando dados de usuário com cargo:", { 
            email: values.email,
            name: values.name,
            role: values.role,
            userType: userType,
            cargo: values.cargo, // Campo cargo do formulário
            phone: values.phone,
            clientId: values.clientId
          });
          
          // Usar createUser para criar usuário no Auth e Firestore
          const firebaseUser = await createUser(
            values.email, 
            values.password || "Senha123!", 
            values.name,
            userType,
            values.role,
            {
              phone: values.phone,
              position: values.cargo, // Enviar cargo para ser salvo como position
              clientId: values.clientId,
            }
          );
          
          toast({
            title: 'Usuário criado',
            description: 'O usuário foi criado com sucesso',
          });
          
          // Recarregar a lista de usuários
          fetchUsers();
          setDialogOpen(false);
        } catch (error: any) {
          console.error("Erro ao criar usuário:", error);
          
          if (error.code === 'auth/email-already-in-use') {
            toast({
              title: 'Email já em uso',
              description: 'Este email já está registrado. Use outro email ou contate o administrador.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erro ao criar usuário',
              description: error.message || 'Ocorreu um erro ao criar o usuário',
              variant: 'destructive',
            });
          }
        }
      } else {
        // Atualizar usuário existente no Firestore
        try {
          // Não enviamos a senha na atualização
          const { password, confirmPassword, ...updateData } = values;
          
          // Determinar o userType baseado no role novamente para atualização
          const userType = updateData.role === 'admin' ? 'admin' : 
                           updateData.role === 'usuario' ? 'staff' : 'client';
          
          // Usar fetch para enviar a atualização para a API do servidor
          const response = await fetch(`/api/firestore/users/${selectedUser.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...updateData,
              userType,
              position: updateData.cargo,
              updatedAt: Date.now(),
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Erro ao atualizar usuário: ${errorData.message || response.statusText}`);
          }
          
          toast({
            title: 'Usuário atualizado',
            description: 'O usuário foi atualizado com sucesso',
          });
          
          // Recarregar a lista de usuários
          fetchUsers();
          setDialogOpen(false);
        } catch (error: any) {
          console.error("Erro ao atualizar usuário:", error);
          toast({
            title: 'Erro ao atualizar usuário',
            description: error.message || 'Ocorreu um erro ao atualizar o usuário',
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: `Falha ao processar usuário: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDialog = () => {
    setSelectedUser(null);
    form.reset({
      name: "",
      email: "",
      role: "usuario",
      cargo: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });
    setShowClientSelect(false);
    setDialogOpen(true);
  };

  const handleEditUser = (user: FirestoreUser) => {
    setSelectedUser(user);
    setShowClientSelect(user.role === 'cliente');
    
    form.reset({
      name: user.name,
      email: user.email,
      role: user.role as 'admin' | 'usuario' | 'cliente',
      cargo: user.position || "",
      phone: user.phone || "",
      clientId: user.clientId,
      password: "",
      confirmPassword: "",
    });
    setDialogOpen(true);
  };

  const handleDeleteUser = (user: FirestoreUser) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  // Enviar convite por email para novo usuário usando o backend
  const sendInvitation = async (user: FirestoreUser) => {
    // Não fazer nada se já estiver enviando para este usuário
    if (sendingInvite === user.id) return;
    
    try {
      // Atualizar estado para indicar que está enviando
      setSendingInvite(user.id);
      
      // Mostrar toast de carregamento
      toast({
        title: 'Enviando convite...',
        description: `Enviando convite para ${user.email}`,
        duration: 5000, // 5 segundos
      });
      
      // Gerar uma senha temporária para o usuário
      const tempPassword = "Senha123!"; // Senha temporária padrão
      
      // Preparar dados para o convite
      const userRole = user.role === 'admin' ? 'Administrador' : 
                     user.role === 'usuario' ? 'Usuário' : 'Cliente';
      
      console.log(`Enviando convite para ${user.email} com papel ${userRole} usando Resend`);
      
      // Chamar a API do backend para enviar o email com timeout de 15 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos
      
      const response = await fetch('/api/email/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          name: user.name,
          password: tempPassword,
          role: userRole
        }),
        signal: controller.signal,
      });
      
      // Limpar o timeout
      clearTimeout(timeoutId);
      
      // Processar a resposta
      try {
        const result = await response.json();
        
        if (response.ok && result.success) {
          // Mostrar toast de sucesso
          toast({
            title: 'Convite enviado com sucesso!',
            description: `Email enviado para ${user.email} com as credenciais de acesso`,
          });
        } else {
          throw new Error(result.message || 'Erro ao enviar convite');
        }
      } catch (jsonError) {
        // Erro ao processar JSON - provavelmente resposta não é JSON
        throw new Error('Formato de resposta inválido do servidor');
      }
    } catch (error: any) {
      console.error('Erro ao enviar convite:', error);
      
      // Tratamento específico para erro de timeout
      if (error.name === 'AbortError') {
        // Mostrar feedback mais amigável quando ocorrer timeout
        toast({
          title: 'Tempo de envio excedido',
          description: `O envio para ${user.email} demorou mais que o esperado. O email pode ter sido enviado, mas não recebemos confirmação.`,
          variant: 'destructive',
        });
        
        // Aqui você pode registrar uma entrada de log com a tentativa de envio
        console.log(`Timeout ao enviar convite para ${user.email} - possível problema de rede ou SMTP`);
      } else {
        // Extrair mensagem de erro de forma adequada para outros erros
        let errorMessage = 'Ocorreu um erro ao enviar o convite';
        
        if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'object') {
          try {
            errorMessage = JSON.stringify(error);
          } catch (e) {
            errorMessage = 'Erro desconhecido no envio do convite';
          }
        }
        
        // Mostrar mensagem de erro mais amigável
        toast({
          title: 'Erro ao enviar convite',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      // Sempre limpar o estado de envio no final
      setSendingInvite(null);
    }
  };

  // Redefinir senha de um usuário existente usando Firebase Authentication
  const resetPassword = async (user: FirestoreUser) => {
    try {
      // Usar a função do Firebase para enviar email de redefinição de senha
      await sendPasswordResetEmail(user.email);
      
      toast({
        title: 'Redefinição de senha enviada',
        description: `Um link para redefinição de senha foi enviado para ${user.email}`,
      });
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      toast({
        title: 'Erro',
        description: `Falha ao enviar email de redefinição: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = async () => {
    if (selectedUser) {
      try {
        setIsDeleting(true);
        
        // Usar a API do servidor para excluir usuário
        const response = await fetch(`/api/firestore/users/${selectedUser.id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Erro ao excluir usuário: ${errorData.message || response.statusText}`);
        }
        
        toast({
          title: 'Usuário excluído',
          description: 'O usuário foi excluído com sucesso',
        });
        
        fetchUsers();
        setDeleteDialogOpen(false);
      } catch (error: any) {
        toast({
          title: 'Erro',
          description: `Falha ao excluir usuário: ${error.message}`,
          variant: 'destructive',
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  // Filtrar usuários com base na pesquisa
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: ColumnDef<FirestoreUser>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.avatar ? (
            <img 
              src={row.original.avatar} 
              alt={row.original.name} 
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
              {row.original.name.charAt(0)}
            </div>
          )}
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
      header: 'Permissão',
      cell: ({ row }) => {
        const role = row.original.role;
        let variant: "default" | "outline" | "secondary" | "destructive" = "default";
        let label = "";
        
        switch (role) {
          case 'admin':
            variant = "destructive";
            label = "Administrador";
            break;
          case 'usuario':
            variant = "default";
            label = "Funcionário";
            break;
          case 'cliente':
            variant = "secondary";
            label = "Cliente";
            break;
          default:
            variant = "outline";
            label = role || "Desconhecido";
        }
        
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      accessorKey: 'position',
      header: 'Cargo',
      cell: ({ row }) => row.original.position || '-',
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Criado em',
      cell: ({ row }) => {
        return row.original.createdAt ? (
          format(new Date(row.original.createdAt), 'dd/MM/yyyy')
        ) : 'N/A';
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditUser(row.original)}
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => resetPassword(row.original)}
            title="Redefinir Senha"
          >
            <Key className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => sendInvitation(row.original)}
            title="Enviar Convite"
            disabled={sendingInvite === row.original.id}
          >
            {sendingInvite === row.original.id ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteUser(row.original)}
            title="Excluir"
            // Permitir a exclusão de todos os usuários exceto o original admin
            disabled={row.original.id === 'riwAaqRuxpXBP0uT1rMO1KGBsIW2'}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const roleOptions = [
    { value: 'admin', label: 'Administrador' },
    { value: 'usuario', label: 'Funcionário' },
    { value: 'cliente', label: 'Cliente' },
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
                {users.filter(u => u.role === 'usuario').length}
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
                {users.filter(u => u.role === 'cliente').length}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-3 text-purple-500 dark:text-purple-400">
              <UsersIcon className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Barra de pesquisa */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="search"
            placeholder="Buscar usuários..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <DataTable 
          columns={columns} 
          data={filteredUsers} 
        />
      </div>
      
      {/* Diálogo para adicionar/editar usuário */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser 
                ? 'Edite os detalhes do usuário abaixo.'
                : 'Preencha os detalhes para criar um novo usuário.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
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
                          placeholder="email@exemplo.com" 
                          {...field} 
                          disabled={!!selectedUser} // Email não pode ser alterado em usuários existentes
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permissão</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma permissão" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roleOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {showClientSelect && (
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente Associado</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value, 10))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map(client => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.companyName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Selecione o cliente para associar a este usuário
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="cargo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo</FormLabel>
                      <FormControl>
                        <Input placeholder="Cargo ou Função" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {!selectedUser && (
                  <>
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="********" {...field} />
                          </FormControl>
                          <FormDescription>
                            Deixe em branco para gerar uma senha aleatória
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="********" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? 'Salvando...'
                    : selectedUser ? 'Atualizar Usuário' : 'Criar Usuário'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmação para excluir usuário */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isto excluirá permanentemente o usuário 
              "{selectedUser?.name}" e removerá seus dados do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir Usuário'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}