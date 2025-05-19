import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { Client } from '@/components/dialogs/client-dialog';
import ClientDialog from '@/components/dialogs/client-dialog';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Eye, Edit, Trash } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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

export function ClientsPage() {
  const [, navigate] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>(undefined);
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const createMutation = useMutation({
    mutationFn: async (client: Client) => {
      const res = await apiRequest('POST', '/api/clients', client);
      return res.json();
    },
    onMutate: () => {
      // Set loading state while creating
      queryClient.setQueryData(['/api/clients'], (old: any[]) => {
        return [...(old || []), { id: 'temp', companyName: 'Creating...', status: 'pending' }];
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: 'Client created',
        description: 'The client has been created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create client: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (client: Client) => {
      const res = await apiRequest('PATCH', `/api/clients/${client.id}`, client);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
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

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: 'Client deleted',
        description: 'The client has been deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete client: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const handleSaveClient = (client: Client) => {
    if (client.id) {
      updateMutation.mutate(client);
    } else {
      createMutation.mutate(client);
    }
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setDialogOpen(true);
  };

  const handleDeleteClient = (client: Client) => {
    setSelectedClient(client);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedClient?.id) {
      deleteMutation.mutate(selectedClient.id);
      setDeleteDialogOpen(false);
    }
  };

  const handleOpenDialog = () => {
    setSelectedClient(undefined);
    setDialogOpen(true);
  };

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: 'companyName',
      header: 'Company',
      cell: ({ row }) => {
        const initial = row.original.companyName.charAt(0).toUpperCase();
        const category = row.original.category || 'General';
        const categoryColor = getColorForCategory(category);
        
        return (
          <div className="flex items-center">
            <div className={`flex-shrink-0 h-10 w-10 ${categoryColor} rounded-full flex items-center justify-center text-white font-medium`}>
              {initial}
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium">{row.original.companyName}</div>
              <div className="text-sm text-gray-500">{category}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'contactName',
      header: 'Contact',
      cell: ({ row }) => {
        return (
          <div>
            <div className="text-sm">{row.original.contactName}</div>
            <div className="text-sm text-gray-500">{row.original.email}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'contractStart',
      header: 'Contract Start',
      cell: ({ row }) => {
        return row.original.contractStart ? (
          <span className="text-sm">
            {format(new Date(row.original.contractStart), 'MMM dd, yyyy')}
          </span>
        ) : (
          <span className="text-sm text-gray-500">Not set</span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={status === 'active' ? 'default' : status === 'inactive' ? 'destructive' : 'outline'}
          >
            {status?.charAt(0).toUpperCase() + status?.slice(1)}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/clients/${row.original.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleEditClient(row.original)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDeleteClient(row.original)}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const getColorForCategory = (category: string) => {
    const colors: Record<string, string> = {
      technology: 'bg-blue-500',
      healthcare: 'bg-green-500',
      education: 'bg-purple-500',
      ecommerce: 'bg-yellow-500',
      finance: 'bg-indigo-500',
      media: 'bg-pink-500',
      other: 'bg-gray-500',
    };
    return colors[category.toLowerCase()] || 'bg-gray-500';
  };

  const statusFilter = {
    key: 'status',
    label: 'Status',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'Pending', value: 'pending' },
    ],
  };

  const categoryFilter = {
    key: 'category',
    label: 'Category',
    options: [
      { label: 'Technology', value: 'technology' },
      { label: 'Healthcare', value: 'healthcare' },
      { label: 'Education', value: 'education' },
      { label: 'E-commerce', value: 'ecommerce' },
      { label: 'Finance', value: 'finance' },
      { label: 'Media', value: 'media' },
      { label: 'Other', value: 'other' },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Clients</h2>
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" /> New Client
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-1">
          <CardTitle>All Clients</CardTitle>
        </CardHeader>
        
        <DataTable
          columns={columns}
          data={clients || []}
          searchKey="companyName"
          searchPlaceholder="Search clients..."
          filters={[statusFilter, categoryFilter]}
        />
      </Card>

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={selectedClient}
        onSave={handleSaveClient}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the client "{selectedClient?.companyName}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ClientsPage;
