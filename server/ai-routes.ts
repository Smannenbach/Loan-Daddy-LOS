import { Router } from 'express';
import { aiDocumentProcessor } from './ai-document-processor';
import { aiChatbot } from './ai-chatbot';
import { aiVoicebot } from './ai-voicebot';
import { socialEnrichment } from './social-enrichment';
import { crmIntegrations } from './crm-integrations';
import { paymentProcessor } from './payment-processor';
import { videoGenerator } from './video-generator';
import { blockchainService } from './blockchain-service';
import { advancedAnalytics } from './advanced-analytics';
import { propertyTaxService } from './property-tax-service';
import multer from 'multer';
import { nanoid } from 'nanoid';
import { join } from 'path';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/documents/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

// AI Document Processing Routes
router.post('/ai/documents/process', upload.single('document'), async (req, res) => {
  try {
    const { documentId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const analysis = await aiDocumentProcessor.processDocument(
      parseInt(documentId),
      file.path
    );

    res.json({
      success: true,
      analysis,
      message: 'Document processed successfully'
    });
  } catch (error) {
    console.error('Document processing error:', error);
    res.status(500).json({ 
      error: 'Document processing failed',
      message: error.message 
    });
  }
});

router.post('/ai/documents/batch-process', async (req, res) => {
  try {
    const { documentIds } = req.body;

    if (!Array.isArray(documentIds)) {
      return res.status(400).json({ error: 'documentIds must be an array' });
    }

    const results = await aiDocumentProcessor.batchProcessDocuments(documentIds);

    res.json({
      success: true,
      results,
      message: 'Batch processing completed'
    });
  } catch (error) {
    console.error('Batch processing error:', error);
    res.status(500).json({ 
      error: 'Batch processing failed',
      message: error.message 
    });
  }
});

router.post('/ai/documents/summary', async (req, res) => {
  try {
    const { documentIds } = req.body;

    if (!Array.isArray(documentIds)) {
      return res.status(400).json({ error: 'documentIds must be an array' });
    }

    const summary = await aiDocumentProcessor.generateDocumentSummary(documentIds);

    res.json({
      success: true,
      summary,
      message: 'Document summary generated'
    });
  } catch (error) {
    console.error('Document summary error:', error);
    res.status(500).json({ 
      error: 'Document summary generation failed',
      message: error.message 
    });
  }
});

// AI Chatbot Routes
router.post('/ai/chat/message', async (req, res) => {
  try {
    const { sessionId, message, contactId } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }

    const response = await aiChatbot.processMessage(sessionId, message, contactId);

    res.json({
      success: true,
      response,
      message: 'Message processed successfully'
    });
  } catch (error) {
    console.error('Chat processing error:', error);
    res.status(500).json({ 
      error: 'Chat processing failed',
      message: error.message 
    });
  }
});

router.get('/ai/chat/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = await aiChatbot.getChatHistory(sessionId);

    res.json({
      success: true,
      history,
      message: 'Chat history retrieved'
    });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve chat history',
      message: error.message 
    });
  }
});

router.post('/ai/chat/summarize', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const summary = await aiChatbot.summarizeSession(sessionId);

    res.json({
      success: true,
      summary,
      message: 'Session summarized successfully'
    });
  } catch (error) {
    console.error('Session summary error:', error);
    res.status(500).json({ 
      error: 'Session summarization failed',
      message: error.message 
    });
  }
});

router.post('/ai/chat/end-session', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    await aiChatbot.endSession(sessionId);

    res.json({
      success: true,
      message: 'Session ended successfully'
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ 
      error: 'Failed to end session',
      message: error.message 
    });
  }
});

// Payment Processing Routes
router.post('/ai/payments/create-intent', async (req, res) => {
  try {
    const { amount, currency, loanApplicationId, borrowerId, description, feeTypes } = req.body;

    if (!amount || !currency || !description) {
      return res.status(400).json({ error: 'amount, currency, and description are required' });
    }

    const paymentIntent = await paymentProcessor.createPaymentIntent({
      amount,
      currency,
      loanApplicationId,
      borrowerId,
      description,
      feeTypes: feeTypes || []
    });

    res.json({
      success: true,
      paymentIntent,
      message: 'Payment intent created successfully'
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ 
      error: 'Payment intent creation failed',
      message: error.message 
    });
  }
});

router.post('/ai/payments/calculate-loan', async (req, res) => {
  try {
    const { principal, interestRate, termYears, paymentFrequency } = req.body;

    if (!principal || !interestRate || !termYears || !paymentFrequency) {
      return res.status(400).json({ error: 'All loan parameters are required' });
    }

    const calculation = await paymentProcessor.calculateLoanPayment({
      principal,
      interestRate,
      termYears,
      paymentFrequency
    });

    res.json({
      success: true,
      calculation,
      message: 'Loan calculation completed'
    });
  } catch (error) {
    console.error('Loan calculation error:', error);
    res.status(500).json({ 
      error: 'Loan calculation failed',
      message: error.message 
    });
  }
});

// Video Generation Routes
router.post('/ai/video/generate', async (req, res) => {
  try {
    const { 
      type, 
      propertyId, 
      loanApplicationId, 
      borrowerId, 
      customPrompt,
      style,
      duration,
      voiceOver,
      music,
      branding
    } = req.body;

    if (!type || !style || !duration) {
      return res.status(400).json({ error: 'type, style, and duration are required' });
    }

    const project = await videoGenerator.generateVideo({
      type,
      propertyId,
      loanApplicationId,
      borrowerId,
      customPrompt,
      style,
      duration,
      voiceOver: voiceOver || false,
      music: music || false,
      branding: branding || false
    });

    res.json({
      success: true,
      project,
      message: 'Video generation started'
    });
  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({ 
      error: 'Video generation failed',
      message: error.message 
    });
  }
});

router.get('/ai/video/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await videoGenerator.getProject(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      success: true,
      project,
      message: 'Project retrieved successfully'
    });
  } catch (error) {
    console.error('Project retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve project',
      message: error.message 
    });
  }
});

router.get('/ai/video/projects', async (req, res) => {
  try {
    const projects = await videoGenerator.getAllProjects();

    res.json({
      success: true,
      projects,
      message: 'Projects retrieved successfully'
    });
  } catch (error) {
    console.error('Projects retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve projects',
      message: error.message 
    });
  }
});

router.post('/ai/video/subtitles', async (req, res) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const subtitles = await videoGenerator.generateVideoSubtitles(projectId);

    res.json({
      success: true,
      subtitles,
      message: 'Subtitles generated successfully'
    });
  } catch (error) {
    console.error('Subtitles generation error:', error);
    res.status(500).json({ 
      error: 'Subtitles generation failed',
      message: error.message 
    });
  }
});

// Blockchain Routes
router.post('/ai/blockchain/record-transaction', async (req, res) => {
  try {
    const { documentId, loanApplicationId, action, validator, metadata } = req.body;

    if (!documentId || !loanApplicationId || !action || !validator) {
      return res.status(400).json({ error: 'documentId, loanApplicationId, action, and validator are required' });
    }

    const transaction = await blockchainService.recordDocumentTransaction({
      documentId,
      loanApplicationId,
      action,
      validator,
      metadata
    });

    res.json({
      success: true,
      transaction,
      message: 'Transaction recorded successfully'
    });
  } catch (error) {
    console.error('Blockchain transaction error:', error);
    res.status(500).json({ 
      error: 'Blockchain transaction failed',
      message: error.message 
    });
  }
});

router.get('/ai/blockchain/verify/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const verification = await blockchainService.verifyDocumentIntegrity(parseInt(documentId));

    res.json({
      success: true,
      verification,
      message: 'Document verification completed'
    });
  } catch (error) {
    console.error('Document verification error:', error);
    res.status(500).json({ 
      error: 'Document verification failed',
      message: error.message 
    });
  }
});

router.post('/ai/blockchain/certificate', async (req, res) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'documentId is required' });
    }

    const certificate = await blockchainService.generateDocumentCertificate(documentId);

    res.json({
      success: true,
      certificate,
      message: 'Certificate generated successfully'
    });
  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({ 
      error: 'Certificate generation failed',
      message: error.message 
    });
  }
});

router.get('/ai/blockchain/stats', async (req, res) => {
  try {
    const stats = await blockchainService.getBlockchainStats();

    res.json({
      success: true,
      stats,
      message: 'Blockchain stats retrieved'
    });
  } catch (error) {
    console.error('Blockchain stats error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve blockchain stats',
      message: error.message 
    });
  }
});

router.post('/ai/blockchain/audit', async (req, res) => {
  try {
    const auditResult = await blockchainService.auditBlockchain();

    res.json({
      success: true,
      auditResult,
      message: 'Blockchain audit completed'
    });
  } catch (error) {
    console.error('Blockchain audit error:', error);
    res.status(500).json({ 
      error: 'Blockchain audit failed',
      message: error.message 
    });
  }
});

// Advanced Analytics Routes
router.post('/ai/analytics/query', async (req, res) => {
  try {
    const { metrics, dimensions, filters, timeRange, groupBy, orderBy, limit } = req.body;

    if (!metrics || !dimensions || !timeRange) {
      return res.status(400).json({ error: 'metrics, dimensions, and timeRange are required' });
    }

    const result = await advancedAnalytics.executeQuery({
      metrics,
      dimensions,
      filters: filters || {},
      timeRange,
      groupBy,
      orderBy,
      limit
    });

    res.json({
      success: true,
      result,
      message: 'Analytics query executed successfully'
    });
  } catch (error) {
    console.error('Analytics query error:', error);
    res.status(500).json({ 
      error: 'Analytics query failed',
      message: error.message 
    });
  }
});

router.get('/ai/analytics/business-intelligence', async (req, res) => {
  try {
    const bi = await advancedAnalytics.generateBusinessIntelligence();

    res.json({
      success: true,
      businessIntelligence: bi,
      message: 'Business intelligence generated successfully'
    });
  } catch (error) {
    console.error('Business intelligence error:', error);
    res.status(500).json({ 
      error: 'Business intelligence generation failed',
      message: error.message 
    });
  }
});

router.post('/ai/analytics/predictive-model', async (req, res) => {
  try {
    const { name, type, features, target, trainingData } = req.body;

    if (!name || !type || !features || !target || !trainingData) {
      return res.status(400).json({ error: 'All model parameters are required' });
    }

    const model = await advancedAnalytics.createPredictiveModel({
      name,
      type,
      features,
      target,
      trainingData
    });

    res.json({
      success: true,
      model,
      message: 'Predictive model created successfully'
    });
  } catch (error) {
    console.error('Predictive model error:', error);
    res.status(500).json({ 
      error: 'Predictive model creation failed',
      message: error.message 
    });
  }
});

router.post('/ai/analytics/predict', async (req, res) => {
  try {
    const { modelId, input } = req.body;

    if (!modelId || !input) {
      return res.status(400).json({ error: 'modelId and input are required' });
    }

    const prediction = await advancedAnalytics.makePrediction(modelId, input);

    res.json({
      success: true,
      prediction,
      message: 'Prediction generated successfully'
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ 
      error: 'Prediction failed',
      message: error.message 
    });
  }
});

router.get('/ai/analytics/export/:format', async (req, res) => {
  try {
    const { format } = req.params;

    if (!['csv', 'json', 'xlsx'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Use csv, json, or xlsx' });
    }

    const exportData = await advancedAnalytics.exportAnalytics(format as 'csv' | 'json' | 'xlsx');

    res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=analytics_export.${format}`);
    res.send(exportData);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ 
      error: 'Export failed',
      message: error.message 
    });
  }
});

// AI Voicebot Routes
router.post('/ai/voice/initiate-call', async (req, res) => {
  try {
    const { contactId, phoneNumber, purpose } = req.body;

    if (!contactId || !phoneNumber) {
      return res.status(400).json({ error: 'contactId and phoneNumber are required' });
    }

    const sessionId = await aiVoicebot.initiateCall(contactId, phoneNumber, purpose);

    res.json({
      success: true,
      sessionId,
      message: 'Voice call initiated successfully'
    });
  } catch (error) {
    console.error('Voice call initiation error:', error);
    res.status(500).json({ 
      error: 'Voice call initiation failed',
      message: error.message 
    });
  }
});

router.post('/ai/voice/process-input', async (req, res) => {
  try {
    const { sessionId, transcript } = req.body;

    if (!sessionId || !transcript) {
      return res.status(400).json({ error: 'sessionId and transcript are required' });
    }

    const response = await aiVoicebot.processVoiceInput(sessionId, transcript);

    res.json({
      success: true,
      response,
      message: 'Voice input processed successfully'
    });
  } catch (error) {
    console.error('Voice input processing error:', error);
    res.status(500).json({ 
      error: 'Voice input processing failed',
      message: error.message 
    });
  }
});

router.post('/ai/voice/end-call', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const outcome = await aiVoicebot.endCall(sessionId);

    res.json({
      success: true,
      outcome,
      message: 'Call ended successfully'
    });
  } catch (error) {
    console.error('Call ending error:', error);
    res.status(500).json({ 
      error: 'Call ending failed',
      message: error.message 
    });
  }
});

router.get('/ai/voice/transcript/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const transcript = await aiVoicebot.getCallTranscript(sessionId);

    res.json({
      success: true,
      transcript,
      message: 'Call transcript retrieved successfully'
    });
  } catch (error) {
    console.error('Transcript retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve transcript',
      message: error.message 
    });
  }
});

router.post('/ai/voice/outbound-call', async (req, res) => {
  try {
    const { contactId, phoneNumber, script } = req.body;

    if (!contactId || !phoneNumber || !script) {
      return res.status(400).json({ error: 'contactId, phoneNumber, and script are required' });
    }

    const sessionId = await aiVoicebot.makeOutboundCall(contactId, phoneNumber, script);

    res.json({
      success: true,
      sessionId,
      message: 'Outbound call initiated successfully'
    });
  } catch (error) {
    console.error('Outbound call error:', error);
    res.status(500).json({ 
      error: 'Outbound call failed',
      message: error.message 
    });
  }
});

// CRM Integration Routes
router.post('/ai/crm/contacts', async (req, res) => {
  try {
    const contactData = req.body;

    if (!contactData.firstName || !contactData.lastName || !contactData.email) {
      return res.status(400).json({ error: 'firstName, lastName, and email are required' });
    }

    const contact = await crmIntegrations.createContact(contactData);

    res.json({
      success: true,
      contact,
      message: 'CRM contact created successfully'
    });
  } catch (error) {
    console.error('CRM contact creation error:', error);
    res.status(500).json({ 
      error: 'CRM contact creation failed',
      message: error.message 
    });
  }
});

router.put('/ai/crm/contacts/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const updates = req.body;

    const contact = await crmIntegrations.updateContact(contactId, updates);

    res.json({
      success: true,
      contact,
      message: 'CRM contact updated successfully'
    });
  } catch (error) {
    console.error('CRM contact update error:', error);
    res.status(500).json({ 
      error: 'CRM contact update failed',
      message: error.message 
    });
  }
});

router.get('/ai/crm/contacts', async (req, res) => {
  try {
    const contacts = await crmIntegrations.getAllContacts();

    res.json({
      success: true,
      contacts,
      message: 'CRM contacts retrieved successfully'
    });
  } catch (error) {
    console.error('CRM contacts retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve CRM contacts',
      message: error.message 
    });
  }
});

router.get('/ai/crm/contacts/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }

    const contacts = await crmIntegrations.searchContacts(q as string);

    res.json({
      success: true,
      contacts,
      message: 'Contact search completed successfully'
    });
  } catch (error) {
    console.error('Contact search error:', error);
    res.status(500).json({ 
      error: 'Contact search failed',
      message: error.message 
    });
  }
});

router.post('/ai/crm/deals', async (req, res) => {
  try {
    const dealData = req.body;

    if (!dealData.contactId || !dealData.name || !dealData.value) {
      return res.status(400).json({ error: 'contactId, name, and value are required' });
    }

    const deal = await crmIntegrations.createDeal(dealData);

    res.json({
      success: true,
      deal,
      message: 'CRM deal created successfully'
    });
  } catch (error) {
    console.error('CRM deal creation error:', error);
    res.status(500).json({ 
      error: 'CRM deal creation failed',
      message: error.message 
    });
  }
});

router.put('/ai/crm/deals/:dealId/stage', async (req, res) => {
  try {
    const { dealId } = req.params;
    const { stage } = req.body;

    if (!stage) {
      return res.status(400).json({ error: 'stage is required' });
    }

    const deal = await crmIntegrations.updateDealStage(dealId, stage);

    res.json({
      success: true,
      deal,
      message: 'Deal stage updated successfully'
    });
  } catch (error) {
    console.error('Deal stage update error:', error);
    res.status(500).json({ 
      error: 'Deal stage update failed',
      message: error.message 
    });
  }
});

router.get('/ai/crm/deals', async (req, res) => {
  try {
    const { stage, contactId } = req.query;

    let deals;
    if (stage) {
      deals = await crmIntegrations.getDealsByStage(stage as any);
    } else if (contactId) {
      deals = await crmIntegrations.getContactDeals(contactId as string);
    } else {
      deals = await crmIntegrations.getAllDeals();
    }

    res.json({
      success: true,
      deals,
      message: 'CRM deals retrieved successfully'
    });
  } catch (error) {
    console.error('CRM deals retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve CRM deals',
      message: error.message 
    });
  }
});

router.post('/ai/crm/activities', async (req, res) => {
  try {
    const activityData = req.body;

    if (!activityData.contactId || !activityData.type || !activityData.subject) {
      return res.status(400).json({ error: 'contactId, type, and subject are required' });
    }

    const activity = await crmIntegrations.logActivity(activityData);

    res.json({
      success: true,
      activity,
      message: 'CRM activity logged successfully'
    });
  } catch (error) {
    console.error('CRM activity logging error:', error);
    res.status(500).json({ 
      error: 'CRM activity logging failed',
      message: error.message 
    });
  }
});

router.get('/ai/crm/contacts/:contactId/activities', async (req, res) => {
  try {
    const { contactId } = req.params;
    const activities = await crmIntegrations.getContactActivities(contactId);

    res.json({
      success: true,
      activities,
      message: 'Contact activities retrieved successfully'
    });
  } catch (error) {
    console.error('Contact activities retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve contact activities',
      message: error.message 
    });
  }
});

router.get('/ai/crm/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const analytics = await crmIntegrations.generateAnalytics(start, end);

    res.json({
      success: true,
      analytics,
      message: 'CRM analytics generated successfully'
    });
  } catch (error) {
    console.error('CRM analytics error:', error);
    res.status(500).json({ 
      error: 'CRM analytics generation failed',
      message: error.message 
    });
  }
});

router.get('/ai/crm/pipeline/:pipelineId?', async (req, res) => {
  try {
    const { pipelineId } = req.params;
    const pipeline = await crmIntegrations.getPipeline(pipelineId);

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    res.json({
      success: true,
      pipeline,
      message: 'CRM pipeline retrieved successfully'
    });
  } catch (error) {
    console.error('CRM pipeline retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve CRM pipeline',
      message: error.message 
    });
  }
});

router.post('/ai/crm/integrations', async (req, res) => {
  try {
    const { platform, apiKey, endpoint } = req.body;

    if (!platform || !apiKey || !endpoint) {
      return res.status(400).json({ error: 'platform, apiKey, and endpoint are required' });
    }

    const integration = await crmIntegrations.setupIntegration(platform, apiKey, endpoint);

    res.json({
      success: true,
      integration,
      message: 'CRM integration setup successfully'
    });
  } catch (error) {
    console.error('CRM integration setup error:', error);
    res.status(500).json({ 
      error: 'CRM integration setup failed',
      message: error.message 
    });
  }
});

router.post('/ai/crm/sync/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const result = await crmIntegrations.syncWithCRM(platform as any);

    res.json({
      success: true,
      result,
      message: 'CRM sync completed successfully'
    });
  } catch (error) {
    console.error('CRM sync error:', error);
    res.status(500).json({ 
      error: 'CRM sync failed',
      message: error.message 
    });
  }
});

// Social Enrichment Routes
router.post('/ai/social/enrich-contact', async (req, res) => {
  try {
    const { contactId, email, name, phone, company, sources } = req.body;

    if (!contactId || !sources || !Array.isArray(sources)) {
      return res.status(400).json({ error: 'contactId and sources array are required' });
    }

    const enrichment = await socialEnrichment.enrichContact({
      contactId,
      email,
      name,
      phone,
      company,
      sources
    });

    res.json({
      success: true,
      enrichment,
      message: 'Contact enrichment completed successfully'
    });
  } catch (error) {
    console.error('Contact enrichment error:', error);
    res.status(500).json({ 
      error: 'Contact enrichment failed',
      message: error.message 
    });
  }
});

router.post('/ai/social/marketing-insights', async (req, res) => {
  try {
    const { contactId } = req.body;

    if (!contactId) {
      return res.status(400).json({ error: 'contactId is required' });
    }

    const insights = await socialEnrichment.generateMarketingInsights(contactId);

    res.json({
      success: true,
      insights,
      message: 'Marketing insights generated successfully'
    });
  } catch (error) {
    console.error('Marketing insights error:', error);
    res.status(500).json({ 
      error: 'Marketing insights generation failed',
      message: error.message 
    });
  }
});

// AI Dashboard Status Route
router.get('/ai/status', async (req, res) => {
  try {
    const status = {
      services: {
        documentProcessor: 'active',
        chatbot: 'active',
        voicebot: 'active',
        socialEnrichment: 'active',
        paymentProcessor: 'active',
        videoGenerator: 'active',
        blockchain: 'active',
        analytics: 'active'
      },
      version: '2.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      features: [
        'AI Document Processing with OCR',
        'Intelligent Chatbot with GPT-4o',
        'AI Voicebot with Claude Sonnet',
        'Social Media Enrichment',
        'Payment Processing & Loan Calculations',
        'AI Video Generation',
        'Blockchain Document Verification',
        'Advanced Analytics & Predictive Modeling'
      ]
    };

    res.json({
      success: true,
      status,
      message: 'AI services status retrieved'
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve status',
      message: error.message 
    });
  }
});

// Property Tax and Ownership Information Routes
router.post('/ai/property-tax/search', async (req, res) => {
  try {
    const { propertyAddress, parcelNumber, ownerName } = req.body;

    if (!propertyAddress) {
      return res.status(400).json({ error: 'propertyAddress is required' });
    }

    const result = await propertyTaxService.searchPropertyTaxInfo(
      propertyAddress,
      parcelNumber,
      ownerName
    );

    res.json({
      success: true,
      result,
      message: 'Property tax information retrieved successfully'
    });
  } catch (error) {
    console.error('Property tax search error:', error);
    res.status(500).json({ 
      error: 'Property tax search failed',
      message: error.message 
    });
  }
});

router.post('/ai/property-tax/process-document', upload.single('document'), async (req, res) => {
  try {
    const { propertyId, loanApplicationId, documentType } = req.body;
    const file = req.file;

    if (!file || !propertyId || !loanApplicationId || !documentType) {
      return res.status(400).json({ error: 'file, propertyId, loanApplicationId, and documentType are required' });
    }

    const document = await propertyTaxService.processTaxDocument(
      file.path,
      parseInt(propertyId),
      parseInt(loanApplicationId),
      documentType
    );

    res.json({
      success: true,
      document,
      message: 'Tax document processed successfully'
    });
  } catch (error) {
    console.error('Tax document processing error:', error);
    res.status(500).json({ 
      error: 'Tax document processing failed',
      message: error.message 
    });
  }
});

router.post('/ai/property-tax/auto-download', async (req, res) => {
  try {
    const { propertyAddress, parcelNumber, years } = req.body;

    if (!propertyAddress || !parcelNumber) {
      return res.status(400).json({ error: 'propertyAddress and parcelNumber are required' });
    }

    const downloadedFiles = await propertyTaxService.autoDownloadTaxBills(
      propertyAddress,
      parcelNumber,
      years
    );

    res.json({
      success: true,
      downloadedFiles,
      message: 'Tax bills downloaded successfully'
    });
  } catch (error) {
    console.error('Auto-download error:', error);
    res.status(500).json({ 
      error: 'Auto-download failed',
      message: error.message 
    });
  }
});

router.get('/ai/property-tax/documents/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const documents = await propertyTaxService.getPropertyTaxDocuments(parseInt(propertyId));

    res.json({
      success: true,
      documents,
      message: 'Property tax documents retrieved successfully'
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve documents',
      message: error.message 
    });
  }
});

router.post('/ai/property-tax/validate', async (req, res) => {
  try {
    const { loanApplicationId } = req.body;

    if (!loanApplicationId) {
      return res.status(400).json({ error: 'loanApplicationId is required' });
    }

    const validation = await propertyTaxService.validateTaxDocuments(parseInt(loanApplicationId));

    res.json({
      success: true,
      validation,
      message: 'Tax documents validated successfully'
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ 
      error: 'Validation failed',
      message: error.message 
    });
  }
});

router.get('/ai/property-tax/report/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const report = await propertyTaxService.generateTaxBillReport(parseInt(propertyId));

    res.json({
      success: true,
      report,
      message: 'Tax bill report generated successfully'
    });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ 
      error: 'Report generation failed',
      message: error.message 
    });
  }
});

export default router;