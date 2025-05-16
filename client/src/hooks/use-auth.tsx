import { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  // In a real application, this would make an API call to authenticate
  const login = async (email: string, password: string) => {
    // For demo purposes, we'll simulate a successful login
    if (email && password) {
      setUser({
        id: 1,
        name: 'Admin User',
        email: email,
        role: 'admin',
      });
      return true;
    }
    return false;
  };
  
  const logout = () => {
    setUser(null);
  };
  
  const isAuthenticated = !!user;
  
  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}