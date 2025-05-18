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
import ChangePasswordPage from "@/pages/change-password";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { AdminRoute } from "@/components/auth/admin-route";
import { ReactNode, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

// Função auxiliar para verificar se o usuário está autenticado
function PasswordCheck({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading || !isAuthenticated) return null;

  return <>{children}</>;
}

export default function App() {
  const { user, isAuthenticated, isLoading, precisa_redefinir_senha } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Se o usuário estiver logado e precisar trocar a senha, redireciona
    if (!isLoading && user && precisa_redefinir_senha) {
      navigate("/change-password");
    }
  }, [isLoading, user, precisa_redefinir_senha, navigate]);

  // Se o usuário precisa trocar a senha, não renderiza nada (será redirecionado)
  if (user && precisa_redefinir_senha) {
    return null;
  }

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? navigate("/") : <Login />}
      </Route>

      <Route path="/change-password">
        <ChangePasswordPage />
      </Route>
      
      <Route path="/">
        <PasswordCheck>
          <MainLayout>
            <Dashboard />
          </MainLayout>
        </PasswordCheck>
      </Route>
      
      <Route path="/dashboard">
        <PasswordCheck>
          <MainLayout>
            <Dashboard />
          </MainLayout>
        </PasswordCheck>
      </Route>
      
      <Route path="/clients">
        <PasswordCheck>
          <MainLayout>
            <ClientsPage />
          </MainLayout>
        </PasswordCheck>
      </Route>
      
      <Route path="/clients/:id">
        {params => (
          <PasswordCheck>
            <MainLayout>
              <ClientDetailPage id={params.id} />
            </MainLayout>
          </PasswordCheck>
        )}
      </Route>
      
      <Route path="/projects">
        <PasswordCheck>
          <MainLayout>
            <ProjectsPage />
          </MainLayout>
        </PasswordCheck>
      </Route>
      
      <Route path="/projects/:id">
        {params => (
          <PasswordCheck>
            <MainLayout>
              <ProjectDetailPage id={params.id} />
            </MainLayout>
          </PasswordCheck>
        )}
      </Route>
      
      <Route path="/tasks">
        <PasswordCheck>
          <MainLayout>
            <TasksPage />
          </MainLayout>
        </PasswordCheck>
      </Route>
      
      <Route path="/proposals">
        <PasswordCheck>
          <AdminRoute>
            <MainLayout>
              <ProposalsPage />
            </MainLayout>
          </AdminRoute>
        </PasswordCheck>
      </Route>
      
      <Route path="/invoices">
        <PasswordCheck>
          <AdminRoute>
            <MainLayout>
              <InvoicesPage />
            </MainLayout>
          </AdminRoute>
        </PasswordCheck>
      </Route>
      
      <Route path="/expenses">
        <PasswordCheck>
          <AdminRoute>
            <MainLayout>
              <ExpensesPage />
            </MainLayout>
          </AdminRoute>
        </PasswordCheck>
      </Route>
      
      <Route path="/support">
        <PasswordCheck>
          <MainLayout>
            <SupportPage />
          </MainLayout>
        </PasswordCheck>
      </Route>
      
      <Route path="/calendar">
        <PasswordCheck>
          <MainLayout>
            <CalendarPage />
          </MainLayout>
        </PasswordCheck>
      </Route>
      
      <Route path="/settings">
        <PasswordCheck>
          <AdminRoute>
            <MainLayout>
              <SettingsPage />
            </MainLayout>
          </AdminRoute>
        </PasswordCheck>
      </Route>
      
      <Route path="/users">
        <PasswordCheck>
          <AdminRoute>
            <MainLayout>
              <UsersPage />
            </MainLayout>
          </AdminRoute>
        </PasswordCheck>
      </Route>
      
      <Route path="/profile">
        <PasswordCheck>
          <MainLayout>
            <ProfilePage />
          </MainLayout>
        </PasswordCheck>
      </Route>

      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

export function AppWithProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <TooltipProvider>
          <AuthProvider>
            <App />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}