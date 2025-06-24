// Twilio Integration for Phone and SMS
import { Twilio } from 'twilio';

export interface CallRecord {
  id: string;
  contactId: number;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'failed' | 'no-answer';
  duration?: number;
  recordingUrl?: string;
  transcript?: string;
  startTime: Date;
  endTime?: Date;
  notes?: string;
}

export interface SMSMessage {
  id: string;
  contactId: number;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  message: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered';
  timestamp: Date;
  mediaUrls?: string[];
}

export class TwilioIntegrationService {
  private static instance: TwilioIntegrationService;
  private client: Twilio | null = null;
  private accountSid: string | null = null;
  private authToken: string | null = null;
  private phoneNumber: string | null = null;

  private constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || null;
    this.authToken = process.env.TWILIO_AUTH_TOKEN || null;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER || null;

    if (this.accountSid && this.authToken) {
      this.client = new Twilio(this.accountSid, this.authToken);
    }
  }

  public static getInstance(): TwilioIntegrationService {
    if (!TwilioIntegrationService.instance) {
      TwilioIntegrationService.instance = new TwilioIntegrationService();
    }
    return TwilioIntegrationService.instance;
  }

  setCredentials(accountSid: string, authToken: string, phoneNumber: string): void {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.phoneNumber = phoneNumber;
    this.client = new Twilio(accountSid, authToken);
  }

  // SMS Functions
  async sendSMS(to: string, message: string, mediaUrls?: string[]): Promise<SMSMessage | null> {
    if (!this.client || !this.phoneNumber) {
      throw new Error('Twilio not configured');
    }

    try {
      const messageOptions: any = {
        body: message,
        from: this.phoneNumber,
        to: to
      };

      if (mediaUrls && mediaUrls.length > 0) {
        messageOptions.mediaUrl = mediaUrls;
      }

      const twilioMessage = await this.client.messages.create(messageOptions);

      return {
        id: twilioMessage.sid,
        contactId: 0, // Will be set by caller
        phoneNumber: to,
        direction: 'outbound',
        message: message,
        status: twilioMessage.status as any,
        timestamp: new Date(),
        mediaUrls: mediaUrls
      };
    } catch (error) {
      console.error('SMS send error:', error);
      throw new Error('Failed to send SMS');
    }
  }

  async sendBulkSMS(messages: Array<{ to: string; message: string; contactId?: number }>): Promise<SMSMessage[]> {
    if (!this.client || !this.phoneNumber) {
      throw new Error('Twilio not configured');
    }

    const results: SMSMessage[] = [];

    for (const msg of messages) {
      try {
        const smsResult = await this.sendSMS(msg.to, msg.message);
        if (smsResult) {
          smsResult.contactId = msg.contactId || 0;
          results.push(smsResult);
        }
      } catch (error) {
        console.error(`Failed to send SMS to ${msg.to}:`, error);
      }
    }

    return results;
  }

  // Phone Call Functions
  async makeCall(to: string, purpose: 'follow_up' | 'qualification' | 'appointment_reminder' | 'custom', customScript?: string): Promise<CallRecord | null> {
    if (!this.client || !this.phoneNumber) {
      throw new Error('Twilio not configured');
    }

    try {
      const twimlUrl = this.generateTwiMLUrl(purpose, customScript);
      
      const call = await this.client.calls.create({
        to: to,
        from: this.phoneNumber,
        url: twimlUrl,
        record: true,
        recordingStatusCallback: `${process.env.BASE_URL}/api/twilio/recording-status`,
        statusCallback: `${process.env.BASE_URL}/api/twilio/call-status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
      });

      return {
        id: call.sid,
        contactId: 0, // Will be set by caller
        phoneNumber: to,
        direction: 'outbound',
        status: call.status as any,
        startTime: new Date()
      };
    } catch (error) {
      console.error('Call creation error:', error);
      throw new Error('Failed to initiate call');
    }
  }

  private generateTwiMLUrl(purpose: string, customScript?: string): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/api/twilio/twiml/${purpose}${customScript ? '?custom=true' : ''}`;
  }

  async getCallStatus(callSid: string): Promise<any> {
    if (!this.client) {
      throw new Error('Twilio not configured');
    }

    try {
      const call = await this.client.calls(callSid).fetch();
      return {
        status: call.status,
        duration: call.duration,
        startTime: call.startTime,
        endTime: call.endTime,
        recordingUrl: call.recordingUrl
      };
    } catch (error) {
      console.error('Call status fetch error:', error);
      return null;
    }
  }

  async getCallRecording(callSid: string): Promise<string | null> {
    if (!this.client) {
      throw new Error('Twilio not configured');
    }

    try {
      const recordings = await this.client.recordings.list({ callSid: callSid });
      return recordings.length > 0 ? recordings[0].uri : null;
    } catch (error) {
      console.error('Recording fetch error:', error);
      return null;
    }
  }

  // Voice Mail Drop
  async sendVoiceMailDrop(to: string, audioUrl: string): Promise<CallRecord | null> {
    if (!this.client || !this.phoneNumber) {
      throw new Error('Twilio not configured');
    }

    try {
      const call = await this.client.calls.create({
        to: to,
        from: this.phoneNumber,
        url: `${process.env.BASE_URL}/api/twilio/voicemail?audio=${encodeURIComponent(audioUrl)}`,
        machineDetection: 'DetectMessageEnd'
      });

      return {
        id: call.sid,
        contactId: 0,
        phoneNumber: to,
        direction: 'outbound',
        status: call.status as any,
        startTime: new Date(),
        notes: 'Voice mail drop'
      };
    } catch (error) {
      console.error('Voice mail drop error:', error);
      throw new Error('Failed to send voice mail drop');
    }
  }

  // Five9 Style Dialer Functionality
  async startDialerCampaign(contacts: Array<{ id: number; phoneNumber: string; name: string }>, script: string): Promise<string> {
    const campaignId = `campaign_${Date.now()}`;
    
    // Process contacts in sequence with delays
    for (const contact of contacts) {
      try {
        await this.makeCall(contact.phoneNumber, 'custom', script);
        // Add delay between calls (compliance requirement)
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error(`Failed to dial ${contact.phoneNumber}:`, error);
      }
    }

    return campaignId;
  }

  // SMS Templates for Loan Origination
  getSMSTemplates(): Record<string, string> {
    return {
      initial_followup: "Hi {firstName}, thanks for your interest in our commercial loan programs. I'd love to discuss your financing needs. When would be a good time for a quick call?",
      document_reminder: "Hi {firstName}, we're still missing some documents for your loan application. Please upload them at {portalLink} or reply if you need help.",
      rate_update: "Hi {firstName}, great news! Rates have improved since your inquiry. Current DSCR rates starting at {rate}%. Let's discuss your options.",
      approval_notification: "Congratulations {firstName}! Your loan has been approved. Your loan officer will contact you shortly with next steps.",
      appointment_reminder: "Hi {firstName}, this is a reminder of your appointment tomorrow at {time} with {loanOfficer}. Reply CONFIRM to confirm or RESCHEDULE if needed.",
      referral_request: "Hi {firstName}, thanks for choosing us for your loan! If you know other investors who could benefit from our services, we'd appreciate the referral."
    };
  }

  // Compliance and DNC Management
  async checkDNCStatus(phoneNumber: string): Promise<boolean> {
    // In a real implementation, this would check against DNC registries
    // For now, return false (not on DNC)
    return false;
  }

  async addToDNC(phoneNumber: string): Promise<void> {
    // Add to internal DNC list
    console.log(`Added ${phoneNumber} to Do Not Call list`);
  }

  async removeFromDNC(phoneNumber: string): Promise<void> {
    // Remove from internal DNC list
    console.log(`Removed ${phoneNumber} from Do Not Call list`);
  }
}

export const twilioIntegration = TwilioIntegrationService.getInstance();