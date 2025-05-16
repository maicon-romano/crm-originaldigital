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
    return `${base.charAt(0).toUpperCase() + base.slice(1)} Details`;
  }
  
  switch (base) {
    case 'dashboard':
      return 'Dashboard';
    case 'clients':
      return 'Clients';
    case 'projects':
      return 'Projects';
    case 'tasks':
      return 'Tasks';
    case 'proposals':
      return 'Proposals';
    case 'invoices':
      return 'Invoices';
    case 'expenses':
      return 'Expenses';
    case 'support':
      return 'Support Tickets';
    case 'calendar':
      return 'Calendar';
    case 'users':
      return 'Users';
    case 'settings':
      return 'Settings';
    case 'profile':
      return 'Your Profile';
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
    document.title = `${getPageTitle(location)} | CRM System`;
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
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
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
