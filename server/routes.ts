import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertBorrowerSchema, 
  insertPropertySchema, 
  insertLoanApplicationSchema,
  insertDocumentSchema,
  insertTaskSchema
} from "@shared/schema";
import multer from "multer";
import path from "path";

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

  const httpServer = createServer(app);
  return httpServer;
}
