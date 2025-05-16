import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Download, Trash, Edit, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/date-utils';
import { toast } from '@/hooks/use-toast';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

// Define the proposal schema
const proposalSchema = z.object({
  clientId: z.string().min(1, { message: "Client is required" }),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  services: z.string().optional(),
  value: z.string().min(1, { message: "Value is required" }),
  dueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  status: z.string().default("draft"),
});

type Proposal = z.infer<typeof proposalSchema> & {
  id?: number;
  createdAt?: string;
};

export function ProposalsPage() {
  const [, navigate] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | undefined>(undefined);
  const queryClient = useQueryClient();

  const form = useForm<Proposal>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      title: "",
      description: "",
      services: "",
      value: "",
      status: "draft",
    },
  });

  const { data: proposals = [], isLoading: proposalsLoading } = useQuery<Proposal[]>({
    queryKey: ['/api/proposals'],
  });

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['/api/clients'],
  });

  const createMutation = useMutation({
    mutationFn: async (proposal: Proposal) => {
      const res = await apiRequest('POST', '/api/proposals', {
        ...proposal,
        value: parseFloat(proposal.value),
        clientId: parseInt(proposal.clientId),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
      setDialogOpen(false);
      toast({
        title: 'Proposal created',
        description: 'The proposal has been created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create proposal: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (proposal: Proposal) => {
      const res = await apiRequest('PATCH', `/api/proposals/${proposal.id}`, {
        ...proposal,
        value: parseFloat(proposal.value),
        clientId: parseInt(proposal.clientId),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
      setDialogOpen(false);
      toast({
        title: 'Proposal updated',
        description: 'The proposal has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update proposal: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/proposals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
      setDeleteDialogOpen(false);
      toast({
        title: 'Proposal deleted',
        description: 'The proposal has been deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete proposal: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: Proposal) => {
    if (selectedProposal?.id) {
      updateMutation.mutate({ ...values, id: selectedProposal.id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpenDialog = () => {
    form.reset({
      title: "",
      description: "",
      services: "",
      value: "",
      status: "draft",
    });
    setSelectedProposal(undefined);
    setDialogOpen(true);
  };

  const handleEditProposal = (proposal: Proposal) => {
    form.reset({
      clientId: proposal.clientId.toString(),
      title: proposal.title,
      description: proposal.description || "",
      services: proposal.services || "",
      value: proposal.value?.toString() || "",
      dueDate: proposal.dueDate ? format(new Date(proposal.dueDate), 'yyyy-MM-dd') : undefined,
      expiryDate: proposal.expiryDate ? format(new Date(proposal.expiryDate), 'yyyy-MM-dd') : undefined,
      status: proposal.status,
    });
    setSelectedProposal(proposal);
    setDialogOpen(true);
  };

  const handleDeleteProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedProposal?.id) {
      deleteMutation.mutate(selectedProposal.id);
    }
  };

  const generatePdf = (proposal: Proposal) => {
    toast({
      title: 'PDF Generation',
      description: 'PDF generation is simulated in this version.',
    });
  };

  const convertToProject = (proposal: Proposal) => {
    navigate(`/projects?proposalId=${proposal.id}`);
  };

  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.companyName : 'Unknown Client';
  };

  const columns: ColumnDef<Proposal>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
    },
    {
      accessorKey: 'clientId',
      header: 'Client',
      cell: ({ row }) => getClientName(row.original.clientId),
    },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: ({ row }) => formatCurrency(row.original.value),
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
      header: 'Created',
      cell: ({ row }) => {
        return row.original.createdAt ? (
          <span>{format(new Date(row.original.createdAt), 'MMM dd, yyyy')}</span>
        ) : 'N/A';
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" onClick={() => handleEditProposal(row.original)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => generatePdf(row.original)}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDeleteProposal(row.original)}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Proposals</h2>
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" /> New Proposal
        </Button>
      </div>

      {proposalsLoading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : proposals.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Proposals</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't created any proposals yet.</p>
          <Button onClick={handleOpenDialog}>
            <Plus className="mr-2 h-4 w-4" /> Create Your First Proposal
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={proposals}
          searchKey="title"
          searchPlaceholder="Search proposals..."
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedProposal ? 'Edit Proposal' : 'Create New Proposal'}</DialogTitle>
            <DialogDescription>
              {selectedProposal 
                ? 'Make changes to your proposal here.'
                : 'Fill in the details to create a new proposal.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter proposal title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter proposal description" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="services"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Services</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="List services included in this proposal" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          min="0" 
                          step="0.01" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedProposal ? 'Save Changes' : 'Create Proposal'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the proposal "{selectedProposal?.title}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700" 
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ProposalsPage;
