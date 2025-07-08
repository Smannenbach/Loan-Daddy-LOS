import { Router } from 'express';
import { aiDocumentProcessor } from './ai-document-processor';
import { aiChatbot } from './ai-chatbot';
import { paymentProcessor } from './payment-processor';
import { videoGenerator } from './video-generator';
import { blockchainService } from './blockchain-service';
import { advancedAnalytics } from './advanced-analytics';
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

// AI Dashboard Status Route
router.get('/ai/status', async (req, res) => {
  try {
    const status = {
      services: {
        documentProcessor: 'active',
        chatbot: 'active',
        paymentProcessor: 'active',
        videoGenerator: 'active',
        blockchain: 'active',
        analytics: 'active'
      },
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
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

export default router;