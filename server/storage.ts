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

  // Document Requirements
  getDocumentRequirements(loanType: string): Promise<any[]>;
  createDocumentRequirement(requirement: any): Promise<any>;

  // Document Reminders
  getDocumentReminders(loanApplicationId: number): Promise<any[]>;
  createDocumentReminder(reminder: any): Promise<any>;
  updateDocumentReminder(id: number, reminder: any): Promise<any>;

  // Bank Accounts
  getBankAccounts(borrowerId: number): Promise<any[]>;
  createBankAccount(account: any): Promise<any>;
  updateBankAccount(id: number, account: any): Promise<any>;

  // Customer Portal
  getCustomerSession(token: string): Promise<any>;
  createCustomerSession(session: any): Promise<any>;
  updateLoanApplicationStage(id: number, stage: string, data?: any): Promise<any>;

  // Contacts
  getAllContacts(): Promise<any[]>;
  getContact(id: number): Promise<any>;
  createContact(contact: any): Promise<any>;
  updateContact(id: number, contact: any): Promise<any>;
  deleteContact(id: number): Promise<boolean>;
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
  private documentRequirements: Map<string, any[]> = new Map();
  private documentReminders: Map<number, any> = new Map();
  private bankAccounts: Map<number, any[]> = new Map();
  private customerSessions: Map<string, any> = new Map();
  private currentDocumentReminderId = 1;
  private currentBankAccountId = 1;

  constructor() {
    // Create default user
    this.users.set(1, {
      id: 1,
      username: 'admin',
      password: 'password',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@loanflow.com',
      role: 'senior_loan_officer',
      phone: null,
      nmlsId: null,
      realEstateLicense: null,
      licenseState: null,
      bio: null,
      emailSignature: null,
      socialMediaLinks: null,
      customDomain: null,
      websiteEnabled: false,
      websiteTheme: 'professional',
      websiteContent: null,
      calendarSettings: null,
      timeZone: 'America/New_York',
      workingHours: null,
      permissions: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
      profilePicture: null
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
      status: application.status || 'application',
      ltv: application.ltv || null,
      dscr: application.dscr || null,
      interestRate: application.interestRate || null,
      termMonths: application.termMonths || null,
      monthlyRent: application.monthlyRent || null,
      monthlyExpenses: application.monthlyExpenses || null,
      loanPurpose: application.loanPurpose || null,
      exitStrategy: application.exitStrategy || null,
      experienceLevel: application.experienceLevel || null,
      notes: application.notes || null,
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
      status: task.status || 'pending',
      description: task.description || null,
      priority: task.priority || 'medium',
      dueDate: task.dueDate || null,
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

  // Notifications
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async getNotificationsByLoanApplication(loanApplicationId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(notif => notif.loanApplicationId === loanApplicationId);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.currentNotificationId++;
    const newNotification: Notification = {
      ...notification,
      id,
      status: notification.status || 'pending',
      subject: notification.subject || null,
      sentAt: null,
      createdAt: new Date()
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async updateNotification(id: number, notification: Partial<InsertNotification>): Promise<Notification | undefined> {
    const existing = this.notifications.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...notification };
    this.notifications.set(id, updated);
    return updated;
  }

  // Templates
  async getTemplate(id: number): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async getAllTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async getTemplatesByType(type: string): Promise<Template[]> {
    return Array.from(this.templates.values()).filter(template => template.type === type);
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const id = this.currentTemplateId++;
    const newTemplate: Template = {
      ...template,
      id,
      subject: template.subject || null,
      isActive: template.isActive !== undefined ? template.isActive : true,
      createdAt: new Date()
    };
    this.templates.set(id, newTemplate);
    return newTemplate;
  }

  async updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template | undefined> {
    const existing = this.templates.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...template };
    this.templates.set(id, updated);
    return updated;
  }

  // Call Logs
  async getCallLog(id: number): Promise<CallLog | undefined> {
    return this.callLogs.get(id);
  }

  async getCallLogsByLoanApplication(loanApplicationId: number): Promise<CallLog[]> {
    return Array.from(this.callLogs.values()).filter(call => call.loanApplicationId === loanApplicationId);
  }

  async getCallLogsByBorrower(borrowerId: number): Promise<CallLog[]> {
    return Array.from(this.callLogs.values()).filter(call => call.borrowerId === borrowerId);
  }

  async createCallLog(callLog: InsertCallLog): Promise<CallLog> {
    const id = this.currentCallLogId++;
    const newCallLog: CallLog = {
      ...callLog,
      id,
      duration: callLog.duration || null,
      notes: callLog.notes || null,
      recordingUrl: callLog.recordingUrl || null,
      createdAt: new Date()
    };
    this.callLogs.set(id, newCallLog);
    return newCallLog;
  }

  // Document Requirements
  async getDocumentRequirements(loanType: string): Promise<any[]> {
    return this.documentRequirements.get(loanType) || this.getDefaultDocumentRequirements(loanType);
  }

  async createDocumentRequirement(requirement: any): Promise<any> {
    const loanType = requirement.loanType;
    const existing = this.documentRequirements.get(loanType) || [];
    existing.push({ ...requirement, id: existing.length + 1 });
    this.documentRequirements.set(loanType, existing);
    return requirement;
  }

  private getDefaultDocumentRequirements(loanType: string): any[] {
    const common = [
      { id: 1, loanType, category: 'income_verification', documentName: 'Tax Returns (2 years)', description: 'Personal and business tax returns for the last 2 years', isRequired: true, sortOrder: 1 },
      { id: 2, loanType, category: 'bank_statements', documentName: 'Bank Statements (3 months)', description: 'Recent bank statements showing cash reserves', isRequired: true, sortOrder: 2 },
      { id: 3, loanType, category: 'insurance', documentName: 'Property Insurance', description: 'Proof of property insurance coverage', isRequired: true, sortOrder: 3 },
      { id: 4, loanType, category: 'property_docs', documentName: 'Purchase Agreement', description: 'Signed purchase agreement or property deed', isRequired: true, sortOrder: 4 }
    ];

    const specific: Record<string, any[]> = {
      'dscr': [
        { id: 5, loanType, category: 'rental_income', documentName: 'Rent Roll', description: 'Current rent roll showing rental income', isRequired: true, sortOrder: 5 },
        { id: 6, loanType, category: 'rental_income', documentName: 'Lease Agreements', description: 'Current tenant lease agreements', isRequired: true, sortOrder: 6 }
      ],
      'fix_flip': [
        { id: 5, loanType, category: 'construction', documentName: 'Rehab Budget', description: 'Detailed renovation budget and timeline', isRequired: true, sortOrder: 5 },
        { id: 6, loanType, category: 'construction', documentName: 'Contractor Estimates', description: 'Licensed contractor estimates', isRequired: true, sortOrder: 6 }
      ],
      'construction': [
        { id: 5, loanType, category: 'construction', documentName: 'Building Plans', description: 'Architectural plans and permits', isRequired: true, sortOrder: 5 },
        { id: 6, loanType, category: 'construction', documentName: 'Construction Budget', description: 'Detailed construction budget', isRequired: true, sortOrder: 6 }
      ]
    };

    return [...common, ...(specific[loanType] || [])];
  }

  // Document Reminders
  async getDocumentReminders(loanApplicationId: number): Promise<any[]> {
    return Array.from(this.documentReminders.values()).filter(reminder => reminder.loanApplicationId === loanApplicationId);
  }

  async createDocumentReminder(reminder: any): Promise<any> {
    const id = this.currentDocumentReminderId++;
    const newReminder = { ...reminder, id, createdAt: new Date() };
    this.documentReminders.set(id, newReminder);
    return newReminder;
  }

  async updateDocumentReminder(id: number, reminder: any): Promise<any> {
    const existing = this.documentReminders.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...reminder };
    this.documentReminders.set(id, updated);
    return updated;
  }

  // Bank Accounts
  async getBankAccounts(borrowerId: number): Promise<any[]> {
    return this.bankAccounts.get(borrowerId) || [];
  }

  async createBankAccount(account: any): Promise<any> {
    const id = this.currentBankAccountId++;
    const newAccount = { ...account, id, createdAt: new Date() };
    const borrowerAccounts = this.bankAccounts.get(account.borrowerId) || [];
    borrowerAccounts.push(newAccount);
    this.bankAccounts.set(account.borrowerId, borrowerAccounts);
    return newAccount;
  }

  async updateBankAccount(id: number, account: any): Promise<any> {
    const bankAccountEntries = Array.from(this.bankAccounts.entries());
    for (const [borrowerId, accounts] of bankAccountEntries) {
      const index = accounts.findIndex((acc: any) => acc.id === id);
      if (index !== -1) {
        accounts[index] = { ...accounts[index], ...account };
        return accounts[index];
      }
    }
    return undefined;
  }

  // Customer Portal
  async getCustomerSession(token: string): Promise<any> {
    return this.customerSessions.get(token);
  }

  async createCustomerSession(session: any): Promise<any> {
    this.customerSessions.set(session.sessionToken, session);
    return session;
  }

  async updateLoanApplicationStage(id: number, stage: string, data?: any): Promise<any> {
    const existing = this.loanApplications.get(id);
    if (!existing) return undefined;
    
    const updated = { 
      ...existing, 
      stage,
      updatedAt: new Date(),
      ...(data?.urlaData && { urlaData: data.urlaData })
    };
    
    this.loanApplications.set(id, updated);
    return updated;
  }

  // Contacts methods
  async getAllContacts(): Promise<any[]> {
    return [];
  }

  async getContact(id: number): Promise<any> {
    return undefined;
  }

  async createContact(contact: any): Promise<any> {
    return { id: Date.now(), ...contact, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }

  async updateContact(id: number, contact: any): Promise<any> {
    return { id, ...contact, updatedAt: new Date().toISOString() };
  }

  async deleteContact(id: number): Promise<boolean> {
    return true;
  }
}

export const storage = new MemStorage();
