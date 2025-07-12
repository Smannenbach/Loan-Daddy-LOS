import OpenAI from "openai";
import { db } from './db';
import { borrowers, loanApplications, documents, properties } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { DocumentAnalysis } from './ai-document-processor';
import { advancedAnalytics } from './advanced-analytics';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

interface ConversationContext {
  sessionId: string;
  borrowerId?: number;
  applicationId?: number;
  stage: 'greeting' | 'qualification' | 'document_collection' | 'application' | 'underwriting' | 'closing';
  conversationHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
  extractedData: Record<string, any>;
  requiredDocuments: string[];
  qualificationScore: number;
  loanProducts: Array<{
    type: string;
    rate: number;
    term: string;
    recommended: boolean;
  }>;
}

interface DataExtractionResult {
  field: string;
  value: any;
  confidence: number;
  source: string;
  validated: boolean;
}

export class AutonomousAIAdvisor {
  private static instance: AutonomousAIAdvisor;
  private activeSessions: Map<string, ConversationContext> = new Map();
  private dataValidationRules: Map<string, (value: any) => boolean> = new Map();

  private constructor() {
    this.initializeValidationRules();
  }

  public static getInstance(): AutonomousAIAdvisor {
    if (!AutonomousAIAdvisor.instance) {
      AutonomousAIAdvisor.instance = new AutonomousAIAdvisor();
    }
    return AutonomousAIAdvisor.instance;
  }

  private initializeValidationRules(): void {
    // Income validation
    this.dataValidationRules.set('income', (value) => {
      const income = parseFloat(value);
      return income > 0 && income < 10000000; // Reasonable income range
    });

    // Credit score validation
    this.dataValidationRules.set('creditScore', (value) => {
      const score = parseInt(value);
      return score >= 300 && score <= 850;
    });

    // SSN validation
    this.dataValidationRules.set('ssn', (value) => {
      return /^\d{3}-?\d{2}-?\d{4}$/.test(value);
    });

    // Email validation
    this.dataValidationRules.set('email', (value) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    });

    // Phone validation
    this.dataValidationRules.set('phone', (value) => {
      return /^\d{10}$/.test(value.replace(/\D/g, ''));
    });
  }

  async startConversation(sessionId: string, channel: 'web' | 'sms' | 'voice' | 'email'): Promise<string> {
    const context: ConversationContext = {
      sessionId,
      stage: 'greeting',
      conversationHistory: [],
      extractedData: {},
      requiredDocuments: [],
      qualificationScore: 0,
      loanProducts: []
    };

    this.activeSessions.set(sessionId, context);

    const greeting = await this.generateGreeting(channel);
    context.conversationHistory.push({
      role: 'assistant',
      content: greeting,
      timestamp: new Date()
    });

    return greeting;
  }

  private async generateGreeting(channel: string): Promise<string> {
    const prompts = {
      web: "Hi! I'm your AI Loan Advisor. I can help you get pre-qualified for a mortgage in just a few minutes. I'll guide you through the entire process, from application to closing. What's your name?",
      sms: "Hi! I'm your AI Loan Advisor from LoanGenius. Ready to get pre-qualified for a mortgage? Reply with your name to start.",
      voice: "Hello, and thank you for calling LoanGenius. I'm your AI Loan Advisor, and I can help you get pre-qualified for a mortgage right now. May I have your name please?",
      email: "Subject: Your Mortgage Pre-Qualification\n\nDear Future Homeowner,\n\nI'm your AI Loan Advisor from LoanGenius. I'm here to help you get pre-qualified for a mortgage quickly and easily. Let's start with some basic information.\n\nWhat's your full name?"
    };

    return prompts[channel] || prompts.web;
  }

  async processMessage(sessionId: string, userMessage: string): Promise<{
    response: string;
    actions: Array<{
      type: 'collect_document' | 'verify_data' | 'calculate_loan' | 'schedule_call' | 'create_application';
      data: any;
    }>;
    nextSteps: string[];
  }> {
    const context = this.activeSessions.get(sessionId);
    if (!context) {
      return {
        response: "I'm sorry, but I can't find your session. Let's start over. What's your name?",
        actions: [],
        nextSteps: ["Start new conversation"]
      };
    }

    // Add user message to history
    context.conversationHistory.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    });

    // Extract data from user message
    const extractedData = await this.extractDataFromMessage(userMessage, context);
    
    // Merge extracted data
    Object.assign(context.extractedData, extractedData);

    // Validate extracted data
    await this.validateData(context);

    // Determine next stage based on data completeness
    const nextStage = this.determineNextStage(context);
    if (nextStage !== context.stage) {
      context.stage = nextStage;
    }

    // Generate response based on current stage
    const response = await this.generateStageResponse(context);
    
    // Determine actions
    const actions = await this.determineActions(context);
    
    // Determine next steps
    const nextSteps = this.determineNextSteps(context);

    // Add assistant response to history
    context.conversationHistory.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });

    return { response, actions, nextSteps };
  }

  private async extractDataFromMessage(message: string, context: ConversationContext): Promise<Record<string, any>> {
    const prompt = `Extract structured data from this message in a mortgage application context.
    
Current stage: ${context.stage}
Message: "${message}"

Previously extracted data: ${JSON.stringify(context.extractedData)}

Extract any of the following information if present:
- Full name (firstName, lastName)
- Email address
- Phone number
- Current address
- Employment status and employer
- Annual income
- Credit score estimate
- Property type (single family, condo, etc.)
- Property address
- Loan purpose (purchase, refinance, cash-out)
- Down payment amount or percentage
- Desired loan amount
- Timeline for purchase

Return extracted data as JSON with field names as keys and extracted values. Include confidence score (0-1) for each field.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a data extraction specialist for mortgage applications." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      const extracted = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate and clean extracted data
      const cleanedData: Record<string, any> = {};
      for (const [field, data] of Object.entries(extracted)) {
        if (data && typeof data === 'object' && 'value' in data && 'confidence' in data) {
          if (data.confidence > 0.7) {
            cleanedData[field] = data.value;
          }
        }
      }

      return cleanedData;
    } catch (error) {
      console.error('Data extraction error:', error);
      return {};
    }
  }

  private async validateData(context: ConversationContext): Promise<void> {
    for (const [field, value] of Object.entries(context.extractedData)) {
      const validator = this.dataValidationRules.get(field);
      if (validator && !validator(value)) {
        delete context.extractedData[field];
      }
    }
  }

  private determineNextStage(context: ConversationContext): ConversationContext['stage'] {
    const data = context.extractedData;
    
    // Check qualification data completeness
    const hasBasicInfo = data.firstName && data.email && data.phone;
    const hasFinancialInfo = data.income && data.creditScore;
    const hasPropertyInfo = data.propertyType && data.loanPurpose;
    const hasDocuments = context.requiredDocuments.length > 0;

    if (!hasBasicInfo) return 'greeting';
    if (!hasFinancialInfo) return 'qualification';
    if (!hasPropertyInfo) return 'application';
    if (!hasDocuments) return 'document_collection';
    if (context.qualificationScore > 0.7) return 'underwriting';
    
    return 'application';
  }

  private async generateStageResponse(context: ConversationContext): Promise<string> {
    const stagePrompts = {
      greeting: "Thanks! To get started with your pre-qualification, I'll need to ask you a few questions. What's your email address?",
      qualification: "Great! Now let's talk about your financial situation. What's your approximate annual income before taxes?",
      document_collection: "Excellent! To move forward, I'll need to collect some documents. I can help you upload them securely. Would you like to start with your most recent pay stubs?",
      application: "Based on what you've told me, you're pre-qualified! Let's complete your full application. What type of property are you looking to finance?",
      underwriting: "Your application is being reviewed. I'm analyzing your information against our lending criteria. This usually takes just a moment.",
      closing: "Congratulations! Your loan has been approved. Let's schedule your closing appointment."
    };

    const systemPrompt = `You are an expert mortgage loan officer AI. Your goal is to:
1. Build rapport and trust with the borrower
2. Collect necessary information naturally through conversation
3. Educate about loan options when appropriate
4. Address concerns proactively
5. Guide them smoothly through the process

Current stage: ${context.stage}
Data collected: ${JSON.stringify(context.extractedData)}
Missing data: ${this.identifyMissingData(context).join(', ')}

Generate a natural, helpful response that moves the conversation forward.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...context.conversationHistory.slice(-10), // Last 10 messages for context
          { role: "user", content: "Generate next response" }
        ]
      });

      return response.choices[0].message.content || stagePrompts[context.stage];
    } catch (error) {
      console.error('Response generation error:', error);
      return stagePrompts[context.stage];
    }
  }

  private identifyMissingData(context: ConversationContext): string[] {
    const required = {
      greeting: ['firstName', 'lastName', 'email', 'phone'],
      qualification: ['income', 'creditScore', 'employmentStatus'],
      application: ['propertyType', 'propertyAddress', 'loanPurpose', 'loanAmount'],
      document_collection: ['paystubs', 'taxReturns', 'bankStatements'],
      underwriting: ['appraisal', 'title', 'insurance'],
      closing: ['closingDate', 'finalLoanAmount']
    };

    const missing: string[] = [];
    const stageRequirements = required[context.stage] || [];
    
    for (const field of stageRequirements) {
      if (!context.extractedData[field]) {
        missing.push(field);
      }
    }

    return missing;
  }

  private async determineActions(context: ConversationContext): Promise<Array<{
    type: 'collect_document' | 'verify_data' | 'calculate_loan' | 'schedule_call' | 'create_application';
    data: any;
  }>> {
    const actions: Array<{
      type: 'collect_document' | 'verify_data' | 'calculate_loan' | 'schedule_call' | 'create_application';
      data: any;
    }> = [];

    // Document collection actions
    if (context.stage === 'document_collection') {
      const missingDocs = this.identifyMissingDocuments(context);
      for (const doc of missingDocs) {
        actions.push({
          type: 'collect_document',
          data: { documentType: doc, required: true }
        });
      }
    }

    // Data verification actions
    if (context.extractedData.ssn && !context.extractedData.creditScore) {
      actions.push({
        type: 'verify_data',
        data: { verificationType: 'credit', ssn: context.extractedData.ssn }
      });
    }

    // Loan calculation actions
    if (context.extractedData.income && context.extractedData.creditScore) {
      actions.push({
        type: 'calculate_loan',
        data: {
          income: context.extractedData.income,
          creditScore: context.extractedData.creditScore,
          downPayment: context.extractedData.downPayment || 0
        }
      });
    }

    // Application creation
    if (context.stage === 'application' && !context.applicationId) {
      actions.push({
        type: 'create_application',
        data: context.extractedData
      });
    }

    return actions;
  }

  private identifyMissingDocuments(context: ConversationContext): string[] {
    const requiredDocs = [
      'pay_stubs',
      'w2_forms',
      'tax_returns',
      'bank_statements',
      'identification',
      'proof_of_address'
    ];

    // Filter out already collected documents
    return requiredDocs.filter(doc => !context.requiredDocuments.includes(doc));
  }

  private determineNextSteps(context: ConversationContext): string[] {
    const steps: string[] = [];

    switch (context.stage) {
      case 'greeting':
        steps.push('Complete basic information');
        steps.push('Verify contact details');
        break;
      case 'qualification':
        steps.push('Submit financial information');
        steps.push('Authorize credit check');
        break;
      case 'document_collection':
        steps.push('Upload required documents');
        steps.push('Complete document verification');
        break;
      case 'application':
        steps.push('Review loan options');
        steps.push('Select preferred loan product');
        break;
      case 'underwriting':
        steps.push('Await underwriting decision');
        steps.push('Provide additional information if requested');
        break;
      case 'closing':
        steps.push('Schedule closing appointment');
        steps.push('Review closing documents');
        break;
    }

    return steps;
  }

  async performDataExtraction(source: 'credit_bureau' | 'property_data' | 'employment' | 'bank', data: any): Promise<DataExtractionResult[]> {
    const results: DataExtractionResult[] = [];

    switch (source) {
      case 'credit_bureau':
        results.push({
          field: 'creditScore',
          value: data.score || 0,
          confidence: 0.95,
          source: 'Experian',
          validated: true
        });
        results.push({
          field: 'debtToIncome',
          value: data.dti || 0,
          confidence: 0.90,
          source: 'Credit Report',
          validated: true
        });
        break;

      case 'property_data':
        results.push({
          field: 'propertyValue',
          value: data.estimatedValue || 0,
          confidence: 0.85,
          source: 'Zillow API',
          validated: true
        });
        results.push({
          field: 'propertyTax',
          value: data.annualTax || 0,
          confidence: 0.80,
          source: 'County Records',
          validated: true
        });
        break;

      case 'employment':
        results.push({
          field: 'employmentStatus',
          value: data.status || 'unknown',
          confidence: 0.90,
          source: 'The Work Number',
          validated: true
        });
        results.push({
          field: 'monthlyIncome',
          value: data.monthlyIncome || 0,
          confidence: 0.88,
          source: 'Employer Verification',
          validated: true
        });
        break;

      case 'bank':
        results.push({
          field: 'bankBalance',
          value: data.currentBalance || 0,
          confidence: 0.95,
          source: 'Plaid',
          validated: true
        });
        results.push({
          field: 'monthlyDeposits',
          value: data.averageMonthlyDeposits || 0,
          confidence: 0.92,
          source: 'Bank Statement Analysis',
          validated: true
        });
        break;
    }

    return results;
  }

  async createLoanApplication(sessionId: string): Promise<number> {
    const context = this.activeSessions.get(sessionId);
    if (!context) throw new Error('Session not found');

    // Create borrower record
    const borrowerData = {
      firstName: context.extractedData.firstName || '',
      lastName: context.extractedData.lastName || '',
      email: context.extractedData.email || '',
      phone: context.extractedData.phone || '',
      currentAddress: context.extractedData.currentAddress || '',
      employmentStatus: context.extractedData.employmentStatus || 'employed',
      annualIncome: parseFloat(context.extractedData.income) || 0,
      creditScore: parseInt(context.extractedData.creditScore) || 0,
      createdAt: new Date()
    };

    const [borrower] = await db.insert(borrowers).values(borrowerData).returning();
    context.borrowerId = borrower.id;

    // Create property record if property info exists
    let propertyId = null;
    if (context.extractedData.propertyAddress) {
      const [property] = await db.insert(properties).values({
        address: context.extractedData.propertyAddress,
        city: context.extractedData.propertyCity || '',
        state: context.extractedData.propertyState || '',
        zipCode: context.extractedData.propertyZip || '',
        propertyType: context.extractedData.propertyType || 'single_family',
        purchasePrice: parseFloat(context.extractedData.purchasePrice) || 0,
        currentValue: parseFloat(context.extractedData.propertyValue) || 0,
        yearBuilt: parseInt(context.extractedData.yearBuilt) || new Date().getFullYear(),
        squareFootage: parseInt(context.extractedData.squareFootage) || 0
      }).returning();
      propertyId = property.id;
    }

    // Create loan application
    const [application] = await db.insert(loanApplications).values({
      borrowerId: borrower.id,
      propertyId: propertyId,
      loanType: context.extractedData.loanType || 'conventional',
      loanPurpose: context.extractedData.loanPurpose || 'purchase',
      loanAmount: parseFloat(context.extractedData.loanAmount) || 0,
      downPayment: parseFloat(context.extractedData.downPayment) || 0,
      interestRate: 0, // Will be calculated
      loanTerm: parseInt(context.extractedData.loanTerm) || 360,
      status: 'application_started',
      assignedTo: 1, // AI Advisor
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    context.applicationId = application.id;
    return application.id;
  }

  async performUnderwriting(applicationId: number): Promise<{
    approved: boolean;
    conditions: string[];
    rate: number;
    reasons: string[];
  }> {
    // Get application details
    const [application] = await db.select().from(loanApplications).where(eq(loanApplications.id, applicationId));
    const [borrower] = await db.select().from(borrowers).where(eq(borrowers.id, application.borrowerId));

    // Calculate approval based on multiple factors
    const creditScore = borrower.creditScore || 0;
    const dti = (application.loanAmount / 12) / (borrower.annualIncome / 12);
    const ltv = application.loanAmount / (application.loanAmount + application.downPayment);

    let approved = true;
    const conditions: string[] = [];
    const reasons: string[] = [];

    // Credit score check
    if (creditScore < 620) {
      approved = false;
      reasons.push('Credit score below minimum requirement (620)');
    } else if (creditScore < 680) {
      conditions.push('Provide letter of explanation for credit issues');
    }

    // DTI check
    if (dti > 0.43) {
      approved = false;
      reasons.push('Debt-to-income ratio exceeds maximum (43%)');
    } else if (dti > 0.36) {
      conditions.push('Provide additional income documentation');
    }

    // LTV check
    if (ltv > 0.95) {
      approved = false;
      reasons.push('Loan-to-value ratio exceeds maximum (95%)');
    } else if (ltv > 0.80) {
      conditions.push('Private mortgage insurance required');
    }

    // Calculate rate based on risk factors
    let baseRate = 6.5;
    if (creditScore >= 760) baseRate -= 0.5;
    else if (creditScore >= 700) baseRate -= 0.25;
    else if (creditScore < 660) baseRate += 0.5;

    if (ltv <= 0.60) baseRate -= 0.25;
    else if (ltv > 0.80) baseRate += 0.25;

    return {
      approved,
      conditions,
      rate: Math.round(baseRate * 100) / 100,
      reasons
    };
  }

  async getSessionAnalytics(sessionId: string): Promise<{
    duration: number;
    messagesExchanged: number;
    dataCompleteness: number;
    conversionProbability: number;
    recommendedActions: string[];
  }> {
    const context = this.activeSessions.get(sessionId);
    if (!context) throw new Error('Session not found');

    const firstMessage = context.conversationHistory[0]?.timestamp || new Date();
    const lastMessage = context.conversationHistory[context.conversationHistory.length - 1]?.timestamp || new Date();
    const duration = (lastMessage.getTime() - firstMessage.getTime()) / 1000 / 60; // minutes

    const requiredFields = [
      'firstName', 'lastName', 'email', 'phone', 'income', 
      'creditScore', 'propertyType', 'loanPurpose', 'loanAmount'
    ];
    const completedFields = requiredFields.filter(field => context.extractedData[field]);
    const dataCompleteness = completedFields.length / requiredFields.length;

    // Calculate conversion probability based on engagement and data
    let conversionProbability = 0.5;
    if (dataCompleteness > 0.8) conversionProbability += 0.3;
    if (context.conversationHistory.length > 10) conversionProbability += 0.1;
    if (context.stage === 'underwriting' || context.stage === 'closing') conversionProbability = 0.9;

    const recommendedActions: string[] = [];
    if (dataCompleteness < 0.5) {
      recommendedActions.push('Send follow-up email with simplified application link');
    }
    if (!context.extractedData.creditScore) {
      recommendedActions.push('Offer soft credit check to provide accurate rates');
    }
    if (duration > 30 && context.stage === 'greeting') {
      recommendedActions.push('Schedule callback with human loan officer');
    }

    return {
      duration,
      messagesExchanged: context.conversationHistory.length,
      dataCompleteness,
      conversionProbability,
      recommendedActions
    };
  }
}

export const autonomousAIAdvisor = AutonomousAIAdvisor.getInstance();