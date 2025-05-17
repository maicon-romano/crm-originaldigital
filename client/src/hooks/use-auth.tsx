import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, loginWithEmailAndPassword, logoutUser, ADMIN_UID } from '../lib/firebase';

interface User {
  id: string;
  name: string;
  email: string | null;
  role: string;
  userType: 'admin' | 'staff' | 'client';
  clientId?: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isClient: boolean;
}

// Converter usuário do Firebase para nosso modelo de usuário
const mapFirebaseUserToUser = (firebaseUser: FirebaseUser): User => {
  const isAdmin = firebaseUser.uid === ADMIN_UID;
  
  // Por padrão, se o usuário for o admin específico, atribuímos o tipo admin
  // Caso contrário, assumimos como staff (equipe interna)
  const userType = isAdmin ? 'admin' : 'staff';
  
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
    email: firebaseUser.email,
    role: isAdmin ? 'admin' : 'staff',
    userType: userType,
  };
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: async () => {},
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,
  isStaff: false,
  isClient: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Monitorar o estado de autenticação do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const mappedUser = mapFirebaseUserToUser(firebaseUser);
        setUser(mappedUser);
        
        // Aqui seria o lugar para consultar o banco de dados para obter detalhes adicionais do usuário
        // como tipo de usuário (admin, staff, client) e clientId (se aplicável)
        
        console.log("Usuário autenticado:", mappedUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Limpar o listener quando o componente for desmontado
    return () => unsubscribe();
  }, []);
  
  // Função de login com Firebase
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const firebaseUser = await loginWithEmailAndPassword(email, password);
      return !!firebaseUser;
    } catch (error) {
      console.error('Falha no login:', error);
      return false;
    }
  };
  
  // Função de logout com Firebase
  const logout = async (): Promise<void> => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Falha no logout:', error);
    }
  };
  
  const isAuthenticated = !!user;
  
  // Verificadores de tipo de usuário
  const isAdmin = user?.userType === 'admin' || user?.role === 'admin';
  const isStaff = user?.userType === 'staff';
  const isClient = user?.userType === 'client';
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated,
      isLoading,
      isAdmin,
      isStaff,
      isClient
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}