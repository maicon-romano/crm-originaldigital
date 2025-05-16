import { useState } from 'react';
import { useLocation } from 'wouter';
import { Bell, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { ModeToggle } from '@/components/ui/mode-toggle';

interface HeaderProps {
  pageTitle: string;
}

export function Header({ pageTitle }: HeaderProps) {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [notifications] = useState([
    { id: 1, text: 'New client registered', read: false },
    { id: 2, text: 'Invoice #123 is overdue', read: false },
    { id: 3, text: 'Project deadline approaching', read: true }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow sticky top-0 z-10">
      <div className="flex justify-between items-center px-4 py-3 md:px-6">
        <div className="flex items-center">
          <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-200">{pageTitle}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <ModeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex justify-between items-center px-4 py-2 border-b">
                <h3 className="font-medium">Notifications</h3>
                <Button variant="ghost" size="sm" className="text-xs">Mark all as read</Button>
              </div>
              {notifications.length > 0 ? (
                <>
                  {notifications.map(notification => (
                    <DropdownMenuItem key={notification.id} className="p-3 cursor-pointer">
                      <div className="flex gap-3 items-start">
                        <div className={`w-2 h-2 mt-2 rounded-full ${notification.read ? 'bg-gray-300' : 'bg-blue-500'}`}></div>
                        <div>
                          <p className="text-sm">{notification.text}</p>
                          <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center text-center py-2 cursor-pointer">
                    View all notifications
                  </DropdownMenuItem>
                </>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  No notifications
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative flex items-center gap-2 p-1">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user?.name || ''} className="h-8 w-8 object-cover" />
                  ) : (
                    <span className="text-gray-500 text-sm font-medium">
                      {user?.name?.charAt(0) || 'A'}
                    </span>
                  )}
                </div>
                <span className="hidden md:inline-block text-sm font-medium">
                  {user?.name || 'Admin User'}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/profile')}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default Header;
