import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail as firebaseSendPasswordReset
} from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAIuDf7b1JyqprPZNCbiDwjRnixH3foQho",
  authDomain: "crm-originaldigital.firebaseapp.com",
  projectId: "crm-originaldigital",
  storageBucket: "crm-originaldigital.firebasestorage.app",
  messagingSenderId: "479915127960",
  appId: "1:479915127960:web:f5ac249194cbb829ae8ced",
  measurementId: "G-FYFRK0WG02"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// O ID definido para o usuário admin
export const ADMIN_UID = 'riwAaqRuxpXBP0uT1rMO1KGBsIW2';

// Tipos de usuário para o sistema
export type UserType = 'admin' | 'staff' | 'client';

// Interface para usuário com tipo
export interface UserWithType extends FirebaseUser {
  userType?: UserType;
}

// Monitorar estado de autenticação
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Auth state changed: User is signed in", user.uid);
  } else {
    console.log("Auth state changed: User is signed out");
  }
});

// Criar um novo usuário
export const createUser = async (
  email: string, 
  password: string, 
  displayName: string,
  userType: UserType = 'staff'
): Promise<FirebaseUser> => {
  try {
    console.log(`Criando novo usuário do tipo ${userType}: ${email}`);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Atualizar o perfil com o nome fornecido
    await updateProfile(userCredential.user, {
      displayName: displayName
    });
    
    console.log("Usuário criado com ID:", userCredential.user.uid);
    
    // Adicionar metadados customizados seria feito pelo Firestore ou Functions
    // Mas aqui usaremos o banco de dados para armazenar o tipo de usuário
    
    return userCredential.user;
  } catch (error: any) {
    console.error("Erro ao criar usuário:", error);
    throw error;
  }
};

// Enviar email de redefinição de senha
export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  try {
    await firebaseSendPasswordReset(auth, email);
    console.log("Email de redefinição de senha enviado com sucesso");
  } catch (error) {
    console.error("Erro ao enviar email de redefinição de senha:", error);
    throw error;
  }
};

// Funções de autenticação Firebase
export const loginWithEmailAndPassword = async (email: string, password: string): Promise<FirebaseUser> => {
  try {
    console.log("Tentando login com email:", email);
    
    // Para desenvolvimento, implementamos um login de teste
    if (email === 'admin@example.com' && password === 'senha123') {
      console.log('Usando credenciais de teste - Em produção, remova este código!');
      return {
        uid: ADMIN_UID,
        email: 'admin@example.com',
        displayName: 'Administrador',
        emailVerified: true,
        isAnonymous: false,
        metadata: {
          creationTime: Date.now().toString(),
          lastSignInTime: Date.now().toString()
        },
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => Promise.resolve(),
        getIdToken: async () => 'mock-token',
        getIdTokenResult: async () => ({
          token: 'mock-token',
          signInProvider: 'password',
          expirationTime: new Date().toString(),
          issuedAtTime: new Date().toString(),
          authTime: new Date().toString(),
          claims: { admin: true }
        }),
        reload: async () => Promise.resolve(),
        toJSON: () => ({})
      } as FirebaseUser;
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Login realizado com sucesso:", userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    console.error("Erro no login com email e senha:", error);
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
    console.log("Logout realizado com sucesso");
    
    // Redirecionar para a página de login
    window.location.href = '/login';
  } catch (error: any) {
    console.error("Erro ao realizar logout:", error);
    throw error;
  }
};