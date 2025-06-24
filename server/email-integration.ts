// Email Integration for Gmail and Microsoft Exchange
import { google } from 'googleapis';

export interface EmailMessage {
  id: string;
  contactId: number;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml: boolean;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
  status: 'draft' | 'sent' | 'delivered' | 'failed';
  timestamp: Date;
  threadId?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  isHtml: boolean;
  category: 'follow_up' | 'document_request' | 'rate_quote' | 'approval' | 'welcome' | 'custom';
  variables: string[];
}

// Gmail Integration
export class GmailIntegration {
  private oauth2Client: any;
  private gmail: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    if (process.env.GMAIL_REFRESH_TOKEN) {
      this.oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN
      });
    }

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  async sendEmail(message: EmailMessage): Promise<string | null> {
    try {
      const emailText = this.buildEmailMessage(message);
      
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: Buffer.from(emailText).toString('base64').replace(/\+/g, '-').replace(/\//g, '_')
        }
      });

      return response.data.id;
    } catch (error) {
      console.error('Gmail send error:', error);
      throw new Error('Failed to send email via Gmail');
    }
  }

  private buildEmailMessage(message: EmailMessage): string {
    const boundary = 'boundary_' + Math.random().toString(36).substring(7);
    let email = '';

    // Headers
    email += `To: ${message.to.join(', ')}\r\n`;
    if (message.cc && message.cc.length > 0) {
      email += `Cc: ${message.cc.join(', ')}\r\n`;
    }
    email += `Subject: ${message.subject}\r\n`;
    email += `MIME-Version: 1.0\r\n`;

    if (message.attachments && message.attachments.length > 0) {
      email += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
      
      // Body part
      email += `--${boundary}\r\n`;
      email += `Content-Type: ${message.isHtml ? 'text/html' : 'text/plain'}; charset=UTF-8\r\n\r\n`;
      email += `${message.body}\r\n\r\n`;

      // Attachments
      message.attachments.forEach(attachment => {
        email += `--${boundary}\r\n`;
        email += `Content-Type: ${attachment.contentType}; name="${attachment.filename}"\r\n`;
        email += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
        email += `Content-Transfer-Encoding: base64\r\n\r\n`;
        email += attachment.content.toString('base64') + '\r\n\r\n';
      });

      email += `--${boundary}--`;
    } else {
      email += `Content-Type: ${message.isHtml ? 'text/html' : 'text/plain'}; charset=UTF-8\r\n\r\n`;
      email += message.body;
    }

    return email;
  }

  async getEmails(query?: string, maxResults: number = 10): Promise<any[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query || 'in:inbox',
        maxResults: maxResults
      });

      const messages = response.data.messages || [];
      const emailDetails = await Promise.all(
        messages.map(async (msg: any) => {
          const detail = await this.gmail.users.messages.get({
            userId: 'me',
            id: msg.id
          });
          return detail.data;
        })
      );

      return emailDetails;
    } catch (error) {
      console.error('Gmail fetch error:', error);
      return [];
    }
  }
}

// Microsoft Exchange/Outlook Integration
export class ExchangeIntegration {
  private clientId: string | null = null;
  private clientSecret: string | null = null;
  private tenantId: string | null = null;
  private accessToken: string | null = null;

  constructor() {
    this.clientId = process.env.EXCHANGE_CLIENT_ID || null;
    this.clientSecret = process.env.EXCHANGE_CLIENT_SECRET || null;
    this.tenantId = process.env.EXCHANGE_TENANT_ID || null;
  }

  async authenticate(): Promise<boolean> {
    if (!this.clientId || !this.clientSecret || !this.tenantId) {
      return false;
    }

    try {
      const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: 'https://graph.microsoft.com/.default'
        })
      });

      const data = await response.json();
      if (data.access_token) {
        this.accessToken = data.access_token;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Exchange authentication error:', error);
      return false;
    }
  }

  async sendEmail(message: EmailMessage, userEmail: string): Promise<string | null> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    if (!this.accessToken) {
      throw new Error('Exchange authentication failed');
    }

    try {
      const outlookMessage = {
        subject: message.subject,
        body: {
          contentType: message.isHtml ? 'HTML' : 'Text',
          content: message.body
        },
        toRecipients: message.to.map(email => ({ emailAddress: { address: email } })),
        ccRecipients: message.cc?.map(email => ({ emailAddress: { address: email } })) || [],
        attachments: message.attachments?.map(att => ({
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: att.filename,
          contentType: att.contentType,
          contentBytes: att.content.toString('base64')
        })) || []
      };

      const response = await fetch(`https://graph.microsoft.com/v1.0/users/${userEmail}/sendMail`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: outlookMessage })
      });

      if (response.ok) {
        return 'sent'; // Exchange doesn't return message ID for sent emails
      }
      throw new Error('Failed to send email');
    } catch (error) {
      console.error('Exchange send error:', error);
      throw new Error('Failed to send email via Exchange');
    }
  }
}

// Email Service Orchestrator
export class EmailIntegrationService {
  private static instance: EmailIntegrationService;
  private gmail: GmailIntegration;
  private exchange: ExchangeIntegration;
  private templates: Map<string, EmailTemplate> = new Map();

  private constructor() {
    this.gmail = new GmailIntegration();
    this.exchange = new ExchangeIntegration();
    this.initializeTemplates();
  }

  public static getInstance(): EmailIntegrationService {
    if (!EmailIntegrationService.instance) {
      EmailIntegrationService.instance = new EmailIntegrationService();
    }
    return EmailIntegrationService.instance;
  }

  private initializeTemplates(): void {
    const templates: EmailTemplate[] = [
      {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to LoanFlow Pro - Let\'s Get Your Loan Started',
        body: `Hi {firstName},

Thank you for choosing LoanFlow Pro for your commercial financing needs! We're excited to help you secure the right loan for your investment property.

Here's what happens next:
1. Complete your loan application in our secure portal
2. Upload required documents
3. Schedule a call with your dedicated loan officer
4. Get pre-approved and lock your rate

Your loan officer {loanOfficerName} will contact you within 24 hours to discuss your specific needs.

Best regards,
The LoanFlow Pro Team`,
        isHtml: false,
        category: 'welcome',
        variables: ['firstName', 'loanOfficerName']
      },
      {
        id: 'document_request',
        name: 'Document Request',
        subject: 'Documents Needed for Your Loan Application',
        body: `Hi {firstName},

We're ready to move forward with your loan application! To complete the underwriting process, we need the following documents:

{documentList}

You can upload these documents securely at: {portalLink}

If you have any questions about these documents, please don't hesitate to call me at {loanOfficerPhone}.

Best regards,
{loanOfficerName}
{loanOfficerTitle}`,
        isHtml: false,
        category: 'document_request',
        variables: ['firstName', 'documentList', 'portalLink', 'loanOfficerPhone', 'loanOfficerName', 'loanOfficerTitle']
      },
      {
        id: 'rate_quote',
        name: 'Rate Quote',
        subject: 'Your Competitive Rate Quote - {propertyAddress}',
        body: `Hi {firstName},

Great news! Based on your loan application, here's your competitive rate quote:

📊 LOAN DETAILS:
• Loan Amount: ${'{loanAmount}'}
• Property Type: {propertyType}
• Loan Program: {loanProgram}
• Interest Rate: {interestRate}%
• Loan Term: {loanTerm}
• LTV: {ltv}%

💰 ESTIMATED MONTHLY PAYMENT: ${'{monthlyPayment}'}

This rate is valid for {rateValidDays} days. To lock this rate, please contact me within the next 48 hours.

Next steps:
1. Review the attached loan terms
2. Complete any missing documents
3. Schedule closing

Questions? Call me directly at {loanOfficerPhone}.

Best regards,
{loanOfficerName}`,
        isHtml: false,
        category: 'rate_quote',
        variables: ['firstName', 'propertyAddress', 'loanAmount', 'propertyType', 'loanProgram', 'interestRate', 'loanTerm', 'ltv', 'monthlyPayment', 'rateValidDays', 'loanOfficerPhone', 'loanOfficerName']
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  async sendEmailTemplate(
    templateId: string, 
    to: string[], 
    variables: Record<string, string>,
    provider: 'gmail' | 'exchange' = 'gmail',
    userEmail?: string
  ): Promise<string | null> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    let subject = template.subject;
    let body = template.body;

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      body = body.replace(new RegExp(placeholder, 'g'), value);
    });

    const message: EmailMessage = {
      id: '',
      contactId: 0,
      to,
      subject,
      body,
      isHtml: template.isHtml,
      status: 'draft',
      timestamp: new Date()
    };

    if (provider === 'gmail') {
      return await this.gmail.sendEmail(message);
    } else {
      if (!userEmail) {
        throw new Error('User email required for Exchange');
      }
      return await this.exchange.sendEmail(message, userEmail);
    }
  }

  async sendCustomEmail(message: EmailMessage, provider: 'gmail' | 'exchange' = 'gmail', userEmail?: string): Promise<string | null> {
    if (provider === 'gmail') {
      return await this.gmail.sendEmail(message);
    } else {
      if (!userEmail) {
        throw new Error('User email required for Exchange');
      }
      return await this.exchange.sendEmail(message, userEmail);
    }
  }

  getTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplate(id: string): EmailTemplate | undefined {
    return this.templates.get(id);
  }

  addTemplate(template: EmailTemplate): void {
    this.templates.set(template.id, template);
  }

  async getInboxEmails(provider: 'gmail' | 'exchange' = 'gmail', maxResults: number = 10): Promise<any[]> {
    if (provider === 'gmail') {
      return await this.gmail.getEmails('in:inbox', maxResults);
    } else {
      // Exchange inbox implementation would go here
      return [];
    }
  }
}

export const emailIntegration = EmailIntegrationService.getInstance();