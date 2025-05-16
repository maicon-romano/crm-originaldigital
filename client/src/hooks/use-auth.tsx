import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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
  demoCredentials: { email: string; password: string };
}

// Demo credentials for easy login
const DEMO_CREDENTIALS = {
  email: 'demo@exemplo.com',
  password: 'senha123',
};

// Demo user information
const DEMO_USER = {
  id: 1,
  name: 'Usuário Demo',
  email: DEMO_CREDENTIALS.email,
  role: 'admin',
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: () => {},
  isAuthenticated: false,
  demoCredentials: DEMO_CREDENTIALS,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  // Check for any previously saved authentication in localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('crm_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('crm_user');
      }
    }
  }, []);
  
  // In a real application, this would make an API call to authenticate
  const login = async (email: string, password: string) => {
    // For demo purposes, check if credentials match demo login
    if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
      // Set user data from demo info
      setUser(DEMO_USER);
      // Save to localStorage for session persistence
      localStorage.setItem('crm_user', JSON.stringify(DEMO_USER));
      return true;
    }
    
    // For testing, allow any non-empty credentials to login as regular user
    if (email && password) {
      const userData = {
        id: 2,
        name: email.split('@')[0],
        email: email,
        role: 'user',
      };
      setUser(userData);
      localStorage.setItem('crm_user', JSON.stringify(userData));
      return true;
    }
    
    return false;
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('crm_user');
  };
  
  const isAuthenticated = !!user;
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated,
      demoCredentials: DEMO_CREDENTIALS
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}