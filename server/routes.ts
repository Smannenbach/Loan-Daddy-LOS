import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";

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

  const httpServer = createServer(app);
  return httpServer;
}
