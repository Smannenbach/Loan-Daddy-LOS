// Marketing Automation and CRM Integration Service
// Handles webhook integrations from Make, Zapier, Facebook Leads, HighLevel CRM, etc.

import { storage } from './storage';
import { aiLoanAdvisor, BorrowerProfile } from './ai-loan-advisor';
import { propertyDataService } from './property-data-service';

export interface LeadData {
  source: string; // 'facebook', 'google', 'highlevel', 'manual', etc.
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  propertyAddress?: string;
  loanAmount?: number;
  loanPurpose?: string;
  timeline?: string;
  creditScore?: number;
  experience?: string;
  additionalData?: Record<string, any>;
  campaignId?: string;
  adSetId?: string;
  leadScore?: number;
}

export interface WebhookPayload {
  source: string;
  data: any;
  timestamp: string;
  signature?: string;
  headers?: Record<string, string>;
}

export class MarketingIntegrationService {
  private static instance: MarketingIntegrationService;

  public static getInstance(): MarketingIntegrationService {
    if (!MarketingIntegrationService.instance) {
      MarketingIntegrationService.instance = new MarketingIntegrationService();
    }
    return MarketingIntegrationService.instance;
  }

  // Process incoming webhooks from various marketing platforms
  async processWebhook(payload: WebhookPayload): Promise<{ success: boolean; leadId?: number; message: string }> {
    try {
      const leadData = await this.parseWebhookData(payload);
      const leadId = await this.createLead(leadData);
      
      // Trigger AI advisor analysis and outreach
      await this.initiateAIOutreach(leadId, leadData);
      
      return { success: true, leadId, message: 'Lead processed successfully' };
    } catch (error) {
      console.error('Webhook processing error:', error);
      return { success: false, message: `Error processing webhook: ${error.message}` };
    }
  }

  private async parseWebhookData(payload: WebhookPayload): Promise<LeadData> {
    switch (payload.source.toLowerCase()) {
      case 'facebook':
        return this.parseFacebookLead(payload.data);
      case 'highlevel':
        return this.parseHighLevelLead(payload.data);
      case 'zapier':
        return this.parseZapierLead(payload.data);
      case 'make':
        return this.parseMakeLead(payload.data);
      case 'google':
        return this.parseGoogleLead(payload.data);
      default:
        return this.parseGenericLead(payload.data);
    }
  }

  private parseFacebookLead(data: any): LeadData {
    // Facebook Lead Ads format
    const fieldData = data.field_data || [];
    const fields: Record<string, string> = {};
    
    fieldData.forEach((field: any) => {
      fields[field.name] = field.values?.[0] || '';
    });

    return {
      source: 'facebook',
      firstName: fields.first_name || fields.full_name?.split(' ')[0] || '',
      lastName: fields.last_name || fields.full_name?.split(' ').slice(1).join(' ') || '',
      email: fields.email || '',
      phone: fields.phone_number || '',
      propertyAddress: fields.property_address || fields.address || '',
      loanAmount: parseInt(fields.loan_amount || '0'),
      loanPurpose: fields.loan_purpose || fields.project_type || '',
      timeline: fields.timeline || fields.when_to_close || '',
      creditScore: parseInt(fields.credit_score || '0'),
      experience: fields.experience || fields.investor_experience || '',
      additionalData: {
        campaignId: data.campaign_id,
        adSetId: data.adset_id,
        leadId: data.leadgen_id,
        platform: data.platform || 'facebook'
      }
    };
  }

  private parseHighLevelLead(data: any): LeadData {
    // HighLevel CRM format
    return {
      source: 'highlevel',
      firstName: data.firstName || data.first_name || '',
      lastName: data.lastName || data.last_name || '',
      email: data.email || '',
      phone: data.phone || data.phoneNumber || '',
      propertyAddress: data.address || data.propertyAddress || '',
      loanAmount: parseInt(data.loanAmount || data.loan_amount || '0'),
      loanPurpose: data.loanPurpose || data.loan_purpose || '',
      timeline: data.timeline || data.timeframe || '',
      creditScore: parseInt(data.creditScore || data.credit_score || '0'),
      experience: data.experience || data.investorExperience || '',
      additionalData: {
        contactId: data.contactId,
        pipelineId: data.pipelineId,
        source: data.source,
        tags: data.tags || []
      }
    };
  }

  private parseZapierLead(data: any): LeadData {
    // Zapier webhook format (can vary based on trigger source)
    return {
      source: 'zapier',
      firstName: data.firstName || data.first_name || data['First Name'] || '',
      lastName: data.lastName || data.last_name || data['Last Name'] || '',
      email: data.email || data.Email || '',
      phone: data.phone || data.Phone || data.phoneNumber || '',
      propertyAddress: data.propertyAddress || data['Property Address'] || '',
      loanAmount: parseInt(data.loanAmount || data['Loan Amount'] || '0'),
      loanPurpose: data.loanPurpose || data['Loan Purpose'] || '',
      timeline: data.timeline || data.Timeline || '',
      creditScore: parseInt(data.creditScore || data['Credit Score'] || '0'),
      experience: data.experience || data.Experience || '',
      additionalData: {
        zapierSource: data._zapier_source,
        originalData: data
      }
    };
  }

  private parseMakeLead(data: any): LeadData {
    // Make (formerly Integromat) webhook format
    return {
      source: 'make',
      firstName: data.firstName || data.first_name || '',
      lastName: data.lastName || data.last_name || '',
      email: data.email || '',
      phone: data.phone || data.phoneNumber || '',
      propertyAddress: data.propertyAddress || data.address || '',
      loanAmount: parseInt(data.loanAmount || data.loan_amount || '0'),
      loanPurpose: data.loanPurpose || data.loan_purpose || '',
      timeline: data.timeline || data.timeframe || '',
      creditScore: parseInt(data.creditScore || data.credit_score || '0'),
      experience: data.experience || data.investor_experience || '',
      additionalData: {
        makeScenario: data._make_scenario,
        bundleId: data._bundle_id
      }
    };
  }

  private parseGoogleLead(data: any): LeadData {
    // Google Ads Lead Form Extensions
    return {
      source: 'google',
      firstName: data.user_column_data?.[0]?.string_value || '',
      lastName: data.user_column_data?.[1]?.string_value || '',
      email: data.user_column_data?.find((col: any) => col.column_id === 'EMAIL')?.string_value || '',
      phone: data.user_column_data?.find((col: any) => col.column_id === 'PHONE_NUMBER')?.string_value || '',
      propertyAddress: data.user_column_data?.find((col: any) => col.column_id?.includes('ADDRESS'))?.string_value || '',
      loanAmount: parseInt(data.user_column_data?.find((col: any) => col.column_id?.includes('LOAN_AMOUNT'))?.string_value || '0'),
      additionalData: {
        campaignId: data.campaign_id,
        leadId: data.lead_id,
        gclidId: data.gclid
      }
    };
  }

  private parseGenericLead(data: any): LeadData {
    // Generic webhook parser for custom integrations
    return {
      source: 'generic',
      firstName: data.firstName || data.first_name || '',
      lastName: data.lastName || data.last_name || '',
      email: data.email || '',
      phone: data.phone || data.phoneNumber || '',
      propertyAddress: data.propertyAddress || data.address || '',
      loanAmount: parseInt(data.loanAmount || '0'),
      loanPurpose: data.loanPurpose || '',
      timeline: data.timeline || '',
      creditScore: parseInt(data.creditScore || '0'),
      experience: data.experience || '',
      additionalData: data
    };
  }

  private async createLead(leadData: LeadData): Promise<number> {
    // Create borrower record
    const borrower = await storage.createBorrower({
      firstName: leadData.firstName,
      lastName: leadData.lastName,
      email: leadData.email,
      phone: leadData.phone,
      ssn: null,
      dateOfBirth: null,
      currentStreet: '',
      currentCity: '',
      currentState: '',
      currentZip: '',
      creditScore: leadData.creditScore || null,
      employmentStatus: 'employed',
      source: leadData.source,
      leadScore: leadData.leadScore || this.calculateLeadScore(leadData)
    });

    // Create initial loan application
    const loanApplication = await storage.createLoanApplication({
      borrowerId: borrower.id,
      propertyId: null,
      loanType: leadData.loanPurpose === 'flip' ? 'fix_flip' : 'dscr',
      loanAmount: leadData.loanAmount || 0,
      loanPurpose: leadData.loanPurpose || 'purchase',
      propertyAddress: leadData.propertyAddress || '',
      status: 'pre_qualification',
      stage: 'lead_intake',
      source: leadData.source,
      campaignData: leadData.additionalData
    });

    // Create initial task for follow-up
    await storage.createTask({
      loanApplicationId: loanApplication.id,
      assignedToId: 1, // Default to admin user
      title: `New ${leadData.source} lead - ${leadData.firstName} ${leadData.lastName}`,
      description: `Follow up on new lead from ${leadData.source}. Loan amount: $${leadData.loanAmount?.toLocaleString()}`,
      status: 'pending',
      priority: this.getPriorityFromLeadScore(leadData.leadScore || 50),
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
    });

    return loanApplication.id;
  }

  private calculateLeadScore(leadData: LeadData): number {
    let score = 50; // Base score

    // Phone number provided
    if (leadData.phone) score += 15;
    
    // Loan amount in reasonable range
    if (leadData.loanAmount && leadData.loanAmount >= 100000 && leadData.loanAmount <= 5000000) {
      score += 20;
    }
    
    // Credit score provided and good
    if (leadData.creditScore) {
      if (leadData.creditScore >= 700) score += 15;
      else if (leadData.creditScore >= 600) score += 10;
      else score += 5;
    }
    
    // Experience level
    if (leadData.experience === 'experienced' || leadData.experience === 'expert') {
      score += 10;
    }
    
    // Property address provided
    if (leadData.propertyAddress) score += 10;
    
    // Urgent timeline
    if (leadData.timeline === 'urgent' || leadData.timeline === '30_days') {
      score += 10;
    }

    return Math.min(Math.max(score, 0), 100);
  }

  private getPriorityFromLeadScore(score: number): string {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  private async initiateAIOutreach(loanApplicationId: number, leadData: LeadData): Promise<void> {
    try {
      // Build borrower profile for AI analysis
      const profile: BorrowerProfile = {
        creditScore: leadData.creditScore,
        experience: leadData.experience,
        loanAmount: leadData.loanAmount,
        loanPurpose: leadData.loanPurpose,
        timelineToFunding: leadData.timeline,
        liquidityPosition: 'unknown'
      };

      // Get property data if address provided
      if (leadData.propertyAddress) {
        const propertyData = await propertyDataService.getPropertyData(leadData.propertyAddress);
        if (propertyData) {
          profile.propertyValue = propertyData.estimatedValue;
          profile.propertyType = propertyData.propertyType;
          profile.yearBuilt = propertyData.yearBuilt;
          profile.squareFootage = propertyData.squareFootage;
          profile.propertyTaxes = propertyData.annualPropertyTaxes;
          profile.insurance = propertyData.estimatedInsurance;
          
          if (propertyData.rentalEstimates && leadData.loanPurpose === 'rental') {
            profile.dscrRatio = this.calculateDSCR(
              propertyData.rentalEstimates.monthlyRent,
              leadData.loanAmount || 0,
              propertyData.monthlyPropertyTaxes + propertyData.monthlyInsurance
            );
          }
        }
      }

      // Get AI loan recommendation
      const recommendation = await aiLoanAdvisor.analyzeBorrowerAndRecommendLoan(profile);

      // Create notification with AI recommendation
      await storage.createNotification({
        loanApplicationId,
        type: 'ai_recommendation',
        title: 'AI Loan Recommendation Available',
        message: `AI Analysis Complete: Recommended ${recommendation.loanProgram} at ${(recommendation.estimatedRate * 100).toFixed(2)}% rate. ${recommendation.reasoning}`,
        isRead: false,
        actionRequired: true,
        metadata: {
          recommendation,
          leadScore: leadData.leadScore,
          propertyData: leadData.propertyAddress ? true : false
        }
      });

      // Schedule automated follow-up sequence based on lead source
      await this.scheduleFollowUpSequence(loanApplicationId, leadData.source, recommendation);

    } catch (error) {
      console.error('AI outreach initiation error:', error);
    }
  }

  private calculateDSCR(monthlyRent: number, loanAmount: number, monthlyExpenses: number): number {
    if (loanAmount <= 0) return 0;
    
    // Assume 6.5% interest rate and 30-year amortization for rough calculation
    const monthlyPayment = this.calculateMonthlyPayment(loanAmount, 0.065, 30);
    const netOperatingIncome = monthlyRent - monthlyExpenses;
    
    return netOperatingIncome / monthlyPayment;
  }

  private calculateMonthlyPayment(principal: number, annualRate: number, years: number): number {
    const monthlyRate = annualRate / 12;
    const numPayments = years * 12;
    
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
           (Math.pow(1 + monthlyRate, numPayments) - 1);
  }

  private async scheduleFollowUpSequence(loanApplicationId: number, source: string, recommendation: any): Promise<void> {
    const sequences: Record<string, Array<{ delay: number; action: string; message: string }>> = {
      facebook: [
        { delay: 5, action: 'sms', message: 'Thanks for your interest! I have your loan recommendation ready.' },
        { delay: 60, action: 'email', message: 'Your personalized loan analysis is attached.' },
        { delay: 1440, action: 'call', message: 'Schedule follow-up call' }
      ],
      highlevel: [
        { delay: 10, action: 'email', message: 'Your loan pre-qualification is ready for review.' },
        { delay: 120, action: 'sms', message: 'Quick question about your timeline - when would you like to close?' }
      ],
      google: [
        { delay: 15, action: 'email', message: 'Thank you for your loan inquiry. Here are your options.' },
        { delay: 480, action: 'sms', message: 'Questions about your loan options? Reply CALL for immediate assistance.' }
      ]
    };

    const sequence = sequences[source] || sequences.facebook;
    
    for (const step of sequence) {
      await storage.createTask({
        loanApplicationId,
        assignedToId: 1,
        title: `Automated ${step.action.toUpperCase()} Follow-up`,
        description: step.message,
        status: 'scheduled',
        priority: 'medium',
        dueDate: new Date(Date.now() + step.delay * 60 * 1000), // Convert minutes to milliseconds
        metadata: {
          automationType: step.action,
          sequence: source,
          aiRecommendation: recommendation.loanType
        }
      });
    }
  }

  // Webhook validation methods
  validateFacebookWebhook(payload: any, signature: string): boolean {
    // Facebook webhook signature validation
    // Would implement HMAC SHA256 validation in production
    return true;
  }

  validateHighLevelWebhook(payload: any, signature: string): boolean {
    // HighLevel webhook validation
    return true;
  }

  // CRM sync methods
  async syncToHighLevel(loanApplicationId: number): Promise<boolean> {
    try {
      const application = await storage.getLoanApplicationWithDetails(loanApplicationId);
      if (!application) return false;

      // Would make API call to HighLevel to create/update contact
      // const response = await fetch('https://rest.gohighlevel.com/v1/contacts/', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${process.env.HIGHLEVEL_API_KEY}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     firstName: application.borrower.firstName,
      //     lastName: application.borrower.lastName,
      //     email: application.borrower.email,
      //     phone: application.borrower.phone,
      //     tags: [`loan-${application.loanType}`, `status-${application.status}`]
      //   })
      // });

      console.log('Would sync to HighLevel:', application.borrower.email);
      return true;
    } catch (error) {
      console.error('HighLevel sync error:', error);
      return false;
    }
  }
}

export const marketingIntegrations = MarketingIntegrationService.getInstance();