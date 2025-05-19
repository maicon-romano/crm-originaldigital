import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  FileText,
  File,
  BanknoteIcon,
  Headphones,
  Calendar,
  User,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  X,
  Shield,
  FolderIcon,
} from "lucide-react";

interface NavLink {
  href: string;
  icon: React.ReactNode;
  text: string;
  adminOnly?: boolean;
  staffOnly?: boolean;  // Propriedade que indica que o link é apenas para staff e admin
}

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  text: string;
  isActive?: boolean;
  collapsed?: boolean;
  adminOnly?: boolean;
  staffOnly?: boolean;  // Nova propriedade para indicar se o link é apenas para staff e admin
}

const SidebarLink = ({ href, icon, text, isActive, collapsed, adminOnly = false, staffOnly = false }: SidebarLinkProps) => {
  const { user, isAdmin, isStaff, isClient } = useAuth();

  // Se o link for apenas para admin e o usuário não for admin, não mostra o link
  if (adminOnly && !isAdmin) {
    return null;
  }

  // Se o link for apenas para staff/admin e o usuário for cliente, não mostra o link
  if (staffOnly && isClient) {
    return null;
  }

  // Restrições adicionais para funcionários (staff)
  if (isStaff && !isAdmin) {
    // Funcionários não podem acessar usuários, faturas, propostas, despesas e configurações
    if (
      href === '/users' || 
      href === '/invoices' || 
      href === '/proposals' || 
      href === '/expenses' ||
      href === '/settings'
    ) {
      return null;
    }
  }

  // Restrições específicas para clientes - garantia adicional de segurança
  if (isClient) {
    // Clientes não podem acessar a página de clientes
    if (href === '/clients') {
      return null;
    }
  }

  // Usando o padrão de função render para evitar o aninhamento de <a> dentro de <a>
  return (
    <div 
      onClick={() => { window.location.href = href; }}
      className={cn(
        "cursor-pointer flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary text-white dark:bg-primary/80"
          : "text-gray-300 hover:bg-gray-700 hover:text-white"
      )}
    >
      <span className="flex-shrink-0 w-5 h-5">{icon}</span>
      {!collapsed && (
        <span className="font-medium flex-1">
          {text}
          {adminOnly && <Shield className="inline-block ml-2 h-3 w-3" />}
        </span>
      )}
      {collapsed && adminOnly && <Shield className="h-3 w-3 absolute right-2 top-2" />}
    </div>
  );
};

export function Sidebar() {
  const [location] = useLocation();
  const { user, isAdmin, isClient } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };

    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const mainLinks: NavLink[] = [
    {
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      text: 'Dashboard',
      adminOnly: false
    },
    {
      href: '/clients',
      icon: <Users className="h-5 w-5" />,
      text: 'Clientes',
      adminOnly: false,
      staffOnly: true  // Essa propriedade garante que o link não aparece para clientes
    },
    {
      href: '/projects',
      icon: <FolderKanban className="h-5 w-5" />,
      text: 'Projetos',
      adminOnly: false
    },
    {
      href: '/tasks',
      icon: <CheckSquare className="h-5 w-5" />,
      text: 'Tarefas',
      adminOnly: false
    },
    {
      href: '/proposals',
      icon: <FileText className="h-5 w-5" />,
      text: 'Propostas',
      adminOnly: true // Apenas administradores podem ver propostas
    },
    {
      href: '/invoices',
      icon: <File className="h-5 w-5" />,
      text: 'Faturas',
      adminOnly: true // Apenas administradores podem ver faturas
    },
    {
      href: '/expenses',
      icon: <BanknoteIcon className="h-5 w-5" />,
      text: 'Despesas',
      adminOnly: true // Apenas administradores podem ver despesas
    },
    {
      href: '/files',
      icon: <FolderIcon className="h-5 w-5" />,
      text: 'Arquivos',
      adminOnly: false
    },
    {
      href: '/support',
      icon: <Headphones className="h-5 w-5" />,
      text: 'Suporte',
      adminOnly: false
    },
    {
      href: '/calendar',
      icon: <Calendar className="h-5 w-5" />,
      text: 'Calendário',
      adminOnly: false
    }
  ];

  const secondaryLinks: NavLink[] = [
    {
      href: '/users',
      icon: <User className="h-5 w-5" />,
      text: 'Usuários',
      adminOnly: true
    },
    {
      href: '/settings',
      icon: <Settings className="h-5 w-5" />,
      text: 'Configurações',
      adminOnly: true // Apenas administradores podem acessar configurações
    }
  ];

  const sidebarClasses = cn(
    "bg-gray-800 text-white flex flex-col transition-all duration-300",
    collapsed ? "w-16" : "w-64",
    isMobile
      ? `fixed inset-y-0 left-0 z-50 transform ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:translate-x-0`
      : "relative"
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile menu button */}
      {isMobile && (
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="fixed top-4 left-4 z-50 lg:hidden bg-gray-800 text-white p-2 rounded-md"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}

      <aside className={sidebarClasses}>
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className="text-primary text-xl flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-7 w-7"
              >
                <path d="M21 13.242V20h1a1 1 0 0 1 0 2H2a1 1 0 0 1 0-2h1v-6.758A4.496 4.496 0 0 1 1 9.5c0-.827.224-1.624.633-2.303L4.345 2.5a1 1 0 0 1 1.659 0l2.713 4.697c.409.679.633 1.476.633 2.303 0 .997-.33 1.917-.882 2.66.155.937.337 1.433.48 1.84H15.1c.481-1.732 1.654-3 4.9-3 .324 0 .641.03.947.086A.998.998 0 0 1 21 12.5v.742zM7.684 9.636L5.13 5.263 2.576 9.636a2.5 2.5 0 1 0 5.109 0z" />
              </svg>
            </div>
            {!collapsed && <h1 className="text-xl font-bold">CRM Original</h1>}
          </div>
          {!isMobile && (
            <button 
              onClick={toggleCollapse}
              className="text-gray-400 hover:text-white"
            >
              {collapsed ? (
                <ChevronsRight className="h-5 w-5" />
              ) : (
                <ChevronsLeft className="h-5 w-5" />
              )}
            </button>
          )}
          {isMobile && (
            <button
              onClick={closeMobileMenu}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto pt-5 px-2">
          <div className="space-y-1">
            {mainLinks.map((link) => {
              // Se o usuário for cliente e a página for 'clients', não mostrar o item
              if ((isClient && link.href === '/clients') || (isClient && link.staffOnly)) {
                return null;
              }

              return (
                <SidebarLink
                  key={link.href}
                  href={link.href}
                  icon={link.icon}
                  text={link.text}
                  isActive={location === link.href || location.startsWith(`${link.href}/`)}
                  collapsed={collapsed}
                  adminOnly={link.adminOnly}
                />
              );
            })}
          </div>

          <div className="mt-8 pt-4 border-t border-gray-700">
            <div className="space-y-1">
              {secondaryLinks.map((link) => (
                <SidebarLink
                  key={link.href}
                  href={link.href}
                  icon={link.icon}
                  text={link.text}
                  isActive={location === link.href}
                  collapsed={collapsed}
                  adminOnly={link.adminOnly}
                />
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <Link href="/profile">
            <a className={cn(
              "flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-all",
              collapsed && "justify-center"
            )}>
              <div className="relative">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  {user?.userType === 'admin' || user?.role === 'admin' ? (
                    <Shield className="h-4 w-4 text-primary" />
                  ) : (
                    <span className="text-primary text-sm font-medium">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-gray-800"></span>
              </div>
              {!collapsed && (
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate">{user?.name || 'Usuário'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                </div>
              )}
            </a>
          </Link>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;