import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  auth, 
  loginWithEmailAndPassword, 
  logoutUser, 
  ADMIN_UID,
  getFirestoreUserById,
  FirestoreUser
} from '../lib/firebase';

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

// Converter usuário do Firebase + Firestore para nosso modelo de usuário
const mapFirebaseUserToUser = async (firebaseUser: FirebaseUser): Promise<User> => {
  // Buscar informações adicionais do usuário no Firestore
  const firestoreUser = await getFirestoreUserById(firebaseUser.uid);
  
  if (firestoreUser) {
    // Se encontrou o usuário no Firestore, use essas informações
    return {
      id: firestoreUser.id,
      name: firestoreUser.name,
      email: firestoreUser.email,
      role: firestoreUser.role,
      userType: firestoreUser.userType,
      clientId: firestoreUser.clientId
    };
  }
  
  // Caso não encontre no Firestore (caso de usuário novo), use informações do Firebase
  // Definindo valores padrão mais seguros
  const isMainAdmin = firebaseUser.uid === ADMIN_UID;
  
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
    email: firebaseUser.email,
    role: isMainAdmin ? 'admin' : 'usuario',
    userType: isMainAdmin ? 'admin' : 'staff',
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Mapear o usuário do Firebase + Firestore para nosso modelo
          const mappedUser = await mapFirebaseUserToUser(firebaseUser);
          setUser(mappedUser);
          
          console.log("Usuário autenticado:", mappedUser);
        } catch (error) {
          console.error("Erro ao obter dados do usuário do Firestore:", error);
          setUser(null);
        }
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
      
      if (firebaseUser) {
        // Não precisamos definir o usuário aqui, pois o onAuthStateChanged será disparado
        return true;
      }
      return false;
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
  // Considera admin tanto o usuário específico (ADMIN_UID) quanto qualquer usuário com userType 'admin' ou role 'admin'
  const isAdmin = user?.id === ADMIN_UID || user?.userType === 'admin' || user?.role === 'admin';
  const isStaff = user?.userType === 'staff' || user?.role === 'usuario'; // 'usuario' é o equivalente a 'staff' nas regras
  const isClient = user?.userType === 'client' || user?.role === 'cliente'; // 'cliente' é o equivalente a 'client' nas regras
  
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