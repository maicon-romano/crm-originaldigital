import admin from 'firebase-admin';

// Tipo de usuário para uso no Firestore
export type UserType = 'admin' | 'staff' | 'client';

// Interface para usuário do Firestore
export interface FirestoreUser {
  id: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  userType: UserType;
  role: string;         // Permissão: 'admin' ou 'usuario' ou 'cliente' 
  department?: string;
  position?: string;
  avatar?: string;
  clientId?: number;
  active: boolean;
  createdAt: number;     // Timestamp
  updatedAt: number;     // Timestamp
}

// Inicializar o admin SDK, verificando se já foi inicializado
let firestore: admin.firestore.Firestore;

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: "crm-originaldigital",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });
  }
  
  firestore = admin.firestore();
  console.log('Firebase Admin SDK inicializado com sucesso');
} catch (error) {
  console.error('Erro ao inicializar Firebase Admin SDK:', error);
  throw error;
}

// Referência à coleção de usuários
const usersCollection = firestore.collection('usuarios');

// Função para criar um usuário no Firestore
export async function createFirestoreUser(userData: Omit<FirestoreUser, 'createdAt' | 'updatedAt'>) {
  try {
    const timestamp = Date.now();
    
    // Remover campos undefined para evitar erros do Firestore
    const cleanUserData: Record<string, any> = {};
    Object.entries(userData).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanUserData[key] = value;
      }
    });
    
    const completeData = {
      ...cleanUserData,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await usersCollection.doc(userData.id).set(completeData);
    return completeData as FirestoreUser;
  } catch (error) {
    console.error('[Admin API] Erro ao criar usuário:', error);
    throw error;
  }
}

// Função para obter um usuário pelo ID
export async function getFirestoreUserById(userId: string) {
  try {
    const userDoc = await usersCollection.doc(userId).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data() || {};
      return { ...userData, id: userId } as FirestoreUser;
    }
    
    return null;
  } catch (error) {
    console.error('[Admin API] Erro ao buscar usuário por ID:', error);
    throw error;
  }
}

// Função para obter um usuário pelo email
export async function getFirestoreUserByEmail(email: string) {
  try {
    const userQuery = await usersCollection.where('email', '==', email).get();
    
    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0];
      const userData = userDoc.data() || {};
      return { ...userData, id: userDoc.id } as FirestoreUser;
    }
    
    return null;
  } catch (error) {
    console.error('[Admin API] Erro ao buscar usuário por email:', error);
    throw error;
  }
}

// Função para obter todos os usuários
export async function getAllFirestoreUsers() {
  try {
    const usersSnapshot = await usersCollection.get();
    return usersSnapshot.docs.map(doc => {
      const data = doc.data() || {};
      return { ...data, id: doc.id } as FirestoreUser;
    });
  } catch (error) {
    console.error('[Admin API] Erro ao obter todos os usuários:', error);
    throw error;
  }
}

// Função para atualizar um usuário
export async function updateFirestoreUser(userId: string, userData: Partial<FirestoreUser>) {
  try {
    const updateData = {
      ...userData,
      updatedAt: Date.now()
    };
    
    await usersCollection.doc(userId).update(updateData);
    
    // Buscar o usuário atualizado para retornar
    const updatedUser = await getFirestoreUserById(userId);
    return updatedUser;
  } catch (error) {
    console.error('[Admin API] Erro ao atualizar usuário:', error);
    throw error;
  }
}

// Função para excluir um usuário
export async function deleteFirestoreUser(userId: string) {
  try {
    await usersCollection.doc(userId).delete();
    return true;
  } catch (error) {
    console.error('[Admin API] Erro ao excluir usuário:', error);
    throw error;
  }
}