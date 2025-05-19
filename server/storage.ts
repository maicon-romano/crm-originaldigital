import {
  users,
  clients,
  projects,
  tasks,
  proposals,
  invoices,
  expenses,
  supportTickets,
  supportMessages,
  calendarEvents,
  companySettings,
  type User,
  type InsertUser,
  type Client,
  type InsertClient,
  type Project,
  type InsertProject,
  type Task,
  type InsertTask,
  type Proposal,
  type InsertProposal,
  type Invoice,
  type InsertInvoice,
  type Expense,
  type InsertExpense,
  type SupportTicket,
  type InsertSupportTicket,
  type SupportMessage,
  type InsertSupportMessage,
  type CalendarEvent,
  type InsertCalendarEvent,
  type CompanySettings,
  type InsertCompanySettings
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Firestore operations
  updateFirestoreClient(clientId: string, data: any): Promise<boolean>;

  // Clients
  getClient(id: number): Promise<Client | undefined>;
  getClients(): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, data: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;

  // Projects
  getProject(id: number): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  getProjectsByClient(clientId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, data: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // Tasks
  getTask(id: number): Promise<Task | undefined>;
  getTasks(): Promise<Task[]>;
  getTasksByProject(projectId: number): Promise<Task[]>;
  getTasksByAssignee(assigneeId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, data: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;

  // Proposals
  getProposal(id: number): Promise<Proposal | undefined>;
  getProposals(): Promise<Proposal[]>;
  getProposalsByClient(clientId: number): Promise<Proposal[]>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposal(id: number, data: Partial<InsertProposal>): Promise<Proposal | undefined>;
  deleteProposal(id: number): Promise<boolean>;

  // Invoices
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoices(): Promise<Invoice[]>;
  getInvoicesByClient(clientId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;

  // Expenses
  getExpense(id: number): Promise<Expense | undefined>;
  getExpenses(): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, data: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;

  // Support Tickets
  getSupportTicket(id: number): Promise<SupportTicket | undefined>;
  getSupportTickets(): Promise<SupportTicket[]>;
  getSupportTicketsByClient(clientId: number): Promise<SupportTicket[]>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(id: number, data: Partial<InsertSupportTicket>): Promise<SupportTicket | undefined>;
  deleteSupportTicket(id: number): Promise<boolean>;

  // Support Messages
  getSupportMessages(ticketId: number): Promise<SupportMessage[]>;
  createSupportMessage(message: InsertSupportMessage): Promise<SupportMessage>;

  // Calendar Events
  getCalendarEvent(id: number): Promise<CalendarEvent | undefined>;
  getCalendarEvents(): Promise<CalendarEvent[]>;
  getCalendarEventsByUser(userId: number): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: number, data: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: number): Promise<boolean>;

  // Company Settings
  getCompanySettings(): Promise<CompanySettings | undefined>;
  updateCompanySettings(data: Partial<InsertCompanySettings>): Promise<CompanySettings | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private projects: Map<number, Project>;
  private tasks: Map<number, Task>;
  private proposals: Map<number, Proposal>;
  private invoices: Map<number, Invoice>;
  private expenses: Map<number, Expense>;
  private supportTickets: Map<number, SupportTicket>;
  private supportMessages: Map<number, SupportMessage>;
  private calendarEvents: Map<number, CalendarEvent>;
  private companySettings: CompanySettings | undefined;

  private userCurrentId: number;
  private clientCurrentId: number;
  private projectCurrentId: number;
  private taskCurrentId: number;
  private proposalCurrentId: number;
  private invoiceCurrentId: number;
  private expenseCurrentId: number;
  private supportTicketCurrentId: number;
  private supportMessageCurrentId: number;
  private calendarEventCurrentId: number;
  private companySettingsId: number;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.projects = new Map();
    this.tasks = new Map();
    this.proposals = new Map();
    this.invoices = new Map();
    this.expenses = new Map();
    this.supportTickets = new Map();
    this.supportMessages = new Map();
    this.calendarEvents = new Map();

    this.userCurrentId = 1;
    this.clientCurrentId = 1;
    this.projectCurrentId = 1;
    this.taskCurrentId = 1;
    this.proposalCurrentId = 1;
    this.invoiceCurrentId = 1;
    this.expenseCurrentId = 1;
    this.supportTicketCurrentId = 1;
    this.supportMessageCurrentId = 1;
    this.calendarEventCurrentId = 1;
    this.companySettingsId = 1;

    // Add admin user
    this.createUser({
      name: "Admin User",
      email: "admin@example.com",
      username: "admin",
      password: "password",
      role: "admin",
      position: "Administrator",
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  // Método para atualizar cliente no Firestore
  async updateFirestoreClient(clientId: string, data: any): Promise<boolean> {
    try {
      const { updateFirestoreClient } = require('./firebase-admin');
      await updateFirestoreClient(clientId, data);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar cliente no Firestore:', error);
      return false;
    }
  }

  // Clients
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.clientCurrentId++;
    const createdAt = new Date();
    const client: Client = { ...insertClient, id, createdAt };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: number, data: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...data };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Projects
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProjectsByClient(clientId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.clientId === clientId
    );
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectCurrentId++;
    const createdAt = new Date();
    const project: Project = { ...insertProject, id, createdAt };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, data: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...data };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Tasks
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTasksByProject(projectId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.projectId === projectId
    );
  }

  async getTasksByAssignee(assigneeId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.assigneeId === assigneeId
    );
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskCurrentId++;
    const createdAt = new Date();
    const task: Task = { ...insertTask, id, createdAt, completedAt: null };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, data: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    // If status is being updated to completed and it wasn't before, set completedAt
    const completedAt = data.status === 'completed' && task.status !== 'completed' 
      ? new Date() 
      : task.completedAt;
    
    const updatedTask = { ...task, ...data, completedAt };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Proposals
  async getProposal(id: number): Promise<Proposal | undefined> {
    return this.proposals.get(id);
  }

  async getProposals(): Promise<Proposal[]> {
    return Array.from(this.proposals.values());
  }

  async getProposalsByClient(clientId: number): Promise<Proposal[]> {
    return Array.from(this.proposals.values()).filter(
      (proposal) => proposal.clientId === clientId
    );
  }

  async createProposal(insertProposal: InsertProposal): Promise<Proposal> {
    const id = this.proposalCurrentId++;
    const createdAt = new Date();
    const proposal: Proposal = { ...insertProposal, id, createdAt };
    this.proposals.set(id, proposal);
    return proposal;
  }

  async updateProposal(id: number, data: Partial<InsertProposal>): Promise<Proposal | undefined> {
    const proposal = this.proposals.get(id);
    if (!proposal) return undefined;
    
    const updatedProposal = { ...proposal, ...data };
    this.proposals.set(id, updatedProposal);
    return updatedProposal;
  }

  async deleteProposal(id: number): Promise<boolean> {
    return this.proposals.delete(id);
  }

  // Invoices
  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoicesByClient(clientId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      (invoice) => invoice.clientId === clientId
    );
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = this.invoiceCurrentId++;
    const createdAt = new Date();
    const invoice: Invoice = { ...insertInvoice, id, createdAt, paidAt: null };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;
    
    // If status is being updated to paid and it wasn't before, set paidAt
    const paidAt = data.status === 'paid' && invoice.status !== 'paid' 
      ? new Date() 
      : invoice.paidAt;
    
    const updatedInvoice = { ...invoice, ...data, paidAt };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    return this.invoices.delete(id);
  }

  // Expenses
  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values());
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.expenseCurrentId++;
    const createdAt = new Date();
    const expense: Expense = { ...insertExpense, id, createdAt };
    this.expenses.set(id, expense);
    return expense;
  }

  async updateExpense(id: number, data: Partial<InsertExpense>): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (!expense) return undefined;
    
    const updatedExpense = { ...expense, ...data };
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<boolean> {
    return this.expenses.delete(id);
  }

  // Support Tickets
  async getSupportTicket(id: number): Promise<SupportTicket | undefined> {
    return this.supportTickets.get(id);
  }

  async getSupportTickets(): Promise<SupportTicket[]> {
    return Array.from(this.supportTickets.values());
  }

  async getSupportTicketsByClient(clientId: number): Promise<SupportTicket[]> {
    return Array.from(this.supportTickets.values()).filter(
      (ticket) => ticket.clientId === clientId
    );
  }

  async createSupportTicket(insertTicket: InsertSupportTicket): Promise<SupportTicket> {
    const id = this.supportTicketCurrentId++;
    const createdAt = new Date();
    const ticket: SupportTicket = { ...insertTicket, id, createdAt, closedAt: null };
    this.supportTickets.set(id, ticket);
    return ticket;
  }

  async updateSupportTicket(id: number, data: Partial<InsertSupportTicket>): Promise<SupportTicket | undefined> {
    const ticket = this.supportTickets.get(id);
    if (!ticket) return undefined;
    
    // If status is being updated to closed and it wasn't before, set closedAt
    const closedAt = data.status === 'closed' && ticket.status !== 'closed' 
      ? new Date() 
      : ticket.closedAt;
    
    const updatedTicket = { ...ticket, ...data, closedAt };
    this.supportTickets.set(id, updatedTicket);
    return updatedTicket;
  }

  async deleteSupportTicket(id: number): Promise<boolean> {
    return this.supportTickets.delete(id);
  }

  // Support Messages
  async getSupportMessages(ticketId: number): Promise<SupportMessage[]> {
    return Array.from(this.supportMessages.values()).filter(
      (message) => message.ticketId === ticketId
    );
  }

  async createSupportMessage(insertMessage: InsertSupportMessage): Promise<SupportMessage> {
    const id = this.supportMessageCurrentId++;
    const createdAt = new Date();
    const message: SupportMessage = { ...insertMessage, id, createdAt };
    this.supportMessages.set(id, message);
    return message;
  }

  // Calendar Events
  async getCalendarEvent(id: number): Promise<CalendarEvent | undefined> {
    return this.calendarEvents.get(id);
  }

  async getCalendarEvents(): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values());
  }

  async getCalendarEventsByUser(userId: number): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values()).filter(
      (event) => event.userId === userId
    );
  }

  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = this.calendarEventCurrentId++;
    const createdAt = new Date();
    const event: CalendarEvent = { ...insertEvent, id, createdAt };
    this.calendarEvents.set(id, event);
    return event;
  }

  async updateCalendarEvent(id: number, data: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined> {
    const event = this.calendarEvents.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...data };
    this.calendarEvents.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteCalendarEvent(id: number): Promise<boolean> {
    return this.calendarEvents.delete(id);
  }

  // Company Settings
  async getCompanySettings(): Promise<CompanySettings | undefined> {
    return this.companySettings;
  }

  async updateCompanySettings(data: Partial<InsertCompanySettings>): Promise<CompanySettings | undefined> {
    const updatedAt = new Date();
    
    if (!this.companySettings) {
      this.companySettings = {
        id: this.companySettingsId,
        companyName: data.companyName || 'Company Name',
        email: data.email || 'company@example.com',
        cnpj: data.cnpj || '',
        logo: data.logo || '',
        theme: data.theme || 'light',
        language: data.language || 'en',
        updatedAt
      };
    } else {
      this.companySettings = {
        ...this.companySettings,
        ...data,
        updatedAt
      };
    }
    
    return this.companySettings;
  }
}

export const storage = new MemStorage();
