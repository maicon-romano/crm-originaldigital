import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertClientSchema, insertProjectSchema, insertTaskSchema, insertProposalSchema, insertInvoiceSchema, insertExpenseSchema, insertSupportTicketSchema, insertSupportMessageSchema, insertCalendarEventSchema, insertCompanySettingsSchema } from "@shared/schema";
import { z } from "zod";
import admin from 'firebase-admin';
import { 
  createFirestoreUser, 
  getFirestoreUserById, 
  getFirestoreUserByEmail,
  getAllFirestoreUsers,
  updateFirestoreUser,
  deleteFirestoreUser,
  FirestoreUser,
  createFirestoreClient,
  updateFirestoreClient,
  FirestoreClient
} from './firebase-admin';
// Importar o serviço do Google Drive
import { createClientFolderStructure } from './google-drive-service';
// Importar serviço de email
import { sendInvitationEmail } from './email-service';
// Importar para compartilhamento de pastas
import { shareFolderWithUser } from './share-drive';
// Importar registradores de rotas
import { registerEmailRoutes } from './email-routes';
import { registerDriveRoutes } from './drive-routes';

export async function registerRoutes(app: Express): Promise<Server> {
  // Registrar as rotas de email
  registerEmailRoutes(app);
  
  // Registrar as rotas do Google Drive
  registerDriveRoutes(app);
  
  // Rotas de gerenciamento de usuários no Firestore
  app.get("/api/firestore/users", async (req, res) => {
    try {
      const users = await getAllFirestoreUsers();
      res.json(users);
    } catch (error: any) {
      console.error("Erro ao obter usuários:", error);
      res.status(500).json({ message: "Erro ao obter usuários", error: error.message });
    }
  });

  app.get("/api/firestore/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await getFirestoreUserById(id);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      res.json(user);
    } catch (error: any) {
      console.error("Erro ao obter usuário:", error);
      res.status(500).json({ message: "Erro ao obter usuário", error: error.message });
    }
  });

  app.post("/api/firestore/users", async (req, res) => {
    try {
      const { id, email, name, username, role, userType, ...rest } = req.body;
      
      if (!id || !email || !name || !role || !userType) {
        return res.status(400).json({ 
          message: "Dados incompletos. Forneça id, email, name, role e userType."
        });
      }
      
      // Verificar se já existe um usuário com o mesmo e-mail
      const existingUser = await getFirestoreUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "Já existe um usuário com este e-mail" });
      }
      
      // Criar o usuário no Firestore com flag de redefinição de senha
      const newUser = await createFirestoreUser({
        id,
        email,
        name,
        username: username || email.split('@')[0],
        role,
        userType,
        active: true,
        precisa_redefinir_senha: true,  // Definir explicitamente que o usuário precisa trocar a senha
        ...rest
      });
      
      console.log("Dados completos recebidos para criação de usuário:", newUser);
      res.status(201).json(newUser);
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      res.status(500).json({ message: "Erro ao criar usuário", error: error.message });
    }
  });

  app.patch("/api/firestore/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Verificar se o usuário existe
      const user = await getFirestoreUserById(id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Atualizar o usuário
      const updatedUser = await updateFirestoreUser(id, updates);
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Erro ao atualizar usuário:", error);
      res.status(500).json({ message: "Erro ao atualizar usuário", error: error.message });
    }
  });

  app.delete("/api/firestore/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar se o usuário existe
      const user = await getFirestoreUserById(id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Impedir a exclusão do usuário admin principal
      if (id === 'riwAaqRuxpXBP0uT1rMO1KGBsIW2') {
        return res.status(403).json({ message: "Não é permitido excluir o usuário admin principal" });
      }
      
      // Excluir o usuário
      await deleteFirestoreUser(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Erro ao excluir usuário:", error);
      res.status(500).json({ message: "Erro ao excluir usuário", error: error.message });
    }
  });
  
  // API para criar usuários no Firestore usando o Admin SDK
  app.post("/api/users", async (req, res) => {
    try {
      const userData = req.body;
      
      if (!userData.email || !userData.name || !userData.firebaseUid) {
        return res.status(400).json({ 
          message: "Dados incompletos. Forneça email, name e firebaseUid."
        });
      }
      
      // Verificar se já existe um usuário com o mesmo e-mail
      const existingUser = await getFirestoreUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: "Já existe um usuário com este e-mail" });
      }
      
      // Log mais detalhado dos dados recebidos para depuração
      console.log("Dados completos recebidos para criação de usuário:", JSON.stringify(userData, null, 2));
      
      // Garantir que o cargo seja salvo corretamente como position
      const position = userData.cargo || userData.position;
      console.log("Valor do cargo/position a ser salvo:", position);
      
      // Criar o usuário no Firestore com a flag de redefinição de senha
      const newUser = await createFirestoreUser({
        id: userData.firebaseUid,
        email: userData.email,
        name: userData.name,
        username: userData.username || userData.email.split('@')[0],
        role: userData.role || 'usuario',
        userType: userData.userType || 'staff',
        active: true,
        precisa_redefinir_senha: true, // Definir explicitamente que precisa trocar a senha
        phone: userData.phone,
        position, // Garantir que o campo position seja salvo
        clientId: userData.clientId,
        department: userData.department
      });
      
      res.status(201).json(newUser);
    } catch (error: any) {
      console.error("Erro ao criar usuário via API:", error);
      res.status(500).json({ message: "Erro ao criar usuário", error: error.message });
    }
  });

  // Auth Routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // In a real app, you'd use JWT or sessions here
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      const user = await storage.createUser(validatedData);
      const { password: _, ...userWithoutPassword } = user;
      
      return res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // User Routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      return res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      console.log("Criando novo usuário:", req.body);
      
      // Validar dados de entrada
      const validatedData = insertUserSchema.parse(req.body);
      
      // Verificar se o email já existe
      if (validatedData.email) {
        const existingUserEmail = await storage.getUserByEmail(validatedData.email);
        if (existingUserEmail) {
          return res.status(400).json({ message: "Email já em uso" });
        }
      }
      
      // Criar o usuário no banco de dados
      const newUser = await storage.createUser(validatedData);
      
      // Remover a senha da resposta
      const { password, ...userWithoutPassword } = newUser;
      
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Erro ao criar usuário:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const validatedData = insertUserSchema.partial().parse(req.body);
      const updatedUser = await storage.updateUser(id, validatedData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Update user error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(204).send();
    } catch (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Client Routes
  app.get("/api/clients", async (req, res) => {
    try {
      console.log("Buscando clientes...");
      // Verificar no banco relacional E no Firestore para garantir dados completos
      const relationalClients = await storage.getClients();
      
      // Buscar também do Firestore
      const firestoreDb = admin.firestore();
      const clientsSnapshot = await firestoreDb.collection('clientes').get();
      
      console.log(`Clientes encontrados: ${clientsSnapshot.size}`);
      
      const firestoreClients = clientsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: parseInt(data.id) || doc.id,
          companyName: data.companyName,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          status: data.status,
          cnpjCpf: data.cnpjCpf,
          address: data.address,
          city: data.city,
          state: data.state,
          contractStart: data.contractStart,
          googleDriveFolderId: data.googleDriveFolderId
        };
      });
      
      // Combinar os resultados (prioridade para os registros do Firestore)
      const clients = [...relationalClients, ...firestoreClients];

      console.log("Clientes encontrados:", clients.length);
      return res.status(200).json(clients);
    } catch (error) {
      console.error("Get clients error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      return res.status(200).json(client);
    } catch (error) {
      console.error("Get client error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      
      // Check if client already exists by email
      const existingClient = await admin.firestore()
        .collection('clientes')
        .where('email', '==', validatedData.email)
        .get();

      if (!existingClient.empty) {
        return res.status(409).json({ 
          message: "Client with this email already exists" 
        });
      }

      // Criar cliente APENAS no Firestore (1 cópia, evitando a duplicação)
      // NÃO vamos mais criar um registro no banco de dados relacional
      let firestoreClientId = null;
      let firestoreUserId = null;
      let client = null; // Referência para o cliente que será retornado
      
      try {
        // Dados para o Firestore, guardando somente na coleção "clientes"
        const firestoreClientData: Omit<FirestoreClient, 'createdAt' | 'updatedAt'> = {
          companyName: validatedData.companyName,
          contactName: validatedData.contactName,
          email: validatedData.email,
          phone: validatedData.phone || '',
          cnpjCpf: validatedData.cnpjCpf || '',
          address: validatedData.address || '',
          city: validatedData.city || '',
          state: validatedData.state || '',
          website: validatedData.website || '',
          instagram: validatedData.instagram || '',
          facebook: validatedData.facebook || '',
          linkedin: validatedData.linkedin || '',
          youtube: validatedData.youtube || '',
          tiktok: validatedData.tiktok || '',
          paymentDay: typeof validatedData.paymentDay === 'number' ? validatedData.paymentDay.toString() : (validatedData.paymentDay || ''),
          contractValue: typeof validatedData.contractValue === 'number' ? validatedData.contractValue.toString() : (validatedData.contractValue || ''),
          contractStart: validatedData.contractStart || new Date().toISOString().split('T')[0],
          contractEnd: validatedData.contractEnd || '',
          category: validatedData.category || '',
          description: validatedData.description || '',
          observations: validatedData.observations || '',
          status: validatedData.status || 'active',
          paymentMethod: validatedData.paymentMethod || '',
          servicesPlatforms: validatedData.servicesPlatforms || '',
        };
        
        // Criar o cliente no Firestore
        const firestoreClient = await createFirestoreClient(firestoreClientData);
        firestoreClientId = firestoreClient.id;
        console.log(`Cliente criado no Firestore com ID: ${firestoreClientId}`);
        
        // 3. Criar apenas um registro de autenticação para o cliente (sem duplicar na coleção de usuários)
        try {
          // Gerar senha temporária aleatória que seja fácil de ler e digitar
          const tempPassword = Math.random().toString(36).slice(-4) + Math.random().toString(36).slice(-4);
          let userRecord;
          let userExists = false;
          
          // Primeiro verificar se o usuário já existe
          try {
            userRecord = await admin.auth().getUserByEmail(validatedData.email);
            console.log(`⚠️ Usuário com email ${validatedData.email} já existe no Firebase Auth com UID: ${userRecord.uid}`);
            firestoreUserId = userRecord.uid;
            userExists = true;
            
            // Atualizar a senha se o usuário já existir
            await admin.auth().updateUser(userRecord.uid, {
              password: tempPassword,
              displayName: validatedData.contactName
            });
            console.log(`✅ Senha atualizada para usuário existente: ${userRecord.uid}`);
            
          } catch (error: any) {
            // Se o erro for "user-not-found", criamos um novo usuário
            if (error.code === 'auth/user-not-found') {
              console.log(`Criando novo usuário no Firebase Auth para email: ${validatedData.email}`);
              try {
                userRecord = await admin.auth().createUser({
                  email: validatedData.email,
                  password: tempPassword,
                  displayName: validatedData.contactName,
                  emailVerified: false,
                });
                
                console.log(`✅ Criado usuário no Firebase Auth com UID: ${userRecord.uid}`);
                firestoreUserId = userRecord.uid;
              } catch (createError: any) {
                console.error(`❌ Erro ao criar usuário: ${createError.message}`);
                // Mesmo com falha na criação, continuamos o processo para enviar email
                // Em caso de falha, vamos recuperar UID existente
                try {
                  // Tentar recuperar o usuário mesmo se a criação falhar
                  const existingUser = await admin.auth().getUserByEmail(validatedData.email);
                  console.log(`🔄 Recuperado usuário existente: ${existingUser.uid}`);
                  firestoreUserId = existingUser.uid;
                  userRecord = existingUser;
                  
                  // Atualizar a senha para ter acesso
                  await admin.auth().updateUser(existingUser.uid, {
                    password: tempPassword,
                    displayName: validatedData.contactName
                  });
                } catch (recoverError) {
                  console.error(`❌ Não foi possível recuperar o usuário existente: ${recoverError}`);
                }
              }
            } else {
              console.error(`❌ Erro ao verificar usuário: ${error.message}`);
            }
          }
          
          // Atualizar apenas o cliente no Firestore com os dados de autenticação
          // Independente de ser novo usuário ou existente
          console.log(`Atualizando cliente no Firestore com dados de usuário...`);
          
          // Atualizar o cliente no Firestore com o ID do usuário
          if (firestoreClientId) {
            await updateFirestoreClient(firestoreClientId, { 
              userId: firestoreUserId,
              role: 'cliente',
              userType: 'client',
              username: validatedData.email.split('@')[0],
              precisa_redefinir_senha: true,
              lastTempPassword: tempPassword // Armazenar senha temporária para referência
            });
            console.log(`✅ Cliente no Firestore atualizado com userId: ${firestoreUserId}`);
          }
          
          // ENVIO DE EMAIL OBRIGATÓRIO - SEMPRE DEVE FUNCIONAR
          console.log(`🔹 INÍCIO DO ENVIO DE EMAIL DE CONVITE 🔹`);
          console.log(`Dados do cliente para envio:
            - Email: ${validatedData.email}
            - Nome: ${validatedData.contactName}
            - Senha: ${tempPassword}
          `);
          
          // Primeiro, armazenar a senha nos dados do cliente (independente do sucesso do email)
          if (firestoreClientId) {
            try {
              await updateFirestoreClient(firestoreClientId, { 
                lastTempPassword: tempPassword, // armazenar para referência obrigatória
                username: validatedData.email.split('@')[0] // sempre definir o username
              });
              console.log(`✅ Senha temporária salva no documento do cliente`);
            } catch (updateError) {
              console.error(`❌ Erro ao salvar senha temporária:`, updateError);
            }
          }
          
          // Tentar enviar o e-mail - estrutura simplificada e robusta
          try {
            const emailResend = await import('./email-resend');
            
            // Verificar se todos os dados necessários estão presentes
            if (!validatedData.email || !validatedData.contactName || !tempPassword) {
              console.error(`❌ Dados incompletos para envio de email`);
              return res.status(500).json({ success: false, message: 'Dados incompletos para envio de email' });
            }
            
            // Log detalhado para diagnóstico
            console.log(`📧 Enviando email para ${validatedData.email}`);
            
            // Enviar o email usando a função do módulo
            const emailResult = await emailResend.sendInvitationEmail({
              to: validatedData.email,
              name: validatedData.contactName,
              password: tempPassword,
              role: 'Cliente'
            });
            
            if (emailResult && emailResult.success) {
              console.log(`✅ Email enviado com sucesso: ${emailResult.message}`);
            } else {
              console.error(`⚠️ Falha no envio de email: ${emailResult?.message || 'Erro desconhecido'}`);
              // Falha no envio não impede a criação do cliente e usuário
            }
          } catch (emailError) {
            console.error(`❌ Erro crítico ao enviar email:`, emailError);
            // Continuar mesmo com erro no email
          }
          
          console.log(`🔹 FIM DO PROCESSAMENTO DE CLIENTE 🔹`);
          // Retornar mensagem informativa ao administrador
          console.log(`
            ✨ INSTRUÇÕES IMPORTANTES ✨
            Cliente: ${validatedData.companyName}
            Email: ${validatedData.email}
            Senha: ${tempPassword}
            
            Se o email não for recebido, forneça estas credenciais manualmente.
          `);
        } catch (userError) {
          console.error('Erro ao criar usuário para o cliente:', userError);
        }
      } catch (firestoreError) {
        console.error('Erro ao criar cliente no Firestore:', firestoreError);
      }
      
      // 4. Criar estrutura de pastas no Google Drive
      try {
        console.log(`Iniciando criação de pastas no Google Drive para: ${validatedData.companyName}`);
        const folderId = await createClientFolderStructure(validatedData.companyName);
        
        if (folderId) {
          // Atualizar apenas o cliente no Firestore com o ID da pasta do Google Drive
          if (firestoreClientId) {
            await updateFirestoreClient(firestoreClientId, { googleDriveFolderId: folderId });
          }
          
          // Criar objeto do cliente para a resposta ao frontend
          // Aqui temos apenas um objeto temporário para a resposta, não um registro no banco relacional
          client = {
            id: firestoreClientId, // Usamos o ID do Firestore para referência
            companyName: validatedData.companyName,
            contactName: validatedData.contactName,
            email: validatedData.email,
            phone: validatedData.phone || '',
            status: validatedData.status || 'active',
            googleDriveFolderId: folderId,
            googleDriveFolderUrl: '' // Será preenchido depois se o compartilhamento funcionar
          };
          
          // Compartilhar a pasta com o email do cliente
          try {
            // Usar a importação já feita no topo do arquivo
            console.log(`Compartilhando pasta ${folderId} com o email ${validatedData.email}`);
            const shareResult = await shareFolderWithUser(folderId, validatedData.email);
            
            if (shareResult.success) {
              console.log(`Pasta compartilhada com sucesso com o email ${validatedData.email}`);
              
              // Atualizar apenas no Firestore
              if (firestoreClientId) {
                await updateFirestoreClient(firestoreClientId, { 
                  googleDriveFolderUrl: shareResult.folderUrl 
                });
              }
              
              // Atualizar o objeto para a resposta
              if (client) {
                client.googleDriveFolderUrl = shareResult.folderUrl;
              }
            } else {
              console.warn(`Falha ao compartilhar pasta, mas o link foi salvo: ${shareResult.folderUrl}`);
            }
          } catch (shareError) {
            console.error('Erro ao compartilhar pasta:', shareError);
          }
          
          console.log(`Estrutura de pastas criada com sucesso para o cliente ${validatedData.companyName}, ID da pasta: ${folderId}`);
        } else {
          console.warn(`Não foi possível criar a estrutura de pastas para o cliente ${validatedData.companyName}`);
        }
      } catch (driveError) {
        console.error("Erro ao criar estrutura de pastas no Google Drive:", driveError);
      }
      
      // Retornar o cliente criado
      return res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Erro ao criar cliente:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.patch("/api/clients/:id", async (req, res) => {
    try {
      const clientId = req.params.id;
      // Verificar se é um ID numérico (PostgreSQL) ou string (Firestore)
      const isNumericId = !isNaN(parseInt(clientId));
      
      const validatedData = insertClientSchema.partial().parse(req.body);
      let updatedClient = null;
      
      if (isNumericId) {
        // Atualizar no banco relacional
        const numericId = parseInt(clientId);
        console.log(`Atualizando cliente com ID numérico: ${numericId}`);
        updatedClient = await storage.updateClient(numericId, validatedData);
      } else {
        // É um ID do Firestore, atualizar no Firestore
        console.log(`Atualizando cliente com ID do Firestore: ${clientId}`);
        
        try {
          // Converter os dados validados para o formato do Firestore
          const firestoreData: Partial<FirestoreClient> = {};
          
          // Mapear campos do banco relacional para o Firestore
          Object.entries(validatedData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              firestoreData[key as keyof FirestoreClient] = value as any;
            }
          });
          
          // Adicionar timestamp de atualização
          firestoreData.updatedAt = Date.now();
          
          // Atualizar no Firestore
          await updateFirestoreClient(clientId, firestoreData);
          
          // Buscar o cliente atualizado
          const firestoreDb = admin.firestore();
          const clientDoc = await firestoreDb.collection('clientes').doc(clientId).get();
          updatedClient = { id: clientId, ...clientDoc.data() } as any;
          
          console.log(`Cliente com ID ${clientId} atualizado no Firestore com sucesso`);
        } catch (firestoreError: any) {
          console.error(`Erro ao atualizar cliente no Firestore: ${firestoreError.message}`);
          return res.status(500).json({ message: `Erro ao atualizar cliente no Firestore: ${firestoreError.message}` });
        }
      }
      
      if (!updatedClient) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }

      return res.status(200).json(updatedClient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Update client error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const clientId = req.params.id;
      
      // Verificar se é um ID numérico (PostgreSQL) ou string (Firestore)
      const isNumericId = !isNaN(parseInt(clientId));
      let success = false;
      
      if (isNumericId) {
        // Deletar do banco relacional
        const numericId = parseInt(clientId);
        console.log(`Tentando deletar cliente com ID numérico: ${numericId}`);
        success = await storage.deleteClient(numericId);
      } else {
        // É um ID do Firestore, deletar do Firestore
        console.log(`Tentando deletar cliente com ID do Firestore: ${clientId}`);
        
        try {
          // Primeiro, obter os dados do cliente antes de deletar
          const firestoreDb = admin.firestore();
          const clientDoc = await firestoreDb.collection('clientes').doc(clientId).get();
          const clientData = clientDoc.data();
          
          // Verificar se o cliente existe
          if (!clientDoc.exists || !clientData) {
            return res.status(404).json({ message: "Cliente não encontrado" });
          }
          
          // Deletar o cliente do Firestore
          await firestoreDb.collection('clientes').doc(clientId).delete();
          console.log(`Cliente com ID ${clientId} excluído do Firestore com sucesso`);
          
          // Se este cliente tem um usuário associado, excluir também
          if (clientData.userId) {
            try {
              // Excluir o usuário do Firestore
              await firestoreDb.collection('users').doc(clientData.userId).delete();
              console.log(`Usuário associado (${clientData.userId}) foi excluído do Firestore`);
              
              // Excluir o usuário do Firebase Authentication
              await admin.auth().deleteUser(clientData.userId);
              console.log(`Usuário associado (${clientData.userId}) foi excluído do Firebase Auth`);
            } catch (authError: any) {
              console.error(`Erro ao excluir o usuário associado: ${authError.message}`);
              // Continuar mesmo se falhar a exclusão do usuário
            }
          }
          
          success = true;
          console.log(`Cliente com ID ${clientId} excluído do Firestore com sucesso`);
        } catch (firestoreError: any) {
          console.error(`Erro ao excluir cliente do Firestore: ${firestoreError.message}`);
          return res.status(500).json({ message: `Erro ao excluir cliente do Firestore: ${firestoreError.message}` });
        }
      }
      
      if (!success) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }

      return res.status(204).send();
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Project Routes
  app.get("/api/projects", async (req, res) => {
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      
      let projects;
      if (clientId && !isNaN(clientId)) {
        projects = await storage.getProjectsByClient(clientId);
      } else {
        projects = await storage.getProjects();
      }
      
      return res.status(200).json(projects);
    } catch (error) {
      console.error("Get projects error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      return res.status(200).json(project);
    } catch (error) {
      console.error("Get project error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      return res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create project error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, validatedData);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      return res.status(200).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Update project error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const success = await storage.deleteProject(id);
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }

      return res.status(204).send();
    } catch (error) {
      console.error("Delete project error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Task Routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const assigneeId = req.query.assigneeId ? parseInt(req.query.assigneeId as string) : undefined;
      
      let tasks;
      if (projectId && !isNaN(projectId)) {
        tasks = await storage.getTasksByProject(projectId);
      } else if (assigneeId && !isNaN(assigneeId)) {
        tasks = await storage.getTasksByAssignee(assigneeId);
      } else {
        tasks = await storage.getTasks();
      }
      
      return res.status(200).json(tasks);
    } catch (error) {
      console.error("Get tasks error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      return res.status(200).json(task);
    } catch (error) {
      console.error("Get task error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      return res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create task error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const validatedData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(id, validatedData);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      return res.status(200).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Update task error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const success = await storage.deleteTask(id);
      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }

      return res.status(204).send();
    } catch (error) {
      console.error("Delete task error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Proposal Routes
  app.get("/api/proposals", async (req, res) => {
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      
      let proposals;
      if (clientId && !isNaN(clientId)) {
        proposals = await storage.getProposalsByClient(clientId);
      } else {
        proposals = await storage.getProposals();
      }
      
      return res.status(200).json(proposals);
    } catch (error) {
      console.error("Get proposals error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/proposals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const proposal = await storage.getProposal(id);
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      return res.status(200).json(proposal);
    } catch (error) {
      console.error("Get proposal error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/proposals", async (req, res) => {
    try {
      const validatedData = insertProposalSchema.parse(req.body);
      const proposal = await storage.createProposal(validatedData);
      return res.status(201).json(proposal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create proposal error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/proposals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const validatedData = insertProposalSchema.partial().parse(req.body);
      const proposal = await storage.updateProposal(id, validatedData);
      
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      return res.status(200).json(proposal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Update proposal error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/proposals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const success = await storage.deleteProposal(id);
      if (!success) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      return res.status(204).send();
    } catch (error) {
      console.error("Delete proposal error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Invoice Routes
  app.get("/api/invoices", async (req, res) => {
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      
      let invoices;
      if (clientId && !isNaN(clientId)) {
        invoices = await storage.getInvoicesByClient(clientId);
      } else {
        invoices = await storage.getInvoices();
      }
      
      return res.status(200).json(invoices);
    } catch (error) {
      console.error("Get invoices error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      return res.status(200).json(invoice);
    } catch (error) {
      console.error("Get invoice error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(validatedData);
      return res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create invoice error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const validatedData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(id, validatedData);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      return res.status(200).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Update invoice error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const success = await storage.deleteInvoice(id);
      if (!success) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      return res.status(204).send();
    } catch (error) {
      console.error("Delete invoice error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Expense Routes
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      return res.status(200).json(expenses);
    } catch (error) {
      console.error("Get expenses error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const expense = await storage.getExpense(id);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      return res.status(200).json(expense);
    } catch (error) {
      console.error("Get expense error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(validatedData);
      return res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create expense error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const validatedData = insertExpenseSchema.partial().parse(req.body);
      const expense = await storage.updateExpense(id, validatedData);
      
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      return res.status(200).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Update expense error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const success = await storage.deleteExpense(id);
      if (!success) {
        return res.status(404).json({ message: "Expense not found" });
      }

      return res.status(204).send();
    } catch (error) {
      console.error("Delete expense error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Support Ticket Routes
  app.get("/api/support-tickets", async (req, res) => {
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      
      let tickets;
      if (clientId && !isNaN(clientId)) {
        tickets = await storage.getSupportTicketsByClient(clientId);
      } else {
        tickets = await storage.getSupportTickets();
      }
      
      return res.status(200).json(tickets);
    } catch (error) {
      console.error("Get support tickets error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/support-tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const ticket = await storage.getSupportTicket(id);
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      return res.status(200).json(ticket);
    } catch (error) {
      console.error("Get support ticket error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/support-tickets", async (req, res) => {
    try {
      const validatedData = insertSupportTicketSchema.parse(req.body);
      const ticket = await storage.createSupportTicket(validatedData);
      return res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create support ticket error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/support-tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const validatedData = insertSupportTicketSchema.partial().parse(req.body);
      const ticket = await storage.updateSupportTicket(id, validatedData);
      
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      return res.status(200).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Update support ticket error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/support-tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const success = await storage.deleteSupportTicket(id);
      if (!success) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      return res.status(204).send();
    } catch (error) {
      console.error("Delete support ticket error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Support Messages Routes
  app.get("/api/support-tickets/:ticketId/messages", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      if (isNaN(ticketId)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }
      
      const messages = await storage.getSupportMessages(ticketId);
      return res.status(200).json(messages);
    } catch (error) {
      console.error("Get support messages error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/support-tickets/:ticketId/messages", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      if (isNaN(ticketId)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }
      
      const ticket = await storage.getSupportTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }
      
      const messageData = { ...req.body, ticketId };
      const validatedData = insertSupportMessageSchema.parse(messageData);
      const message = await storage.createSupportMessage(validatedData);
      
      return res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create support message error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Calendar Event Routes
  app.get("/api/calendar-events", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      let events;
      if (userId && !isNaN(userId)) {
        events = await storage.getCalendarEventsByUser(userId);
      } else {
        events = await storage.getCalendarEvents();
      }
      
      return res.status(200).json(events);
    } catch (error) {
      console.error("Get calendar events error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/calendar-events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const event = await storage.getCalendarEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Calendar event not found" });
      }

      return res.status(200).json(event);
    } catch (error) {
      console.error("Get calendar event error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/calendar-events", async (req, res) => {
    try {
      const validatedData = insertCalendarEventSchema.parse(req.body);
      const event = await storage.createCalendarEvent(validatedData);
      return res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create calendar event error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/calendar-events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const validatedData = insertCalendarEventSchema.partial().parse(req.body);
      const event = await storage.updateCalendarEvent(id, validatedData);
      
      if (!event) {
        return res.status(404).json({ message: "Calendar event not found" });
      }

      return res.status(200).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Update calendar event error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/calendar-events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const success = await storage.deleteCalendarEvent(id);
      if (!success) {
        return res.status(404).json({ message: "Calendar event not found" });
      }

      return res.status(204).send();
    } catch (error) {
      console.error("Delete calendar event error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Company Settings Routes
  app.get("/api/company-settings", async (req, res) => {
    try {
      const settings = await storage.getCompanySettings();
      if (!settings) {
        // Initialize default settings if none exist
        const defaultSettings = {
          companyName: "CRM System",
          email: "contact@crmsystem.com",
          cnpj: "",
          logo: "",
          theme: "light",
          language: "en"
        };
        const newSettings = await storage.updateCompanySettings(defaultSettings);
        return res.status(200).json(newSettings);
      }
      return res.status(200).json(settings);
    } catch (error) {
      console.error("Get company settings error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/company-settings", async (req, res) => {
    try {
      const validatedData = insertCompanySettingsSchema.partial().parse(req.body);
      const settings = await storage.updateCompanySettings(validatedData);
      
      if (!settings) {
        return res.status(404).json({ message: "Company settings not found" });
      }

      return res.status(200).json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Update company settings error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard Data
  app.get("/api/dashboard", async (req, res) => {
    try {
      const clients = await storage.getClients();
      const projects = await storage.getProjects();
      const tasks = await storage.getTasks();
      const invoices = await storage.getInvoices();
      const proposals = await storage.getProposals();
      
      // Get counts
      const clientCount = clients.length;
      const tasksToday = tasks.filter(task => {
        if (!task.dueDate) return false;
        const today = new Date();
        const dueDate = new Date(task.dueDate);
        return dueDate.toDateString() === today.toDateString();
      }).length;
      const openInvoices = invoices.filter(invoice => invoice.status === 'pending').length;
      const openInvoicesValue = invoices
        .filter(invoice => invoice.status === 'pending')
        .reduce((sum, invoice) => sum + (invoice.value || 0), 0);
      const proposalsSent = proposals.length;
      const proposalsAccepted = proposals.filter(proposal => proposal.status === 'accepted').length;
      
      // Calculate task status counts
      const taskStatusCounts = {
        backlog: tasks.filter(task => task.status === 'backlog').length,
        inProgress: tasks.filter(task => task.status === 'inProgress').length,
        testing: tasks.filter(task => task.status === 'testing').length,
        completed: tasks.filter(task => task.status === 'completed').length
      };
      
      // Calculate monthly revenue
      const monthlyRevenue = new Array(6).fill(0);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      invoices.forEach(invoice => {
        if (invoice.status === 'paid' && invoice.paidAt) {
          const paidAt = new Date(invoice.paidAt);
          const monthsDiff = (currentYear - paidAt.getFullYear()) * 12 + (currentMonth - paidAt.getMonth());
          if (monthsDiff >= 0 && monthsDiff < 6) {
            monthlyRevenue[5 - monthsDiff] += invoice.value || 0;
          }
        }
      });
      
      // Recent activities
      const recentActivities = [
        ...tasks.filter(task => task.status === 'completed' && task.completedAt)
          .map(task => ({
            type: 'task_completed',
            task,
            date: task.completedAt!,
          })),
        ...proposals.filter(proposal => proposal.createdAt)
          .map(proposal => ({
            type: 'proposal_created',
            proposal,
            date: proposal.createdAt!,
          })),
        ...clients.filter(client => client.createdAt)
          .map(client => ({
            type: 'client_created',
            client,
            date: client.createdAt!,
          })),
        ...invoices.filter(invoice => invoice.status === 'paid' && invoice.paidAt)
          .map(invoice => ({
            type: 'invoice_paid',
            invoice,
            date: invoice.paidAt!,
          }))
      ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
      
      const dashboardData = {
        counts: {
          clients: clientCount,
          tasksToday,
          openInvoices,
          openInvoicesValue,
          proposalsSent,
          proposalsAccepted
        },
        taskStatusCounts,
        monthlyRevenue,
        recentActivities
      };
      
      return res.status(200).json(dashboardData);
    } catch (error) {
      console.error("Get dashboard data error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
