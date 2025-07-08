import { nanoid } from 'nanoid';

export interface CRMContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  source?: string;
  status: 'lead' | 'prospect' | 'qualified' | 'customer' | 'churned';
  tags: string[];
  customFields: Record<string, any>;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CRMDeal {
  id: string;
  contactId: string;
  name: string;
  value: number;
  currency: string;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number;
  closeDate: Date;
  loanType: 'DSCR' | 'Fix-and-Flip' | 'Bridge' | 'Commercial';
  propertyType?: string;
  loanAmount: number;
  propertyValue?: number;
  ownerUserId: string;
  activities: CRMActivity[];
  notes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CRMActivity {
  id: string;
  contactId: string;
  dealId?: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note' | 'document_upload' | 'application_submitted';
  subject: string;
  description?: string;
  outcome?: string;
  scheduledAt?: Date;
  completedAt?: Date;
  createdBy: string;
  createdAt: Date;
}

export interface CRMPipeline {
  id: string;
  name: string;
  stages: CRMStage[];
  deals: CRMDeal[];
  totalValue: number;
  avgDealSize: number;
  conversionRate: number;
  avgSalesCycle: number;
}

export interface CRMStage {
  id: string;
  name: string;
  probability: number;
  deals: string[];
  value: number;
  avgTimeInStage: number;
}

export interface CRMIntegration {
  platform: 'salesforce' | 'hubspot' | 'pipedrive' | 'zoho' | 'highlevel';
  apiKey: string;
  endpoint: string;
  lastSyncAt: Date;
  status: 'active' | 'inactive' | 'error';
  syncedContacts: number;
  syncedDeals: number;
  errorLog: string[];
}

export interface CRMAnalytics {
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalContacts: number;
    newContacts: number;
    totalDeals: number;
    newDeals: number;
    totalValue: number;
    avgDealSize: number;
    conversionRate: number;
    avgSalesCycle: number;
    activitiesCompleted: number;
    topPerformers: Array<{
      userId: string;
      name: string;
      deals: number;
      value: number;
    }>;
  };
  funnel: Array<{
    stage: string;
    count: number;
    value: number;
    conversionRate: number;
  }>;
  trends: {
    contactsOverTime: Array<{ date: string; count: number }>;
    dealsOverTime: Array<{ date: string; count: number; value: number }>;
    pipelineVelocity: Array<{ date: string; velocity: number }>;
  };
}

export class CRMIntegrationsService {
  private static instance: CRMIntegrationsService;
  private contacts: Map<string, CRMContact> = new Map();
  private deals: Map<string, CRMDeal> = new Map();
  private activities: Map<string, CRMActivity[]> = new Map();
  private pipelines: Map<string, CRMPipeline> = new Map();
  private integrations: Map<string, CRMIntegration> = new Map();

  private constructor() {
    this.initializeDefaultData();
  }

  public static getInstance(): CRMIntegrationsService {
    if (!CRMIntegrationsService.instance) {
      CRMIntegrationsService.instance = new CRMIntegrationsService();
    }
    return CRMIntegrationsService.instance;
  }

  private initializeDefaultData(): void {
    // Initialize default pipeline
    const defaultPipeline: CRMPipeline = {
      id: 'default',
      name: 'Commercial Loan Pipeline',
      stages: [
        { id: 'stage1', name: 'Lead', probability: 10, deals: [], value: 0, avgTimeInStage: 3 },
        { id: 'stage2', name: 'Qualified', probability: 25, deals: [], value: 0, avgTimeInStage: 7 },
        { id: 'stage3', name: 'Application', probability: 50, deals: [], value: 0, avgTimeInStage: 14 },
        { id: 'stage4', name: 'Underwriting', probability: 75, deals: [], value: 0, avgTimeInStage: 21 },
        { id: 'stage5', name: 'Approval', probability: 90, deals: [], value: 0, avgTimeInStage: 5 },
        { id: 'stage6', name: 'Closing', probability: 95, deals: [], value: 0, avgTimeInStage: 10 }
      ],
      deals: [],
      totalValue: 0,
      avgDealSize: 0,
      conversionRate: 0,
      avgSalesCycle: 60
    };

    this.pipelines.set('default', defaultPipeline);

    // Add sample contacts and deals
    this.generateSampleData();
  }

  private generateSampleData(): void {
    // Sample contacts
    const sampleContacts = [
      { firstName: 'John', lastName: 'Peterson', email: 'john.peterson@example.com', company: 'Peterson Properties', title: 'CEO' },
      { firstName: 'Sarah', lastName: 'Williams', email: 'sarah.w@example.com', company: 'Williams Investments', title: 'Principal' },
      { firstName: 'Michael', lastName: 'Chen', email: 'mchen@example.com', company: 'Chen Real Estate', title: 'Founder' },
      { firstName: 'Lisa', lastName: 'Rodriguez', email: 'lisa@example.com', company: 'Rodriguez Holdings', title: 'Managing Partner' },
      { firstName: 'David', lastName: 'Thompson', email: 'dthompson@example.com', company: 'Thompson Capital', title: 'President' }
    ];

    sampleContacts.forEach((contact, index) => {
      const contactId = `contact_${nanoid(12)}`;
      const crmContact: CRMContact = {
        id: contactId,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        company: contact.company,
        title: contact.title,
        source: ['website', 'referral', 'linkedin', 'cold_outreach'][Math.floor(Math.random() * 4)],
        status: ['lead', 'prospect', 'qualified'][Math.floor(Math.random() * 3)] as any,
        tags: ['commercial', 'high_value', 'multi_family'].slice(0, Math.floor(Math.random() * 3) + 1),
        customFields: {
          portfolioSize: Math.floor(Math.random() * 50) + 5,
          investmentExperience: ['Beginner', 'Intermediate', 'Expert'][Math.floor(Math.random() * 3)],
          creditScore: Math.floor(Math.random() * 200) + 650
        },
        lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      };

      this.contacts.set(contactId, crmContact);

      // Create deal for some contacts
      if (Math.random() > 0.3) {
        const dealId = `deal_${nanoid(12)}`;
        const loanTypes = ['DSCR', 'Fix-and-Flip', 'Bridge', 'Commercial'] as const;
        const stages = ['prospecting', 'qualification', 'proposal', 'negotiation'] as const;
        
        const deal: CRMDeal = {
          id: dealId,
          contactId,
          name: `${contact.company} - ${loanTypes[Math.floor(Math.random() * loanTypes.length)]} Loan`,
          value: Math.floor(Math.random() * 5000000) + 500000,
          currency: 'USD',
          stage: stages[Math.floor(Math.random() * stages.length)],
          probability: Math.floor(Math.random() * 80) + 10,
          closeDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000),
          loanType: loanTypes[Math.floor(Math.random() * loanTypes.length)],
          propertyType: ['Multi-Family', 'Single Family', 'Commercial', 'Mixed Use'][Math.floor(Math.random() * 4)],
          loanAmount: Math.floor(Math.random() * 2000000) + 200000,
          propertyValue: Math.floor(Math.random() * 3000000) + 300000,
          ownerUserId: `user_${Math.floor(Math.random() * 5) + 1}`,
          activities: [],
          notes: [`Initial contact with ${contact.firstName}`, 'Interested in commercial financing'],
          createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        };

        this.deals.set(dealId, deal);
      }
    });
  }

  async createContact(contactData: Partial<CRMContact>): Promise<CRMContact> {
    try {
      const contactId = `contact_${nanoid(12)}`;
      const contact: CRMContact = {
        id: contactId,
        firstName: contactData.firstName || '',
        lastName: contactData.lastName || '',
        email: contactData.email || '',
        phone: contactData.phone,
        company: contactData.company,
        title: contactData.title,
        source: contactData.source || 'manual',
        status: contactData.status || 'lead',
        tags: contactData.tags || [],
        customFields: contactData.customFields || {},
        lastActivity: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.contacts.set(contactId, contact);
      console.log(`CRM contact created: ${contactId}`);
      return contact;
    } catch (error) {
      console.error('Error creating CRM contact:', error);
      throw new Error(`Contact creation failed: ${error.message}`);
    }
  }

  async updateContact(contactId: string, updates: Partial<CRMContact>): Promise<CRMContact> {
    try {
      const contact = this.contacts.get(contactId);
      if (!contact) {
        throw new Error('Contact not found');
      }

      const updatedContact = {
        ...contact,
        ...updates,
        updatedAt: new Date()
      };

      this.contacts.set(contactId, updatedContact);
      console.log(`CRM contact updated: ${contactId}`);
      return updatedContact;
    } catch (error) {
      console.error('Error updating CRM contact:', error);
      throw new Error(`Contact update failed: ${error.message}`);
    }
  }

  async createDeal(dealData: Partial<CRMDeal>): Promise<CRMDeal> {
    try {
      const dealId = `deal_${nanoid(12)}`;
      const deal: CRMDeal = {
        id: dealId,
        contactId: dealData.contactId || '',
        name: dealData.name || 'New Deal',
        value: dealData.value || 0,
        currency: dealData.currency || 'USD',
        stage: dealData.stage || 'prospecting',
        probability: dealData.probability || 10,
        closeDate: dealData.closeDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        loanType: dealData.loanType || 'DSCR',
        propertyType: dealData.propertyType,
        loanAmount: dealData.loanAmount || 0,
        propertyValue: dealData.propertyValue,
        ownerUserId: dealData.ownerUserId || 'system',
        activities: [],
        notes: dealData.notes || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.deals.set(dealId, deal);
      console.log(`CRM deal created: ${dealId}`);
      return deal;
    } catch (error) {
      console.error('Error creating CRM deal:', error);
      throw new Error(`Deal creation failed: ${error.message}`);
    }
  }

  async updateDealStage(dealId: string, newStage: CRMDeal['stage']): Promise<CRMDeal> {
    try {
      const deal = this.deals.get(dealId);
      if (!deal) {
        throw new Error('Deal not found');
      }

      // Update probability based on stage
      const stageProbabilities = {
        prospecting: 10,
        qualification: 25,
        proposal: 50,
        negotiation: 75,
        closed_won: 100,
        closed_lost: 0
      };

      const updatedDeal = {
        ...deal,
        stage: newStage,
        probability: stageProbabilities[newStage],
        updatedAt: new Date()
      };

      this.deals.set(dealId, updatedDeal);

      // Log activity
      await this.logActivity({
        contactId: deal.contactId,
        dealId,
        type: 'note',
        subject: 'Deal Stage Updated',
        description: `Deal moved to ${newStage} stage`,
        createdBy: 'system'
      });

      console.log(`Deal stage updated: ${dealId} -> ${newStage}`);
      return updatedDeal;
    } catch (error) {
      console.error('Error updating deal stage:', error);
      throw new Error(`Deal stage update failed: ${error.message}`);
    }
  }

  async logActivity(activityData: Partial<CRMActivity>): Promise<CRMActivity> {
    try {
      const activityId = `activity_${nanoid(12)}`;
      const activity: CRMActivity = {
        id: activityId,
        contactId: activityData.contactId || '',
        dealId: activityData.dealId,
        type: activityData.type || 'note',
        subject: activityData.subject || 'Activity',
        description: activityData.description,
        outcome: activityData.outcome,
        scheduledAt: activityData.scheduledAt,
        completedAt: activityData.completedAt || new Date(),
        createdBy: activityData.createdBy || 'system',
        createdAt: new Date()
      };

      // Add to contact activities
      const contactActivities = this.activities.get(activity.contactId) || [];
      contactActivities.push(activity);
      this.activities.set(activity.contactId, contactActivities);

      // Update contact last activity
      const contact = this.contacts.get(activity.contactId);
      if (contact) {
        contact.lastActivity = new Date();
        this.contacts.set(activity.contactId, contact);
      }

      console.log(`CRM activity logged: ${activityId}`);
      return activity;
    } catch (error) {
      console.error('Error logging CRM activity:', error);
      throw new Error(`Activity logging failed: ${error.message}`);
    }
  }

  async getContactActivities(contactId: string): Promise<CRMActivity[]> {
    return this.activities.get(contactId) || [];
  }

  async getDealsByStage(stage: CRMDeal['stage']): Promise<CRMDeal[]> {
    return Array.from(this.deals.values()).filter(deal => deal.stage === stage);
  }

  async getContactDeals(contactId: string): Promise<CRMDeal[]> {
    return Array.from(this.deals.values()).filter(deal => deal.contactId === contactId);
  }

  async searchContacts(query: string): Promise<CRMContact[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.contacts.values()).filter(contact =>
      contact.firstName.toLowerCase().includes(searchTerm) ||
      contact.lastName.toLowerCase().includes(searchTerm) ||
      contact.email.toLowerCase().includes(searchTerm) ||
      contact.company?.toLowerCase().includes(searchTerm)
    );
  }

  async generateAnalytics(startDate?: Date, endDate?: Date): Promise<CRMAnalytics> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate || new Date();

      const allContacts = Array.from(this.contacts.values());
      const allDeals = Array.from(this.deals.values());
      const allActivities = Array.from(this.activities.values()).flat();

      // Filter by date range
      const periodContacts = allContacts.filter(c => c.createdAt >= start && c.createdAt <= end);
      const periodDeals = allDeals.filter(d => d.createdAt >= start && d.createdAt <= end);
      const periodActivities = allActivities.filter(a => a.createdAt >= start && a.createdAt <= end);

      // Calculate metrics
      const totalValue = allDeals.reduce((sum, deal) => sum + deal.value, 0);
      const avgDealSize = allDeals.length > 0 ? totalValue / allDeals.length : 0;
      const closedWonDeals = allDeals.filter(d => d.stage === 'closed_won');
      const conversionRate = allDeals.length > 0 ? (closedWonDeals.length / allDeals.length) * 100 : 0;

      // Calculate average sales cycle
      const avgSalesCycle = closedWonDeals.length > 0 
        ? closedWonDeals.reduce((sum, deal) => {
            const cycle = (deal.updatedAt.getTime() - deal.createdAt.getTime()) / (24 * 60 * 60 * 1000);
            return sum + cycle;
          }, 0) / closedWonDeals.length
        : 0;

      // Generate funnel data
      const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
      const funnel = stages.map(stage => {
        const stageDeals = allDeals.filter(d => d.stage === stage);
        const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
        const prevStageDeals = allDeals.filter(d => {
          const stageIndex = stages.indexOf(d.stage);
          return stageIndex < stages.indexOf(stage);
        });
        const conversionRate = prevStageDeals.length > 0 ? (stageDeals.length / prevStageDeals.length) * 100 : 0;

        return {
          stage,
          count: stageDeals.length,
          value: stageValue,
          conversionRate
        };
      });

      const analytics: CRMAnalytics = {
        period: { start, end },
        metrics: {
          totalContacts: allContacts.length,
          newContacts: periodContacts.length,
          totalDeals: allDeals.length,
          newDeals: periodDeals.length,
          totalValue,
          avgDealSize,
          conversionRate,
          avgSalesCycle,
          activitiesCompleted: periodActivities.length,
          topPerformers: this.generateTopPerformers()
        },
        funnel,
        trends: {
          contactsOverTime: this.generateContactsTrend(start, end),
          dealsOverTime: this.generateDealsTrend(start, end),
          pipelineVelocity: this.generateVelocityTrend(start, end)
        }
      };

      console.log('CRM analytics generated successfully');
      return analytics;
    } catch (error) {
      console.error('Error generating CRM analytics:', error);
      throw new Error(`Analytics generation failed: ${error.message}`);
    }
  }

  private generateTopPerformers(): Array<{ userId: string; name: string; deals: number; value: number }> {
    const performerMap = new Map<string, { deals: number; value: number }>();
    
    Array.from(this.deals.values()).forEach(deal => {
      const current = performerMap.get(deal.ownerUserId) || { deals: 0, value: 0 };
      performerMap.set(deal.ownerUserId, {
        deals: current.deals + 1,
        value: current.value + deal.value
      });
    });

    return Array.from(performerMap.entries())
      .map(([userId, stats]) => ({
        userId,
        name: `User ${userId}`,
        deals: stats.deals,
        value: stats.value
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }

  private generateContactsTrend(start: Date, end: Date): Array<{ date: string; count: number }> {
    const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    const trend: Array<{ date: string; count: number }> = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const count = Math.floor(Math.random() * 10) + 1;
      trend.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }

    return trend;
  }

  private generateDealsTrend(start: Date, end: Date): Array<{ date: string; count: number; value: number }> {
    const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    const trend: Array<{ date: string; count: number; value: number }> = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const count = Math.floor(Math.random() * 5) + 1;
      const value = count * (Math.floor(Math.random() * 1000000) + 500000);
      trend.push({
        date: date.toISOString().split('T')[0],
        count,
        value
      });
    }

    return trend;
  }

  private generateVelocityTrend(start: Date, end: Date): Array<{ date: string; velocity: number }> {
    const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    const trend: Array<{ date: string; velocity: number }> = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const velocity = Math.random() * 100 + 50; // 50-150 velocity score
      trend.push({
        date: date.toISOString().split('T')[0],
        velocity
      });
    }

    return trend;
  }

  async setupIntegration(platform: CRMIntegration['platform'], apiKey: string, endpoint: string): Promise<CRMIntegration> {
    try {
      const integration: CRMIntegration = {
        platform,
        apiKey,
        endpoint,
        lastSyncAt: new Date(),
        status: 'active',
        syncedContacts: 0,
        syncedDeals: 0,
        errorLog: []
      };

      this.integrations.set(platform, integration);
      console.log(`CRM integration setup: ${platform}`);
      return integration;
    } catch (error) {
      console.error('Error setting up CRM integration:', error);
      throw new Error(`Integration setup failed: ${error.message}`);
    }
  }

  async syncWithCRM(platform: CRMIntegration['platform']): Promise<{ contacts: number; deals: number; errors: string[] }> {
    try {
      const integration = this.integrations.get(platform);
      if (!integration) {
        throw new Error(`No integration found for ${platform}`);
      }

      // Simulate sync process
      const syncedContacts = Math.floor(Math.random() * 100) + 50;
      const syncedDeals = Math.floor(Math.random() * 50) + 25;
      const errors: string[] = [];

      // Update integration status
      integration.lastSyncAt = new Date();
      integration.syncedContacts += syncedContacts;
      integration.syncedDeals += syncedDeals;
      
      if (Math.random() > 0.9) {
        errors.push('API rate limit exceeded');
        integration.errorLog.push('API rate limit exceeded');
      }

      this.integrations.set(platform, integration);

      console.log(`CRM sync completed: ${platform} - ${syncedContacts} contacts, ${syncedDeals} deals`);
      return { contacts: syncedContacts, deals: syncedDeals, errors };
    } catch (error) {
      console.error('Error syncing with CRM:', error);
      throw new Error(`CRM sync failed: ${error.message}`);
    }
  }

  async getAllContacts(): Promise<CRMContact[]> {
    return Array.from(this.contacts.values());
  }

  async getAllDeals(): Promise<CRMDeal[]> {
    return Array.from(this.deals.values());
  }

  async getPipeline(pipelineId: string = 'default'): Promise<CRMPipeline | undefined> {
    return this.pipelines.get(pipelineId);
  }
}

export const crmIntegrations = CRMIntegrationsService.getInstance();