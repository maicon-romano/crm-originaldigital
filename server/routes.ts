import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertClientSchema, insertProjectSchema, insertTaskSchema, insertProposalSchema, insertInvoiceSchema, insertExpenseSchema, insertSupportTicketSchema, insertSupportMessageSchema, insertCalendarEventSchema, insertCompanySettingsSchema } from "@shared/schema";
import { z } from "zod";
import { 
  createFirestoreUser, 
  getFirestoreUserById, 
  getFirestoreUserByEmail,
  getAllFirestoreUsers,
  updateFirestoreUser,
  deleteFirestoreUser,
  FirestoreUser 
} from './firebase-admin';

export async function registerRoutes(app: Express): Promise<Server> {
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
      
      // Criar o usuário no Firestore
      const newUser = await createFirestoreUser({
        id,
        email,
        name,
        username: username || email.split('@')[0],
        role,
        userType,
        active: true,
        ...rest
      });
      
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
      
      // Criar o usuário no Firestore
      const newUser = await createFirestoreUser({
        id: userData.firebaseUid,
        email: userData.email,
        name: userData.name,
        username: userData.username || userData.email.split('@')[0],
        role: userData.role || 'usuario',
        userType: userData.userType || 'staff',
        active: true,
        phone: userData.phone,
        position: userData.cargo || userData.position, // Aceitar tanto cargo quanto position
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
      const clients = await storage.getClients();
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
      const client = await storage.createClient(validatedData);
      return res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Create client error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const validatedData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(id, validatedData);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      return res.status(200).json(client);
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
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const success = await storage.deleteClient(id);
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }

      return res.status(204).send();
    } catch (error) {
      console.error("Delete client error:", error);
      return res.status(500).json({ message: "Internal server error" });
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
