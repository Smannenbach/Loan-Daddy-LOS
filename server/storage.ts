import { 
  users, borrowers, properties, loanApplications, documents, tasks, notifications, templates, callLogs,
  type User, type Borrower, type Property, type LoanApplication, 
  type Document, type Task, type Notification, type Template, type CallLog,
  type InsertBorrower, type InsertProperty, type InsertLoanApplication, 
  type InsertDocument, type InsertTask, type InsertNotification, 
  type InsertTemplate, type InsertCallLog, type LoanApplicationWithDetails
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Omit<User, 'id'>): Promise<User>;

  // Borrowers
  getBorrower(id: number): Promise<Borrower | undefined>;
  createBorrower(borrower: InsertBorrower): Promise<Borrower>;
  updateBorrower(id: number, borrower: Partial<InsertBorrower>): Promise<Borrower | undefined>;

  // Properties
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined>;

  // Loan Applications
  getLoanApplication(id: number): Promise<LoanApplication | undefined>;
  getLoanApplicationWithDetails(id: number): Promise<LoanApplicationWithDetails | undefined>;
  getAllLoanApplications(): Promise<LoanApplication[]>;
  getAllLoanApplicationsWithDetails(): Promise<LoanApplicationWithDetails[]>;
  createLoanApplication(application: InsertLoanApplication): Promise<LoanApplication>;
  updateLoanApplication(id: number, application: Partial<InsertLoanApplication>): Promise<LoanApplication | undefined>;
  getLoanApplicationsByStatus(status: string): Promise<LoanApplication[]>;

  // Documents
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByLoanApplication(loanApplicationId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<boolean>;

  // Tasks
  getTask(id: number): Promise<Task | undefined>;
  getTasksByLoanApplication(loanApplicationId: number): Promise<Task[]>;
  getTasksByAssignee(assignedToId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;

  // Notifications
  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationsByLoanApplication(loanApplicationId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: number, notification: Partial<InsertNotification>): Promise<Notification | undefined>;

  // Templates
  getTemplate(id: number): Promise<Template | undefined>;
  getAllTemplates(): Promise<Template[]>;
  getTemplatesByType(type: string): Promise<Template[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template | undefined>;

  // Call Logs
  getCallLog(id: number): Promise<CallLog | undefined>;
  getCallLogsByLoanApplication(loanApplicationId: number): Promise<CallLog[]>;
  getCallLogsByBorrower(borrowerId: number): Promise<CallLog[]>;
  createCallLog(callLog: InsertCallLog): Promise<CallLog>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    activeApplications: number;
    pendingReview: number;
    approvedThisMonth: number;
    totalFunded: string;
    pipelineStats: Record<string, number>;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private borrowers: Map<number, Borrower> = new Map();
  private properties: Map<number, Property> = new Map();
  private loanApplications: Map<number, LoanApplication> = new Map();
  private documents: Map<number, Document> = new Map();
  private tasks: Map<number, Task> = new Map();
  private notifications: Map<number, Notification> = new Map();
  private templates: Map<number, Template> = new Map();
  private callLogs: Map<number, CallLog> = new Map();
  
  private currentUserId = 1;
  private currentBorrowerId = 1;
  private currentPropertyId = 1;
  private currentLoanApplicationId = 1;
  private currentDocumentId = 1;
  private currentTaskId = 1;
  private currentNotificationId = 1;
  private currentTemplateId = 1;
  private currentCallLogId = 1;

  constructor() {
    // Create default user
    this.users.set(1, {
      id: 1,
      username: 'admin',
      password: 'password',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@loanflow.com',
      role: 'senior_loan_officer'
    });
    this.currentUserId = 2;

    // Create default email templates
    this.templates.set(1, {
      id: 1,
      name: 'Application Received',
      type: 'email',
      subject: 'Your Loan Application Has Been Received',
      content: 'Dear {borrowerName},\n\nThank you for submitting your loan application. We have received your application for ${requestedAmount} and will review it within 24-48 hours.\n\nApplication ID: {applicationId}\nLoan Type: {loanType}\n\nBest regards,\nLoanFlow Pro Team',
      isActive: true,
      createdAt: new Date()
    });

    this.templates.set(2, {
      id: 2,
      name: 'Document Request',
      type: 'sms',
      subject: null,
      content: 'Hi {borrowerName}, we need additional documents for your loan application #{applicationId}. Please upload them to your portal or call us at (555) 123-4567.',
      isActive: true,
      createdAt: new Date()
    });

    this.currentTemplateId = 3;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    const id = this.currentUserId++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  // Borrowers
  async getBorrower(id: number): Promise<Borrower | undefined> {
    return this.borrowers.get(id);
  }

  async createBorrower(borrower: InsertBorrower): Promise<Borrower> {
    const id = this.currentBorrowerId++;
    const newBorrower: Borrower = { 
      ...borrower, 
      id,
      address: borrower.address || null,
      city: borrower.city || null,
      state: borrower.state || null,
      zipCode: borrower.zipCode || null,
      linkedinProfile: borrower.linkedinProfile || null,
      company: borrower.company || null,
      jobTitle: borrower.jobTitle || null,
      investmentExperience: borrower.investmentExperience || null,
      portfolioSize: borrower.portfolioSize || null,
      preferredLoanTypes: borrower.preferredLoanTypes || null
    };
    this.borrowers.set(id, newBorrower);
    return newBorrower;
  }

  async updateBorrower(id: number, borrower: Partial<InsertBorrower>): Promise<Borrower | undefined> {
    const existing = this.borrowers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...borrower };
    this.borrowers.set(id, updated);
    return updated;
  }

  // Properties
  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const id = this.currentPropertyId++;
    const newProperty: Property = { 
      ...property, 
      id,
      propertyValue: property.propertyValue || null,
      purchasePrice: property.purchasePrice || null,
      rehabCost: property.rehabCost || null,
      arv: property.arv || null
    };
    this.properties.set(id, newProperty);
    return newProperty;
  }

  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const existing = this.properties.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...property };
    this.properties.set(id, updated);
    return updated;
  }

  // Loan Applications
  async getLoanApplication(id: number): Promise<LoanApplication | undefined> {
    return this.loanApplications.get(id);
  }

  async getLoanApplicationWithDetails(id: number): Promise<LoanApplicationWithDetails | undefined> {
    const application = this.loanApplications.get(id);
    if (!application) return undefined;

    const borrower = this.borrowers.get(application.borrowerId);
    const property = this.properties.get(application.propertyId);
    const documents = Array.from(this.documents.values()).filter(doc => doc.loanApplicationId === id);
    const tasks = Array.from(this.tasks.values()).filter(task => task.loanApplicationId === id);

    if (!borrower || !property) return undefined;

    return {
      ...application,
      borrower,
      property,
      documents,
      tasks
    };
  }

  async getAllLoanApplications(): Promise<LoanApplication[]> {
    return Array.from(this.loanApplications.values());
  }

  async getAllLoanApplicationsWithDetails(): Promise<LoanApplicationWithDetails[]> {
    const applications = Array.from(this.loanApplications.values());
    const detailed: LoanApplicationWithDetails[] = [];

    for (const app of applications) {
      const borrower = this.borrowers.get(app.borrowerId);
      const property = this.properties.get(app.propertyId);
      const documents = Array.from(this.documents.values()).filter(doc => doc.loanApplicationId === app.id);
      const tasks = Array.from(this.tasks.values()).filter(task => task.loanApplicationId === app.id);

      if (borrower && property) {
        detailed.push({
          ...app,
          borrower,
          property,
          documents,
          tasks
        });
      }
    }

    return detailed;
  }

  async createLoanApplication(application: InsertLoanApplication): Promise<LoanApplication> {
    const id = this.currentLoanApplicationId++;
    const now = new Date();
    const newApplication: LoanApplication = { 
      ...application, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.loanApplications.set(id, newApplication);
    return newApplication;
  }

  async updateLoanApplication(id: number, application: Partial<InsertLoanApplication>): Promise<LoanApplication | undefined> {
    const existing = this.loanApplications.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...application, updatedAt: new Date() };
    this.loanApplications.set(id, updated);
    return updated;
  }

  async getLoanApplicationsByStatus(status: string): Promise<LoanApplication[]> {
    return Array.from(this.loanApplications.values()).filter(app => app.status === status);
  }

  // Documents
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentsByLoanApplication(loanApplicationId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.loanApplicationId === loanApplicationId);
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const newDocument: Document = { 
      ...document, 
      id,
      uploadedAt: new Date()
    };
    this.documents.set(id, newDocument);
    return newDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Tasks
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByLoanApplication(loanApplicationId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.loanApplicationId === loanApplicationId);
  }

  async getTasksByAssignee(assignedToId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.assignedToId === assignedToId);
  }

  async createTask(task: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const newTask: Task = { 
      ...task, 
      id,
      createdAt: new Date()
    };
    this.tasks.set(id, newTask);
    return newTask;
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const existing = this.tasks.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...task };
    this.tasks.set(id, updated);
    return updated;
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    activeApplications: number;
    pendingReview: number;
    approvedThisMonth: number;
    totalFunded: string;
    pipelineStats: Record<string, number>;
  }> {
    const applications = Array.from(this.loanApplications.values());
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const activeApplications = applications.filter(app => 
      ['application', 'document_review', 'underwriting'].includes(app.status)
    ).length;

    const pendingReview = applications.filter(app => app.status === 'document_review').length;

    const approvedThisMonth = applications.filter(app => {
      if (app.status !== 'approved') return false;
      const createdDate = new Date(app.createdAt);
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
    }).length;

    const approvedApps = applications.filter(app => app.status === 'approved');
    const totalFunded = approvedApps.reduce((sum, app) => {
      return sum + parseFloat(app.requestedAmount || '0');
    }, 0);

    const pipelineStats = {
      application: applications.filter(app => app.status === 'application').length,
      document_review: applications.filter(app => app.status === 'document_review').length,
      underwriting: applications.filter(app => app.status === 'underwriting').length,
      approved: applications.filter(app => app.status === 'approved').length,
      declined: applications.filter(app => app.status === 'declined').length,
    };

    return {
      activeApplications,
      pendingReview,
      approvedThisMonth,
      totalFunded: `$${(totalFunded / 1000000).toFixed(1)}M`,
      pipelineStats
    };
  }
}

export const storage = new MemStorage();
