import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { Project } from '@/components/dialogs/project-dialog';
import ProjectDialog from '@/components/dialogs/project-dialog';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Plus, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function ProjectsPage() {
  const [, navigate] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['/api/clients'],
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });

  const createMutation = useMutation({
    mutationFn: async (project: Project) => {
      const res = await apiRequest('POST', '/api/projects', project);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
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

  const updateMutation = useMutation({
    mutationFn: async (project: Project) => {
      const res = await apiRequest('PATCH', `/api/projects/${project.id}`, project);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
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

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
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

  const handleSaveProject = (project: Project) => {
    if (project.id) {
      updateMutation.mutate(project);
    } else {
      createMutation.mutate(project);
    }
    setDialogOpen(false);
  };

  const handleDeleteProject = (project: Project) => {
    setSelectedProject(project);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedProject?.id) {
      deleteMutation.mutate(selectedProject.id);
      setDeleteDialogOpen(false);
    }
  };

  const handleEditProject = (project: Project) => {
    const fullProject = {
      ...project,
      clientId: project.clientId.toString(),
      responsibleId: project.responsibleId.toString(),
      progress: project.progress?.toString() || "0"
    };
    setSelectedProject(fullProject);
    setDialogOpen(true);
  };

  const handleOpenDialog = () => {
    setSelectedProject(undefined);
    setDialogOpen(true);
  };

  const filteredProjects = activeFilter
    ? projects.filter(project => project.status === activeFilter)
    : projects;

  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.companyName : 'Unknown Client';
  };

  const getResponsibleName = (responsibleId: number) => {
    const user = users.find(u => u.id === responsibleId);
    return user ? user.name : 'Unassigned';
  };

  const getResponsibleInitials = (responsibleId: number) => {
    const user = users.find(u => u.id === responsibleId);
    if (!user) return 'UN';
    return user.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase();
  };

  const getTagColors = (tag: string) => {
    const colors = {
      development: 'bg-blue-100 text-blue-800',
      design: 'bg-purple-100 text-purple-800',
      marketing: 'bg-green-100 text-green-800',
      urgent: 'bg-red-100 text-red-800',
      feature: 'bg-yellow-100 text-yellow-800',
      bug: 'bg-orange-100 text-orange-800',
    };
    
    return colors[tag.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Projects</h2>
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button 
          variant={activeFilter === null ? "default" : "outline"} 
          onClick={() => setActiveFilter(null)}
        >
          All Projects
        </Button>
        <Button 
          variant={activeFilter === "inProgress" ? "default" : "outline"} 
          onClick={() => setActiveFilter("inProgress")}
        >
          Active
        </Button>
        <Button 
          variant={activeFilter === "completed" ? "default" : "outline"} 
          onClick={() => setActiveFilter("completed")}
        >
          Completed
        </Button>
        <Button 
          variant={activeFilter === "onHold" ? "default" : "outline"} 
          onClick={() => setActiveFilter("onHold")}
        >
          On Hold
        </Button>
      </div>

      {projectsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="opacity-50">
              <CardHeader className="skeleton h-24"></CardHeader>
              <CardContent className="skeleton h-32"></CardContent>
              <CardFooter className="skeleton h-10"></CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="rounded-full bg-blue-100 p-3 text-blue-500 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium">No Projects Found</h3>
            <p className="text-sm text-muted-foreground text-center mt-1 mb-4">
              {activeFilter 
                ? `No ${activeFilter} projects found. Try changing the filter or create a new project.`
                : "You don't have any projects yet. Create your first project to get started."}
            </p>
            <Button onClick={handleOpenDialog}>
              <Plus className="mr-2 h-4 w-4" /> Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="p-5 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <Badge 
                    variant={
                      project.status === 'completed' ? 'default' :
                      project.status === 'inProgress' ? 'outline' :
                      project.status === 'onHold' ? 'secondary' :
                      'destructive'
                    }
                  >
                    {project.status}
                  </Badge>
                </div>
                <CardDescription className="mt-2 line-clamp-2">
                  {project.description || 'No description provided.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="flex justify-between mb-4">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Client</span>
                    <p className="text-sm font-medium">{getClientName(project.clientId)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Deadline</span>
                    <p className="text-sm font-medium">
                      {project.endDate 
                        ? format(new Date(project.endDate), 'MMM d, yyyy')
                        : 'No deadline'}
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${project.progress || 0}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {project.progress || 0}% Complete
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Team</span>
                  <div className="flex mt-1 items-center">
                    <Avatar className="h-8 w-8 border-2 border-white">
                      <AvatarFallback>
                        {getResponsibleInitials(project.responsibleId)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs ml-2">{getResponsibleName(project.responsibleId)}</span>
                  </div>
                </div>
                {project.tags && project.tags.length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag, index) => (
                        <span 
                          key={index} 
                          className={`text-xs px-2 py-1 rounded-full ${getTagColors(tag)}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="px-5 py-3 bg-gray-50 dark:bg-gray-800 flex justify-between">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleEditProject(project)}
                >
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-500 hover:text-blue-700"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  View Details <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={selectedProject}
        onSave={handleSaveProject}
        clients={clients}
        users={users}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project "{selectedProject?.name}". This action cannot be undone.
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

export default ProjectsPage;
