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
  lastTempPassword?: string | null; // Campo para armazenar a última senha temporária
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
        precisa_redefinir_senha: firestoreUser.precisa_redefinir_senha || false,
        lastTempPassword: firestoreUser.lastTempPassword || null
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
      precisa_redefinir_senha: false,
      lastTempPassword: null
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
      precisa_redefinir_senha: false,
      lastTempPassword: null
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
  // Esta verificação funciona para todos os tipos de usuário (cliente, staff ou admin)
  // 1. Verificamos a flag 'precisa_redefinir_senha' que é definida no servidor
  // 2. Verificamos se é o primeiro login comparando as datas de criação e login
  const isFirstLogin = auth.currentUser && 
    auth.currentUser.metadata.creationTime === auth.currentUser.metadata.lastSignInTime;
  
  // VERIFICAÇÃO REFORÇADA para garantir que qualquer tipo de usuário (ESPECIALMENTE CLIENTES)
  // seja redirecionado para trocar a senha no primeiro login
  const precisa_redefinir_senha = Boolean(
    // 1. Verificar flags explícitas no objeto do usuário
    user?.precisa_redefinir_senha === true || 
    // 2. Verificar flag lastTempPassword no cliente
    (user?.lastTempPassword && user?.lastTempPassword.length > 0) ||
    // 3. Verificar se é primeiro login para qualquer tipo de usuário
    (isFirstLogin && 
      // Garantir que TODOS os tipos de usuários sejam verificados 
      (user?.userType === 'client' || user?.role === 'cliente' || 
       user?.userType === 'staff' || user?.role === 'usuario' ||
       user?.userType === 'admin' || user?.role === 'admin'))
  );
  
  // Adicionar log para depuração de redirecionamento
  if (user) {
    console.log(`Verificação de troca de senha para ${user.email}:`, {
      flag_explícita: user.precisa_redefinir_senha === true,
      lastTempPassword: Boolean(user.lastTempPassword),
      isFirstLogin: isFirstLogin,
      userType: user.userType,
      role: user.role,
      resultado: precisa_redefinir_senha
    })
  }
  
  // Função para atualizar o usuário após mudar a senha
  const updateUserAfterPasswordChange = async (): Promise<void> => {
    if (user?.id) {
      try {
        console.log('Atualizando status do usuário após troca de senha');
        
        // Atualizar o usuário no Firestore para remover todas as flags de troca de senha
        await fetch(`/api/firestore/users/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            precisa_redefinir_senha: false,
            lastTempPassword: null  // Remove a senha temporária armazenada
          })
        });
        
        console.log('✅ Status de senha atualizado com sucesso');
        
        // Recarregar os dados do usuário
        if (auth.currentUser) {
          const updatedUser = await mapFirebaseUserToUser(auth.currentUser);
          setUser(updatedUser);
          console.log('✅ Dados do usuário atualizados após troca de senha');
        }
      } catch (error) {
        console.error('❌ Erro ao atualizar status de senha do usuário:', error);
      }
    }
  };
  
  // Verificadores de tipo de usuário
  // Considera admin tanto o usuário específico (ADMIN_UID) quanto qualquer usuário com userType 'admin' ou role 'admin'
  const isAdmin = user?.id === ADMIN_UID || user?.userType === 'admin' || user?.role === 'admin';
  const isStaff = user?.userType === 'staff' || user?.role === 'usuario'; // 'usuario' é o equivalente a 'staff' nas regras
  // Verificação rigorosa para clientes - se userType for client OU role for cliente
  const isClient = user?.userType === 'client' || user?.role === 'cliente';
  
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