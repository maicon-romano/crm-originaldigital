import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
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
import { Switch } from '@/components/ui/switch';
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
  Trash,
  Edit,
  CreditCard,
  DollarSign,
  CalendarDays,
  RefreshCw,
  PieChart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as RechartsChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Define the expense schema
const expenseSchema = z.object({
  description: z.string().min(1, { message: "Description is required" }),
  value: z.string().min(1, { message: "Value is required" }),
  date: z.string().min(1, { message: "Date is required" }),
  category: z.string().min(1, { message: "Category is required" }),
  recurring: z.boolean().default(false),
  recurrenceInterval: z.string().optional(),
});

type Expense = z.infer<typeof expenseSchema> & {
  id?: number;
  createdAt?: string;
};

const EXPENSE_CATEGORIES = [
  "Office",
  "Utilities",
  "Software",
  "Hardware",
  "Marketing",
  "Travel",
  "Salaries",
  "Consulting",
  "Legal",
  "Taxes",
  "Other",
];

export function ExpensesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>(undefined);
  const queryClient = useQueryClient();

  const form = useForm<Expense>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      value: "",
      date: format(new Date(), 'yyyy-MM-dd'),
      category: "",
      recurring: false,
      recurrenceInterval: "",
    },
  });

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['/api/expenses'],
  });

  const createMutation = useMutation({
    mutationFn: async (expense: Expense) => {
      const res = await apiRequest('POST', '/api/expenses', {
        ...expense,
        value: parseFloat(expense.value),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      setDialogOpen(false);
      toast({
        title: 'Expense created',
        description: 'The expense has been created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create expense: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (expense: Expense) => {
      const res = await apiRequest('PATCH', `/api/expenses/${expense.id}`, {
        ...expense,
        value: parseFloat(expense.value),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      setDialogOpen(false);
      toast({
        title: 'Expense updated',
        description: 'The expense has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update expense: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      setDeleteDialogOpen(false);
      toast({
        title: 'Expense deleted',
        description: 'The expense has been deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete expense: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: Expense) => {
    // If not recurring, remove the recurrence interval
    if (!values.recurring) {
      values.recurrenceInterval = undefined;
    }
    
    if (selectedExpense?.id) {
      updateMutation.mutate({ ...values, id: selectedExpense.id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleOpenDialog = () => {
    form.reset({
      description: "",
      value: "",
      date: format(new Date(), 'yyyy-MM-dd'),
      category: "",
      recurring: false,
      recurrenceInterval: "",
    });
    setSelectedExpense(undefined);
    setDialogOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    form.reset({
      description: expense.description || "",
      value: expense.value?.toString() || "",
      date: expense.date ? format(new Date(expense.date), 'yyyy-MM-dd') : "",
      category: expense.category || "",
      recurring: expense.recurring || false,
      recurrenceInterval: expense.recurrenceInterval || "",
    });
    setSelectedExpense(expense);
    setDialogOpen(true);
  };

  const handleDeleteExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedExpense?.id) {
      deleteMutation.mutate(selectedExpense.id);
    }
  };

  const watchRecurring = form.watch("recurring");

  // Calculate total expenses and prepare chart data
  const totalExpenses = expenses.reduce((sum, expense) => 
    sum + (parseFloat(expense.value?.toString() || "0")), 0);
  
  // Group expenses by category for the chart
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category || "Other";
    if (!acc[category]) acc[category] = 0;
    acc[category] += parseFloat(expense.value?.toString() || "0");
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'value',
      header: 'Amount',
      cell: ({ row }) => formatCurrency(row.original.value),
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => format(new Date(row.original.date), 'MMM dd, yyyy'),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.category}
        </Badge>
      ),
    },
    {
      accessorKey: 'recurring',
      header: 'Recurring',
      cell: ({ row }) => (
        <div className="flex items-center">
          {row.original.recurring ? (
            <>
              <RefreshCw className="h-4 w-4 mr-1 text-primary" />
              <span>{row.original.recurrenceInterval}</span>
            </>
          ) : (
            <span className="text-gray-500">One-time</span>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditExpense(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteExpense(row.original)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const filterOptions = EXPENSE_CATEGORIES.map(category => ({
    label: category,
    value: category.toLowerCase(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Expenses</h2>
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" /> New Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-muted-foreground" />
              Expenses Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Number of Expenses</p>
                  <p className="text-2xl font-bold">{expenses.length}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Recurring Expenses</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    expenses
                      .filter(e => e.recurring)
                      .reduce((sum, e) => sum + (parseFloat(e.value?.toString() || "0")), 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5 text-muted-foreground" />
              Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${formatCurrency(value)}`, 'Amount']}
                    />
                    <Legend />
                  </RechartsChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <PieChart className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No expense data to display</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex h-80 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={expenses}
          searchKey="description"
          searchPlaceholder="Search expenses..."
          filters={[
            {
              key: 'category',
              label: 'Category',
              options: filterOptions,
            },
          ]}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
            <DialogDescription>
              {selectedExpense
                ? 'Make changes to your expense here.'
                : 'Fill in the details to add a new expense.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter expense description" {...field} />
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
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
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
                name="recurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Recurring Expense</FormLabel>
                      <FormDescription>
                        Is this a recurring expense?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {watchRecurring && (
                <FormField
                  control={form.control}
                  name="recurrenceInterval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurrence Interval</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select interval" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedExpense ? 'Save Changes' : 'Add Expense'}
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
              This will permanently delete the expense "{selectedExpense?.description}".
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

export default ExpensesPage;
