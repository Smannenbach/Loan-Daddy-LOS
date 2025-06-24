// E-Signature Service (DocuSign-style functionality)

export interface SignatureField {
  id: string;
  type: 'signature' | 'initial' | 'date' | 'text' | 'checkbox';
  label: string;
  required: boolean;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  signerEmail: string;
  signerName: string;
  value?: string;
  signatureImage?: string;
}

export interface SigningSession {
  id: string;
  documentId: string;
  documentName: string;
  documentUrl: string;
  status: 'pending' | 'in_progress' | 'completed' | 'declined' | 'expired';
  signers: Array<{
    email: string;
    name: string;
    role: string;
    status: 'pending' | 'signed' | 'declined';
    signedAt?: Date;
    ipAddress?: string;
  }>;
  signatureFields: SignatureField[];
  createdAt: Date;
  expiresAt: Date;
  completedAt?: Date;
  emailSubject: string;
  emailMessage: string;
}

export interface SigningEvent {
  sessionId: string;
  signerEmail: string;
  eventType: 'sent' | 'opened' | 'signed' | 'declined' | 'expired';
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

export class ESignatureService {
  private static instance: ESignatureService;
  private sessions: Map<string, SigningSession> = new Map();
  private events: SigningEvent[] = [];

  private constructor() {}

  public static getInstance(): ESignatureService {
    if (!ESignatureService.instance) {
      ESignatureService.instance = new ESignatureService();
    }
    return ESignatureService.instance;
  }

  async createSigningSession(
    documentUrl: string,
    documentName: string,
    signers: Array<{ email: string; name: string; role: string }>,
    signatureFields: Omit<SignatureField, 'id'>[],
    options: {
      emailSubject?: string;
      emailMessage?: string;
      expirationDays?: number;
    } = {}
  ): Promise<string> {
    const sessionId = `sign_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const session: SigningSession = {
      id: sessionId,
      documentId: `doc_${Date.now()}`,
      documentName,
      documentUrl,
      status: 'pending',
      signers: signers.map(signer => ({
        ...signer,
        status: 'pending'
      })),
      signatureFields: signatureFields.map((field, index) => ({
        ...field,
        id: `field_${index}_${Date.now()}`
      })),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (options.expirationDays || 30) * 24 * 60 * 60 * 1000),
      emailSubject: options.emailSubject || `Please sign: ${documentName}`,
      emailMessage: options.emailMessage || 'Please review and sign the attached document.'
    };

    this.sessions.set(sessionId, session);

    // Send signing invitations
    await this.sendSigningInvitations(session);

    return sessionId;
  }

  private async sendSigningInvitations(session: SigningSession): Promise<void> {
    for (const signer of session.signers) {
      try {
        const signingUrl = this.generateSigningUrl(session.id, signer.email);
        
        await this.sendSigningEmail(
          signer.email,
          signer.name,
          session.emailSubject,
          session.emailMessage,
          signingUrl,
          session.documentName
        );

        this.logEvent({
          sessionId: session.id,
          signerEmail: signer.email,
          eventType: 'sent',
          timestamp: new Date(),
          ipAddress: '',
          userAgent: ''
        });
      } catch (error) {
        console.error(`Failed to send signing invitation to ${signer.email}:`, error);
      }
    }
  }

  private generateSigningUrl(sessionId: string, signerEmail: string): string {
    const token = Buffer.from(`${sessionId}:${signerEmail}`).toString('base64');
    return `${process.env.BASE_URL}/sign/${sessionId}?token=${token}`;
  }

  private async sendSigningEmail(
    email: string,
    name: string,
    subject: string,
    message: string,
    signingUrl: string,
    documentName: string
  ): Promise<void> {
    const emailBody = `
Dear ${name},

${message}

Document: ${documentName}

Please click the link below to review and sign the document:
${signingUrl}

This signing request will expire in 30 days.

If you have any questions, please contact us.

Best regards,
LoanFlow Pro Team
`;

    // Use email integration service
    const { emailIntegration } = await import('./email-integration');
    
    await emailIntegration.sendCustomEmail({
      id: '',
      contactId: 0,
      to: [email],
      subject,
      body: emailBody,
      isHtml: false,
      status: 'draft',
      timestamp: new Date()
    });
  }

  async getSigningSession(sessionId: string): Promise<SigningSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async validateSigningAccess(sessionId: string, signerEmail: string, token: string): Promise<boolean> {
    const expectedToken = Buffer.from(`${sessionId}:${signerEmail}`).toString('base64');
    return token === expectedToken;
  }

  async recordDocumentView(sessionId: string, signerEmail: string, ipAddress: string, userAgent: string): Promise<void> {
    this.logEvent({
      sessionId,
      signerEmail,
      eventType: 'opened',
      timestamp: new Date(),
      ipAddress,
      userAgent
    });
  }

  async processSignature(
    sessionId: string,
    signerEmail: string,
    signatures: Array<{
      fieldId: string;
      value: string;
      signatureImage?: string;
    }>,
    ipAddress: string,
    userAgent: string
  ): Promise<{ success: boolean; message: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, message: 'Session not found' };
    }

    if (session.status === 'completed' || session.status === 'expired') {
      return { success: false, message: 'Document already completed or expired' };
    }

    if (new Date() > session.expiresAt) {
      session.status = 'expired';
      return { success: false, message: 'Signing session has expired' };
    }

    // Find the signer
    const signer = session.signers.find(s => s.email === signerEmail);
    if (!signer) {
      return { success: false, message: 'Signer not found' };
    }

    if (signer.status === 'signed') {
      return { success: false, message: 'Document already signed by this signer' };
    }

    // Validate required fields
    const requiredFields = session.signatureFields.filter(f => f.required && f.signerEmail === signerEmail);
    const providedFieldIds = signatures.map(s => s.fieldId);
    const missingFields = requiredFields.filter(f => !providedFieldIds.includes(f.id));

    if (missingFields.length > 0) {
      return { success: false, message: 'Missing required signature fields' };
    }

    // Apply signatures to fields
    signatures.forEach(sig => {
      const field = session.signatureFields.find(f => f.id === sig.fieldId);
      if (field) {
        field.value = sig.value;
        field.signatureImage = sig.signatureImage;
      }
    });

    // Mark signer as signed
    signer.status = 'signed';
    signer.signedAt = new Date();
    signer.ipAddress = ipAddress;

    // Check if all signers have signed
    const allSigned = session.signers.every(s => s.status === 'signed');
    if (allSigned) {
      session.status = 'completed';
      session.completedAt = new Date();
      
      // Generate final signed document
      await this.generateSignedDocument(session);
    }

    this.sessions.set(sessionId, session);

    this.logEvent({
      sessionId,
      signerEmail,
      eventType: 'signed',
      timestamp: new Date(),
      ipAddress,
      userAgent
    });

    return { success: true, message: 'Document signed successfully' };
  }

  async declineToSign(
    sessionId: string,
    signerEmail: string,
    reason: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ success: boolean; message: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, message: 'Session not found' };
    }

    const signer = session.signers.find(s => s.email === signerEmail);
    if (!signer) {
      return { success: false, message: 'Signer not found' };
    }

    signer.status = 'declined';
    session.status = 'declined';

    this.sessions.set(sessionId, session);

    this.logEvent({
      sessionId,
      signerEmail,
      eventType: 'declined',
      timestamp: new Date(),
      ipAddress,
      userAgent
    });

    // Notify other parties of decline
    await this.notifyDeclined(session, signerEmail, reason);

    return { success: true, message: 'Document declined' };
  }

  private async generateSignedDocument(session: SigningSession): Promise<void> {
    // In a real implementation, this would:
    // 1. Take the original document
    // 2. Apply all signatures and field values
    // 3. Generate a new PDF with signatures embedded
    // 4. Store the final signed document
    // 5. Send completion notifications

    console.log(`Generating signed document for session ${session.id}`);
    
    // For now, we'll simulate this
    const signedDocumentUrl = `${process.env.BASE_URL}/signed-documents/${session.id}.pdf`;
    
    // Send completion emails
    await this.sendCompletionNotifications(session, signedDocumentUrl);
  }

  private async sendCompletionNotifications(session: SigningSession, signedDocumentUrl: string): Promise<void> {
    for (const signer of session.signers) {
      try {
        const emailBody = `
Dear ${signer.name},

The document "${session.documentName}" has been successfully completed by all parties.

You can download the signed document here: ${signedDocumentUrl}

Thank you for your cooperation.

Best regards,
LoanFlow Pro Team
`;

        const { emailIntegration } = await import('./email-integration');
        
        await emailIntegration.sendCustomEmail({
          id: '',
          contactId: 0,
          to: [signer.email],
          subject: `Completed: ${session.documentName}`,
          body: emailBody,
          isHtml: false,
          status: 'draft',
          timestamp: new Date()
        });
      } catch (error) {
        console.error(`Failed to send completion notification to ${signer.email}:`, error);
      }
    }
  }

  private async notifyDeclined(session: SigningSession, declinerEmail: string, reason: string): Promise<void> {
    const otherSigners = session.signers.filter(s => s.email !== declinerEmail);
    
    for (const signer of otherSigners) {
      try {
        const emailBody = `
Dear ${signer.name},

The document "${session.documentName}" has been declined by ${declinerEmail}.

Reason: ${reason}

Please contact us if you have any questions.

Best regards,
LoanFlow Pro Team
`;

        const { emailIntegration } = await import('./email-integration');
        
        await emailIntegration.sendCustomEmail({
          id: '',
          contactId: 0,
          to: [signer.email],
          subject: `Document Declined: ${session.documentName}`,
          body: emailBody,
          isHtml: false,
          status: 'draft',
          timestamp: new Date()
        });
      } catch (error) {
        console.error(`Failed to send decline notification to ${signer.email}:`, error);
      }
    }
  }

  private logEvent(event: SigningEvent): void {
    this.events.push(event);
  }

  async getSigningEvents(sessionId: string): Promise<SigningEvent[]> {
    return this.events.filter(e => e.sessionId === sessionId);
  }

  async getAllSessions(): Promise<SigningSession[]> {
    return Array.from(this.sessions.values());
  }

  async getSessionsByStatus(status: SigningSession['status']): Promise<SigningSession[]> {
    return Array.from(this.sessions.values()).filter(s => s.status === status);
  }

  async extendExpiration(sessionId: string, additionalDays: number): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.expiresAt = new Date(session.expiresAt.getTime() + additionalDays * 24 * 60 * 60 * 1000);
    this.sessions.set(sessionId, session);
    return true;
  }

  async cancelSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.status = 'expired';
    this.sessions.set(sessionId, session);
    return true;
  }

  // Signature validation
  validateSignature(signatureImage: string): boolean {
    // Basic validation - in production, implement proper signature analysis
    return signatureImage.length > 100; // Minimum signature complexity
  }

  // Generate signature field templates for common documents
  generateStandardSignatureFields(documentType: 'credit_auth' | 'broker_agreement' | 'financial_statement'): Omit<SignatureField, 'id'>[] {
    const baseFields = {
      credit_auth: [
        {
          type: 'signature' as const,
          label: 'Borrower Signature',
          required: true,
          page: 1,
          x: 100,
          y: 500,
          width: 200,
          height: 50,
          signerEmail: '',
          signerName: ''
        },
        {
          type: 'date' as const,
          label: 'Date',
          required: true,
          page: 1,
          x: 350,
          y: 500,
          width: 100,
          height: 30,
          signerEmail: '',
          signerName: ''
        }
      ],
      broker_agreement: [
        {
          type: 'signature' as const,
          label: 'Borrower Signature',
          required: true,
          page: 1,
          x: 100,
          y: 600,
          width: 200,
          height: 50,
          signerEmail: '',
          signerName: ''
        },
        {
          type: 'signature' as const,
          label: 'Broker Signature',
          required: true,
          page: 1,
          x: 100,
          y: 700,
          width: 200,
          height: 50,
          signerEmail: '',
          signerName: ''
        }
      ],
      financial_statement: [
        {
          type: 'signature' as const,
          label: 'Borrower Signature',
          required: true,
          page: 1,
          x: 100,
          y: 800,
          width: 200,
          height: 50,
          signerEmail: '',
          signerName: ''
        },
        {
          type: 'date' as const,
          label: 'Date',
          required: true,
          page: 1,
          x: 350,
          y: 800,
          width: 100,
          height: 30,
          signerEmail: '',
          signerName: ''
        }
      ]
    };

    return baseFields[documentType] || [];
  }
}

export const eSignatureService = ESignatureService.getInstance();