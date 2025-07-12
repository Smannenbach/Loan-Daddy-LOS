import { Router } from 'express';
import { autonomousAIAdvisor } from './autonomous-ai-advisor';
import { aiDocumentProcessor } from './ai-document-processor';
import { propertyDataService } from './property-data-service';
import { db } from './db';
import { documents, borrowers, loanApplications } from '../shared/schema';
import { eq } from 'drizzle-orm';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Start conversation with AI advisor
router.post('/start-conversation', async (req, res) => {
  try {
    const { channel = 'web' } = req.body;
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const greeting = await autonomousAIAdvisor.startConversation(sessionId, channel);
    
    res.json({
      sessionId,
      message: greeting,
      stage: 'greeting'
    });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({ error: 'Failed to start conversation' });
  }
});

// Process message from borrower
router.post('/process-message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'Session ID and message are required' });
    }
    
    const result = await autonomousAIAdvisor.processMessage(sessionId, message);
    
    // Execute any actions
    for (const action of result.actions) {
      switch (action.type) {
        case 'create_application':
          const applicationId = await autonomousAIAdvisor.createLoanApplication(sessionId);
          result.response += `\n\nGreat news! I've created your loan application (ID: ${applicationId}). `;
          break;
          
        case 'verify_data':
          if (action.data.verificationType === 'credit') {
            // Simulate credit check
            const creditData = {
              score: 720 + Math.floor(Math.random() * 80),
              dti: 0.25 + Math.random() * 0.15
            };
            await autonomousAIAdvisor.performDataExtraction('credit_bureau', creditData);
            result.response += `\n\nI've checked your credit: Score ${creditData.score}. `;
          }
          break;
          
        case 'calculate_loan':
          const loanOptions = [
            { type: 'Conventional 30-year', rate: 6.75, payment: 2597 },
            { type: 'FHA 30-year', rate: 6.25, payment: 2465 },
            { type: 'VA 30-year', rate: 6.00, payment: 2398 }
          ];
          result.response += '\n\nBased on your information, here are your loan options:';
          loanOptions.forEach(option => {
            result.response += `\n- ${option.type}: ${option.rate}% rate, $${option.payment}/month`;
          });
          break;
      }
    }
    
    res.json(result);
  } catch (error) {
    console.error('Process message error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Upload and process documents
router.post('/upload-document', upload.single('document'), async (req, res) => {
  try {
    const { sessionId, documentType } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Process document with AI
    const analysis = await aiDocumentProcessor.processDocument(1, file.path);
    
    // Store document record
    const [document] = await db.insert(documents).values({
      loanApplicationId: 1, // This should come from session
      documentType: documentType || 'other',
      fileName: file.filename,
      filePath: file.path,
      uploadedAt: new Date()
    }).returning();
    
    res.json({
      documentId: document.id,
      analysis,
      message: `Document uploaded successfully. ${analysis.extractedData ? 'I\'ve extracted the information and added it to your application.' : ''}`
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Get property data
router.post('/analyze-property', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Property address is required' });
    }
    
    const propertyData = await propertyDataService.getPropertyData(address);
    
    // Extract relevant data for loan application
    const extractedData = await autonomousAIAdvisor.performDataExtraction('property_data', {
      estimatedValue: propertyData.estimatedValue,
      annualTax: propertyData.taxInfo?.annualTax || 0,
      propertyType: propertyData.propertyType,
      yearBuilt: propertyData.yearBuilt
    });
    
    res.json({
      propertyData,
      extractedData,
      message: `I found the property! Estimated value: $${propertyData.estimatedValue?.toLocaleString()}. This will help me calculate your loan options.`
    });
  } catch (error) {
    console.error('Property analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze property' });
  }
});

// Perform underwriting
router.post('/perform-underwriting', async (req, res) => {
  try {
    const { applicationId } = req.body;
    
    if (!applicationId) {
      return res.status(400).json({ error: 'Application ID is required' });
    }
    
    const result = await autonomousAIAdvisor.performUnderwriting(applicationId);
    
    // Update application status
    await db.update(loanApplications)
      .set({
        status: result.approved ? 'approved' : 'declined',
        interestRate: result.rate,
        updatedAt: new Date()
      })
      .where(eq(loanApplications.id, applicationId));
    
    res.json({
      ...result,
      message: result.approved 
        ? `Congratulations! Your loan has been approved at ${result.rate}% interest rate.`
        : `I'm sorry, but we're unable to approve your loan at this time. Reasons: ${result.reasons.join(', ')}`
    });
  } catch (error) {
    console.error('Underwriting error:', error);
    res.status(500).json({ error: 'Failed to perform underwriting' });
  }
});

// Get session analytics
router.get('/session-analytics/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const analytics = await autonomousAIAdvisor.getSessionAnalytics(sessionId);
    
    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to get session analytics' });
  }
});

// Get all active sessions (for loan officer dashboard)
router.get('/active-sessions', async (req, res) => {
  try {
    // This would typically filter by organization/user
    const sessions = []; // Placeholder - would get from database
    
    res.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get active sessions' });
  }
});

// Multi-channel webhook endpoints
router.post('/webhook/sms', async (req, res) => {
  try {
    const { From, Body } = req.body; // Twilio format
    const sessionId = `sms-${From}`;
    
    const result = await autonomousAIAdvisor.processMessage(sessionId, Body);
    
    res.set('Content-Type', 'text/xml');
    res.send(`
      <Response>
        <Message>${result.response}</Message>
      </Response>
    `);
  } catch (error) {
    console.error('SMS webhook error:', error);
    res.status(500).send('<Response><Message>Error processing message</Message></Response>');
  }
});

router.post('/webhook/email', async (req, res) => {
  try {
    const { from, subject, text } = req.body;
    const sessionId = `email-${from}`;
    
    const result = await autonomousAIAdvisor.processMessage(sessionId, text);
    
    // Queue email response (would integrate with SendGrid/similar)
    res.json({ 
      queued: true,
      response: result.response 
    });
  } catch (error) {
    console.error('Email webhook error:', error);
    res.status(500).json({ error: 'Failed to process email' });
  }
});

export default router;