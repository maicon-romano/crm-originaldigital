import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { Client } from '@/components/dialogs/client-dialog';
import { Project } from '@/components/dialogs/project-dialog';
import { Task } from '@/components/dialogs/task-dialog';
import { Invoice } from '@/lib/api';
import ClientDialog from '@/components/dialogs/client-dialog';
import ProjectDialog from '@/components/dialogs/project-dialog';
import { apiRequest } from '@/lib/queryClient';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency } from '@/lib/utils/date-utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Instagram, 
  Facebook, 
  Linkedin, 
  Calendar, 
  DollarSign, 
  FileText, 
  ChevronLeft,
  Pencil
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ClientDetailPageProps {
  id: string;
}

export function ClientDetailPage({ id }: ClientDetailPageProps) {
  const [, navigate] = useLocation();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const clientId = parseInt(id);
  const queryClient = useQueryClient();

  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: [`/api/clients/${clientId}`],
    enabled: !isNaN(clientId),
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: [`/api/projects?clientId=${clientId}`],
    enabled: !isNaN(clientId),
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: [`/api/invoices?clientId=${clientId}`],
    enabled: !isNaN(clientId),
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: [`/api/tasks`],
    enabled: !isNaN(clientId) && projects !== undefined,
  });

  const { data: proposals, isLoading: proposalsLoading } = useQuery({
    queryKey: [`/api/proposals?clientId=${clientId}`],
    enabled: !isNaN(clientId),
  });

  const { data: users } = useQuery({
    queryKey: ['/api/users'],
  });

  const updateMutation = useMutation({
    mutationFn: async (client: Client) => {
      const res = await apiRequest('PATCH', `/api/clients/${clientId}`, client);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
      toast({
        title: 'Client updated',
        description: 'The client has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update client: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (project: Project) => {
      const res = await apiRequest('POST', '/api/projects', project);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects?clientId=${clientId}`] });
      toast({
        title: 'Project created',
        description: 'The project has been created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create project: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const handleUpdateClient = (client: Client) => {
    updateMutation.mutate(client);
  };

  const handleCreateProject = (project: Project) => {
    createProjectMutation.mutate(project);
  };

  // Filter tasks related to this client's projects
  const clientTasks = tasks?.filter(task => 
    projects?.some(project => project.id === task.projectId)
  ) || [];

  // Project columns
  const projectColumns: ColumnDef<Project>[] = [
    {
      accessorKey: 'name',
      header: 'Project Name',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={
              status === 'completed' ? 'default' :
              status === 'inProgress' ? 'outline' :
              status === 'onHold' ? 'secondary' :
              'destructive'
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'progress',
      header: 'Progress',
      cell: ({ row }) => {
        const progress = row.original.progress || 0;
        return (
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div 
              className="bg-primary h-2.5 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        );
      },
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      cell: ({ row }) => {
        return row.original.startDate ? (
          <span>{format(new Date(row.original.startDate), 'MMM dd, yyyy')}</span>
        ) : (
          <span className="text-muted-foreground">Not set</span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${row.original.id}`)}
          >
            View
          </Button>
        );
      },
    },
  ];

  // Invoice columns
  const invoiceColumns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'id',
      header: 'Invoice #',
      cell: ({ row }) => <span>INV-{String(row.original.id).padStart(4, '0')}</span>,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => <span>{row.original.description || 'No description'}</span>,
    },
    {
      accessorKey: 'value',
      header: 'Amount',
      cell: ({ row }) => <span>{formatCurrency(row.original.value)}</span>,
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => (
        <span>{format(new Date(row.original.dueDate), 'MMM dd, yyyy')}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={
              status === 'paid' ? 'default' :
              status === 'pending' ? 'outline' :
              'destructive'
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/invoices?id=${row.original.id}`)}
          >
            View
          </Button>
        );
      },
    },
  ];

  // Tasks columns
  const taskColumns: ColumnDef<Task>[] = [
    {
      accessorKey: 'name',
      header: 'Task Name',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={
              status === 'completed' ? 'default' :
              status === 'inProgress' ? 'outline' :
              status === 'testing' ? 'secondary' :
              'destructive'
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => (
        row.original.dueDate ? (
          <span>{format(new Date(row.original.dueDate), 'MMM dd, yyyy')}</span>
        ) : (
          <span className="text-muted-foreground">Not set</span>
        )
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const priority = row.original.priority;
        return (
          <Badge
            variant={
              priority === 'high' ? 'destructive' :
              priority === 'medium' ? 'outline' :
              'secondary'
            }
          >
            {priority}
          </Badge>
        );
      },
    },
  ];

  // Proposals columns
  const proposalColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
    },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: ({ row }) => <span>{formatCurrency(row.original.value)}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={
              status === 'accepted' ? 'default' :
              status === 'sent' ? 'outline' :
              status === 'draft' ? 'secondary' :
              'destructive'
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => <span>{format(new Date(row.original.createdAt), 'MMM dd, yyyy')}</span>,
    },
  ];

  if (clientLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <h3 className="text-lg font-semibold">Client not found</h3>
        <p>The client you're looking for doesn't exist or has been removed.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/clients')}>
          Go back to clients
        </Button>
      </div>
    );
  }

  // Get initial for avatar
  const getInitial = (companyName: string) => {
    return companyName.charAt(0).toUpperCase();
  };

  // Get color based on category
  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      technology: 'bg-blue-500',
      healthcare: 'bg-green-500',
      education: 'bg-purple-500',
      ecommerce: 'bg-yellow-500',
      finance: 'bg-indigo-500',
      media: 'bg-pink-500',
    };
    return category ? colors[category.toLowerCase()] || 'bg-gray-500' : 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/clients')}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Client Info Card */}
        <Card className="md:w-1/3">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <Avatar className={`h-14 w-14 ${getCategoryColor(client.category)}`}>
                  <AvatarFallback className="text-lg text-white">
                    {getInitial(client.companyName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{client.companyName}</CardTitle>
                  <CardDescription>
                    {client.category || 'No category'} • {client.status}
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditDialogOpen(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Contact Information</span>
              </div>
              <div className="grid grid-cols-1 gap-2 pl-6">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{client.phone}</span>
                  </div>
                )}
                {client.contactName && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Contact: {client.contactName}</span>
                  </div>
                )}
              </div>
            </div>

            {(client.address || client.cnpjCpf) && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Company Information</span>
                </div>
                <div className="grid grid-cols-1 gap-2 pl-6">
                  {client.address && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm">{client.address}</span>
                    </div>
                  )}
                  {client.cnpjCpf && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">CNPJ/CPF: {client.cnpjCpf}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(client.instagram || client.facebook || client.linkedin) && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Social Media</span>
                </div>
                <div className="flex gap-4 pl-6">
                  {client.instagram && (
                    <a href={client.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {client.facebook && (
                    <a href={client.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                  {client.linkedin && (
                    <a href={client.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {(client.contractStart || client.contractEnd || client.contractValue) && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Contract Information</span>
                </div>
                <div className="grid grid-cols-1 gap-2 pl-6">
                  {(client.contractStart || client.contractEnd) && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {client.contractStart ? format(new Date(client.contractStart), 'MMM dd, yyyy') : 'N/A'} 
                        {' to '} 
                        {client.contractEnd ? format(new Date(client.contractEnd), 'MMM dd, yyyy') : 'N/A'}
                      </span>
                    </div>
                  )}
                  {client.contractValue && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatCurrency(client.contractValue)}</span>
                    </div>
                  )}
                  {client.paymentDay && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Payment day: {client.paymentDay}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {client.description && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Description</span>
                </div>
                <p className="text-sm text-muted-foreground">{client.description}</p>
              </div>
            )}

            {client.observations && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Observations</span>
                </div>
                <p className="text-sm text-muted-foreground">{client.observations}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Data Tabs */}
        <div className="flex-1">
          <Tabs defaultValue="projects">
            <TabsList className="w-full">
              <TabsTrigger value="projects" className="flex-1">Projects</TabsTrigger>
              <TabsTrigger value="invoices" className="flex-1">Invoices</TabsTrigger>
              <TabsTrigger value="tasks" className="flex-1">Tasks</TabsTrigger>
              <TabsTrigger value="proposals" className="flex-1">Proposals</TabsTrigger>
            </TabsList>
            
            <TabsContent value="projects" className="pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Projects</h3>
                <Button onClick={() => setNewProjectDialogOpen(true)}>
                  New Project
                </Button>
              </div>
              
              {projectsLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : projects && projects.length > 0 ? (
                <DataTable
                  columns={projectColumns}
                  data={projects}
                  searchKey="name"
                  searchPlaceholder="Search projects..."
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Projects</h3>
                    <p className="text-sm text-muted-foreground text-center mt-1 mb-4">
                      This client doesn't have any projects yet.
                    </p>
                    <Button onClick={() => setNewProjectDialogOpen(true)}>
                      Create Project
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="invoices" className="pt-4">
              <h3 className="text-lg font-semibold mb-4">Invoices</h3>
              
              {invoicesLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : invoices && invoices.length > 0 ? (
                <DataTable
                  columns={invoiceColumns}
                  data={invoices}
                  searchKey="description"
                  searchPlaceholder="Search invoices..."
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Invoices</h3>
                    <p className="text-sm text-muted-foreground text-center mt-1 mb-4">
                      This client doesn't have any invoices yet.
                    </p>
                    <Button onClick={() => navigate('/invoices?clientId=' + clientId)}>
                      Create Invoice
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="tasks" className="pt-4">
              <h3 className="text-lg font-semibold mb-4">Tasks</h3>
              
              {tasksLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : clientTasks.length > 0 ? (
                <DataTable
                  columns={taskColumns}
                  data={clientTasks}
                  searchKey="name"
                  searchPlaceholder="Search tasks..."
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Tasks</h3>
                    <p className="text-sm text-muted-foreground text-center mt-1 mb-4">
                      This client doesn't have any tasks associated with their projects yet.
                    </p>
                    <Button onClick={() => navigate('/tasks')}>
                      Go to Tasks
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="proposals" className="pt-4">
              <h3 className="text-lg font-semibold mb-4">Proposals</h3>
              
              {proposalsLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : proposals && proposals.length > 0 ? (
                <DataTable
                  columns={proposalColumns}
                  data={proposals}
                  searchKey="title"
                  searchPlaceholder="Search proposals..."
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Proposals</h3>
                    <p className="text-sm text-muted-foreground text-center mt-1 mb-4">
                      This client doesn't have any proposals yet.
                    </p>
                    <Button onClick={() => navigate('/proposals?clientId=' + clientId)}>
                      Create Proposal
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Client Dialog */}
      <ClientDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        client={client}
        onSave={handleUpdateClient}
      />

      {/* Create Project Dialog */}
      <ProjectDialog
        open={newProjectDialogOpen}
        onOpenChange={setNewProjectDialogOpen}
        onSave={handleCreateProject}
        clients={[{ id: clientId, companyName: client.companyName }]}
        users={users || []}
      />
    </div>
  );
}

export default ClientDetailPage;
