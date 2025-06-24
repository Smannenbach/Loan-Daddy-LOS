// CRM Integration Service for Salesforce, Jungo, Close.com, etc.

export interface CRMContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  title?: string;
  source: string;
  tags: string[];
  customFields: Record<string, any>;
}

export interface CRMDeal {
  id: string;
  contactId: string;
  amount: number;
  stage: string;
  probability: number;
  expectedCloseDate: string;
  description: string;
}

// Salesforce Integration
export class SalesforceIntegration {
  private accessToken: string | null = null;
  private instanceUrl: string | null = null;

  async authenticate(clientId: string, clientSecret: string, username: string, password: string): Promise<boolean> {
    try {
      const authUrl = 'https://login.salesforce.com/services/oauth2/token';
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: clientId,
          client_secret: clientSecret,
          username: username,
          password: password
        })
      });

      const data = await response.json();
      if (data.access_token) {
        this.accessToken = data.access_token;
        this.instanceUrl = data.instance_url;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Salesforce authentication error:', error);
      return false;
    }
  }

  async syncContact(contact: CRMContact): Promise<string | null> {
    if (!this.accessToken || !this.instanceUrl) return null;

    try {
      const salesforceContact = {
        FirstName: contact.firstName,
        LastName: contact.lastName,
        Email: contact.email,
        Phone: contact.phone,
        Title: contact.title,
        Account: { Name: contact.company }
      };

      const response = await fetch(`${this.instanceUrl}/services/data/v59.0/sobjects/Contact/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(salesforceContact)
      });

      const result = await response.json();
      return result.id || null;
    } catch (error) {
      console.error('Salesforce contact sync error:', error);
      return null;
    }
  }
}

// Close.com Integration
export class CloseIntegration {
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.CLOSE_API_KEY || null;
  }

  async syncContact(contact: CRMContact): Promise<string | null> {
    if (!this.apiKey) return null;

    try {
      const closeContact = {
        name: `${contact.firstName} ${contact.lastName}`,
        contacts: [{
          name: `${contact.firstName} ${contact.lastName}`,
          emails: [{ type: 'office', email: contact.email }],
          phones: [{ type: 'office', phone: contact.phone }]
        }]
      };

      const response = await fetch('https://api.close.com/api/v1/lead/', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(closeContact)
      });

      const result = await response.json();
      return result.id || null;
    } catch (error) {
      console.error('Close.com contact sync error:', error);
      return null;
    }
  }

  async createOpportunity(deal: CRMDeal): Promise<string | null> {
    if (!this.apiKey) return null;

    try {
      const opportunity = {
        lead_id: deal.contactId,
        status_id: 'stat_default',
        value: deal.amount,
        value_period: 'one_time',
        confidence: deal.probability,
        note: deal.description,
        expected_date: deal.expectedCloseDate
      };

      const response = await fetch('https://api.close.com/api/v1/opportunity/', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(opportunity)
      });

      const result = await response.json();
      return result.id || null;
    } catch (error) {
      console.error('Close.com opportunity creation error:', error);
      return null;
    }
  }
}

// Jungo CRM Integration
export class JungoIntegration {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.jungocrm.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.JUNGO_API_KEY || null;
  }

  async syncContact(contact: CRMContact): Promise<string | null> {
    if (!this.apiKey) return null;

    try {
      const jungoContact = {
        first_name: contact.firstName,
        last_name: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        title: contact.title,
        source: contact.source,
        tags: contact.tags.join(',')
      };

      const response = await fetch(`${this.baseUrl}/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jungoContact)
      });

      const result = await response.json();
      return result.id || null;
    } catch (error) {
      console.error('Jungo CRM contact sync error:', error);
      return null;
    }
  }
}

// CRM Service Orchestrator
export class CRMIntegrationService {
  private static instance: CRMIntegrationService;
  private salesforce: SalesforceIntegration;
  private close: CloseIntegration;
  private jungo: JungoIntegration;

  private constructor() {
    this.salesforce = new SalesforceIntegration();
    this.close = new CloseIntegration();
    this.jungo = new JungoIntegration();
  }

  public static getInstance(): CRMIntegrationService {
    if (!CRMIntegrationService.instance) {
      CRMIntegrationService.instance = new CRMIntegrationService();
    }
    return CRMIntegrationService.instance;
  }

  async syncContactToAllCRMs(contact: CRMContact): Promise<Record<string, string | null>> {
    const results = await Promise.allSettled([
      this.salesforce.syncContact(contact),
      this.close.syncContact(contact),
      this.jungo.syncContact(contact)
    ]);

    return {
      salesforce: results[0].status === 'fulfilled' ? results[0].value : null,
      close: results[1].status === 'fulfilled' ? results[1].value : null,
      jungo: results[2].status === 'fulfilled' ? results[2].value : null
    };
  }

  async syncContactToSpecificCRM(contact: CRMContact, crmType: 'salesforce' | 'close' | 'jungo'): Promise<string | null> {
    switch (crmType) {
      case 'salesforce':
        return await this.salesforce.syncContact(contact);
      case 'close':
        return await this.close.syncContact(contact);
      case 'jungo':
        return await this.jungo.syncContact(contact);
      default:
        return null;
    }
  }

  async setupSalesforceAuth(clientId: string, clientSecret: string, username: string, password: string): Promise<boolean> {
    return await this.salesforce.authenticate(clientId, clientSecret, username, password);
  }
}

export const crmIntegrationService = CRMIntegrationService.getInstance();