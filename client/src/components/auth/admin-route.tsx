import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AccessDenied } from './access-denied';

interface AdminRouteProps {
  children: ReactNode;
}

/**
 * Componente para proteger rotas que só podem ser acessadas por administradores
 * Redireciona usuários não administradores para uma página de acesso negado
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, isLoading } = useAuth();

  // Enquanto estiver carregando, não renderiza nada
  if (isLoading) {
    return null;
  }

  // Se não for admin, mostra página de acesso negado
  if (!isAdmin) {
    return <AccessDenied />;
  }

  // Se for admin, renderiza o conteúdo normalmente
  return <>{children}</>;
}