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
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  deleteDoc
} from "firebase/firestore";

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
export const db = getFirestore(app);

// O ID definido para o usuário admin
export const ADMIN_UID = 'riwAaqRuxpXBP0uT1rMO1KGBsIW2';

// Tipos de usuário para o sistema
export type UserType = 'admin' | 'staff' | 'client';

// Interface para usuário com tipo (baseado nas regras do Firestore enviadas)
export interface FirestoreUser {
  id: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  userType: UserType;
  role: 'admin' | 'usuario' | 'cliente';  // Permissão: 'admin' ou 'usuario' ou 'cliente' (das regras do Firestore)
  department?: string;
  position?: string;
  avatar?: string;
  clientId?: number;
  active: boolean;
  firstLogin?: boolean;      // Indica se é o primeiro login do usuário
  needsPasswordChange?: boolean; // Indica se o usuário precisa trocar a senha
  createdAt: number;     // Timestamp para compatibilidade com Firestore
  updatedAt: number;     // Timestamp para compatibilidade com Firestore
}

// Referência à coleção 'usuarios' no Firestore
export const usersCollection = collection(db, 'usuarios');

// Monitorar estado de autenticação
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Auth state changed: User is signed in", user.uid);
  } else {
    console.log("Auth state changed: User is signed out");
  }
});

// ======== FUNÇÕES PARA GERENCIAR USUÁRIOS NO FIRESTORE ========

// Criar um novo usuário usando Firebase Auth e salvar no Firestore via API do servidor
export const createUser = async (
  email: string, 
  password: string, 
  displayName: string,
  userType: UserType = 'staff',
  role: 'admin' | 'usuario' | 'cliente' = 'usuario', // role padrão no Firestore
  extraData: Partial<FirestoreUser> = {},
  requirePasswordChange: boolean = true // Novo parâmetro para indicar se deve solicitar troca de senha
): Promise<FirestoreUser> => {
  try {
    console.log(`Criando novo usuário do tipo ${userType} com role ${role}: ${email} (Senha temporária: ${password})`);
    
    // Criar um app temporário para criar o usuário sem deslogar o atual
    const tempApp = initializeApp(firebaseConfig, 'tempApp-' + new Date().getTime());
    const tempAuth = getAuth(tempApp);
    
    // Criar o usuário no app temporário
    const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
    
    // Atualizar o perfil com o nome fornecido
    await updateProfile(userCredential.user, {
      displayName: displayName
    });
    
    const timestamp = Date.now();
    
    // Preparar dados básicos do usuário
    const userData: Record<string, any> = {
      id: userCredential.user.uid,
      username: email.split('@')[0],
      name: displayName,
      email: email,
      userType: userType,
      role: role,
      active: true,
      firstLogin: true, // Marcar como primeiro login para solicitar troca de senha
      needsPasswordChange: requirePasswordChange, // Flag para indicar que precisa trocar a senha
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    // Extrair campos específicos de extraData
    if (extraData) {
      if (extraData.position) {
        // Garantir que position seja salvo - este é o campo "cargo"
        userData.position = extraData.position;
        userData.cargo = extraData.position; // Adicionar tanto position quanto cargo
        console.log('Campo position/cargo definido como:', extraData.position);
      }
      if (extraData.phone) userData.phone = extraData.phone;
      if (extraData.clientId) userData.clientId = extraData.clientId;
      // Adicionar outros campos relevantes
    }
    
    console.log('Dados do usuário sendo enviados para API:', JSON.stringify(userData));
    
    // Enviar dados para o servidor via API POST para salvar no Firestore com permissões elevadas
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...userData,
        firebaseUid: userData.id, // Adicionar campo para identificar o usuário no Firebase
        position: userData.position || userData.cargo || "", // Garantir que position seja enviado
        cargo: userData.position || userData.cargo || "", // Enviar também como cargo
      }),
    });
    
    // Verificar se a requisição para o servidor foi bem-sucedida
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro ao salvar usuário no Firestore: ${errorData.message || response.statusText}`);
    }
    
    console.log("Usuário criado com sucesso no Firebase Auth e dados salvos no Firestore via API");
    
    // Deslogar do app temporário para não afetar o usuário atual
    await signOut(tempAuth);
    
    // Retornar os dados do usuário criado
    return userData as FirestoreUser;
  } catch (error: any) {
    console.error("Erro ao criar usuário:", error);
    throw error;
  }
};

// Buscar um usuário pelo ID do Firebase no Firestore
export const getFirestoreUserById = async (userId: string): Promise<FirestoreUser | null> => {
  try {
    const userDoc = await getDoc(doc(usersCollection, userId));
    
    if (userDoc.exists()) {
      // Fazer log detalhado dos dados do usuário para depuração
      const userData = userDoc.data() as FirestoreUser;
      console.log("Dados brutos do usuário no Firestore:", userData);
      
      // Garantir que as flags de primeiro login estejam presentes
      // Se não existirem, assumir que é o primeiro login e precisa trocar a senha
      const userWithFlags = {
        ...userData,
        firstLogin: userData.firstLogin === undefined ? true : userData.firstLogin,
        needsPasswordChange: userData.needsPasswordChange === undefined ? true : userData.needsPasswordChange
      };
      
      // Depuração
      console.log("Dados completos do usuário no Firestore:", userWithFlags);
      
      return userWithFlags;
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    throw error;
  }
};

// Buscar um usuário pelo e-mail no Firestore
export const getFirestoreUserByEmail = async (email: string): Promise<FirestoreUser | null> => {
  try {
    const q = query(usersCollection, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as FirestoreUser;
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao buscar usuário por e-mail:", error);
    throw error;
  }
};

// Atualizar um usuário no Firestore
export const updateFirestoreUser = async (
  userId: string, 
  userData: Partial<FirestoreUser>
): Promise<FirestoreUser | null> => {
  try {
    const userRef = doc(usersCollection, userId);
    
    // Verificar se o usuário existe
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      console.error("Usuário não encontrado:", userId);
      return null;
    }
    
    const updateData = {
      ...userData,
      updatedAt: Date.now()
    };
    
    await updateDoc(userRef, updateData);
    
    // Buscar o usuário atualizado
    const updatedUserDoc = await getDoc(userRef);
    return updatedUserDoc.data() as FirestoreUser;
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    throw error;
  }
};

// Excluir um usuário do Firestore
export const deleteFirestoreUser = async (userId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(usersCollection, userId));
    return true;
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
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

// Login com email e senha - verifica no Firebase Auth e depois no Firestore
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
      } as unknown as FirebaseUser;
    }
    
    // Fazer login usando Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Login realizado com sucesso:", userCredential.user.uid);
    
    // Verificar se o usuário existe no Firestore
    const firestoreUser = await getFirestoreUserById(userCredential.user.uid);
    
    if (!firestoreUser) {
      console.log("Usuário não encontrado no Firestore, criando registro...");
      
      // Criar um usuário no Firestore se não existir
      await setDoc(doc(usersCollection, userCredential.user.uid), {
        id: userCredential.user.uid,
        username: email.split('@')[0],
        name: userCredential.user.displayName || email.split('@')[0],
        email: email,
        userType: userCredential.user.uid === ADMIN_UID ? 'admin' : 'staff',
        role: userCredential.user.uid === ADMIN_UID ? 'admin' : 'usuario',
        active: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
    
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