import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const taskSchema = z.object({
  name: z.string().min(1, "Task name is required"),
  description: z.string().optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.string(),
  priority: z.string(),
  checklist: z.array(z.object({
    id: z.string(),
    text: z.string(),
    completed: z.boolean()
  })).optional(),
});

export type Task = z.infer<typeof taskSchema> & {
  id?: number;
  createdAt?: string;
  completedAt?: string | null;
};

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  onSave: (task: Task) => void;
  projects: { id: number; name: string }[];
  users: { id: number; name: string }[];
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  onSave,
  projects = [],
  users = [],
}: TaskDialogProps) {
  const form = useForm<Task>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "backlog",
      priority: "medium",
      checklist: [],
    },
  });

  const [newChecklistItem, setNewChecklistItem] = useState("");

  useEffect(() => {
    if (task) {
      const formattedDueDate = task.dueDate 
        ? format(new Date(task.dueDate), "yyyy-MM-dd") 
        : undefined;
        
      form.reset({
        ...task,
        projectId: task.projectId?.toString(),
        assigneeId: task.assigneeId?.toString(),
        dueDate: formattedDueDate,
        checklist: task.checklist || []
      });
    } else {
      form.reset({
        name: "",
        description: "",
        status: "backlog",
        priority: "medium",
        checklist: [],
      });
    }
  }, [task, form]);

  const onSubmit = (values: Task) => {
    try {
      onSave(values);
      toast({
        title: task ? "Task updated" : "Task created",
        description: task ? "Your task has been updated successfully." : "Your task has been created successfully.",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    
    const currentChecklist = form.getValues("checklist") || [];
    form.setValue("checklist", [
      ...currentChecklist,
      { id: Date.now().toString(), text: newChecklistItem, completed: false }
    ]);
    setNewChecklistItem("");
  };

  const removeChecklistItem = (id: string) => {
    const currentChecklist = form.getValues("checklist") || [];
    form.setValue(
      "checklist",
      currentChecklist.filter(item => item.id !== id)
    );
  };

  const toggleChecklistItem = (id: string, completed: boolean) => {
    const currentChecklist = form.getValues("checklist") || [];
    form.setValue(
      "checklist",
      currentChecklist.map(item => item.id === id ? { ...item, completed } : item)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
          <DialogDescription>
            {task
              ? "Make changes to the existing task."
              : "Fill in the details to create a new task."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="assignment">Assignment</TabsTrigger>
                <TabsTrigger value="checklist">Checklist</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter task name" {...field} />
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
                          placeholder="Enter task description"
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
                            <SelectItem value="backlog">Backlog</SelectItem>
                            <SelectItem value="inProgress">In Progress</SelectItem>
                            <SelectItem value="testing">Testing</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="assignment" className="space-y-4">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.name}
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
                  name="assigneeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignee</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select assignee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Unassigned</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.name}
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
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="checklist" className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add a checklist item"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addChecklistItem();
                      }
                    }}
                  />
                  <Button type="button" onClick={addChecklistItem} variant="secondary">
                    Add
                  </Button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {form.watch("checklist")?.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2 p-2 border rounded-md">
                      <Checkbox
                        id={`item-${item.id}`}
                        checked={item.completed}
                        onCheckedChange={(checked) => toggleChecklistItem(item.id, checked as boolean)}
                      />
                      <label
                        htmlFor={`item-${item.id}`}
                        className={`flex-1 text-sm ${item.completed ? "line-through text-gray-500" : ""}`}
                      >
                        {item.text}
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChecklistItem(item.id)}
                        className="h-8 w-8 p-0"
                      >
                        &times;
                      </Button>
                    </div>
                  ))}
                  {form.watch("checklist")?.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center p-4">
                      No checklist items yet. Add one above.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{task ? "Save Changes" : "Create Task"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default TaskDialog;
