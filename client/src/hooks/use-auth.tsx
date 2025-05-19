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
  precisa_redefinir_senha: boolean;
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
  precisa_redefinir_senha: boolean;
  updateUserAfterPasswordChange: () => Promise<void>;
}

// Converter usuário do Firebase + Firestore para nosso modelo de usuário
const mapFirebaseUserToUser = async (firebaseUser: FirebaseUser): Promise<User> => {
  try {
    // Buscar informações adicionais do usuário no Firestore
    const firestoreUser = await getFirestoreUserById(firebaseUser.uid);
    
    if (firestoreUser) {
      // Se encontrou o usuário no Firestore, use essas informações
      console.log("Dados completos do usuário no Firestore:", firestoreUser);
      
      return {
        id: firestoreUser.id,
        name: firestoreUser.name,
        email: firestoreUser.email,
        role: firestoreUser.role,
        userType: firestoreUser.userType,
        clientId: firestoreUser.clientId,
        precisa_redefinir_senha: firestoreUser.precisa_redefinir_senha || false
      };
    }
    
    // Caso não encontre no Firestore (caso de usuário novo), use informações do Firebase
    // Definindo valores padrão mais seguros
    const isMainAdmin = firebaseUser.uid === ADMIN_UID;
    
    // Usuário não encontrado no Firestore (caso raro)
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
      email: firebaseUser.email,
      role: isMainAdmin ? 'admin' : 'usuario',
      userType: isMainAdmin ? 'admin' : 'staff',
      precisa_redefinir_senha: false
    };
  } catch (error) {
    console.error("Erro ao mapear usuário do Firestore:", error);
    
    // Em caso de erro, usar dados mínimos do Firebase
    const adminStatus = firebaseUser.uid === ADMIN_UID;
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
      email: firebaseUser.email,
      role: adminStatus ? 'admin' : 'usuario',
      userType: adminStatus ? 'admin' : 'staff',
      precisa_redefinir_senha: false
    };
  }
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
  precisa_redefinir_senha: false,
  updateUserAfterPasswordChange: async () => {},
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
  
  // Função de login com Firebase - Melhorada para lidar com primeiro login
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const firebaseUser = await loginWithEmailAndPassword(email, password);
      
      if (firebaseUser) {
        // Buscar dados do usuário no Firestore para verificar se é primeiro login
        const userDoc = await getFirestoreUserById(firebaseUser.uid);
        
        // Se é o primeiro login, o usuário será redirecionado automaticamente 
        // pelo componente PasswordCheck para a página de troca de senha
        
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
  
  // Check if it's first login or if password needs to be changed
  const precisa_redefinir_senha = !!user?.precisa_redefinir_senha || 
    // Checar se é primeiro login para QUALQUER tipo de usuário (cliente, staff ou admin)
    (auth.currentUser?.metadata.creationTime === auth.currentUser?.metadata.lastSignInTime);
  
  // Função para atualizar o usuário após mudar a senha
  const updateUserAfterPasswordChange = async (): Promise<void> => {
    if (user?.id) {
      try {
        // Atualizar o usuário no Firestore para remover a flag de troca de senha
        await fetch(`/api/firestore/users/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            precisa_redefinir_senha: false
          })
        });
        
        // Recarregar os dados do usuário
        if (auth.currentUser) {
          const updatedUser = await mapFirebaseUserToUser(auth.currentUser);
          setUser(updatedUser);
        }
      } catch (error) {
        console.error('Erro ao atualizar status de senha do usuário:', error);
      }
    }
  };
  
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
      isClient,
      precisa_redefinir_senha,
      updateUserAfterPasswordChange
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}