import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Plus,
  TicketIcon,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Send,
} from 'lucide-react';

// Define the ticket schema
const ticketSchema = z.object({
  clientId: z.string().min(1, { message: "Client is required" }),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  type: z.string().min(1, { message: "Type is required" }),
  status: z.string().default("open"),
});

// Define the message schema
const messageSchema = z.object({
  message: z.string().min(1, { message: "Message is required" }),
  isInternal: z.boolean().default(false),
});

type SupportTicket = z.infer<typeof ticketSchema> & {
  id?: number;
  createdAt?: string;
  closedAt?: string | null;
};

type SupportMessage = z.infer<typeof messageSchema> & {
  id?: number;
  ticketId: number;
  senderId: number;
  createdAt?: string;
};

export default function SupportPage() {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [messageAreaOpen, setMessageAreaOpen] = useState(false);
  const queryClient = useQueryClient();

  const ticketForm = useForm<SupportTicket>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "support",
      status: "open",
    },
  });

  const messageForm = useForm<SupportMessage>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      message: "",
      isInternal: false,
    },
  });

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<SupportTicket[]>({
    queryKey: ['/api/support-tickets'],
  });

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['/api/clients'],
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<SupportMessage[]>({
    queryKey: ['/api/support-messages', selectedTicket?.id],
    enabled: !!selectedTicket?.id,
  });

  const createTicketMutation = useMutation({
    mutationFn: async (ticket: SupportTicket) => {
      const res = await apiRequest('POST', '/api/support-tickets', {
        ...ticket,
        clientId: parseInt(ticket.clientId),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support-tickets'] });
      setNewTicketOpen(false);
      ticketForm.reset();
      toast({
        title: 'Ticket created',
        description: 'The support ticket has been created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create ticket: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: SupportMessage) => {
      const res = await apiRequest('POST', '/api/support-messages', message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support-messages', selectedTicket?.id] });
      messageForm.reset({ message: "", isInternal: false });
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to send message: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const closeTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      const res = await apiRequest('PATCH', `/api/support-tickets/${ticketId}`, {
        status: 'closed',
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support-tickets'] });
      if (selectedTicket) {
        setSelectedTicket({
          ...selectedTicket,
          status: 'closed',
        });
      }
      toast({
        title: 'Ticket closed',
        description: 'The support ticket has been closed successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to close ticket: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const reopenTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      const res = await apiRequest('PATCH', `/api/support-tickets/${ticketId}`, {
        status: 'open',
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support-tickets'] });
      if (selectedTicket) {
        setSelectedTicket({
          ...selectedTicket,
          status: 'open',
        });
      }
      toast({
        title: 'Ticket reopened',
        description: 'The support ticket has been reopened successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to reopen ticket: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmitTicket = (values: SupportTicket) => {
    createTicketMutation.mutate(values);
  };

  const onSubmitMessage = (values: SupportMessage) => {
    if (selectedTicket?.id) {
      sendMessageMutation.mutate({
        ...values,
        ticketId: selectedTicket.id,
        senderId: 1, // Current user ID (hardcoded for simplicity)
      });
    }
  };

  const handleOpenTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setMessageAreaOpen(true);
  };

  const handleCreateTicket = () => {
    ticketForm.reset({
      title: "",
      description: "",
      type: "support",
      status: "open",
    });
    setNewTicketOpen(true);
  };

  const handleCloseTicket = () => {
    if (selectedTicket?.id) {
      closeTicketMutation.mutate(selectedTicket.id);
    }
  };

  const handleReopenTicket = () => {
    if (selectedTicket?.id) {
      reopenTicketMutation.mutate(selectedTicket.id);
    }
  };

  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.companyName : 'Unknown Client';
  };

  const columns: ColumnDef<SupportTicket>[] = [
    {
      accessorKey: 'id',
      header: 'Ticket',
      cell: ({ row }) => `#${row.original.id}`,
    },
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
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.type}</Badge>
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
              status === 'open' ? 'outline' :
              status === 'closed' ? 'default' :
              status === 'pending' ? 'secondary' :
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
            size="sm"
            onClick={() => handleOpenTicket(row.original)}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Support Tickets</h2>
        <Button onClick={handleCreateTicket}>
          <Plus className="mr-2 h-4 w-4" /> New Ticket
        </Button>
      </div>

      {ticketsLoading ? (
        <div className="flex h-80 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <DataTable
            columns={columns}
            data={tickets}
            searchKey="title"
            searchPlaceholder="Search tickets..."
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: [
                  { label: 'All Status', value: 'all' },
                  { label: 'Open', value: 'open' },
                  { label: 'Pending', value: 'pending' },
                  { label: 'Closed', value: 'closed' },
                ],
              },
              {
                key: 'type',
                label: 'Type',
                options: [
                  { label: 'All Types', value: 'all' },
                  { label: 'Support', value: 'support' },
                  { label: 'Bug', value: 'bug' },
                  { label: 'Feature', value: 'feature' },
                ],
              },
            ]}
          />
        </div>
      )}

      {/* New Ticket Dialog */}
      <Dialog open={newTicketOpen} onOpenChange={setNewTicketOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Support Ticket</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new support ticket.
            </DialogDescription>
          </DialogHeader>

          <Form {...ticketForm}>
            <form onSubmit={ticketForm.handleSubmit(onSubmitTicket)} className="space-y-4">
              <FormField
                control={ticketForm.control}
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
                control={ticketForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Ticket title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={ticketForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select ticket type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="bug">Bug</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={ticketForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the issue in detail..." 
                        rows={5} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={createTicketMutation.isPending}>
                  {createTicketMutation.isPending ? 'Creating...' : 'Create Ticket'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Message Area Dialog */}
      <Dialog open={messageAreaOpen} onOpenChange={setMessageAreaOpen}>
        <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <TicketIcon className="h-5 w-5 mr-2" />
              Ticket #{selectedTicket?.id} - {selectedTicket?.title}
            </DialogTitle>
            <DialogDescription className="flex justify-between items-center">
              <span>
                Client: {selectedTicket?.clientId ? getClientName(selectedTicket.clientId) : 'Unknown'}
              </span>
              <Badge
                variant={
                  selectedTicket?.status === 'open' ? 'outline' :
                  selectedTicket?.status === 'closed' ? 'default' :
                  'secondary'
                }
              >
                {selectedTicket?.status}
              </Badge>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 p-4 border rounded-md my-2">
            {/* Initial ticket description */}
            {selectedTicket && (
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <div className="font-medium mb-1">
                  Description:
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  {selectedTicket.description}
                </p>
                <div className="text-xs text-gray-500 mt-2">
                  {selectedTicket.createdAt ? format(new Date(selectedTicket.createdAt), 'MMM dd, yyyy HH:mm') : 'Unknown date'}
                </div>
              </div>
            )}
            
            {/* Message history */}
            {messagesLoading ? (
              <div className="flex items-center justify-center p-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 p-4">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`p-3 rounded-lg ${
                    msg.isInternal 
                      ? 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 ml-8'
                      : 'bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  {msg.isInternal && (
                    <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">
                      INTERNAL NOTE
                    </div>
                  )}
                  <p className="text-gray-700 dark:text-gray-300">{msg.message}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    {msg.createdAt ? format(new Date(msg.createdAt), 'MMM dd, yyyy HH:mm') : 'Unknown date'}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message input */}
          {selectedTicket?.status !== 'closed' ? (
            <Form {...messageForm}>
              <form 
                onSubmit={messageForm.handleSubmit(onSubmitMessage)} 
                className="flex flex-col space-y-2"
              >
                <FormField
                  control={messageForm.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="Type your message..." 
                          rows={3} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between items-center">
                  <FormField
                    control={messageForm.control}
                    name="isInternal"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="text-primary"
                          />
                        </FormControl>
                        <FormLabel className="text-sm cursor-pointer">Internal note (only visible to staff)</FormLabel>
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseTicket}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Close Ticket
                    </Button>
                    <Button type="submit" disabled={sendMessageMutation.isPending}>
                      <Send className="h-4 w-4 mr-1" />
                      {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          ) : (
            <div className="flex justify-center py-2">
              <Button
                onClick={handleReopenTicket}
                variant="outline"
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                Reopen Ticket
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}