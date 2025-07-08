import Anthropic from '@anthropic-ai/sdk';
import { nanoid } from 'nanoid';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// the newest Anthropic model is "claude-sonnet-4-20250514", not "claude-3-7-sonnet-20250219", "claude-3-5-sonnet-20241022" nor "claude-3-sonnet-20240229"
const DEFAULT_MODEL_STR = "claude-sonnet-4-20250514";

export interface VoiceCallSession {
  id: string;
  contactId: number;
  phoneNumber: string;
  status: 'connecting' | 'active' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  transcript: VoiceMessage[];
  summary?: string;
  outcome: 'information_provided' | 'callback_requested' | 'application_started' | 'escalated';
  nextActions: string[];
}

export interface VoiceMessage {
  speaker: 'ai' | 'caller';
  content: string;
  timestamp: Date;
  confidence?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface CallOutcome {
  intent: string;
  leadQuality: 'hot' | 'warm' | 'cold';
  followUpRequired: boolean;
  appointmentScheduled: boolean;
  informationCaptured: {
    loanAmount?: number;
    propertyType?: string;
    timeline?: string;
    creditScore?: number;
    experience?: string;
  };
}

export class AIVoicebotService {
  private static instance: AIVoicebotService;
  private anthropic: Anthropic;
  private activeCalls: Map<string, VoiceCallSession> = new Map();

  private constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  public static getInstance(): AIVoicebotService {
    if (!AIVoicebotService.instance) {
      AIVoicebotService.instance = new AIVoicebotService();
    }
    return AIVoicebotService.instance;
  }

  async initiateCall(contactId: number, phoneNumber: string, purpose: string = 'follow_up'): Promise<string> {
    try {
      const sessionId = `call_${nanoid(24)}`;
      
      const session: VoiceCallSession = {
        id: sessionId,
        contactId,
        phoneNumber,
        status: 'connecting',
        startTime: new Date(),
        transcript: [],
        outcome: 'information_provided',
        nextActions: []
      };

      this.activeCalls.set(sessionId, session);

      // Simulate call connection and initial greeting
      this.simulateCallConnection(sessionId, purpose);

      console.log(`Voice call initiated: ${sessionId} to ${phoneNumber}`);
      return sessionId;
    } catch (error) {
      console.error('Error initiating voice call:', error);
      throw new Error(`Failed to initiate call: ${error.message}`);
    }
  }

  async processVoiceInput(sessionId: string, transcript: string): Promise<string> {
    try {
      const session = this.activeCalls.get(sessionId);
      if (!session) {
        throw new Error('Call session not found');
      }

      // Add caller message to transcript
      const callerMessage: VoiceMessage = {
        speaker: 'caller',
        content: transcript,
        timestamp: new Date(),
        confidence: 0.85 + Math.random() * 0.1, // Simulate speech recognition confidence
        sentiment: this.analyzeSentiment(transcript)
      };

      session.transcript.push(callerMessage);

      // Generate AI response
      const aiResponse = await this.generateVoiceResponse(session, transcript);

      // Add AI response to transcript
      const aiMessage: VoiceMessage = {
        speaker: 'ai',
        content: aiResponse,
        timestamp: new Date(),
        confidence: 0.95,
        sentiment: 'positive'
      };

      session.transcript.push(aiMessage);
      session.status = 'active';
      this.activeCalls.set(sessionId, session);

      return aiResponse;
    } catch (error) {
      console.error('Error processing voice input:', error);
      return "I apologize, I'm having trouble understanding. Could you please repeat that?";
    }
  }

  private async generateVoiceResponse(session: VoiceCallSession, userInput: string): Promise<string> {
    try {
      // Build conversation context
      const recentMessages = session.transcript
        .slice(-4)
        .map(msg => `${msg.speaker}: ${msg.content}`)
        .join('\n');

      const systemPrompt = `You are a professional AI voice assistant for LoanDaddy, a commercial loan origination company. You're making an outbound call to a potential borrower.

Your role:
- Engage professionally and warmly
- Gather loan requirements and borrower information
- Explain loan products (DSCR, Fix-and-Flip, Bridge, Commercial)
- Schedule follow-up appointments
- Answer questions about rates and terms

Guidelines:
- Keep responses conversational and natural for voice
- Ask one question at a time
- Be helpful but not pushy
- Listen carefully and respond appropriately
- Aim to qualify the lead and gather contact information

Current conversation context:
${recentMessages}

Respond naturally to: "${userInput}"

Keep your response under 50 words and conversational for voice delivery.`;

      const message = await this.anthropic.messages.create({
        max_tokens: 150,
        messages: [{ role: 'user', content: systemPrompt }],
        model: DEFAULT_MODEL_STR,
      });

      return message.content[0].text || "Thank you for your time. I'll have someone from our team follow up with you soon.";
    } catch (error) {
      console.error('AI voice response generation error:', error);
      return "I appreciate your interest. Let me connect you with one of our loan specialists who can better assist you.";
    }
  }

  private simulateCallConnection(sessionId: string, purpose: string): void {
    setTimeout(() => {
      const session = this.activeCalls.get(sessionId);
      if (session) {
        session.status = 'active';
        
        // Add opening message
        const openingMessage: VoiceMessage = {
          speaker: 'ai',
          content: this.getOpeningMessage(purpose),
          timestamp: new Date(),
          confidence: 1.0,
          sentiment: 'positive'
        };

        session.transcript.push(openingMessage);
        this.activeCalls.set(sessionId, session);
      }
    }, 2000); // Simulate 2-second connection delay
  }

  private getOpeningMessage(purpose: string): string {
    const openings = {
      follow_up: "Hello! This is Sarah from LoanDaddy. I'm calling to follow up on your interest in commercial financing. Do you have a quick moment to chat?",
      new_lead: "Hi there! This is Sarah from LoanDaddy. I understand you're interested in learning about our commercial loan programs. Is now a good time to talk?",
      appointment_reminder: "Hello! This is Sarah from LoanDaddy calling to remind you about your consultation appointment. Are you still available to discuss your financing needs?",
      qualification: "Hi! This is Sarah from LoanDaddy. I'd like to learn more about your commercial real estate financing needs. Do you have a few minutes?"
    };

    return openings[purpose] || openings.follow_up;
  }

  async endCall(sessionId: string): Promise<CallOutcome> {
    try {
      const session = this.activeCalls.get(sessionId);
      if (!session) {
        throw new Error('Call session not found');
      }

      session.status = 'completed';
      session.endTime = new Date();
      session.duration = Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000);

      // Analyze call outcome
      const outcome = await this.analyzeCallOutcome(session);
      
      // Generate call summary
      session.summary = await this.generateCallSummary(session);
      
      // Determine next actions
      session.nextActions = this.determineNextActions(outcome);
      
      session.outcome = outcome.followUpRequired ? 'callback_requested' : 'information_provided';

      this.activeCalls.set(sessionId, session);

      console.log(`Call completed: ${sessionId}, Duration: ${session.duration}s, Outcome: ${session.outcome}`);
      return outcome;
    } catch (error) {
      console.error('Error ending call:', error);
      throw new Error(`Failed to end call: ${error.message}`);
    }
  }

  private async analyzeCallOutcome(session: VoiceCallSession): Promise<CallOutcome> {
    try {
      const transcript = session.transcript
        .map(msg => `${msg.speaker}: ${msg.content}`)
        .join('\n');

      const analysisPrompt = `Analyze this loan origination call transcript and extract key information in JSON format:

Transcript:
${transcript}

Return JSON with:
{
  "intent": "string describing caller's main intent",
  "leadQuality": "hot|warm|cold based on interest level",
  "followUpRequired": boolean,
  "appointmentScheduled": boolean,
  "informationCaptured": {
    "loanAmount": number or null,
    "propertyType": "string or null",
    "timeline": "string or null",
    "creditScore": number or null,
    "experience": "string or null"
  }
}`;

      const message = await this.anthropic.messages.create({
        max_tokens: 500,
        messages: [{ role: 'user', content: analysisPrompt }],
        model: DEFAULT_MODEL_STR,
      });

      try {
        const analysis = JSON.parse(message.content[0].text);
        return analysis;
      } catch (parseError) {
        console.error('Error parsing call analysis:', parseError);
        return this.getDefaultOutcome();
      }
    } catch (error) {
      console.error('Call outcome analysis error:', error);
      return this.getDefaultOutcome();
    }
  }

  private getDefaultOutcome(): CallOutcome {
    return {
      intent: 'General inquiry about commercial loans',
      leadQuality: 'warm',
      followUpRequired: true,
      appointmentScheduled: false,
      informationCaptured: {}
    };
  }

  private async generateCallSummary(session: VoiceCallSession): Promise<string> {
    try {
      const transcript = session.transcript
        .map(msg => `${msg.speaker}: ${msg.content}`)
        .join('\n');

      const summaryPrompt = `Summarize this commercial loan call in 2-3 sentences focusing on:
- Borrower's loan needs and interests
- Key information gathered
- Next steps discussed

Transcript:
${transcript}`;

      const message = await this.anthropic.messages.create({
        max_tokens: 200,
        messages: [{ role: 'user', content: summaryPrompt }],
        model: DEFAULT_MODEL_STR,
      });

      return message.content[0].text || 'Call summary unavailable.';
    } catch (error) {
      console.error('Call summary generation error:', error);
      return `Call completed with ${session.transcript.length} exchanges. Duration: ${session.duration || 0} seconds.`;
    }
  }

  private determineNextActions(outcome: CallOutcome): string[] {
    const actions: string[] = [];

    if (outcome.appointmentScheduled) {
      actions.push('Send appointment confirmation email');
      actions.push('Prepare consultation materials');
    }

    if (outcome.followUpRequired) {
      actions.push('Schedule follow-up call');
      actions.push('Send informational email');
    }

    if (outcome.leadQuality === 'hot') {
      actions.push('Priority follow-up within 24 hours');
      actions.push('Assign to senior loan officer');
    }

    if (outcome.informationCaptured.loanAmount) {
      actions.push('Prepare preliminary loan scenarios');
      actions.push('Research comparable properties');
    }

    if (actions.length === 0) {
      actions.push('Update contact record');
      actions.push('Add to nurture campaign');
    }

    return actions.slice(0, 4); // Limit to 4 actions
  }

  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['interested', 'yes', 'great', 'good', 'perfect', 'absolutely', 'definitely'];
    const negativeWords = ['not interested', 'no', 'busy', 'later', 'maybe', 'unsure'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  async getCallTranscript(sessionId: string): Promise<VoiceMessage[]> {
    const session = this.activeCalls.get(sessionId);
    return session ? session.transcript : [];
  }

  async makeOutboundCall(contactId: number, phoneNumber: string, script: string): Promise<string> {
    try {
      const sessionId = await this.initiateCall(contactId, phoneNumber, 'qualification');
      
      // Simulate custom script delivery
      const session = this.activeCalls.get(sessionId);
      if (session) {
        const scriptMessage: VoiceMessage = {
          speaker: 'ai',
          content: script,
          timestamp: new Date(),
          confidence: 1.0,
          sentiment: 'positive'
        };
        
        session.transcript.push(scriptMessage);
        this.activeCalls.set(sessionId, session);
      }

      console.log(`Outbound call initiated with custom script: ${sessionId}`);
      return sessionId;
    } catch (error) {
      console.error('Error making outbound call:', error);
      throw new Error(`Outbound call failed: ${error.message}`);
    }
  }
}

export const aiVoicebot = AIVoicebotService.getInstance();