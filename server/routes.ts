import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { databaseStorage } from "./database-storage";
import { 
  insertBorrowerSchema, 
  insertPropertySchema, 
  insertLoanApplicationSchema,
  insertDocumentSchema,
  insertTaskSchema,
  insertNotificationSchema,
  insertTemplateSchema,
  insertCallLogSchema
} from "@shared/schema";
import { marketingIntegrations, type WebhookPayload } from "./marketing-integrations";
import { aiLoanAdvisor, type BorrowerProfile } from "./ai-loan-advisor";
import { aiMarketAnalyzer, type MarketAnalysisRequest } from "./ai-market-analysis";
import { propertyDataService } from "./property-data-service";
import { pricingEngine, type PricingRequest } from "./pricing-engine";
import type { PropertyVideoTourRequest } from "./video-tour-generator";
import { propertyImageService } from "./property-image-service";
import { linkedInIntegration } from "./linkedin-integration";
import { aiChatbot } from "./ai-chatbot";
import { aiVoicebot } from "./ai-voicebot";
import { socialEnrichment } from "./social-enrichment";
import { contactRecommendationService } from "./contact-recommendation";
import { customerAuth } from "./customer-auth";
import { customerOAuth } from "./customer-oauth";
import aiRoutes from "./ai-routes";
import multer from "multer";
import cookieParser from "cookie-parser";
import passport from "passport";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure middleware
  app.use(cookieParser());
  
  // Serve public website for root domain
  app.use((req, res, next) => {
    const host = req.get('host') || '';
    const url = req.path;
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    
    // Skip API routes and static assets
    if (url.startsWith('/api') || url.startsWith('/src') || url.startsWith('/assets') || url.includes('.')) {
      return next();
    }
    
    // Check if we're on the app subdomain or accessing the app
    // In production: app.loangenius.ai
    // In Replit: URLs with /app prefix or query param ?app=true
    const isAppSubdomain = host.includes('app.loangenius.ai') || 
                          host.includes('app-') || 
                          url.startsWith('/app') ||
                          req.query.app === 'true' ||
                          fullUrl.includes('app.loangenius.ai');
    
    // Log for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Route detection:', { host, url, isAppSubdomain });
    }
    
    // If not on app subdomain and not an API route, serve public website
    if (!isAppSubdomain) {
      const publicPath = path.join(__dirname, "../public-site");
      
      // Handle specific routes
      if (url === '/' || url === '') {
        return res.sendFile(path.join(publicPath, "index.html"));
      } else if (url === '/privacy' || url === '/privacy.html') {
        return res.sendFile(path.join(publicPath, "privacy.html"));
      } else if (url === '/terms' || url === '/terms.html') {
        return res.sendFile(path.join(publicPath, "terms.html"));
      }
      
      // Check if file exists in public-site
      const filePath = path.join(publicPath, url);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return res.sendFile(filePath);
      }
    }
    
    // Continue to next middleware (React app)
    next();
  });
  
  // Add convenient redirect for testing
  app.get('/app', (req, res) => {
    // Redirect to root with app=true parameter
    res.redirect('/?app=true');
  });
  
  // Initialize OAuth system
  customerOAuth.setupSession(app);
  customerOAuth.initializeStrategies();

  // OAuth routes for customer authentication
  app.get("/api/customer/oauth/providers", (req, res) => {
    const providers = customerOAuth.getAvailableProviders();
    res.json(providers);
  });

  // Google OAuth
  app.get("/api/customer/auth/google", 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get("/api/customer/auth/google/callback",
    passport.authenticate('google', { failureRedirect: '/customer/login?error=oauth_failed' }),
    (req, res) => {
      res.redirect('/customer/dashboard');
    }
  );

  // Facebook OAuth
  app.get("/api/customer/auth/facebook", 
    passport.authenticate('facebook', { scope: ['email'] })
  );

  app.get("/api/customer/auth/facebook/callback",
    passport.authenticate('facebook', { failureRedirect: '/customer/login?error=oauth_failed' }),
    (req, res) => {
      res.redirect('/customer/dashboard');
    }
  );

  // LinkedIn OAuth
  app.get("/api/customer/auth/linkedin", 
    passport.authenticate('linkedin', { scope: ['r_emailaddress', 'r_liteprofile'] })
  );

  app.get("/api/customer/auth/linkedin/callback",
    passport.authenticate('linkedin', { failureRedirect: '/customer/login?error=oauth_failed' }),
    (req, res) => {
      res.redirect('/customer/dashboard');
    }
  );

  // Twitter OAuth
  app.get("/api/customer/auth/twitter", 
    passport.authenticate('twitter')
  );

  app.get("/api/customer/auth/twitter/callback",
    passport.authenticate('twitter', { failureRedirect: '/customer/login?error=oauth_failed' }),
    (req, res) => {
      res.redirect('/customer/dashboard');
    }
  );

  // GitHub OAuth
  app.get("/api/customer/auth/github", 
    passport.authenticate('github', { scope: ['user:email'] })
  );

  app.get("/api/customer/auth/github/callback",
    passport.authenticate('github', { failureRedirect: '/customer/login?error=oauth_failed' }),
    (req, res) => {
      res.redirect('/customer/dashboard');
    }
  );

  // Apple OAuth
  app.get("/api/customer/auth/apple", 
    passport.authenticate('apple')
  );

  app.get("/api/customer/auth/apple/callback",
    passport.authenticate('apple', { failureRedirect: '/customer/login?error=oauth_failed' }),
    (req, res) => {
      res.redirect('/customer/dashboard');
    }
  );
  
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Loan Applications
  app.get("/api/loan-applications", async (req, res) => {
    try {
      const applications = await storage.getAllLoanApplicationsWithDetails();
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch loan applications" });
    }
  });

  app.get("/api/loan-applications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const application = await storage.getLoanApplicationWithDetails(id);
      if (!application) {
        return res.status(404).json({ message: "Loan application not found" });
      }
      res.json(application);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch loan application" });
    }
  });

  app.post("/api/loan-applications", async (req, res) => {
    try {
      // Validate and create borrower
      const borrowerData = insertBorrowerSchema.parse({
        firstName: req.body.borrower.firstName,
        lastName: req.body.borrower.lastName,
        email: req.body.borrower.email,
        phone: req.body.borrower.phone,
        address: req.body.borrower.address,
        city: req.body.borrower.city,
        state: req.body.borrower.state,
        zipCode: req.body.borrower.zipCode,
      });
      const borrower = await storage.createBorrower(borrowerData);

      // Validate and create property
      const propertyData = insertPropertySchema.parse({
        address: req.body.property.address,
        city: req.body.property.city,
        state: req.body.property.state,
        zipCode: req.body.property.zipCode,
        propertyType: req.body.property.propertyType,
        propertyValue: req.body.property.propertyValue,
        purchasePrice: req.body.property.purchasePrice,
        rehabCost: req.body.property.rehabCost,
        arv: req.body.property.arv,
      });
      const property = await storage.createProperty(propertyData);

      // Calculate LTV and DSCR
      const requestedAmount = parseFloat(req.body.requestedAmount);
      const propertyValue = parseFloat(req.body.property.propertyValue || '0');
      const monthlyRent = parseFloat(req.body.monthlyRent || '0');
      const monthlyExpenses = parseFloat(req.body.monthlyExpenses || '0');
      const interestRate = parseFloat(req.body.interestRate || '0');
      const termMonths = parseInt(req.body.termMonths || '360');

      let ltv = 0;
      if (propertyValue > 0) {
        ltv = (requestedAmount / propertyValue) * 100;
      }

      let dscr = 0;
      if (monthlyRent > 0 && interestRate > 0) {
        const monthlyPayment = (requestedAmount * (interestRate / 100 / 12)) / 
          (1 - Math.pow(1 + (interestRate / 100 / 12), -termMonths));
        const netOperatingIncome = monthlyRent - monthlyExpenses;
        if (monthlyPayment > 0) {
          dscr = netOperatingIncome / monthlyPayment;
        }
      }

      // Validate and create loan application
      const applicationData = insertLoanApplicationSchema.parse({
        borrowerId: borrower.id,
        propertyId: property.id,
        loanOfficerId: 1, // Default to admin user
        loanType: req.body.loanType,
        requestedAmount: req.body.requestedAmount,
        status: 'application',
        ltv: ltv.toString(),
        dscr: dscr.toString(),
        interestRate: req.body.interestRate,
        termMonths: termMonths,
        monthlyRent: req.body.monthlyRent,
        monthlyExpenses: req.body.monthlyExpenses,
        notes: req.body.notes,
      });

      const application = await storage.createLoanApplication(applicationData);
      
      // Create initial task
      await storage.createTask({
        loanApplicationId: application.id,
        assignedToId: 1,
        title: "Review Application Documents",
        description: `Initial review for ${borrower.firstName} ${borrower.lastName}`,
        priority: "medium",
        status: "pending",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
      });

      const fullApplication = await storage.getLoanApplicationWithDetails(application.id);
      res.status(201).json(fullApplication);
    } catch (error) {
      console.error("Error creating loan application:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Invalid loan application data" 
      });
    }
  });

  app.patch("/api/loan-applications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const application = await storage.updateLoanApplication(id, req.body);
      if (!application) {
        return res.status(404).json({ message: "Loan application not found" });
      }
      const fullApplication = await storage.getLoanApplicationWithDetails(id);
      res.json(fullApplication);
    } catch (error) {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  // Documents
  app.get("/api/loan-applications/:id/documents", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const documents = await storage.getDocumentsByLoanApplication(id);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/loan-applications/:id/documents", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const loanApplicationId = parseInt(req.params.id);
      const category = req.body.category || 'other';

      const documentData = insertDocumentSchema.parse({
        loanApplicationId,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        category,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });

      const document = await storage.createDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to upload document" 
      });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDocument(id);
      if (!success) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const assignedToId = req.query.assignedTo ? parseInt(req.query.assignedTo as string) : 1;
      const tasks = await storage.getTasksByAssignee(assignedToId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Invalid task data" 
      });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.updateTask(id, req.body);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  // Pipeline data
  app.get("/api/pipeline", async (req, res) => {
    try {
      const applications = await storage.getAllLoanApplicationsWithDetails();
      
      // Group applications by status
      const pipeline = {
        application: applications.filter(app => app.status === 'application'),
        document_review: applications.filter(app => app.status === 'document_review'),
        underwriting: applications.filter(app => app.status === 'underwriting'),
        approved: applications.filter(app => app.status === 'approved'),
        declined: applications.filter(app => app.status === 'declined'),
      };

      res.json(pipeline);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pipeline data" });
    }
  });

  // Notifications
  app.get("/api/notifications", async (req, res) => {
    try {
      const { loanApplicationId } = req.query;
      if (loanApplicationId) {
        const notifications = await storage.getNotificationsByLoanApplication(Number(loanApplicationId));
        res.json(notifications);
      } else {
        // Get all notifications for dashboard/communications view
        const applications = await storage.getAllLoanApplicationsWithDetails();
        const allNotifications = [];
        for (const app of applications) {
          const notifications = await storage.getNotificationsByLoanApplication(app.id);
          allNotifications.push(...notifications);
        }
        // Sort by creation date, most recent first
        allNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        res.json(allNotifications);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const result = insertNotificationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid notification data", details: result.error.issues });
      }

      const notification = await storage.createNotification(result.data);
      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  // Templates
  app.get("/api/templates", async (req, res) => {
    try {
      const { type } = req.query;
      if (type) {
        const templates = await storage.getTemplatesByType(String(type));
        res.json(templates);
      } else {
        const templates = await storage.getAllTemplates();
        res.json(templates);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const result = insertTemplateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid template data", details: result.error.issues });
      }

      const template = await storage.createTemplate(result.data);
      res.status(201).json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  // Call Logs
  app.get("/api/call-logs", async (req, res) => {
    try {
      const { loanApplicationId, borrowerId } = req.query;
      if (loanApplicationId) {
        const callLogs = await storage.getCallLogsByLoanApplication(Number(loanApplicationId));
        res.json(callLogs);
      } else if (borrowerId) {
        const callLogs = await storage.getCallLogsByBorrower(Number(borrowerId));
        res.json(callLogs);
      } else {
        // Get all call logs for dashboard view
        const applications = await storage.getAllLoanApplicationsWithDetails();
        const allCallLogs = [];
        for (const app of applications) {
          const callLogs = await storage.getCallLogsByLoanApplication(app.id);
          allCallLogs.push(...callLogs);
        }
        // Sort by creation date, most recent first
        allCallLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        res.json(allCallLogs);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch call logs" });
    }
  });

  app.post("/api/call-logs", async (req, res) => {
    try {
      const result = insertCallLogSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid call log data", details: result.error.issues });
      }

      const callLog = await storage.createCallLog(result.data);
      res.status(201).json(callLog);
    } catch (error) {
      res.status(500).json({ error: "Failed to create call log" });
    }
  });

  // Short loan application endpoint
  app.post("/api/short-loan-applications", async (req, res) => {
    try {
      // Parse borrower name - could be individual or business entity
      const fullName = req.body.borrowerName || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || fullName;
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create borrower
      const borrowerData = insertBorrowerSchema.parse({
        firstName,
        lastName,
        email: req.body.email,
        phone: req.body.phone,
        company: fullName.includes('LLC') || fullName.includes('Inc') ? fullName : undefined,
      });
      const borrower = await storage.createBorrower(borrowerData);

      // Parse property address
      const addressParts = req.body.propertyAddress.split(',');
      const address = addressParts[0]?.trim() || req.body.propertyAddress;
      const city = addressParts[1]?.trim() || '';
      const stateZip = addressParts[2]?.trim() || '';
      const state = stateZip.split(' ')[0] || '';
      const zipCode = stateZip.split(' ')[1] || '';

      // Create property
      const propertyData = insertPropertySchema.parse({
        address,
        city,
        state,
        zipCode,
        propertyType: req.body.propertyType,
        propertyValue: req.body.estimatedValue,
        purchasePrice: req.body.purchasePrice || null,
      });
      const property = await storage.createProperty(propertyData);

      // Calculate basic LTV
      const requestedAmount = parseFloat(req.body.loanAmount.replace(/[$,]/g, ''));
      const propertyValue = parseFloat(req.body.estimatedValue.replace(/[$,]/g, ''));
      const ltv = propertyValue > 0 ? (requestedAmount / propertyValue) * 100 : 0;

      // Generate customer portal token
      const customerPortalToken = `portal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create loan application with initial intake data
      const applicationData = insertLoanApplicationSchema.parse({
        borrowerId: borrower.id,
        propertyId: property.id,
        loanOfficerId: 1,
        loanType: req.body.loanType,
        requestedAmount: requestedAmount.toString(),
        status: 'application',
        stage: 'initial_intake',
        ltv: ltv.toString(),
        initialIntakeData: req.body,
        customerPortalAccess: true,
        customerPortalToken,
        notes: `Exit Strategy: ${req.body.exitStrategy}\nExperience: ${req.body.isExperienced}\nCredit Score: ${req.body.creditScore}\nFlips: ${req.body.flipsCompleted}\nRentals: ${req.body.rentalsOwned}\nAdditional Info: ${req.body.additionalInfo || 'None'}`,
      });

      const application = await storage.createLoanApplication(applicationData);
      
      // Create initial task
      await storage.createTask({
        loanApplicationId: application.id,
        assignedToId: 1,
        title: "Review Short Application",
        description: `Initial review for ${borrower.firstName} ${borrower.lastName} - ${req.body.loanType} loan`,
        priority: "medium",
        status: "pending",
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day from now
      });

      // Create customer portal session
      await storage.createCustomerSession({
        borrowerId: borrower.id,
        loanApplicationId: application.id,
        sessionToken: customerPortalToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true
      });

      // Send welcome email with portal link
      await storage.createNotification({
        loanApplicationId: application.id,
        borrowerId: borrower.id,
        type: 'email',
        recipient: borrower.email,
        subject: 'Welcome to Your Loan Application Portal',
        message: `Thank you for starting your loan application. Access your portal here: ${process.env.APP_URL || 'http://localhost:5000'}/customer-portal?token=${customerPortalToken}`,
        status: 'sent'
      });

      const fullApplication = await storage.getLoanApplicationWithDetails(application.id);
      res.status(201).json({
        ...fullApplication,
        customerPortalUrl: `${process.env.APP_URL || 'http://localhost:5000'}/customer-portal?token=${customerPortalToken}`
      });
    } catch (error) {
      console.error("Error creating short loan application:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Invalid loan application data" 
      });
    }
  });

  // Full loan application endpoint (URLA)
  app.post("/api/full-loan-applications", async (req, res) => {
    try {
      const { loanApplicationId, ...urlaData } = req.body;
      
      // Update loan application with URLA data and stage
      const updatedApplication = await storage.updateLoanApplicationStage(
        loanApplicationId, 
        'full_application', 
        { urlaData }
      );

      // Create task for document collection
      await storage.createTask({
        loanApplicationId,
        assignedToId: 1,
        title: "Begin Document Collection",
        description: "Full application received - start document collection process",
        priority: "high",
        status: "pending",
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day from now
      });

      // Setup document reminders based on loan type
      const documentRequirements = await storage.getDocumentRequirements(updatedApplication.loanType);
      for (const req of documentRequirements) {
        if (req.isRequired) {
          // Schedule initial document reminder
          await storage.createDocumentReminder({
            loanApplicationId,
            documentCategory: req.category,
            reminderType: 'email',
            reminderNumber: 1,
            scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
            status: 'pending'
          });
        }
      }

      res.json(updatedApplication);
    } catch (error) {
      console.error("Error processing full loan application:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to process full application" 
      });
    }
  });

  // Customer Portal Routes
  app.get("/api/customer-portal/application", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({ message: "Token required" });
      }

      const session = await storage.getCustomerSession(String(token));
      if (!session || !session.isActive || new Date() > session.expiresAt) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      const application = await storage.getLoanApplicationWithDetails(session.loanApplicationId);
      const bankAccounts = await storage.getBankAccounts(session.borrowerId);

      res.json({
        ...application,
        bankAccounts
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch application data" });
    }
  });

  app.get("/api/customer-portal/documents", async (req, res) => {
    try {
      const { token } = req.query;
      const session = await storage.getCustomerSession(String(token));
      if (!session) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const documents = await storage.getDocumentsByLoanApplication(session.loanApplicationId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/customer-portal/document-requirements", async (req, res) => {
    try {
      const { token } = req.query;
      const session = await storage.getCustomerSession(String(token));
      if (!session) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const application = await storage.getLoanApplication(session.loanApplicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      const requirements = await storage.getDocumentRequirements(application.loanType);
      res.json(requirements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document requirements" });
    }
  });

  app.post("/api/customer-portal/upload-document", upload.single('file'), async (req, res) => {
    try {
      const { token, category } = req.body;
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const session = await storage.getCustomerSession(token);
      if (!session) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const documentData = insertDocumentSchema.parse({
        loanApplicationId: session.loanApplicationId,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        category,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        isRequired: true,
        isReceived: true,
        uploadedBy: 'borrower'
      });

      const document = await storage.createDocument(documentData);

      // Send notification to loan officer
      await storage.createNotification({
        loanApplicationId: session.loanApplicationId,
        borrowerId: session.borrowerId,
        type: 'email',
        recipient: 'loan.officer@company.com',
        subject: 'New Document Uploaded',
        message: `Borrower has uploaded ${req.file.originalname} for category: ${category}`,
        status: 'sent'
      });

      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ message: "Failed to upload document" });
    }
  });

  app.post("/api/customer-portal/connect-bank", async (req, res) => {
    try {
      const { token } = req.body;
      const session = await storage.getCustomerSession(token);
      if (!session) {
        return res.status(401).json({ message: "Invalid token" });
      }

      // In a real implementation, this would create a Plaid Link token
      // For now, we'll return a mock response
      res.json({
        linkUrl: `https://plaid.com/link?token=mock_token_${session.loanApplicationId}`,
        message: "Bank connection initiated"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to initiate bank connection" });
    }
  });

  // Marketing Automation & CRM Integration Routes
  
  // Webhook endpoint for marketing platforms
  app.post("/api/webhooks/:source", async (req, res) => {
    try {
      const source = req.params.source;
      const signature = req.headers['x-hub-signature-256'] || req.headers['x-signature'] || '';
      
      const webhookPayload: WebhookPayload = {
        source,
        data: req.body,
        timestamp: new Date().toISOString(),
        signature: signature as string,
        headers: req.headers as Record<string, string>
      };

      const result = await marketingIntegrations.processWebhook(webhookPayload);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // AI Loan Advisor Routes
  
  // Get loan recommendation
  app.post("/api/ai/loan-recommendation", async (req, res) => {
    try {
      const profile: BorrowerProfile = req.body;
      const recommendation = await aiLoanAdvisor.analyzeBorrowerAndRecommendLoan(profile);
      res.json(recommendation);
    } catch (error) {
      console.error("AI recommendation error:", error);
      res.status(500).json({ message: "Failed to generate loan recommendation" });
    }
  });

  // AI chat conversation
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, profile, context } = req.body;
      const response = await aiLoanAdvisor.generateConversationalResponse(message, profile, context);
      res.json({ response });
    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // AI market analysis
  app.post("/api/ai/market-analysis", async (req, res) => {
    try {
      const analysisRequest: MarketAnalysisRequest = req.body;
      const analysis = await aiMarketAnalyzer.analyzeMarket(analysisRequest);
      res.json(analysis);
    } catch (error) {
      console.error("AI market analysis error:", error);
      res.status(500).json({ message: "Failed to analyze market data" });
    }
  });

  // Address autocomplete using Google Places API
  app.get("/api/address-autocomplete", async (req, res) => {
    try {
      const { input } = req.query;
      if (!input || typeof input !== 'string') {
        return res.status(400).json({ message: "Input parameter required" });
      }

      const apiKey = process.env.GOOGLE_MAPS_API_KEY || "AIzaSyB_eOoP_huU27PjXO4LMQCnopqsGSLckBE";
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&key=${apiKey}`
      );
      
      const data = await response.json();
      
      if (data.predictions) {
        const suggestions = data.predictions.map((p: any) => p.description).slice(0, 5);
        res.json({ suggestions });
      } else {
        res.json({ suggestions: [] });
      }
    } catch (error) {
      console.error("Address autocomplete error:", error);
      res.status(500).json({ message: "Failed to fetch address suggestions" });
    }
  });

  // Property Data Routes
  
  // Get property data by address
  app.get("/api/property-data", async (req, res) => {
    try {
      const { address, searchType } = req.query;
      if (!address) {
        return res.status(400).json({ message: "Address parameter required" });
      }

      const searchMode = (searchType === 'building') ? 'building' : 'unit';
      const propertyData = await propertyDataService.getPropertyData(address as string, searchMode);
      if (!propertyData) {
        return res.status(404).json({ message: "Property data not found" });
      }

      res.json(propertyData);
    } catch (error) {
      console.error("Property data error:", error);
      res.status(500).json({ message: "Failed to fetch property data" });
    }
  });

  // Video tour generation endpoint
  app.post('/api/generate-video-tour', async (req, res) => {
    try {
      const { videoTourGenerator } = await import('./video-tour-generator.js');
      const tourRequest: PropertyVideoTourRequest = req.body;

      if (!tourRequest.propertyData || !tourRequest.tourStyle || !tourRequest.duration) {
        return res.status(400).json({ error: 'Property data, tour style, and duration are required' });
      }

      const videoTour = await videoTourGenerator.generateVideoTour(tourRequest);
      res.json(videoTour);
    } catch (error) {
      console.error('Video tour generation error:', error);
      res.status(500).json({ error: 'Failed to generate video tour' });
    }
  });

  // Generate video thumbnail endpoint
  app.post('/api/generate-thumbnail', async (req, res) => {
    try {
      const { videoTourGenerator } = await import('./video-tour-generator.js');
      const { prompt } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Thumbnail prompt is required' });
      }

      const thumbnail = await videoTourGenerator.generateVideoThumbnail(prompt);
      res.json(thumbnail);
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      res.status(500).json({ error: 'Failed to generate thumbnail' });
    }
  });

  // Property images endpoint
  app.get('/api/property-images', async (req, res) => {
    try {
      const { address, city, state, zipCode } = req.query;
      
      if (!address || !city || !state) {
        return res.status(400).json({ error: 'Address, city, and state are required' });
      }

      const images = await propertyImageService.getPropertyImages(
        address as string, 
        city as string, 
        state as string, 
        zipCode as string || ''
      );
      
      // Also get street view
      const streetViewUrl = await propertyImageService.getStreetViewImage(
        address as string,
        city as string,
        state as string
      );

      res.json({
        images,
        streetView: streetViewUrl
      });
    } catch (error) {
      console.error('Property images error:', error);
      res.status(500).json({ error: 'Failed to fetch property images' });
    }
  });

  // Profile endpoints
  app.get('/api/profile', async (req, res) => {
    try {
      // Mock profile data for now - replace with actual user session
      const mockProfile = {
        id: 1,
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@loandaddy.com',
        phone: '(555) 123-4567',
        nmlsId: '123456',
        realEstateLicense: 'CA-DRE-12345',
        licenseState: 'CA',
        bio: 'Experienced loan officer with 10+ years helping clients achieve their real estate dreams.',
        websiteEnabled: true,
        websiteTheme: 'professional',
        timeZone: 'America/Los_Angeles',
        permissions: ['loans.view', 'loans.create', 'contacts.view'],
        socialMediaLinks: {
          linkedin: 'https://linkedin.com/in/johnsmith',
          website: 'https://johnsmith.com'
        }
      };
      res.json(mockProfile);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  app.put('/api/profile', async (req, res) => {
    try {
      // Update profile logic would go here
      res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Team management endpoints
  app.get('/api/team-members', async (req, res) => {
    try {
      // Mock team data
      const mockTeam = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@loandaddy.com',
          phone: '(555) 123-4567',
          role: 'loan_officer',
          department: 'sales',
          title: 'Senior Loan Officer',
          nmlsId: '123456',
          status: 'active',
          maxLoanAmount: 1000000,
          baseSalary: 75000,
          commissionRate: 0.005,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      res.json(mockTeam);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch team members' });
    }
  });

  app.post('/api/team-members', async (req, res) => {
    try {
      // Add team member logic would go here
      const newMember = { id: Date.now(), ...req.body, createdAt: new Date().toISOString() };
      res.json(newMember);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add team member' });
    }
  });

  // Contacts endpoints
  app.get('/api/contacts', async (req, res) => {
    try {
      const contacts = await databaseStorage.getAllContacts();
      res.json(contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  });

  app.post('/api/contacts', async (req, res) => {
    try {
      const contactData = req.body;
      
      // Enhanced contact creation with LinkedIn enrichment
      if (contactData.email && !contactData.linkedInUrl) {
        try {
          const linkedInProfile = await linkedInIntegration.enrichContactWithLinkedIn(contactData.email);
          if (linkedInProfile) {
            contactData.linkedInUrl = linkedInProfile.publicProfileUrl;
            contactData.notes = (contactData.notes || '') + `\n\nLinkedIn Profile: ${linkedInProfile.headline}`;
            if (!contactData.company && linkedInProfile.experience.length > 0) {
              contactData.company = linkedInProfile.experience[0].company;
            }
            if (!contactData.title && linkedInProfile.experience.length > 0) {
              contactData.title = linkedInProfile.experience[0].title;
            }
          }
        } catch (enrichmentError) {
          console.log('LinkedIn enrichment failed, continuing without enrichment');
        }
      }

      // Create the contact in database
      const newContact = await databaseStorage.createContact(contactData);
      
      res.json(newContact);
    } catch (error) {
      console.error('Contact creation error:', error);
      res.status(500).json({ error: 'Failed to add contact' });
    }
  });

  // User stats endpoint for gamification
  app.get('/api/user-stats', async (req, res) => {
    try {
      const contacts = await databaseStorage.getAllContacts();
      const totalContacts = contacts.length;
      
      const stats = {
        totalContacts,
        contactsThisWeek: Math.floor(totalContacts * 0.1), // Mock data
        linkedInConnections: Math.floor(totalContacts * 0.3),
        emailsSent: Math.floor(totalContacts * 0.5),
        callsMade: Math.floor(totalContacts * 0.2),
        level: Math.floor(totalContacts / 10) + 1,
        totalPoints: totalContacts * 10,
        achievements: [],
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ error: 'Failed to fetch user stats' });
    }
  });

  // LinkedIn integration endpoints
  app.get('/api/linkedin/search', async (req, res) => {
    try {
      const { query, location, industry, currentCompany, title, limit = 25, offset = 0 } = req.query;
      
      // Mock LinkedIn search results for demo purposes
      const mockResults = [
        {
          id: 1,
          firstName: 'Alex',
          lastName: 'Thompson',
          headline: 'Senior Real Estate Agent at Premium Properties',
          currentPosition: {
            title: 'Senior Real Estate Agent',
            company: 'Premium Properties'
          },
          location: 'San Francisco, CA',
          connectionLevel: '2nd',
          profileUrl: 'https://linkedin.com/in/alexthompson',
        },
        {
          id: 2,
          firstName: 'Maria',
          lastName: 'Rodriguez',
          headline: 'Mortgage Loan Officer at First National Bank',
          currentPosition: {
            title: 'Mortgage Loan Officer',
            company: 'First National Bank'
          },
          location: 'Los Angeles, CA',
          connectionLevel: '3rd',
          profileUrl: 'https://linkedin.com/in/mariarodriguez',
        },
        {
          id: 3,
          firstName: 'James',
          lastName: 'Wilson',
          headline: 'Real Estate Investor & Property Developer',
          currentPosition: {
            title: 'CEO',
            company: 'Wilson Development Group'
          },
          location: 'Austin, TX',
          connectionLevel: 'Public',
          profileUrl: 'https://linkedin.com/in/jameswilson',
        },
        {
          id: 4,
          firstName: 'Jennifer',
          lastName: 'Lee',
          headline: 'Commercial Real Estate Broker at Lee & Associates',
          currentPosition: {
            title: 'Commercial Broker',
            company: 'Lee & Associates'
          },
          location: 'Seattle, WA',
          connectionLevel: '2nd',
          profileUrl: 'https://linkedin.com/in/jenniferlee',
        },
        {
          id: 5,
          firstName: 'Robert',
          lastName: 'Chen',
          headline: 'Real Estate Investment Analyst at Capital Partners',
          currentPosition: {
            title: 'Investment Analyst',
            company: 'Capital Partners'
          },
          location: 'New York, NY',
          connectionLevel: '3rd',
          profileUrl: 'https://linkedin.com/in/robertchen',
        },
      ];

      // For demo, return mock results filtered by query
      const filteredResults = mockResults.filter(profile => 
        !query || 
        profile.headline.toLowerCase().includes((query as string).toLowerCase()) ||
        profile.currentPosition.title.toLowerCase().includes((query as string).toLowerCase()) ||
        profile.currentPosition.company.toLowerCase().includes((query as string).toLowerCase())
      );

      res.json(filteredResults);
    } catch (error) {
      console.error('LinkedIn search error:', error);
      res.status(500).json({ error: 'Failed to search LinkedIn profiles' });
    }
  });

  app.post('/api/linkedin/import-bulk', async (req, res) => {
    try {
      const { profileIds } = req.body;
      
      // Mock import process - in real implementation, this would fetch full profiles and create contacts
      const importedContacts = [];
      
      for (const profileId of profileIds) {
        const mockContact = {
          firstName: `LinkedInUser${profileId}`,
          lastName: 'Imported',
          email: `user${profileId}@linkedin-import.com`,
          phone: `555-${String(profileId).padStart(3, '0')}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
          contactType: 'real_estate_agent',
          source: 'linkedin_import',
          company: 'LinkedIn Import Demo',
          title: 'Professional',
          linkedInUrl: `https://linkedin.com/in/user${profileId}`,
        };
        
        const newContact = await databaseStorage.createContact(mockContact);
        importedContacts.push(newContact);
      }
      
      res.json(importedContacts);
    } catch (error) {
      console.error('LinkedIn import error:', error);
      res.status(500).json({ error: 'Failed to import LinkedIn contacts' });
    }
  });

  app.post('/api/linkedin/import', async (req, res) => {
    try {
      const { profileId } = req.body;
      const profile = await linkedInIntegration.getProfile(profileId);
      
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const contactData = await linkedInIntegration.importProfileToContacts(profile);
      
      // Create the contact
      const newContact = { 
        id: Date.now(), 
        ...contactData, 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      res.json(newContact);
    } catch (error) {
      console.error('LinkedIn import error:', error);
      res.status(500).json({ error: 'Failed to import LinkedIn profile' });
    }
  });

  // AI Chatbot endpoints
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { sessionId, message, contactId } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const response = await aiChatbot.processMessage(sessionId, message, contactId);
      res.json(response);
    } catch (error) {
      console.error('AI chat error:', error);
      res.status(500).json({ error: 'Failed to process chat message' });
    }
  });

  app.get('/api/ai/chat/:sessionId/history', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const history = await aiChatbot.getChatHistory(sessionId);
      res.json(history);
    } catch (error) {
      console.error('Chat history error:', error);
      res.status(500).json({ error: 'Failed to get chat history' });
    }
  });

  app.post('/api/ai/chat/:sessionId/end', async (req, res) => {
    try {
      const { sessionId } = req.params;
      await aiChatbot.endSession(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error('End chat session error:', error);
      res.status(500).json({ error: 'Failed to end chat session' });
    }
  });

  // AI Voice Bot endpoints
  app.post('/api/ai/voice/call', async (req, res) => {
    try {
      const { contactId, phoneNumber, purpose = 'follow_up' } = req.body;
      
      if (!contactId || !phoneNumber) {
        return res.status(400).json({ error: 'Contact ID and phone number are required' });
      }

      const sessionId = await aiVoicebot.initiateCall(contactId, phoneNumber, purpose);
      res.json({ sessionId });
    } catch (error) {
      console.error('Voice call initiation error:', error);
      res.status(500).json({ error: 'Failed to initiate voice call' });
    }
  });

  app.post('/api/ai/voice/:sessionId/input', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { transcript } = req.body;
      
      if (!transcript) {
        return res.status(400).json({ error: 'Transcript is required' });
      }

      const response = await aiVoicebot.processVoiceInput(sessionId, transcript);
      res.json({ response });
    } catch (error) {
      console.error('Voice input processing error:', error);
      res.status(500).json({ error: 'Failed to process voice input' });
    }
  });

  app.post('/api/ai/voice/:sessionId/end', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const outcome = await aiVoicebot.endCall(sessionId);
      res.json(outcome);
    } catch (error) {
      console.error('End voice call error:', error);
      res.status(500).json({ error: 'Failed to end voice call' });
    }
  });

  app.get('/api/ai/voice/:sessionId/transcript', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const transcript = await aiVoicebot.getCallTranscript(sessionId);
      res.json(transcript);
    } catch (error) {
      console.error('Voice transcript error:', error);
      res.status(500).json({ error: 'Failed to get call transcript' });
    }
  });

  // Roles and permissions endpoints
  app.get('/api/roles', async (req, res) => {
    try {
      const mockRoles = [
        {
          id: 1,
          name: 'owner',
          displayName: 'Owner',
          description: 'Full system access',
          permissions: ['*'],
          isSystemRole: true,
          userCount: 1,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          name: 'loan_officer',
          displayName: 'Loan Officer',
          description: 'Standard loan officer permissions',
          permissions: ['loans.view', 'loans.create', 'contacts.view'],
          isSystemRole: true,
          userCount: 5,
          createdAt: new Date().toISOString()
        }
      ];
      res.json(mockRoles);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch roles' });
    }
  });

  app.post('/api/roles', async (req, res) => {
    try {
      const newRole = { id: Date.now(), ...req.body, createdAt: new Date().toISOString() };
      res.json(newRole);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create role' });
    }
  });

  app.get('/api/users', async (req, res) => {
    try {
      const mockUsers = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@loandaddy.com',
          role: 'owner',
          permissions: ['*'],
          isActive: true
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Doe', 
          email: 'jane@loandaddy.com',
          role: 'loan_officer',
          permissions: ['loans.view', 'loans.create'],
          isActive: true
        }
      ];
      res.json(mockUsers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.put('/api/users/:id', async (req, res) => {
    try {
      // Update user logic would go here
      res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // Get DSCR calculation for property
  app.get("/api/property-data/dscr", async (req, res) => {
    try {
      const { address } = req.query;
      if (!address) {
        return res.status(400).json({ message: "Address parameter required" });
      }

      const dscrData = await propertyDataService.getPropertyForDSCR(address as string);
      if (!dscrData) {
        return res.status(404).json({ message: "DSCR data not available" });
      }

      res.json(dscrData);
    } catch (error) {
      console.error("DSCR calculation error:", error);
      res.status(500).json({ message: "Failed to calculate DSCR" });
    }
  });

  // Loan Pricing Engine Routes
  
  // Get loan pricing
  app.post("/api/pricing/quote", async (req, res) => {
    try {
      const pricingRequest: PricingRequest = req.body;
      const pricing = await pricingEngine.getPricing(pricingRequest);
      res.json(pricing);
    } catch (error) {
      console.error("Pricing engine error:", error);
      res.status(500).json({ message: "Failed to generate pricing" });
    }
  });

  // Get rates by lender
  app.get("/api/pricing/lenders/:loanType", async (req, res) => {
    try {
      const { loanType } = req.params;
      const lenderRates = await pricingEngine.getRatesByLender(loanType);
      res.json(lenderRates);
    } catch (error) {
      console.error("Lender rates error:", error);
      res.status(500).json({ message: "Failed to fetch lender rates" });
    }
  });

  // Sync external rate sources
  app.post("/api/pricing/sync-rates", async (req, res) => {
    try {
      const { source } = req.body;
      let success = false;
      
      if (source === 'loansifter') {
        success = await pricingEngine.syncLoanSifterRates();
      } else if (source === 'lenderprice') {
        success = await pricingEngine.syncLenderPriceRates();
      } else {
        return res.status(400).json({ message: "Invalid rate source" });
      }
      
      res.json({ success, source });
    } catch (error) {
      console.error("Rate sync error:", error);
      res.status(500).json({ message: "Failed to sync rates" });
    }
  });

  // Social Media Enrichment endpoints
  app.post('/api/contacts/:id/enrich', async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const contact = await databaseStorage.getContact(contactId);
      
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      const enrichmentRequest = {
        contactId,
        email: contact.email || '',
        firstName: contact.firstName,
        lastName: contact.lastName,
        phone: contact.phone,
        company: contact.company || undefined
      };

      const enrichedData = await socialEnrichmentService.enrichContact(enrichmentRequest);
      res.json(enrichedData);
    } catch (error) {
      console.error('Contact enrichment error:', error);
      res.status(500).json({ error: 'Failed to enrich contact' });
    }
  });

  app.post('/api/contacts/batch-enrich', async (req, res) => {
    try {
      const { contactIds } = req.body;
      const contacts = await Promise.all(
        contactIds.map((id: number) => databaseStorage.getContact(id))
      );

      const enrichmentRequests = contacts
        .filter(contact => contact !== undefined)
        .map(contact => ({
          contactId: contact!.id,
          email: contact!.email,
          firstName: contact!.firstName,
          lastName: contact!.lastName,
          phone: contact!.phone,
          company: contact!.company
        }));

      const enrichedResults = await socialEnrichmentService.enrichMultipleContacts(enrichmentRequests);
      
      // Convert Map to object for JSON response
      const resultsObject = Object.fromEntries(enrichedResults);
      res.json(resultsObject);
    } catch (error) {
      console.error('Batch enrichment error:', error);
      res.status(500).json({ error: 'Failed to enrich contacts' });
    }
  });

  app.get('/api/contacts/:id/enrichment-suggestions', async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const contact = await databaseStorage.getContact(contactId);
      
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      const suggestions = socialEnrichment.getSuggestedEnrichments(contact);
      res.json({ suggestions });
    } catch (error) {
      console.error('Enrichment suggestions error:', error);
      res.status(500).json({ error: 'Failed to get enrichment suggestions' });
    }
  });

  // Contact recommendation system routes
  app.get('/api/contacts/recommendations', async (req, res) => {
    try {
      const filters = {
        category: req.query.category ? String(req.query.category).split(',') : undefined,
        minScore: req.query.minScore ? parseInt(String(req.query.minScore)) : undefined,
        maxResults: req.query.maxResults ? parseInt(String(req.query.maxResults)) : undefined,
        loanTypes: req.query.loanTypes ? String(req.query.loanTypes).split(',') : undefined,
        geography: req.query.geography ? String(req.query.geography).split(',') : undefined,
        priorityLevel: req.query.priorityLevel as 'high' | 'medium' | 'low' | undefined
      };
      
      const recommendations = await contactRecommendationService.getContactRecommendations(filters);
      res.json({ recommendations });
    } catch (error) {
      console.error('Contact recommendations error:', error);
      res.status(500).json({ error: 'Failed to get contact recommendations' });
    }
  });

  app.get('/api/contacts/:id/insights', async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const insights = await contactRecommendationService.getContactInsights(contactId);
      res.json({ insights });
    } catch (error) {
      console.error('Contact insights error:', error);
      res.status(500).json({ error: 'Failed to get contact insights' });
    }
  });

  app.get('/api/contacts/:id/follow-up-suggestions', async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const suggestions = await contactRecommendationService.getFollowUpSuggestions(contactId);
      res.json({ suggestions });
    } catch (error) {
      console.error('Follow-up suggestions error:', error);
      res.status(500).json({ error: 'Failed to get follow-up suggestions' });
    }
  });

  // Customer Authentication Routes
  app.post('/api/customer/signup', async (req, res) => {
    try {
      const result = await customerAuth.signup(req.body);
      
      // Set session cookie
      res.cookie('customer_session', result.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: 'strict'
      });

      res.json({
        success: true,
        customer: result.customer,
        message: 'Account created successfully'
      });
    } catch (error) {
      console.error('Customer signup error:', error);
      res.status(400).json({ 
        error: error.message,
        message: 'Failed to create account' 
      });
    }
  });

  app.post('/api/customer/login', async (req, res) => {
    try {
      const result = await customerAuth.login(req.body);
      
      // Set session cookie
      res.cookie('customer_session', result.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: 'strict'
      });

      res.json({
        success: true,
        customer: result.customer,
        message: 'Logged in successfully'
      });
    } catch (error) {
      console.error('Customer login error:', error);
      res.status(400).json({ 
        error: error.message,
        message: 'Failed to log in' 
      });
    }
  });

  app.post('/api/customer/logout', async (req, res) => {
    try {
      const sessionId = req.cookies.customer_session;
      
      if (sessionId) {
        await customerAuth.logout(sessionId);
      }
      
      res.clearCookie('customer_session');
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Customer logout error:', error);
      res.status(500).json({ 
        error: error.message,
        message: 'Failed to log out' 
      });
    }
  });

  app.get('/api/customer/profile', async (req, res) => {
    try {
      const sessionId = req.cookies.customer_session;
      
      if (!sessionId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const customer = await customerAuth.getCustomerBySession(sessionId);
      
      if (!customer) {
        res.clearCookie('customer_session');
        return res.status(401).json({ error: 'Session expired' });
      }

      res.json({
        success: true,
        customer
      });
    } catch (error) {
      console.error('Get customer profile error:', error);
      res.status(500).json({ 
        error: error.message,
        message: 'Failed to get profile' 
      });
    }
  });

  // Customer middleware for protected routes
  const customerAuthMiddleware = async (req: any, res: any, next: any) => {
    try {
      const sessionId = req.cookies.customer_session;
      
      if (!sessionId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const customer = await customerAuth.getCustomerBySession(sessionId);
      
      if (!customer) {
        res.clearCookie('customer_session');
        return res.status(401).json({ error: 'Session expired' });
      }

      req.customer = customer;
      next();
    } catch (error) {
      console.error('Customer auth middleware error:', error);
      res.status(500).json({ error: 'Authentication error' });
    }
  };

  // Customer loan application routes (protected)
  app.post('/api/customer/loan-applications', customerAuthMiddleware, async (req, res) => {
    try {
      const applicationNumber = `LA-${Date.now()}`;
      
      res.json({
        success: true,
        application: {
          id: Math.floor(Math.random() * 1000) + 1,
          applicationNumber,
          customerId: req.customer.id,
          status: 'draft',
          ...req.body,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        message: 'Loan application created successfully'
      });
    } catch (error) {
      console.error('Create loan application error:', error);
      res.status(400).json({ 
        error: error.message,
        message: 'Failed to create loan application' 
      });
    }
  });

  app.get('/api/customer/loan-applications', customerAuthMiddleware, async (req, res) => {
    try {
      res.json({
        success: true,
        applications: [],
        message: 'Loan applications retrieved successfully'
      });
    } catch (error) {
      console.error('Get loan applications error:', error);
      res.status(500).json({ 
        error: error.message,
        message: 'Failed to retrieve loan applications' 
      });
    }
  });

  // Document upload configuration
  const customerDocumentUpload = multer({
    dest: 'uploads/customer-documents/',
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 
                           'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PDF, images, and Word documents are allowed.'));
      }
    }
  });

  // Customer document upload routes (protected)
  app.post('/api/customer/documents/upload', customerAuthMiddleware, customerDocumentUpload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const { category, documentType, applicationId } = req.body;

      if (!category || !documentType) {
        return res.status(400).json({ error: 'Category and document type are required' });
      }

      const document = {
        id: Math.floor(Math.random() * 1000) + 1,
        customerId: req.customer.id,
        applicationId: applicationId ? parseInt(applicationId) : null,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        category,
        documentType,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        status: 'uploaded',
        uploadedAt: new Date(),
        createdAt: new Date()
      };

      res.json({
        success: true,
        document,
        message: 'Document uploaded successfully'
      });
    } catch (error) {
      console.error('Document upload error:', error);
      res.status(400).json({ 
        error: error.message,
        message: 'Failed to upload document' 
      });
    }
  });

  app.get('/api/customer/documents', customerAuthMiddleware, async (req, res) => {
    try {
      res.json({
        success: true,
        documents: [],
        message: 'Documents retrieved successfully'
      });
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({ 
        error: error.message,
        message: 'Failed to retrieve documents' 
      });
    }
  });

  // Get document requirements for loan type
  app.get('/api/customer/document-requirements/:loanType', async (req, res) => {
    try {
      const { loanType } = req.params;
      
      const requirements = {
        'dscr': [
          { category: 'income', documentType: 'tax_return', displayName: 'Tax Returns (2 years)', isRequired: true },
          { category: 'income', documentType: 'rent_roll', displayName: 'Current Rent Roll', isRequired: true },
          { category: 'bank_statements', documentType: 'bank_statement', displayName: 'Bank Statements (3 months)', isRequired: true },
          { category: 'property', documentType: 'property_appraisal', displayName: 'Property Appraisal', isRequired: false },
          { category: 'property', documentType: 'purchase_contract', displayName: 'Purchase Contract', isRequired: true }
        ],
        'fix-and-flip': [
          { category: 'income', documentType: 'tax_return', displayName: 'Tax Returns (2 years)', isRequired: true },
          { category: 'income', documentType: 'profit_loss', displayName: 'Profit & Loss Statement', isRequired: true },
          { category: 'bank_statements', documentType: 'bank_statement', displayName: 'Bank Statements (3 months)', isRequired: true },
          { category: 'property', documentType: 'purchase_contract', displayName: 'Purchase Contract', isRequired: true },
          { category: 'property', documentType: 'rehab_budget', displayName: 'Rehab Budget & Plans', isRequired: true },
          { category: 'property', documentType: 'arv_analysis', displayName: 'After Repair Value Analysis', isRequired: true }
        ],
        'bridge': [
          { category: 'income', documentType: 'tax_return', displayName: 'Tax Returns (2 years)', isRequired: true },
          { category: 'bank_statements', documentType: 'bank_statement', displayName: 'Bank Statements (3 months)', isRequired: true },
          { category: 'property', documentType: 'purchase_contract', displayName: 'Purchase Contract', isRequired: true },
          { category: 'property', documentType: 'exit_strategy', displayName: 'Exit Strategy Documentation', isRequired: true }
        ],
        'commercial': [
          { category: 'income', documentType: 'tax_return', displayName: 'Tax Returns (3 years)', isRequired: true },
          { category: 'income', documentType: 'financial_statement', displayName: 'Financial Statements', isRequired: true },
          { category: 'bank_statements', documentType: 'bank_statement', displayName: 'Bank Statements (6 months)', isRequired: true },
          { category: 'property', documentType: 'property_appraisal', displayName: 'Property Appraisal', isRequired: true },
          { category: 'property', documentType: 'operating_statement', displayName: 'Property Operating Statements', isRequired: true },
          { category: 'property', documentType: 'lease_agreements', displayName: 'Lease Agreements', isRequired: true }
        ]
      };

      res.json({
        success: true,
        requirements: requirements[loanType] || [],
        message: 'Document requirements retrieved successfully'
      });
    } catch (error) {
      console.error('Get document requirements error:', error);
      res.status(500).json({ 
        error: error.message,
        message: 'Failed to retrieve document requirements' 
      });
    }
  });

  // LinkedIn Integration Routes
  app.post("/api/linkedin/search", async (req, res) => {
    try {
      const { query, filters } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query parameter is required and must be a string' });
      }
      
      const searchResults = await linkedInIntegration.searchLinkedInProfiles(query, filters);
      res.json({
        success: true,
        data: searchResults,
        message: `Found ${searchResults.profiles.length} LinkedIn profiles`
      });
    } catch (error) {
      console.error('LinkedIn search error:', error);
      res.status(500).json({ error: 'Failed to search LinkedIn profiles', details: error.message });
    }
  });

  app.post("/api/linkedin/enrich", async (req, res) => {
    try {
      const { linkedinUrl } = req.body;
      if (!linkedinUrl || typeof linkedinUrl !== 'string') {
        return res.status(400).json({ error: 'LinkedIn URL is required and must be a string' });
      }
      
      const enrichedData = await linkedInIntegration.enrichContactData(linkedinUrl);
      res.json({
        success: true,
        data: enrichedData,
        message: `Successfully enriched contact data with ${enrichedData.confidence}% confidence`
      });
    } catch (error) {
      console.error('Contact enrichment error:', error);
      res.status(500).json({ error: 'Failed to enrich contact data', details: error.message });
    }
  });

  app.post("/api/linkedin/import", async (req, res) => {
    try {
      const { enrichedData } = req.body;
      if (!enrichedData || !enrichedData.linkedinProfile) {
        return res.status(400).json({ error: 'Enriched contact data is required' });
      }
      
      const importResult = await linkedInIntegration.importContactToSystem(enrichedData);
      if (importResult.success) {
        res.json({
          success: true,
          data: importResult,
          message: importResult.message
        });
      } else {
        res.status(500).json({ error: 'Failed to import contact', details: importResult.message });
      }
    } catch (error) {
      console.error('Contact import error:', error);
      res.status(500).json({ error: 'Failed to import contact', details: error.message });
    }
  });

  app.post("/api/linkedin/quick-import", async (req, res) => {
    try {
      const { linkedinUrl, autoImport = true } = req.body;
      if (!linkedinUrl || typeof linkedinUrl !== 'string') {
        return res.status(400).json({ error: 'LinkedIn URL is required and must be a string' });
      }
      
      const enrichedData = await linkedInIntegration.enrichContactData(linkedinUrl);
      let importResult = null;
      
      if (autoImport) {
        importResult = await linkedInIntegration.importContactToSystem(enrichedData);
      }
      
      res.json({
        success: true,
        data: { enrichedData, importResult, processed: true },
        message: autoImport 
          ? `Successfully enriched and imported ${enrichedData.linkedinProfile.name}`
          : `Successfully enriched ${enrichedData.linkedinProfile.name}`
      });
    } catch (error) {
      console.error('Quick enrich and import error:', error);
      res.status(500).json({ error: 'Failed to enrich and import contact', details: error.message });
    }
  });

  app.post("/api/linkedin/batch-enrich", async (req, res) => {
    try {
      const { linkedinUrls } = req.body;
      if (!Array.isArray(linkedinUrls) || linkedinUrls.length === 0) {
        return res.status(400).json({ error: 'LinkedIn URLs array is required and must not be empty' });
      }
      
      const batchResults = await linkedInIntegration.batchEnrichContacts(linkedinUrls);
      const successCount = batchResults.filter(r => r.success).length;
      const failCount = batchResults.filter(r => !r.success).length;
      
      res.json({
        success: true,
        data: {
          results: batchResults,
          summary: {
            total: batchResults.length,
            successful: successCount,
            failed: failCount,
            successRate: (successCount / batchResults.length) * 100
          }
        },
        message: `Batch enrichment completed: ${successCount} successful, ${failCount} failed`
      });
    } catch (error) {
      console.error('Batch enrichment error:', error);
      res.status(500).json({ error: 'Failed to perform batch enrichment', details: error.message });
    }
  });

  app.get("/api/linkedin/status", async (req, res) => {
    try {
      const status = await linkedInIntegration.getEnrichmentStatus();
      res.json({
        success: true,
        data: status,
        message: 'Enrichment status retrieved successfully'
      });
    } catch (error) {
      console.error('Status retrieval error:', error);
      res.status(500).json({ error: 'Failed to retrieve enrichment status', details: error.message });
    }
  });

  // Mount AI routes
  app.use(aiRoutes);
  
  // No public website routes here - they will be handled by vite.ts
  
  const httpServer = createServer(app);
  return httpServer;
}
