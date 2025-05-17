import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';

interface MainLayoutProps {
  children: React.ReactNode;
}

function getPageTitle(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  const base = parts[0] || 'dashboard';
  
  // Special case for detail pages
  if (parts.length > 1 && !isNaN(Number(parts[1]))) {
    switch (base) {
      case 'clients':
        return 'Detalhes do Cliente';
      case 'projects':
        return 'Detalhes do Projeto';
      default:
        return `Detalhes de ${base.charAt(0).toUpperCase() + base.slice(1)}`;
    }
  }
  
  switch (base) {
    case 'dashboard':
      return 'Dashboard';
    case 'clients':
      return 'Clientes';
    case 'projects':
      return 'Projetos';
    case 'tasks':
      return 'Tarefas';
    case 'proposals':
      return 'Propostas';
    case 'invoices':
      return 'Faturas';
    case 'expenses':
      return 'Despesas';
    case 'support':
      return 'Suporte';
    case 'calendar':
      return 'Calendário';
    case 'users':
      return 'Usuários';
    case 'settings':
      return 'Configurações';
    case 'profile':
      return 'Seu Perfil';
    default:
      return 'Dashboard';
  }
}

export function MainLayout({ children }: MainLayoutProps) {
  const [location, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  const [pageTitle, setPageTitle] = useState(getPageTitle(location));

  // Update page title when location changes
  useEffect(() => {
    setPageTitle(getPageTitle(location));
    document.title = `${getPageTitle(location)} | CRM Original Digital`;
  }, [location]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <Header pageTitle={pageTitle} />
        
        <div className="px-4 py-6 md:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
