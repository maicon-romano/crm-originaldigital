import { Switch, Route, useLocation, useRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/ui/theme-provider";
import MainLayout from "./components/layout/main-layout";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import ClientsPage from "@/pages/clients";
import ClientDetailPage from "@/pages/clients/[id]";
import ProjectsPage from "@/pages/projects";
import ProjectDetailPage from "@/pages/projects/[id]";
import TasksPage from "@/pages/tasks";
import ProposalsPage from "@/pages/proposals";
import InvoicesPage from "@/pages/invoices";
import ExpensesPage from "@/pages/expenses";
import SupportPage from "@/pages/support";
import CalendarPage from "@/pages/calendar";
import SettingsPage from "@/pages/settings";
import UsersPage from "@/pages/users";
import ProfilePage from "@/pages/profile";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { ReactNode, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

// Componente para proteger rotas que só devem ser acessadas por admin
interface AdminRouteProps {
  children: ReactNode;
}

function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Se não estiver carregando e o usuário não for admin, redireciona
    if (!isLoading && user && user.role !== 'admin') {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  // Se estiver carregando, mostra um indicador de carregamento
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Se não estiver autenticado ou não for admin, não renderiza nada
  if (!user || user.role !== 'admin') {
    return null;
  }

  // Se for admin, renderiza o conteúdo
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/">
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </Route>
      
      <Route path="/dashboard">
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </Route>
      
      <Route path="/clients">
        <MainLayout>
          <ClientsPage />
        </MainLayout>
      </Route>
      
      <Route path="/clients/:id">
        {params => (
          <MainLayout>
            <ClientDetailPage id={params.id} />
          </MainLayout>
        )}
      </Route>
      
      <Route path="/projects">
        <MainLayout>
          <ProjectsPage />
        </MainLayout>
      </Route>
      
      <Route path="/projects/:id">
        {params => (
          <MainLayout>
            <ProjectDetailPage id={params.id} />
          </MainLayout>
        )}
      </Route>
      
      <Route path="/tasks">
        <MainLayout>
          <TasksPage />
        </MainLayout>
      </Route>
      
      <Route path="/proposals">
        <MainLayout>
          <ProposalsPage />
        </MainLayout>
      </Route>
      
      <Route path="/invoices">
        <MainLayout>
          <InvoicesPage />
        </MainLayout>
      </Route>
      
      <Route path="/expenses">
        <MainLayout>
          <ExpensesPage />
        </MainLayout>
      </Route>
      
      <Route path="/support">
        <MainLayout>
          <SupportPage />
        </MainLayout>
      </Route>
      
      <Route path="/calendar">
        <MainLayout>
          <CalendarPage />
        </MainLayout>
      </Route>
      
      <Route path="/settings">
        <MainLayout>
          <SettingsPage />
        </MainLayout>
      </Route>
      
      <Route path="/users">
        <MainLayout>
          <AdminRoute>
            <UsersPage />
          </AdminRoute>
        </MainLayout>
      </Route>
      
      <Route path="/profile">
        <MainLayout>
          <ProfilePage />
        </MainLayout>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="crm-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
