import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { apiRequest } from '@/lib/queryClient';
import { Task } from '@/components/dialogs/task-dialog';
import TaskDialog from '@/components/dialogs/task-dialog';
import KanbanBoard, { KanbanColumn, TaskItem } from '@/components/ui/kanban-board';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function TasksPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>([]);
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ['/api/projects'],
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      const res = await apiRequest('PATCH', `/api/tasks/${task.id}`, task);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
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

  const createTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      const res = await apiRequest('POST', '/api/tasks', task);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
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

  useEffect(() => {
    if (!tasksLoading && tasks) {
      // Filter tasks based on selected filters
      let filteredTasks = [...tasks];
      
      if (projectFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => 
          task.projectId && task.projectId.toString() === projectFilter
        );
      }
      
      if (userFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => 
          task.assigneeId && task.assigneeId.toString() === userFilter
        );
      }
      
      if (priorityFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => 
          task.priority === priorityFilter
        );
      }

      // Group tasks by status
      const backlogTasks = filteredTasks
        .filter(task => task.status === 'backlog')
        .map(mapTaskToKanbanItem);
      
      const inProgressTasks = filteredTasks
        .filter(task => task.status === 'inProgress')
        .map(mapTaskToKanbanItem);
      
      const testingTasks = filteredTasks
        .filter(task => task.status === 'testing')
        .map(mapTaskToKanbanItem);
      
      const completedTasks = filteredTasks
        .filter(task => task.status === 'completed')
        .map(mapTaskToKanbanItem);

      setKanbanColumns([
        {
          id: 'backlog',
          title: 'Backlog',
          tasks: backlogTasks,
        },
        {
          id: 'inProgress',
          title: 'In Progress',
          tasks: inProgressTasks,
        },
        {
          id: 'testing',
          title: 'Testing',
          tasks: testingTasks,
        },
        {
          id: 'completed',
          title: 'Completed',
          tasks: completedTasks,
        },
      ]);
    }
  }, [tasks, tasksLoading, projectFilter, userFilter, priorityFilter]);

  const mapTaskToKanbanItem = (task: Task): TaskItem => {
    const projectData = projects.find(p => p.id === (task.projectId ? parseInt(task.projectId.toString()) : null));
    const assigneeData = users.find(u => u.id === (task.assigneeId ? parseInt(task.assigneeId.toString()) : null));

    return {
      id: task.id || 0,
      name: task.name,
      description: task.description,
      status: task.status,
      priority: task.priority as any,
      dueDate: task.dueDate,
      assigneeId: task.assigneeId ? parseInt(task.assigneeId.toString()) : undefined,
      assignee: assigneeData ? {
        id: assigneeData.id,
        name: assigneeData.name,
        avatar: assigneeData.avatar,
      } : undefined,
      projectId: task.projectId ? parseInt(task.projectId.toString()) : undefined,
      project: projectData ? {
        id: projectData.id,
        name: projectData.name,
      } : undefined,
    };
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    // Find the task that was dragged
    const taskId = parseInt(draggableId);
    const task = tasks.find(t => t.id === taskId);

    if (task) {
      // Update the task status
      updateTaskMutation.mutate({
        ...task,
        status: destination.droppableId,
      });
    }
  };

  const handleAddTask = (columnId: string) => {
    setSelectedStatus(columnId);
    setSelectedTask(undefined);
    setDialogOpen(true);
  };

  const handleEditTask = (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setDialogOpen(true);
    }
  };

  const handleSaveTask = (task: Task) => {
    if (task.id) {
      updateTaskMutation.mutate(task);
    } else {
      // If task is new and selectedStatus is set, use it
      createTaskMutation.mutate({
        ...task,
        status: selectedStatus || 'backlog',
      });
    }
    setDialogOpen(false);
  };

  const getProjectById = (id?: number) => {
    if (!id) return null;
    return projects.find(p => p.id === id);
  };

  const getAssigneeById = (id?: number) => {
    if (!id) return null;
    return users.find(u => u.id === id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Tasks</h2>
        <Button onClick={() => {
          setSelectedStatus(null);
          setSelectedTask(undefined);
          setDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> New Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Select
            value={projectFilter}
            onValueChange={setProjectFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Select
            value={userFilter}
            onValueChange={setUserFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Select
            value={priorityFilter}
            onValueChange={setPriorityFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {tasksLoading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <KanbanBoard 
            columns={kanbanColumns} 
            onTaskMove={handleDragEnd}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
          />
        </DragDropContext>
      )}

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={selectedTask}
        onSave={handleSaveTask}
        projects={projects}
        users={users}
      />
    </div>
  );
}

export default TasksPage;
