import { linkedInIntegration } from './linkedin-integration.js';
import { socialEnrichment } from './social-enrichment.js';
import { db } from './db.js';
import { contacts } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  headline?: string;
  summary?: string;
  location?: string;
  industry?: string;
  profilePicture?: string;
  publicProfileUrl?: string;
  email?: string;
  phoneNumbers?: string[];
  currentPosition?: {
    title: string;
    companyName: string;
    startDate?: string;
  };
  connections?: number;
}

interface ContactExtraction {
  profile: LinkedInProfile;
  extractedEmail?: string;
  emailConfidence: number;
  extractedPhones: string[];
  phoneConfidence: number;
  enrichedData?: any;
}

export class LinkedInEnhancedIntegration {
  private static instance: LinkedInEnhancedIntegration;

  private constructor() {}

  public static getInstance(): LinkedInEnhancedIntegration {
    if (!this.instance) {
      this.instance = new LinkedInEnhancedIntegration();
    }
    return this.instance;
  }

  // Enhanced LinkedIn OAuth login
  async authenticateLinkedIn(userId: number): Promise<string> {
    // Generate OAuth URL for LinkedIn login
    const clientId = process.env.LINKEDIN_CLIENT_ID || '86av4f3covekzx';
    const redirectUri = encodeURIComponent(`${process.env.APP_URL}/api/linkedin/callback`);
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
    const scope = 'r_liteprofile r_emailaddress w_member_social r_1st_connections_size';
    
    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;
  }

  // Handle OAuth callback and store tokens
  async handleCallback(code: string, state: string): Promise<{ accessToken: string; userId: number }> {
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());
    const accessToken = await linkedInIntegration.exchangeCodeForToken(code);
    
    // Store access token securely
    await this.storeUserToken(userId, accessToken);
    
    return { accessToken, userId };
  }

  // Extract contacts from LinkedIn connections
  async extractLinkedInContacts(userId: number, accessToken: string): Promise<ContactExtraction[]> {
    try {
      // Get LinkedIn connections
      const connections = await this.getLinkedInConnections(accessToken);
      const extractedContacts: ContactExtraction[] = [];

      for (const connection of connections) {
        // Extract basic profile
        const profile = await this.getProfileDetails(connection.id, accessToken);
        
        // Guess email address
        const extractedEmail = await this.guessEmail(profile);
        
        // Extract phone numbers from various sources
        const extractedPhones = await this.extractPhoneNumbers(profile);
        
        // Enrich data from other sources
        const enrichedData = await this.enrichContactData(profile);
        
        extractedContacts.push({
          profile,
          extractedEmail: extractedEmail.email,
          emailConfidence: extractedEmail.confidence,
          extractedPhones,
          phoneConfidence: extractedPhones.length > 0 ? 0.8 : 0,
          enrichedData
        });
      }

      return extractedContacts;
    } catch (error) {
      console.error('Error extracting LinkedIn contacts:', error);
      throw new Error('Failed to extract LinkedIn contacts');
    }
  }

  // Get LinkedIn connections
  private async getLinkedInConnections(accessToken: string): Promise<any[]> {
    // LinkedIn API endpoint for connections
    const response = await fetch('https://api.linkedin.com/v2/connections?q=viewer&projection=(elements*(to~))', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch LinkedIn connections');
    }

    const data = await response.json();
    return data.elements || [];
  }

  // Get detailed profile information
  private async getProfileDetails(profileId: string, accessToken: string): Promise<LinkedInProfile> {
    const profileResponse = await fetch(`https://api.linkedin.com/v2/people/(id:${profileId})`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    const emailResponse = await fetch(`https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    const profileData = await profileResponse.json();
    const emailData = await emailResponse.json();

    return {
      id: profileId,
      firstName: profileData.localizedFirstName,
      lastName: profileData.localizedLastName,
      headline: profileData.headline?.localized?.en_US,
      profilePicture: profileData.profilePicture?.displayImage,
      email: emailData.elements?.[0]?.['handle~']?.emailAddress
    };
  }

  // Advanced email guessing algorithm
  private async guessEmail(profile: LinkedInProfile): Promise<{ email: string; confidence: number }> {
    const firstName = profile.firstName?.toLowerCase() || '';
    const lastName = profile.lastName?.toLowerCase() || '';
    const company = profile.currentPosition?.companyName?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
    
    // Common email patterns
    const patterns = [
      `${firstName}.${lastName}`,
      `${firstName}${lastName}`,
      `${firstName.charAt(0)}${lastName}`,
      `${firstName}`,
      `${lastName}`,
      `${firstName}_${lastName}`,
      `${lastName}.${firstName}`,
      `${firstName}${lastName.charAt(0)}`,
      `${lastName}${firstName.charAt(0)}`
    ];

    // Common email domains for companies
    const domains = await this.getCompanyDomains(profile.currentPosition?.companyName || '');
    
    const possibleEmails: { email: string; confidence: number }[] = [];

    for (const pattern of patterns) {
      for (const domain of domains) {
        const email = `${pattern}@${domain}`;
        const confidence = await this.verifyEmailPattern(email, profile);
        possibleEmails.push({ email, confidence });
      }
    }

    // Sort by confidence and return the best match
    possibleEmails.sort((a, b) => b.confidence - a.confidence);
    return possibleEmails[0] || { email: '', confidence: 0 };
  }

  // Get possible company domains
  private async getCompanyDomains(companyName: string): Promise<string[]> {
    if (!companyName) return ['gmail.com', 'yahoo.com', 'outlook.com'];

    // Clean company name
    const cleanName = companyName.toLowerCase()
      .replace(/\s+(inc|llc|ltd|corp|corporation|company|co)\.?$/i, '')
      .replace(/[^a-z0-9]/g, '');

    // Common domain patterns
    const domains = [
      `${cleanName}.com`,
      `${cleanName}.io`,
      `${cleanName}.co`,
      `${cleanName}.net`,
      `${cleanName}.org`
    ];

    // Try to find actual domain through web search
    try {
      const searchResult = await this.searchCompanyDomain(companyName);
      if (searchResult) {
        domains.unshift(searchResult);
      }
    } catch (error) {
      console.error('Error searching company domain:', error);
    }

    return domains;
  }

  // Search for company domain
  private async searchCompanyDomain(companyName: string): Promise<string | null> {
    // Use a web search API or scraping to find company domain
    // This is a placeholder - implement actual search logic
    return null;
  }

  // Verify email pattern likelihood
  private async verifyEmailPattern(email: string, profile: LinkedInProfile): Promise<number> {
    let confidence = 0.5; // Base confidence

    // Check if email format is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 0;

    // Boost confidence for common patterns
    if (email.includes(profile.firstName?.toLowerCase() || '') && 
        email.includes(profile.lastName?.toLowerCase() || '')) {
      confidence += 0.2;
    }

    // Check against known email verification services
    // This is a placeholder - implement actual verification
    
    return Math.min(confidence, 0.95);
  }

  // Extract phone numbers from various sources
  private async extractPhoneNumbers(profile: LinkedInProfile): Promise<string[]> {
    const phoneNumbers: string[] = [];

    // Try to extract from profile summary/headline
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    
    const textToSearch = [
      profile.summary || '',
      profile.headline || ''
    ].join(' ');

    let match;
    while ((match = phoneRegex.exec(textToSearch)) !== null) {
      const phone = match[0].replace(/[^\d+]/g, '');
      if (phone.length >= 10) {
        phoneNumbers.push(phone);
      }
    }

    // Try web search for phone numbers
    try {
      const webPhones = await this.searchPhoneNumbers(profile);
      phoneNumbers.push(...webPhones);
    } catch (error) {
      console.error('Error searching phone numbers:', error);
    }

    // Remove duplicates
    return [...new Set(phoneNumbers)];
  }

  // Search for phone numbers through web sources
  private async searchPhoneNumbers(profile: LinkedInProfile): Promise<string[]> {
    // Implement web search for phone numbers
    // This could include searching professional directories, company websites, etc.
    return [];
  }

  // Enrich contact data from multiple sources
  private async enrichContactData(profile: LinkedInProfile): Promise<any> {
    try {
      // Use social enrichment service
      const enrichedData = await socialEnrichment.enrichProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        company: profile.currentPosition?.companyName,
        linkedinUrl: profile.publicProfileUrl
      });

      return enrichedData;
    } catch (error) {
      console.error('Error enriching contact data:', error);
      return null;
    }
  }

  // Save extracted contacts to database
  async saveExtractedContacts(userId: number, organizationId: number, extractedContacts: ContactExtraction[]): Promise<number> {
    let savedCount = 0;

    for (const extraction of extractedContacts) {
      try {
        const { profile, extractedEmail, extractedPhones, enrichedData } = extraction;

        // Check if contact already exists
        const existingContact = await db.select()
          .from(contacts)
          .where(eq(contacts.linkedinUrl, profile.publicProfileUrl || ''))
          .limit(1);

        if (existingContact.length === 0) {
          // Create new contact
          await db.insert(contacts).values({
            organizationId,
            userId,
            type: 'lead',
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: extractedEmail || profile.email,
            mobilePhone: extractedPhones[0],
            businessPhone: extractedPhones[1],
            company: profile.currentPosition?.companyName,
            jobTitle: profile.currentPosition?.title,
            linkedinUrl: profile.publicProfileUrl,
            profileImageUrl: profile.profilePicture,
            industry: profile.industry,
            location: profile.location,
            notes: `Imported from LinkedIn. ${profile.headline || ''}`,
            tags: ['linkedin-import', 'auto-extracted'],
            customFields: {
              linkedinId: profile.id,
              emailConfidence: extraction.emailConfidence,
              phoneConfidence: extraction.phoneConfidence,
              connections: profile.connections,
              enrichedData
            },
            lastContactedAt: new Date(),
            source: 'linkedin',
            status: 'active'
          });
          savedCount++;
        }
      } catch (error) {
        console.error('Error saving contact:', error);
      }
    }

    return savedCount;
  }

  // Store user LinkedIn token
  private async storeUserToken(userId: number, accessToken: string): Promise<void> {
    // Store encrypted token in database
    // Implementation depends on your security requirements
  }

  // Batch import contacts with progress tracking
  async batchImportContacts(
    userId: number, 
    organizationId: number,
    accessToken: string,
    onProgress?: (progress: number, message: string) => void
  ): Promise<{ imported: number; failed: number; duplicates: number }> {
    const results = { imported: 0, failed: 0, duplicates: 0 };
    
    try {
      onProgress?.(10, 'Fetching LinkedIn connections...');
      const connections = await this.getLinkedInConnections(accessToken);
      
      onProgress?.(20, `Found ${connections.length} connections. Extracting details...`);
      
      const batchSize = 10;
      for (let i = 0; i < connections.length; i += batchSize) {
        const batch = connections.slice(i, i + batchSize);
        const progress = 20 + (i / connections.length) * 60;
        
        onProgress?.(progress, `Processing contacts ${i + 1} to ${Math.min(i + batchSize, connections.length)}...`);
        
        const extractedBatch = await Promise.all(
          batch.map(conn => this.extractContactFromConnection(conn, accessToken))
        );
        
        for (const extraction of extractedBatch) {
          if (extraction) {
            const saved = await this.saveExtractedContacts(userId, organizationId, [extraction]);
            if (saved > 0) {
              results.imported++;
            } else {
              results.duplicates++;
            }
          } else {
            results.failed++;
          }
        }
      }
      
      onProgress?.(90, 'Finalizing import...');
      
    } catch (error) {
      console.error('Batch import error:', error);
      throw error;
    }
    
    onProgress?.(100, 'Import complete!');
    return results;
  }

  // Extract contact from single connection
  private async extractContactFromConnection(connection: any, accessToken: string): Promise<ContactExtraction | null> {
    try {
      const profile = await this.getProfileDetails(connection.to, accessToken);
      const extractedEmail = await this.guessEmail(profile);
      const extractedPhones = await this.extractPhoneNumbers(profile);
      const enrichedData = await this.enrichContactData(profile);
      
      return {
        profile,
        extractedEmail: extractedEmail.email,
        emailConfidence: extractedEmail.confidence,
        extractedPhones,
        phoneConfidence: extractedPhones.length > 0 ? 0.8 : 0,
        enrichedData
      };
    } catch (error) {
      console.error('Error extracting contact:', error);
      return null;
    }
  }
}

export const linkedInEnhanced = LinkedInEnhancedIntegration.getInstance();