import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, isAfter, format } from 'date-fns';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { apiRequest } from '@/lib/queryClient';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/date-utils';
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
import { toast } from '@/hooks/use-toast';
import {
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  FileText,
  Download,
  Trash,
  Edit,
} from 'lucide-react';

// Define the schema for the invoice form
const invoiceSchema = z.object({
  clientId: z.string().min(1, { message: "Client is required" }),
  projectId: z.string().optional(),
  description: z.string().optional(),
  value: z.string().min(1, { message: "Value is required" }),
  dueDate: z.string().min(1, { message: "Due date is required" }),
  status: z.string().default("pending"),
  paymentLink: z.string().optional(),
});

type Invoice = z.infer<typeof invoiceSchema> & {
  id?: number;
  createdAt?: string;
  paidAt?: string | null;
};

export function InvoicesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>(undefined);
  const queryClient = useQueryClient();

  const form = useForm<Invoice>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      description: "",
      value: "",
      status: "pending",
      paymentLink: "",
    },
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
  });

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['/api/clients'],
  });

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ['/api/projects'],
  });

  const createMutation = useMutation({
    mutationFn: async (invoice: Invoice) => {
      const res = await apiRequest('POST', '/api/invoices', {
        ...invoice,
        value: parseFloat(invoice.value),
        clientId: parseInt(invoice.clientId),
        projectId: invoice.projectId ? parseInt(invoice.projectId) : undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      setDialogOpen(false);
      toast({
        title: 'Invoice created',
        description: 'The invoice has been created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create invoice: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (invoice: Invoice) => {
      const res = await apiRequest('PATCH', `/api/invoices/${invoice.id}`, {
        ...invoice,
        value: parseFloat(invoice.value),
        clientId: parseInt(invoice.clientId),
        projectId: invoice.projectId ? parseInt(invoice.projectId) : undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      setDialogOpen(false);
      toast({
        title: 'Invoice updated',
        description: 'The invoice has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update invoice: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      const res = await apiRequest('PATCH', `/api/invoices/${invoiceId}`, {
        status: 'paid',
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: 'Invoice updated',
        description: 'The invoice has been marked as paid',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update invoice status: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      setDeleteDialogOpen(false);
      toast({
        title: 'Invoice deleted',
        description: 'The invoice has been deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete invoice: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: Invoice) => {
    if (selectedInvoice?.id) {
      updateMutation.mutate({ ...values, id: selectedInvoice.id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpenDialog = () => {
    form.reset({
      description: "",
      value: "",
      status: "pending",
      paymentLink: "",
      dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    });
    setSelectedInvoice(undefined);
    setDialogOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    form.reset({
      clientId: invoice.clientId.toString(),
      projectId: invoice.projectId?.toString(),
      description: invoice.description || "",
      value: invoice.value?.toString() || "",
      dueDate: invoice.dueDate ? format(new Date(invoice.dueDate), 'yyyy-MM-dd') : "",
      status: invoice.status,
      paymentLink: invoice.paymentLink || "",
    });
    setSelectedInvoice(invoice);
    setDialogOpen(true);
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedInvoice?.id) {
      deleteMutation.mutate(selectedInvoice.id);
    }
  };

  const handleMarkAsPaid = (invoiceId: number) => {
    markAsPaidMutation.mutate(invoiceId);
  };

  const generatePdf = (invoice: Invoice) => {
    toast({
      title: 'PDF Generation',
      description: 'PDF generation is simulated in this version.',
    });
  };

  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.companyName : 'Unknown Client';
  };

  const getProjectName = (projectId?: number) => {
    if (!projectId) return 'N/A';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  const getStatusIcon = (status: string, dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    
    if (status === 'paid') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (status === 'pending') {
      if (isAfter(now, due)) {
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      } else {
        return <Clock className="h-4 w-4 text-yellow-500" />;
      }
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'id',
      header: 'Invoice #',
      cell: ({ row }) => {
        const id = row.original.id;
        return (
          <div className="flex items-center gap-2">
            {getStatusIcon(row.original.status, row.original.dueDate)}
            <span>INV-{String(id).padStart(4, '0')}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'clientId',
      header: 'Client',
      cell: ({ row }) => getClientName(row.original.clientId),
    },
    {
      accessorKey: 'value',
      header: 'Amount',
      cell: ({ row }) => formatCurrency(row.original.value),
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => {
        const dueDate = new Date(row.original.dueDate);
        const now = new Date();
        const isPastDue = isAfter(now, dueDate) && row.original.status !== 'paid';
        
        return (
          <div className={`${isPastDue ? 'text-red-500 font-medium' : ''}`}>
            {format(dueDate, 'MMM dd, yyyy')}
            {isPastDue && (
              <div className="text-xs">
                Overdue by {formatDistanceToNow(dueDate)}
              </div>
            )}
          </div>
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
          <div className="flex space-x-2">
            {row.original.status !== 'paid' && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleMarkAsPaid(row.original.id!)}
                title="Mark as Paid"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleEditInvoice(row.original)}
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => generatePdf(row.original)}
              title="Download PDF"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleDeleteInvoice(row.original)}
              title="Delete"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const filterOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Paid', value: 'paid' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Invoices</h2>
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" /> New Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Invoices</h3>
              <p className="text-2xl font-bold">{invoices.length}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3 text-blue-500 dark:text-blue-400">
              <FileText className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Paid Invoices</h3>
              <p className="text-2xl font-bold">
                {invoices.filter(i => i.status === 'paid').length}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 rounded-full p-3 text-green-500 dark:text-green-400">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Amount</h3>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  invoices
                    .filter(i => i.status === 'pending')
                    .reduce((sum, i) => sum + (parseFloat(i.value.toString()) || 0), 0)
                )}
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 rounded-full p-3 text-yellow-500 dark:text-yellow-400">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {invoicesLoading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={invoices}
          searchKey="description"
          searchPlaceholder="Search invoices..."
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: filterOptions,
            },
          ]}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedInvoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
            <DialogDescription>
              {selectedInvoice 
                ? 'Make changes to your invoice here.'
                : 'Fill in the details to create a new invoice.'}
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
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {projects
                          .filter(p => form.getValues('clientId') 
                            ? p.clientId.toString() === form.getValues('clientId') 
                            : true)
                          .map((project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.name}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
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
                        placeholder="Enter invoice description"
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
                      <FormLabel>Amount</FormLabel>
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
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Link (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Payment link URL"
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
                  {selectedInvoice ? 'Save Changes' : 'Create Invoice'}
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
              This will permanently delete invoice #{selectedInvoice?.id}.
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

export default InvoicesPage;
