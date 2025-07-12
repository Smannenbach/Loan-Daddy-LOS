import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from './db';
import { documents } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { authenticateBorrower } from './borrower-auth';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const borrowerId = (req as any).borrower?.id;
    if (!borrowerId) {
      return cb(new Error('No borrower ID found'), '');
    }
    
    const uploadDir = path.join('uploads', 'borrowers', borrowerId.toString());
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG, DOC, and DOCX files are allowed.'));
    }
  }
});

// Upload document endpoint
router.post('/upload', authenticateBorrower, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const borrowerId = (req as any).borrower.id;
    const { documentType, description } = req.body;
    
    // Save document record to database
    const [document] = await db.insert(documents).values({
      name: req.file.originalname,
      type: documentType || 'general',
      filePath: req.file.path,
      uploadedBy: borrowerId,
      uploadedAt: new Date(),
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      status: 'pending_review',
      description
    }).returning();
    
    res.json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        id: document.id,
        name: document.name,
        type: document.type,
        uploadedAt: document.uploadedAt,
        status: document.status
      }
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload document' });
  }
});

// Get borrower's documents
router.get('/documents', authenticateBorrower, async (req, res) => {
  try {
    const borrowerId = (req as any).borrower.id;
    
    const borrowerDocuments = await db
      .select()
      .from(documents)
      .where(eq(documents.uploadedBy, borrowerId))
      .orderBy(documents.uploadedAt);
    
    res.json({
      documents: borrowerDocuments.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        uploadedAt: doc.uploadedAt,
        status: doc.status,
        fileSize: doc.fileSize,
        description: doc.description
      }))
    });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Delete document
router.delete('/documents/:id', authenticateBorrower, async (req, res) => {
  try {
    const borrowerId = (req as any).borrower.id;
    const documentId = parseInt(req.params.id);
    
    // Verify document belongs to borrower
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);
    
    if (!document || document.uploadedBy !== borrowerId) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Delete file from filesystem
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }
    
    // Delete from database
    await db.delete(documents).where(eq(documents.id, documentId));
    
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Get required documents for loan type
router.get('/required-documents/:loanType', authenticateBorrower, async (req, res) => {
  const { loanType } = req.params;
  
  const requiredDocuments = {
    'DSCR': [
      { type: 'tax_returns', name: 'Tax Returns (2 years)', required: true },
      { type: 'bank_statements', name: 'Bank Statements (3 months)', required: true },
      { type: 'rent_roll', name: 'Rent Roll', required: true },
      { type: 'property_insurance', name: 'Property Insurance', required: true },
      { type: 'entity_docs', name: 'Entity Formation Documents', required: false }
    ],
    'Fix-and-Flip': [
      { type: 'bank_statements', name: 'Bank Statements (3 months)', required: true },
      { type: 'proof_of_funds', name: 'Proof of Funds', required: true },
      { type: 'contractor_bid', name: 'Contractor Bid/Scope of Work', required: true },
      { type: 'purchase_contract', name: 'Purchase Contract', required: false }
    ],
    'Bridge': [
      { type: 'bank_statements', name: 'Bank Statements (3 months)', required: true },
      { type: 'property_appraisal', name: 'Property Appraisal', required: false },
      { type: 'exit_strategy', name: 'Exit Strategy Documentation', required: true }
    ],
    'Commercial': [
      { type: 'tax_returns', name: 'Business Tax Returns (2 years)', required: true },
      { type: 'financial_statements', name: 'Financial Statements', required: true },
      { type: 'business_plan', name: 'Business Plan', required: false },
      { type: 'lease_agreements', name: 'Lease Agreements', required: true }
    ]
  };
  
  res.json({
    loanType,
    requiredDocuments: requiredDocuments[loanType] || []
  });
});

export default router;