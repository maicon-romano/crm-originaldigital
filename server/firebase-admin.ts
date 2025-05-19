import admin from 'firebase-admin';

// Tipo de usuário para uso no Firestore
export type UserType = 'admin' | 'staff' | 'client';

// Interface para usuário do Firestore
export interface FirestoreUser {
  id: string;            // UID do Firebase Authentication
  username: string;
  name: string;
  email: string;
  phone?: string;
  userType: UserType;
  role: string;         // Permissão: 'admin' ou 'usuario' ou 'cliente' 
  department?: string;
  position?: string;     // Cargo do usuário
  avatar?: string;
  clientId?: number;
  active: boolean;
  createdAt: number;     // Timestamp
  updatedAt: number;     // Timestamp
  precisa_redefinir_senha: boolean; // Indica se o usuário precisa trocar a senha no primeiro login
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

// Referência às coleções
const usersCollection = firestore.collection('usuarios');
const clientsCollection = firestore.collection('clientes'); // Nome em português usado em todo o sistema

// Interface para cliente no Firestore
export interface FirestoreClient {
  id?: string;            // ID gerado pelo Firestore
  companyName: string;    // Nome da empresa
  contactName: string;    // Nome do contato
  email: string;          // Email do contato
  phone: string;          // Telefone
  cnpjCpf: string;        // CNPJ ou CPF
  address: string;        // Endereço
  city: string;           // Cidade
  state: string;          // Estado
  website: string;        // Site
  instagram: string;      // Instagram
  facebook: string;       // Facebook
  linkedin: string;       // LinkedIn
  youtube: string;        // YouTube
  tiktok: string;         // TikTok
  paymentDay: string;     // Dia do pagamento
  contractValue: string;  // Valor do contrato
  contractStart: string;  // Data de início do contrato
  contractEnd: string;    // Data de término do contrato
  category: string;       // Categoria
  description: string;    // Cargo do contato ou descrição
  observations: string;   // Observações
  status: string;         // Status: active, paused, closed
  paymentMethod: string;  // Método de pagamento
  servicesPlatforms: string; // Plataformas de serviço
  googleDriveFolderId?: string; // ID da pasta no Google Drive
  googleDriveFolderUrl?: string; // URL público da pasta no Google Drive
  userId?: string;        // ID do usuário associado (se existir)
  createdAt: number;      // Timestamp
  updatedAt: number;      // Timestamp
}

// Função para criar um cliente no Firestore
export async function createFirestoreClient(clientData: Omit<FirestoreClient, 'createdAt' | 'updatedAt'>) {
  const now = Date.now();
  const clientToSave = {
    ...clientData,
    createdAt: now,
    updatedAt: now
  };

  // Salvar na coleção 'clientes'
  const docRef = await clientsCollection.add(clientToSave);
  
  // Retornar os dados salvos
  const snapshot = await docRef.get();
  
  console.log(`Cliente salvo na coleção 'clientes' com ID: ${docRef.id}`);
  
  return {
    id: docRef.id,
    ...snapshot.data()
  } as FirestoreClient;
}

// Função para obter todos os clientes do Firestore
export async function getAllFirestoreClients() {
  const snapshot = await clientsCollection.get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as FirestoreClient[];
}

// Função para obter um cliente do Firestore pelo ID
export async function getFirestoreClientById(clientId: string) {
  const doc = await clientsCollection.doc(clientId).get();
  if (!doc.exists) return null;
  
  return {
    id: doc.id,
    ...doc.data()
  } as FirestoreClient;
}

// Função para atualizar um cliente no Firestore
export async function updateFirestoreClient(clientId: string, clientData: Partial<FirestoreClient>) {
  const updateData = {
    ...clientData,
    updatedAt: Date.now()
  };
  
  await clientsCollection.doc(clientId).update(updateData);
  const doc = await clientsCollection.doc(clientId).get();
  
  return {
    id: doc.id,
    ...doc.data()
  } as FirestoreClient;
}

// Função para excluir um cliente do Firestore
export async function deleteFirestoreClient(clientId: string) {
  await clientsCollection.doc(clientId).delete();
  return true;
}

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
    
    // Garantir que precisa_redefinir_senha seja sempre definido para novos usuários
    // como foi especificado, ou fallback para true (comportamento mais seguro)
    const completeData = {
      ...cleanUserData,
      createdAt: timestamp,
      updatedAt: timestamp,
      precisa_redefinir_senha: cleanUserData.precisa_redefinir_senha !== undefined 
        ? cleanUserData.precisa_redefinir_senha 
        : true
    };
    
    console.log("Salvando usuário com dados completos:", completeData);
    
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
      // Log para depuração
      console.log("Dados do usuário obtidos do Firestore:", { userId, userData });
      
      // Para usuários existentes, manter o valor salvo no Firestore
      // ou definir como false se não existir (usuários antigos já estão usando o sistema)
      return { 
        ...userData, 
        id: userId,
        precisa_redefinir_senha: userData.precisa_redefinir_senha ?? false
      } as FirestoreUser;
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
      console.log("Dados do usuário obtidos do Firestore por email:", { email, userData });
      
      // Para usuários existentes, manter o valor salvo no Firestore
      // ou definir como false se não existir (usuários antigos já estão usando o sistema)
      return { 
        ...userData, 
        id: userDoc.id,
        precisa_redefinir_senha: userData.precisa_redefinir_senha ?? false
      } as FirestoreUser;
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

// Função para excluir um usuário (tanto do Firestore quanto do Authentication)
export async function deleteFirestoreUser(userId: string) {
  try {
    // 1. Excluir dados do usuário no Firestore
    await usersCollection.doc(userId).delete();
    
    // 2. Tentar excluir o usuário do Firebase Authentication
    try {
      await admin.auth().deleteUser(userId);
      console.log(`Usuário ${userId} excluído com sucesso do Authentication`);
    } catch (authError) {
      console.error(`Erro ao excluir usuário ${userId} do Authentication:`, authError);
      // Continuar mesmo se falhar a exclusão do Authentication
    }
    
    console.log(`Usuário ${userId} excluído com sucesso do Firestore`);
    return true;
  } catch (error) {
    console.error('[Admin API] Erro ao excluir usuário do Firestore:', error);
    throw error;
  }
}