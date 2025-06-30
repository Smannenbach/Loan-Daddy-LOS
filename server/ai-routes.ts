import express from 'express';
import { aiChatbot } from './ai-chatbot';
import { aiVoicebot } from './ai-voicebot';
import { aiMarketAnalyzer } from './ai-market-analysis';
import { aiLoanAdvisor } from './ai-loan-advisor';

const router = express.Router();

// AI Metrics endpoint
router.get('/api/ai/metrics', async (req, res) => {
  try {
    const { timeframe = 'today' } = req.query;
    
    // Mock metrics for now - would integrate with actual AI service metrics
    const metrics = {
      totalSessions: 145,
      activeSessions: 3,
      avgResponseTime: 1.8,
      satisfactionScore: 87,
      conversionsGenerated: 23,
      callsHandled: 67,
      leadsQualified: 19,
      automationSavings: 12450
    };

    res.json(metrics);
  } catch (error) {
    console.error('AI metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch AI metrics' });
  }
});

// Active AI sessions endpoint
router.get('/api/ai/sessions', async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    
    // Mock active sessions - would integrate with actual AI service
    const sessions = [
      {
        id: 'chat_001',
        type: 'chat',
        contactId: 1,
        contactName: 'John Smith',
        status: 'active',
        startTime: new Date(Date.now() - 1200000), // 20 minutes ago
        confidence: 92
      },
      {
        id: 'voice_002',
        type: 'voice',
        contactId: 2,
        contactName: 'Sarah Johnson',
        status: 'active',
        startTime: new Date(Date.now() - 300000), // 5 minutes ago
        duration: 5,
        confidence: 78
      },
      {
        id: 'chat_003',
        type: 'chat',
        contactId: 3,
        contactName: 'Mike Wilson',
        status: 'completed',
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
        duration: 15,
        outcome: 'Lead qualified',
        confidence: 95
      }
    ];

    const filteredSessions = status === 'all' ? sessions : sessions.filter(s => s.status === status);
    res.json(filteredSessions);
  } catch (error) {
    console.error('AI sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch AI sessions' });
  }
});

// AI performance data endpoint
router.get('/api/ai/performance', async (req, res) => {
  try {
    const { timeframe = 'today' } = req.query;
    
    // Mock performance data - would integrate with actual AI analytics
    const performance = {
      responseTimeByHour: [
        { hour: '00:00', avgTime: 1.2 },
        { hour: '01:00', avgTime: 1.4 },
        { hour: '02:00', avgTime: 1.8 },
        { hour: '03:00', avgTime: 2.1 },
        { hour: '04:00', avgTime: 1.9 },
        { hour: '05:00', avgTime: 1.6 },
        { hour: '06:00', avgTime: 1.3 },
        { hour: '07:00', avgTime: 1.1 },
        { hour: '08:00', avgTime: 0.9 },
        { hour: '09:00', avgTime: 1.2 },
        { hour: '10:00', avgTime: 1.4 },
        { hour: '11:00', avgTime: 1.6 }
      ],
      satisfactionByDay: [
        { day: 'Mon', score: 85 },
        { day: 'Tue', score: 88 },
        { day: 'Wed', score: 92 },
        { day: 'Thu', score: 87 },
        { day: 'Fri', score: 89 },
        { day: 'Sat', score: 84 },
        { day: 'Sun', score: 86 }
      ],
      conversionsOverTime: [
        { time: '9:00', conversions: 2 },
        { time: '10:00', conversions: 5 },
        { time: '11:00', conversions: 8 },
        { time: '12:00', conversions: 12 },
        { time: '13:00', conversions: 15 },
        { time: '14:00', conversions: 18 },
        { time: '15:00', conversions: 23 }
      ]
    };

    res.json(performance);
  } catch (error) {
    console.error('AI performance error:', error);
    res.status(500).json({ error: 'Failed to fetch AI performance data' });
  }
});

// AI Chat endpoint
router.post('/api/ai/chat', async (req, res) => {
  try {
    const { sessionId, message, contactId } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'Session ID and message are required' });
    }

    const response = await aiChatbot.processMessage(sessionId, message, contactId);
    res.json(response);
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// AI Chat history endpoint
router.get('/api/ai/chat/:sessionId/history', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = await aiChatbot.getChatHistory(sessionId);
    res.json(history);
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
});

// AI Chat session summary endpoint
router.get('/api/ai/chat/:sessionId/summary', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const summary = await aiChatbot.summarizeSession(sessionId);
    res.json({ summary });
  } catch (error) {
    console.error('Chat summary error:', error);
    res.status(500).json({ error: 'Failed to generate session summary' });
  }
});

// End AI Chat session endpoint
router.post('/api/ai/chat/:sessionId/end', async (req, res) => {
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
router.post('/api/ai/voice/call', async (req, res) => {
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

router.post('/api/ai/voice/:sessionId/input', async (req, res) => {
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

router.post('/api/ai/voice/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const outcome = await aiVoicebot.endCall(sessionId);
    res.json(outcome);
  } catch (error) {
    console.error('End voice call error:', error);
    res.status(500).json({ error: 'Failed to end voice call' });
  }
});

router.get('/api/ai/voice/:sessionId/transcript', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const transcript = await aiVoicebot.getCallTranscript(sessionId);
    res.json(transcript);
  } catch (error) {
    console.error('Voice transcript error:', error);
    res.status(500).json({ error: 'Failed to get call transcript' });
  }
});

// AI Market Analysis endpoint
router.post('/api/ai/market-analysis', async (req, res) => {
  try {
    const marketData = req.body;
    const analysis = await aiMarketAnalyzer.analyzeMarket({ marketData });
    res.json(analysis);
  } catch (error) {
    console.error('Market analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze market data' });
  }
});

// AI Loan Advisor endpoint
router.post('/api/ai/loan-recommendation', async (req, res) => {
  try {
    const borrowerProfile = req.body;
    const recommendation = await aiLoanAdvisor.analyzeBorrowerAndRecommendLoan(borrowerProfile);
    res.json(recommendation);
  } catch (error) {
    console.error('Loan recommendation error:', error);
    res.status(500).json({ error: 'Failed to generate loan recommendation' });
  }
});

export default router;