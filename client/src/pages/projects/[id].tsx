import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { Project } from '@/components/dialogs/project-dialog';
import { Task } from '@/components/dialogs/task-dialog';
import ProjectDialog from '@/components/dialogs/project-dialog';
import TaskDialog from '@/components/dialogs/task-dialog';
import { apiRequest } from '@/lib/queryClient';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ChevronLeft,
  Pencil,
  Plus,
  Calendar,
  Clock,
  FileText,
  Users,
  MessageSquare,
  CheckSquare,
  Upload
} from 'lucide-react';
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

interface ProjectDetailPageProps {
  id: string;
}

export function ProjectDetailPage({ id }: ProjectDetailPageProps) {
  const [, navigate] = useLocation();
  const [editProjectDialogOpen, setEditProjectDialogOpen] = useState(false);
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const projectId = parseInt(id);
  const queryClient = useQueryClient();

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !isNaN(projectId),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: [`/api/tasks?projectId=${projectId}`],
    enabled: !isNaN(projectId),
  });

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['/api/clients'],
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (project: Project) => {
      const res = await apiRequest('PATCH', `/api/projects/${projectId}`, project);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast({
        title: 'Project updated',
        description: 'The project has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update project: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      navigate('/projects');
      toast({
        title: 'Project deleted',
        description: 'The project has been deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete project: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      const res = await apiRequest('POST', '/api/tasks', task);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks?projectId=${projectId}`] });
      toast({
        title: 'Task created',
        description: 'The task has been created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create task: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      const res = await apiRequest('PATCH', `/api/tasks/${task.id}`, task);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks?projectId=${projectId}`] });
      toast({
        title: 'Task updated',
        description: 'The task has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update task: ${error}`,
        variant: 'destructive',
      });
    },
  });

  const handleUpdateProject = (updatedProject: Project) => {
    updateProjectMutation.mutate(updatedProject);
  };

  const handleDeleteProject = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProject = () => {
    deleteProjectMutation.mutate();
  };

  const handleSaveTask = (task: Task) => {
    // Ensure the task is associated with this project
    const processedTask = {
      ...task,
      projectId: projectId.toString()
    };
    
    if (task.id) {
      updateTaskMutation.mutate(processedTask);
    } else {
      createTaskMutation.mutate(processedTask);
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setNewTaskDialogOpen(true);
  };

  const getClientName = (clientId?: number) => {
    if (!clientId) return 'N/A';
    const client = clients.find(c => c.id === clientId);
    return client ? client.companyName : 'Unknown Client';
  };

  const getResponsibleName = (responsibleId?: number) => {
    if (!responsibleId) return 'Unassigned';
    const user = users.find(u => u.id === responsibleId);
    return user ? user.name : 'Unknown User';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  // Task columns for DataTable
  const taskColumns: ColumnDef<Task>[] = [
    {
      accessorKey: 'name',
      header: 'Task Name',
    },
    {
      accessorKey: 'assigneeId',
      header: 'Assignee',
      cell: ({ row }) => {
        const assigneeId = row.original.assigneeId;
        return assigneeId ? getResponsibleName(parseInt(assigneeId.toString())) : 'Unassigned';
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
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => {
        return row.original.dueDate ? (
          <span>{format(new Date(row.original.dueDate), 'MMM dd, yyyy')}</span>
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
            onClick={() => handleEditTask(row.original)}
          >
            Edit
          </Button>
        );
      },
    },
  ];

  if (projectLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <h3 className="text-lg font-semibold">Project not found</h3>
        <p>The project you're looking for doesn't exist or has been removed.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/projects')}>
          Go back to projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Project Overview Card */}
        <Card className="lg:w-1/3">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription>
                  {getClientName(project.clientId)} • {project.status}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => setEditProjectDialogOpen(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Description</span>
              </div>
              <p className="text-sm text-muted-foreground pl-6">
                {project.description || 'No description provided.'}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Project Timeline</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pl-6">
                <div>
                  <span className="text-xs text-muted-foreground">Start Date</span>
                  <p className="text-sm">
                    {project.startDate
                      ? format(new Date(project.startDate), 'MMM dd, yyyy')
                      : 'Not set'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">End Date</span>
                  <p className="text-sm">
                    {project.endDate
                      ? format(new Date(project.endDate), 'MMM dd, yyyy')
                      : 'Not set'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Progress</span>
              </div>
              <div className="pl-6">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-blue-500 h-2.5 rounded-full"
                    style={{ width: `${project.progress || 0}%` }}
                  ></div>
                </div>
                <span className="text-xs text-muted-foreground mt-1 inline-block">
                  {project.progress || 0}% Complete
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Team</span>
              </div>
              <div className="flex items-center gap-2 pl-6">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {getInitials(getResponsibleName(project.responsibleId))}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{getResponsibleName(project.responsibleId)}</p>
                  <p className="text-xs text-muted-foreground">Project Manager</p>
                </div>
              </div>
            </div>

            {project.tags && project.tags.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2 pl-6">
                  {project.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <Button variant="destructive" size="sm" onClick={handleDeleteProject}>
              Delete Project
            </Button>
          </CardFooter>
        </Card>

        {/* Project Details Tabs */}
        <div className="flex-1">
          <Tabs defaultValue="tasks">
            <TabsList className="w-full">
              <TabsTrigger value="tasks" className="flex-1">Tasks</TabsTrigger>
              <TabsTrigger value="comments" className="flex-1">Comments</TabsTrigger>
              <TabsTrigger value="files" className="flex-1">Files</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Project Tasks</h3>
                <Button onClick={() => {
                  setSelectedTask(undefined);
                  setNewTaskDialogOpen(true);
                }}>
                  <Plus className="mr-2 h-4 w-4" /> Add Task
                </Button>
              </div>

              {tasksLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : tasks.length > 0 ? (
                <DataTable
                  columns={taskColumns}
                  data={tasks}
                  searchKey="name"
                  searchPlaceholder="Search tasks..."
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Tasks</h3>
                    <p className="text-sm text-muted-foreground text-center mt-1 mb-4">
                      This project doesn't have any tasks yet.
                    </p>
                    <Button onClick={() => {
                      setSelectedTask(undefined);
                      setNewTaskDialogOpen(true);
                    }}>
                      Create Task
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="comments" className="pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Comments</h3>
              </div>
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Comments</h3>
                  <p className="text-sm text-muted-foreground text-center mt-1 mb-4">
                    This project doesn't have any comments yet.
                  </p>
                  <Button>Add Comment</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="files" className="pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Files & Documents</h3>
              </div>
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Files</h3>
                  <p className="text-sm text-muted-foreground text-center mt-1 mb-4">
                    This project doesn't have any files uploaded yet.
                  </p>
                  <Button>Upload Files</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Project Dialog */}
      <ProjectDialog
        open={editProjectDialogOpen}
        onOpenChange={setEditProjectDialogOpen}
        project={{
          ...project,
          clientId: project.clientId?.toString(),
          responsibleId: project.responsibleId?.toString(),
          progress: project.progress?.toString() || "0"
        }}
        onSave={handleUpdateProject}
        clients={clients}
        users={users}
      />

      {/* Add/Edit Task Dialog */}
      <TaskDialog
        open={newTaskDialogOpen}
        onOpenChange={setNewTaskDialogOpen}
        task={selectedTask}
        onSave={handleSaveTask}
        projects={[{ id: projectId, name: project.name }]}
        users={users}
      />

      {/* Delete Project Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project "{project.name}"
              and all associated tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProject} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ProjectDetailPage;
