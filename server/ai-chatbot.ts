import OpenAI from "openai";
import { db } from "./db";
import { contacts, loanApplications, borrowers, properties } from "@shared/schema";
import { eq } from "drizzle-orm";

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
        contactId: session.contactId
      });

      session.updatedAt = new Date();
      this.activeSessions.set(sessionId, session);

      return aiResponse;
    } catch (error) {
      console.error('Error processing message:', error);
      throw new Error(`Message processing failed: ${error.message}`);
    }
  }

  private createNewSession(sessionId: string, contactId: number): ChatSession {
    const session: ChatSession = {
      id: sessionId,
      contactId,
      messages: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: []
    };
    
    this.activeSessions.set(sessionId, session);
    return session;
  }

  private async generateResponse(session: ChatSession, userMessage: string): Promise<AIResponse> {
    try {
      // Get context about the contact
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

      const aiMessage = response.choices[0].message.content;
      
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
      console.error('Error generating AI response:', error);
      return {
        message: "I apologize, but I'm having trouble processing your request right now. Let me connect you with a human representative who can assist you better.",
        confidence: 0.1,
        suggestedActions: [{
          type: 'escalate',
          description: 'Connect with human representative',
          data: { reason: 'AI processing error' }
        }],
        nextSteps: ['Wait for human representative']
      };
    }
  }

  private getSystemPrompt(): string {
    return `You are LoanBot, an AI assistant for LoanDaddy, a commercial loan origination platform specializing in DSCR (Debt Service Coverage Ratio) and Fix-and-Flip loans.

Your role is to:
1. Help potential borrowers understand loan products and requirements
2. Guide them through the application process
3. Answer questions about loan terms, rates, and documentation
4. Provide market insights and property analysis
5. Schedule appointments with loan officers
6. Collect initial application information

Key loan products:
- DSCR Loans: For rental properties, qualification based on property cash flow
- Fix-and-Flip Loans: Short-term financing for property renovation projects
- Bridge Loans: Temporary financing for property purchases
- Commercial Real Estate Loans: For income-producing properties

Guidelines:
- Be helpful, professional, and knowledgeable
- Always verify information and set proper expectations
- Escalate complex situations to human loan officers
- Focus on qualifying leads and moving them through the funnel
- Use real estate and lending terminology appropriately
- Provide specific next steps and clear call-to-actions

If you need to collect information, be conversational and explain why it's needed.
If you're uncertain about something, acknowledge it and offer to connect with a specialist.`;
  }

  private async buildContextPrompt(session: ChatSession, userMessage: string): string {
    let context = `Current conversation with contact ID ${session.contactId}:\n\n`;
    
    // Add recent conversation history
    const recentMessages = session.messages.slice(-6); // Last 6 messages
    recentMessages.forEach(msg => {
      context += `${msg.role}: ${msg.content}\n`;
    });
    
    // Add contact information if available
    try {
      const [contact] = await db.select().from(contacts).where(eq(contacts.id, session.contactId));
      if (contact) {
        context += `\nContact Information:
        Name: ${contact.firstName} ${contact.lastName}
        Email: ${contact.email}
        Phone: ${contact.phone}
        Investment Experience: ${contact.investmentExperience}
        Portfolio Size: ${contact.portfolioSize}
        Tags: ${contact.tags?.join(', ') || 'None'}`;
        
        // Add loan application history if exists
        const loanApps = await db.select().from(loanApplications).where(eq(loanApplications.borrowerId, session.contactId));
        if (loanApps.length > 0) {
          context += `\nLoan History:`;
          loanApps.forEach(loan => {
            context += `\n- ${loan.loanType}: $${loan.loanAmount}, Status: ${loan.status}`;
          });
        }
      }
    } catch (error) {
      console.error('Error fetching contact context:', error);
    }
    
    context += `\n\nLatest user message: "${userMessage}"\n\nProvide a helpful response and suggest appropriate next steps.`;
    
    return context;
  }

  private extractSuggestedActions(aiMessage: string, userMessage: string): Array<{
    type: 'schedule_call' | 'send_email' | 'create_task' | 'escalate';
    description: string;
    data?: any;
  }> {
    const actions = [];
    
    // Simple keyword-based action extraction
    const lowerMessage = userMessage.toLowerCase();
    const lowerResponse = aiMessage.toLowerCase();
    
    if (lowerMessage.includes('call') || lowerMessage.includes('speak') || lowerMessage.includes('talk')) {
      actions.push({
        type: 'schedule_call',
        description: 'Schedule a call with loan officer',
        data: { priority: 'high', type: 'consultation' }
      });
    }
    
    if (lowerMessage.includes('application') || lowerMessage.includes('apply') || lowerMessage.includes('qualify')) {
      actions.push({
        type: 'send_email',
        description: 'Send loan application link',
        data: { template: 'application_start', priority: 'high' }
      });
    }
    
    if (lowerMessage.includes('rates') || lowerMessage.includes('quote') || lowerMessage.includes('terms')) {
      actions.push({
        type: 'create_task',
        description: 'Prepare personalized rate quote',
        data: { assignee: 'loan_officer', priority: 'medium' }
      });
    }
    
    if (lowerResponse.includes('specialist') || lowerResponse.includes('complex') || lowerResponse.includes('escalate')) {
      actions.push({
        type: 'escalate',
        description: 'Connect with human specialist',
        data: { reason: 'complex_inquiry', priority: 'high' }
      });
    }
    
    return actions;
  }

  private extractNextSteps(aiMessage: string): string[] {
    const steps = [];
    
    // Extract numbered lists or bullet points
    const lines = aiMessage.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.match(/^\d+\./) || trimmed.startsWith('•') || trimmed.startsWith('-')) {
        steps.push(trimmed.replace(/^\d+\.\s*/, '').replace(/^[•-]\s*/, ''));
      }
    });
    
    // If no structured steps found, generate generic ones
    if (steps.length === 0) {
      steps.push('Review the information provided');
      steps.push('Consider your financing needs');
      steps.push('Contact us for personalized assistance');
    }
    
    return steps;
  }

  private calculateConfidence(aiMessage: string, userMessage: string): number {
    // Simple confidence calculation based on various factors
    let confidence = 0.8; // Base confidence
    
    // Reduce confidence for vague responses
    if (aiMessage.includes('I\'m not sure') || aiMessage.includes('uncertain')) {
      confidence -= 0.3;
    }
    
    // Increase confidence for specific information
    if (aiMessage.includes('$') || aiMessage.includes('%') || aiMessage.includes('days')) {
      confidence += 0.1;
    }
    
    // Reduce confidence for escalation responses
    if (aiMessage.includes('specialist') || aiMessage.includes('representative')) {
      confidence -= 0.2;
    }
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private cleanAIMessage(message: string): string {
    // Remove any potential system prompts or unwanted content
    return message
      .replace(/\[SYSTEM\].*?\[\/SYSTEM\]/g, '')
      .replace(/\[ACTION\].*?\[\/ACTION\]/g, '')
      .trim();
  }

  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    const session = this.activeSessions.get(sessionId);
    return session ? session.messages : [];
  }

  async summarizeSession(sessionId: string): Promise<string> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    try {
      const conversationText = session.messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: "system",
            content: "Summarize this customer conversation, highlighting key points, customer needs, and recommended actions."
          },
          {
            role: "user",
            content: conversationText
          }
        ],
        max_tokens: 300
      });

      const summary = response.choices[0].message.content;
      session.summary = summary;
      this.activeSessions.set(sessionId, session);

      return summary;
    } catch (error) {
      console.error('Error summarizing session:', error);
      return 'Unable to generate session summary';
    }
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'resolved';
      session.updatedAt = new Date();
      
      // Generate summary before ending
      if (!session.summary) {
        await this.summarizeSession(sessionId);
      }
      
      // In a real implementation, you would save to database here
      console.log(`Session ${sessionId} ended with summary: ${session.summary}`);
    }
  }
}

export const aiChatbot = AIChatbotService.getInstance();