import OpenAI from "openai";
import { nanoid } from 'nanoid';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = "gpt-4o";

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  contactId?: number;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  contactId: number;
  messages: ChatMessage[];
  status: 'active' | 'resolved' | 'escalated';
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  summary?: string;
}

export interface AIResponse {
  message: string;
  confidence: number;
  suggestedActions: Array<{
    type: 'schedule_call' | 'send_email' | 'create_task' | 'escalate';
    description: string;
    data?: any;
  }>;
  nextSteps: string[];
}

export class AIChatbotService {
  private static instance: AIChatbotService;
  private activeSessions: Map<string, ChatSession> = new Map();

  private constructor() {}

  public static getInstance(): AIChatbotService {
    if (!AIChatbotService.instance) {
      AIChatbotService.instance = new AIChatbotService();
    }
    return AIChatbotService.instance;
  }

  async processMessage(sessionId: string, userMessage: string, contactId?: number): Promise<AIResponse> {
    try {
      let session = this.activeSessions.get(sessionId);
      
      if (!session && contactId) {
        session = this.createNewSession(sessionId, contactId);
      }
      
      if (!session) {
        throw new Error('Session not found and no contact ID provided');
      }

      // Add user message to session
      session.messages.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
        contactId: session.contactId
      });

      // Generate AI response
      const aiResponse = await this.generateResponse(session, userMessage);

      // Add AI response to session
      session.messages.push({
        role: 'assistant',
        content: aiResponse.message,
        timestamp: new Date(),
        contactId: session.contactId,
        metadata: {
          confidence: aiResponse.confidence,
          suggestedActions: aiResponse.suggestedActions
        }
      });

      session.updatedAt = new Date();
      this.activeSessions.set(sessionId, session);

      return aiResponse;
    } catch (error) {
      console.error('Chatbot message processing error:', error);
      throw new Error(`Failed to process message: ${error.message}`);
    }
  }

  private createNewSession(sessionId: string, contactId: number): ChatSession {
    const session: ChatSession = {
      id: sessionId,
      contactId,
      messages: [{
        role: 'system',
        content: this.getSystemPrompt(),
        timestamp: new Date()
      }],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['new', 'active']
    };

    this.activeSessions.set(sessionId, session);
    return session;
  }

  private async generateResponse(session: ChatSession, userMessage: string): Promise<AIResponse> {
    try {
      const contextPrompt = await this.buildContextPrompt(session, userMessage);

      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt()
          },
          {
            role: "user",
            content: contextPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const aiMessage = response.choices[0].message.content || 'I apologize, but I encountered an issue generating a response. Please try again.';

      // Extract suggested actions and next steps
      const suggestedActions = this.extractSuggestedActions(aiMessage, userMessage);
      const nextSteps = this.extractNextSteps(aiMessage);
      const confidence = this.calculateConfidence(aiMessage, userMessage);

      return {
        message: this.cleanAIMessage(aiMessage),
        confidence,
        suggestedActions,
        nextSteps
      };
    } catch (error) {
      console.error('AI response generation error:', error);
      return {
        message: "I'm having trouble connecting right now, but I'd be happy to help you with your commercial loan needs. Could you tell me more about what you're looking for?",
        confidence: 0.5,
        suggestedActions: [{
          type: 'escalate',
          description: 'Transfer to human agent due to technical issue'
        }],
        nextSteps: ['Resolve technical issue', 'Continue conversation']
      };
    }
  }

  private getSystemPrompt(): string {
    return `You are an expert commercial loan advisor for LoanDaddy, a leading commercial loan origination platform. You specialize in DSCR loans, Fix-and-Flip financing, Bridge loans, and Commercial real estate loans.

Your role:
- Help potential borrowers understand loan products and requirements
- Gather preliminary qualification information
- Schedule appointments with loan officers
- Answer questions about rates, terms, and processes
- Provide expert guidance on real estate investment financing

Key loan products:
1. DSCR Loans: Qualify based on property cash flow, not personal income
2. Fix-and-Flip Loans: Short-term financing for property renovation projects
3. Bridge Loans: Quick financing for time-sensitive acquisitions
4. Commercial Loans: Long-term financing for commercial real estate

Guidelines:
- Be helpful, professional, and knowledgeable
- Ask qualifying questions to understand borrower needs
- Provide accurate information about loan products
- Suggest next steps and schedule follow-ups
- Always aim to move the conversation toward a loan application
- Be empathetic to borrower concerns and challenges

When appropriate, suggest these actions:
- Schedule a consultation call
- Start a loan application
- Request property information
- Connect with a specialist loan officer

Keep responses conversational, informative, and action-oriented.`;
  }

  private async buildContextPrompt(session: ChatSession, userMessage: string): string {
    const recentMessages = session.messages.slice(-5).map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n');

    return `Recent conversation:
${recentMessages}

Current user message: ${userMessage}

Please respond as a helpful commercial loan advisor. Consider the conversation history and provide a relevant, helpful response that moves the conversation forward toward helping the borrower with their financing needs.`;
  }

  private extractSuggestedActions(aiMessage: string, userMessage: string): Array<{
    type: 'schedule_call' | 'send_email' | 'create_task' | 'escalate';
    description: string;
    data?: any;
  }> {
    const actions: Array<{
      type: 'schedule_call' | 'send_email' | 'create_task' | 'escalate';
      description: string;
      data?: any;
    }> = [];

    // Simple keyword-based action detection
    const lowerMessage = aiMessage.toLowerCase() + ' ' + userMessage.toLowerCase();

    if (lowerMessage.includes('schedule') || lowerMessage.includes('call') || lowerMessage.includes('appointment')) {
      actions.push({
        type: 'schedule_call',
        description: 'Schedule consultation call with loan officer'
      });
    }

    if (lowerMessage.includes('application') || lowerMessage.includes('apply') || lowerMessage.includes('qualify')) {
      actions.push({
        type: 'create_task',
        description: 'Create loan application task'
      });
    }

    if (lowerMessage.includes('email') || lowerMessage.includes('send') || lowerMessage.includes('information')) {
      actions.push({
        type: 'send_email',
        description: 'Send loan product information via email'
      });
    }

    if (lowerMessage.includes('complex') || lowerMessage.includes('specialist') || lowerMessage.includes('escalate')) {
      actions.push({
        type: 'escalate',
        description: 'Transfer to senior loan officer'
      });
    }

    return actions;
  }

  private extractNextSteps(aiMessage: string): string[] {
    const steps: string[] = [];
    
    // Extract potential next steps from the AI message
    const sentences = aiMessage.split('.').map(s => s.trim()).filter(s => s.length > 0);
    
    sentences.forEach(sentence => {
      const lower = sentence.toLowerCase();
      if (lower.includes('next') || lower.includes('step') || lower.includes('then') || 
          lower.includes('would like') || lower.includes('can help') || lower.includes('let me')) {
        steps.push(sentence);
      }
    });

    // Default next steps if none found
    if (steps.length === 0) {
      steps.push('Continue gathering borrower requirements');
      steps.push('Provide additional loan product information');
    }

    return steps.slice(0, 3); // Limit to 3 steps
  }

  private calculateConfidence(aiMessage: string, userMessage: string): number {
    // Simple confidence calculation based on message characteristics
    let confidence = 0.7; // Base confidence

    // Increase confidence for specific loan-related keywords
    const loanKeywords = ['loan', 'rate', 'dscr', 'flip', 'bridge', 'commercial', 'financing', 'mortgage'];
    const userLower = userMessage.toLowerCase();
    const keywordMatches = loanKeywords.filter(keyword => userLower.includes(keyword)).length;
    
    confidence += keywordMatches * 0.05; // +5% per keyword match

    // Adjust based on message length and detail
    if (aiMessage.length > 200) confidence += 0.1;
    if (aiMessage.length < 50) confidence -= 0.1;

    return Math.min(0.95, Math.max(0.3, confidence));
  }

  private cleanAIMessage(message: string): string {
    // Remove any unwanted patterns or formatting
    return message
      .replace(/\n\s*\n/g, '\n') // Remove double line breaks
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .replace(/\*\*(.*?)\*\*/g, '$1'); // Remove markdown bold
  }

  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    const session = this.activeSessions.get(sessionId);
    return session ? session.messages.filter(msg => msg.role !== 'system') : [];
  }

  async summarizeSession(sessionId: string): Promise<string> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const messages = session.messages
        .filter(msg => msg.role !== 'system')
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: "system",
            content: "Summarize this customer conversation in 2-3 sentences, focusing on the borrower's needs, loan interests, and next steps."
          },
          {
            role: "user",
            content: `Conversation to summarize:\n${messages}`
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      });

      const summary = response.choices[0].message.content || 'Conversation summary unavailable.';
      
      // Update session with summary
      session.summary = summary;
      this.activeSessions.set(sessionId, session);

      return summary;
    } catch (error) {
      console.error('Session summarization error:', error);
      return 'Unable to generate conversation summary at this time.';
    }
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'resolved';
      session.updatedAt = new Date();
      
      // Generate final summary
      await this.summarizeSession(sessionId);
      
      // In a real implementation, you might save to database here
      console.log(`Chat session ${sessionId} ended with ${session.messages.length} messages`);
    }
  }
}

export const aiChatbot = AIChatbotService.getInstance();