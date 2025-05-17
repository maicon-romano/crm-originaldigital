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

// Criar um novo usuário sem fazer login no usuário recém-criado
export const createUser = async (
  email: string, 
  password: string, 
  displayName: string,
  userType: UserType = 'staff'
): Promise<FirebaseUser> => {
  try {
    console.log(`Criando novo usuário do tipo ${userType}: ${email}`);
    
    // Salvar usuário atual
    const currentUser = auth.currentUser;
    let currentUserToken = null;
    
    if (currentUser) {
      // Obter token atual para reautenticar sem deslogar
      try {
        currentUserToken = await currentUser.getIdToken();
      } catch (e) {
        console.warn("Não foi possível obter token do usuário atual:", e);
      }
    }
    
    // Criar um app temporário para criar o usuário sem deslogar o atual
    const tempApp = initializeApp(firebaseConfig, 'tempApp-' + new Date().getTime());
    const tempAuth = getAuth(tempApp);
    
    // Criar o usuário no app temporário
    const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
    
    // Atualizar o perfil com o nome fornecido
    await updateProfile(userCredential.user, {
      displayName: displayName
    });
    
    // Guardar a referência do usuário criado
    // Precisamos copiar as propriedades pois o objeto será invalidado quando deletarmos o app
    const newUser = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      emailVerified: userCredential.user.emailVerified,
      metadata: userCredential.user.metadata,
      isAnonymous: userCredential.user.isAnonymous,
      providerId: 'firebase',
      photoURL: userCredential.user.photoURL,
      phoneNumber: userCredential.user.phoneNumber,
    };
    
    console.log("Usuário criado com ID:", newUser.uid);
    
    // Deslogar do app temporário e limpar recursos
    await signOut(tempAuth);
    
    return newUser as FirebaseUser;
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