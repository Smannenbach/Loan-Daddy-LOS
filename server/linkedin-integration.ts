import { z } from 'zod';
import * as cheerio from 'cheerio';
import { emailIntegration } from './email-integration';

export interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  headline: string;
  summary: string;
  location: string;
  profilePicture: string;
  publicProfileUrl: string;
  experience: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate?: string;
    description: string;
    location: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate?: string;
  }>;
  skills: string[];
  connections: number;
  email?: string;
  phone?: string;
}

export interface LinkedInSearchRequest {
  query: string;
  location?: string;
  industry?: string;
  currentCompany?: string;
  pastCompany?: string;
  title?: string;
  school?: string;
  limit?: number;
  offset?: number;
}

export interface LinkedInSearchResult {
  profiles: LinkedInProfile[];
  totalResults: number;
  hasMore: boolean;
  nextOffset?: number;
}

export interface EmailGuess {
  email: string;
  confidence: number;
  source: 'pattern' | 'scraped' | 'verified';
  isValid?: boolean;
}

export interface ScrapedProfileData {
  profile: LinkedInProfile;
  emails: EmailGuess[];
  phoneNumbers: string[];
  companyEmails: EmailGuess[];
  socialLinks: Record<string, string>;
}

export class LinkedInIntegrationService {
  private static instance: LinkedInIntegrationService;
  private accessToken: string | null = null;
  private apiBaseUrl = 'https://api.linkedin.com/v2';
  private emailPatterns: Map<string, string[]> = new Map();
  private companyDomains: Map<string, string> = new Map();

  private constructor() {
    this.initializeEmailPatterns();
    this.initializeCompanyDomains();
  }

  public static getInstance(): LinkedInIntegrationService {
    if (!LinkedInIntegrationService.instance) {
      LinkedInIntegrationService.instance = new LinkedInIntegrationService();
    }
    return LinkedInIntegrationService.instance;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  // OAuth 2.0 Authentication Flow
  getLinkedInAuthUrl(clientId: string, redirectUri: string, state: string): string {
    const scope = 'r_liteprofile r_emailaddress w_member_social';
    const authUrl = 'https://www.linkedin.com/oauth/v2/authorization';
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state: state,
      scope: scope
    });

    return `${authUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, clientId: string, clientSecret: string, redirectUri: string): Promise<string | null> {
    try {
      const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret
        })
      });

      const data = await response.json();
      if (data.access_token) {
        this.accessToken = data.access_token;
        return data.access_token;
      }
      return null;
    } catch (error) {
      console.error('LinkedIn token exchange error:', error);
      return null;
    }
  }

  // Advanced Profile Scraping
  async scrapeLinkedInProfile(profileUrl: string): Promise<ScrapedProfileData | null> {
    try {
      // Note: In production, you'd need to handle LinkedIn's anti-bot measures
      // This is a simplified version for demonstration
      const response = await fetch(profileUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        }
      });

      const html = await response.text();
      return this.parseLinkedInProfile(html, profileUrl);
    } catch (error) {
      console.error('LinkedIn scraping error:', error);
      return null;
    }
  }

  private parseLinkedInProfile(html: string, profileUrl: string): ScrapedProfileData {
    const $ = cheerio.load(html);
    
    // Extract basic profile information
    const name = $('h1').first().text().trim();
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ');
    
    const headline = $('.text-body-medium').first().text().trim();
    const location = $('[data-field="location"]').text().trim();
    const summary = $('.pv-shared-text-with-see-more').text().trim();

    // Extract experience
    const experience: any[] = [];
    $('.pv-entity__position-group-pager .pv-entity__summary-info').each((i, el) => {
      const title = $(el).find('h3').text().trim();
      const company = $(el).find('.pv-entity__secondary-title').text().trim();
      const duration = $(el).find('.pv-entity__bullet-item-v2').text().trim();
      
      if (title && company) {
        experience.push({
          title,
          company,
          duration,
          startDate: '',
          endDate: '',
          description: '',
          location: ''
        });
      }
    });

    // Extract education
    const education: any[] = [];
    $('.pv-education-entity').each((i, el) => {
      const school = $(el).find('.pv-entity__school-name').text().trim();
      const degree = $(el).find('.pv-entity__degree-name').text().trim();
      const field = $(el).find('.pv-entity__fos').text().trim();
      
      if (school) {
        education.push({
          school,
          degree,
          fieldOfStudy: field,
          startDate: '',
          endDate: ''
        });
      }
    });

    // Extract skills
    const skills: string[] = [];
    $('.pv-skill-category-entity__name span').each((i, el) => {
      const skill = $(el).text().trim();
      if (skill) skills.push(skill);
    });

    // Build profile
    const profile: LinkedInProfile = {
      id: this.generateProfileId(profileUrl),
      firstName,
      lastName,
      headline,
      summary,
      location,
      profilePicture: '',
      publicProfileUrl: profileUrl,
      experience,
      education,
      skills,
      connections: 0,
      email: '',
      phone: ''
    };

    // Generate email guesses
    const emails = this.generateEmailGuesses(firstName, lastName, experience);
    
    // Extract phone numbers (if visible)
    const phoneNumbers = this.extractPhoneNumbers(html);

    // Generate company emails
    const companyEmails = this.generateCompanyEmails(firstName, lastName, experience);

    // Extract social links
    const socialLinks = this.extractSocialLinks(html);

    return {
      profile,
      emails,
      phoneNumbers,
      companyEmails,
      socialLinks
    };
  }

  // Email Discovery and Verification
  private generateEmailGuesses(firstName: string, lastName: string, experience: any[]): EmailGuess[] {
    const emails: EmailGuess[] = [];
    
    if (experience.length === 0) return emails;

    const currentJob = experience[0];
    const company = currentJob.company?.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (!company) return emails;

    // Get company domain
    const domain = this.companyDomains.get(company) || `${company}.com`;
    
    // Common email patterns
    const patterns = [
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`,
      `${firstName.toLowerCase()}@${domain}`,
      `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}@${domain}`,
      `${firstName.toLowerCase()}${lastName.charAt(0).toLowerCase()}@${domain}`,
      `${firstName.charAt(0).toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      `${lastName.toLowerCase()}.${firstName.toLowerCase()}@${domain}`,
      `${lastName.toLowerCase()}${firstName.toLowerCase()}@${domain}`
    ];

    patterns.forEach((email, index) => {
      emails.push({
        email,
        confidence: Math.max(0.9 - (index * 0.1), 0.1),
        source: 'pattern'
      });
    });

    return emails;
  }

  private generateCompanyEmails(firstName: string, lastName: string, experience: any[]): EmailGuess[] {
    const emails: EmailGuess[] = [];
    
    // Generate emails for all companies in experience
    experience.forEach((job, jobIndex) => {
      const company = job.company?.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!company) return;

      const domain = this.companyDomains.get(company) || `${company}.com`;
      
      const patterns = [
        `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
        `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`,
        `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}@${domain}`
      ];

      patterns.forEach((email, index) => {
        emails.push({
          email,
          confidence: Math.max(0.8 - (jobIndex * 0.2) - (index * 0.1), 0.1),
          source: 'pattern'
        });
      });
    });

    return emails;
  }

  async verifyEmailAddresses(emails: EmailGuess[]): Promise<EmailGuess[]> {
    const verifiedEmails: EmailGuess[] = [];

    for (const emailGuess of emails) {
      try {
        const isValid = await this.verifyEmailAddress(emailGuess.email);
        verifiedEmails.push({
          ...emailGuess,
          isValid,
          source: isValid ? 'verified' : emailGuess.source,
          confidence: isValid ? Math.min(emailGuess.confidence + 0.3, 1.0) : emailGuess.confidence * 0.5
        });
      } catch (error) {
        verifiedEmails.push({
          ...emailGuess,
          isValid: false
        });
      }
    }

    return verifiedEmails.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  }

  private async verifyEmailAddress(email: string): Promise<boolean> {
    try {
      // Use multiple verification methods
      const [syntaxValid, mxValid, smtpValid] = await Promise.all([
        this.validateEmailSyntax(email),
        this.validateMXRecord(email),
        this.validateSMTP(email)
      ]);

      return syntaxValid && mxValid && smtpValid;
    } catch (error) {
      console.error('Email verification error:', error);
      return false;
    }
  }

  private validateEmailSyntax(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async validateMXRecord(email: string): Promise<boolean> {
    try {
      const domain = email.split('@')[1];
      const dns = await import('dns').then(m => m.promises);
      const mxRecords = await dns.resolveMx(domain);
      return mxRecords.length > 0;
    } catch (error) {
      return false;
    }
  }

  private async validateSMTP(email: string): Promise<boolean> {
    try {
      // Simplified SMTP validation - in production, use a service like ZeroBounce or Hunter.io
      const domain = email.split('@')[1];
      
      // Check if domain responds to ping
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
      const data = await response.json();
      
      return data.Status === 0 && data.Answer && data.Answer.length > 0;
    } catch (error) {
      return false;
    }
  }

  private extractPhoneNumbers(html: string): string[] {
    const phoneRegex = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const phones: string[] = [];
    let match;

    while ((match = phoneRegex.exec(html)) !== null) {
      phones.push(match[0].trim());
    }

    return [...new Set(phones)]; // Remove duplicates
  }

  private extractSocialLinks(html: string): Record<string, string> {
    const $ = cheerio.load(html);
    const socialLinks: Record<string, string> = {};

    // Extract various social media links
    $('a[href*="twitter.com"]').each((i, el) => {
      socialLinks.twitter = $(el).attr('href') || '';
    });

    $('a[href*="facebook.com"]').each((i, el) => {
      socialLinks.facebook = $(el).attr('href') || '';
    });

    $('a[href*="instagram.com"]').each((i, el) => {
      socialLinks.instagram = $(el).attr('href') || '';
    });

    return socialLinks;
  }

  private initializeEmailPatterns(): void {
    // Common email patterns by company
    this.emailPatterns.set('google', ['firstname.lastname@google.com', 'firstname@google.com']);
    this.emailPatterns.set('microsoft', ['firstname.lastname@microsoft.com', 'flastname@microsoft.com']);
    this.emailPatterns.set('amazon', ['firstname@amazon.com', 'lastname@amazon.com']);
    this.emailPatterns.set('meta', ['firstname@fb.com', 'flastname@meta.com']);
    this.emailPatterns.set('apple', ['firstname.lastname@apple.com', 'flastname@apple.com']);
    // Add more patterns as needed
  }

  private initializeCompanyDomains(): void {
    // Map company names to email domains
    this.companyDomains.set('google', 'google.com');
    this.companyDomains.set('alphabet', 'google.com');
    this.companyDomains.set('microsoft', 'microsoft.com');
    this.companyDomains.set('amazon', 'amazon.com');
    this.companyDomains.set('meta', 'fb.com');
    this.companyDomains.set('facebook', 'fb.com');
    this.companyDomains.set('apple', 'apple.com');
    this.companyDomains.set('tesla', 'tesla.com');
    this.companyDomains.set('netflix', 'netflix.com');
    this.companyDomains.set('salesforce', 'salesforce.com');
    this.companyDomains.set('oracle', 'oracle.com');
    this.companyDomains.set('ibm', 'ibm.com');
    this.companyDomains.set('cisco', 'cisco.com');
    this.companyDomains.set('intel', 'intel.com');
    this.companyDomains.set('nvidia', 'nvidia.com');
    this.companyDomains.set('amd', 'amd.com');
    this.companyDomains.set('wells fargo', 'wellsfargo.com');
    this.companyDomains.set('wellsfargo', 'wellsfargo.com');
    this.companyDomains.set('chase', 'chase.com');
    this.companyDomains.set('jpmorgan', 'jpmorgan.com');
    this.companyDomains.set('goldman sachs', 'gs.com');
    this.companyDomains.set('morgan stanley', 'morganstanley.com');
    this.companyDomains.set('bank of america', 'bankofamerica.com');
    this.companyDomains.set('citigroup', 'citi.com');
    this.companyDomains.set('century 21', 'century21.com');
    this.companyDomains.set('coldwell banker', 'coldwellbanker.com');
    this.companyDomains.set('keller williams', 'kw.com');
    this.companyDomains.set('re/max', 'remax.com');
    this.companyDomains.set('remax', 'remax.com');
    this.companyDomains.set('compass', 'compass.com');
    this.companyDomains.set('berkshire hathaway', 'bhhspro.com');
    // Add more as needed
  }

  private generateProfileId(profileUrl: string): string {
    return Buffer.from(profileUrl).toString('base64').substring(0, 16);
  }

  // Bulk LinkedIn Profile Processing
  async processBulkLinkedInUrls(urls: string[]): Promise<ScrapedProfileData[]> {
    const results: ScrapedProfileData[] = [];
    
    for (const url of urls) {
      try {
        const scrapedData = await this.scrapeLinkedInProfile(url);
        if (scrapedData) {
          // Verify emails
          const verifiedEmails = await this.verifyEmailAddresses([
            ...scrapedData.emails,
            ...scrapedData.companyEmails
          ]);
          
          scrapedData.emails = verifiedEmails.filter(e => e.isValid);
          results.push(scrapedData);
        }
        
        // Rate limiting - don't overwhelm LinkedIn
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to process ${url}:`, error);
      }
    }

    return results;
  }

  // LinkedIn Sales Navigator Style Search
  async advancedLinkedInSearch(criteria: {
    keywords: string;
    location: string;
    industry: string;
    currentCompany: string;
    pastCompany: string;
    title: string;
    seniority: string;
    function: string;
    schoolName: string;
    profileLanguage: string;
  }): Promise<string[]> {
    // This would integrate with LinkedIn's search or use web scraping
    // For demo purposes, return mock profile URLs
    const mockUrls = [
      'https://linkedin.com/in/john-smith-realtor',
      'https://linkedin.com/in/jane-doe-loan-officer',
      'https://linkedin.com/in/mike-jones-commercial-broker'
    ];

    return mockUrls;
  }

  async searchProfiles(request: LinkedInSearchRequest): Promise<LinkedInSearchResult> {
    if (!this.accessToken) {
      throw new Error('LinkedIn access token not configured');
    }

    try {
      // For real LinkedIn API integration
      const searchParams = new URLSearchParams();
      if (request.query) searchParams.append('keywords', request.query);
      if (request.location) searchParams.append('location', request.location);
      if (request.currentCompany) searchParams.append('current-company', request.currentCompany);
      if (request.title) searchParams.append('title', request.title);
      
      searchParams.append('count', (request.limit || 25).toString());
      searchParams.append('start', (request.offset || 0).toString());

      // Note: This would require LinkedIn Partner Program access for real implementation
      // For now, we'll return enriched mock data based on search criteria
      return this.getMockSearchResults(request);

    } catch (error) {
      console.error('LinkedIn search error:', error);
      throw new Error('Failed to search LinkedIn profiles');
    }
  }

  async getProfile(profileId: string): Promise<LinkedInProfile | null> {
    if (!this.accessToken) {
      throw new Error('LinkedIn access token not configured');
    }

    try {
      // Real LinkedIn API call would go here
      // For now, return mock profile data
      return this.getMockProfile(profileId);
    } catch (error) {
      console.error('LinkedIn profile fetch error:', error);
      return null;
    }
  }

  async importProfileToContacts(profile: LinkedInProfile): Promise<any> {
    // Convert LinkedIn profile to contact format
    const contactData = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email || '',
      phone: profile.phone || '',
      company: profile.experience[0]?.company || '',
      title: profile.experience[0]?.title || profile.headline,
      contactType: this.inferContactType(profile),
      linkedInUrl: profile.publicProfileUrl,
      streetAddress: '',
      city: this.extractCity(profile.location),
      state: this.extractState(profile.location),
      zipCode: '',
      country: 'United States',
      notes: `LinkedIn Import: ${profile.summary || profile.headline}`,
      source: 'linkedin',
      tags: ['linkedin', 'imported'],
      status: 'active'
    };

    return contactData;
  }

  private inferContactType(profile: LinkedInProfile): string {
    const title = profile.headline.toLowerCase();
    const company = profile.experience[0]?.company?.toLowerCase() || '';
    
    if (title.includes('real estate') || title.includes('realtor') || title.includes('broker')) {
      return 'real_estate_agent';
    }
    if (title.includes('loan') || title.includes('mortgage') || title.includes('lending')) {
      return 'loan_officer';
    }
    if (title.includes('appraiser') || title.includes('valuation')) {
      return 'appraiser';
    }
    if (title.includes('title') || company.includes('title')) {
      return 'title_company';
    }
    if (title.includes('contractor') || title.includes('construction')) {
      return 'contractor';
    }
    
    return 'other';
  }

  private extractCity(location: string): string {
    if (!location) return '';
    const parts = location.split(',');
    return parts[0]?.trim() || '';
  }

  private extractState(location: string): string {
    if (!location) return '';
    const parts = location.split(',');
    if (parts.length > 1) {
      const stateArea = parts[1].trim();
      // Extract state abbreviation if present
      const stateMatch = stateArea.match(/\b([A-Z]{2})\b/);
      return stateMatch ? stateMatch[1] : stateArea.substring(0, 2).toUpperCase();
    }
    return '';
  }

  private getMockSearchResults(request: LinkedInSearchRequest): LinkedInSearchResult {
    // Generate realistic mock data based on search criteria
    const mockProfiles: LinkedInProfile[] = [
      {
        id: 'mock-1',
        firstName: 'Sarah',
        lastName: 'Mitchell',
        headline: 'Senior Real Estate Agent at Century 21',
        summary: 'Experienced real estate professional specializing in residential and commercial properties.',
        location: 'Los Angeles, CA',
        profilePicture: '',
        publicProfileUrl: 'https://linkedin.com/in/sarah-mitchell-realtor',
        experience: [
          {
            company: 'Century 21',
            title: 'Senior Real Estate Agent',
            startDate: '2020-01',
            description: 'Specializing in luxury residential properties',
            location: 'Los Angeles, CA'
          }
        ],
        education: [
          {
            school: 'UCLA',
            degree: 'Bachelor of Business Administration',
            fieldOfStudy: 'Marketing',
            startDate: '2015-09',
            endDate: '2019-06'
          }
        ],
        skills: ['Real Estate', 'Property Management', 'Client Relations'],
        connections: 500,
        email: 'sarah.mitchell@century21.com'
      },
      {
        id: 'mock-2',
        firstName: 'Michael',
        lastName: 'Rodriguez',
        headline: 'Mortgage Loan Officer at Wells Fargo',
        summary: 'Helping families achieve their homeownership dreams through personalized mortgage solutions.',
        location: 'San Diego, CA',
        profilePicture: '',
        publicProfileUrl: 'https://linkedin.com/in/michael-rodriguez-loans',
        experience: [
          {
            company: 'Wells Fargo',
            title: 'Senior Mortgage Loan Officer',
            startDate: '2018-03',
            description: 'Originating residential mortgages and providing exceptional customer service',
            location: 'San Diego, CA'
          }
        ],
        education: [
          {
            school: 'San Diego State University',
            degree: 'Bachelor of Science',
            fieldOfStudy: 'Finance',
            startDate: '2012-09',
            endDate: '2016-05'
          }
        ],
        skills: ['Mortgage Lending', 'Financial Analysis', 'Customer Service'],
        connections: 750,
        email: 'michael.rodriguez@wellsfargo.com'
      }
    ];

    return {
      profiles: mockProfiles,
      totalResults: mockProfiles.length,
      hasMore: false
    };
  }

  private getMockProfile(profileId: string): LinkedInProfile {
    return {
      id: profileId,
      firstName: 'John',
      lastName: 'Smith',
      headline: 'Commercial Real Estate Broker',
      summary: 'Experienced commercial real estate professional with 10+ years in the industry.',
      location: 'New York, NY',
      profilePicture: '',
      publicProfileUrl: 'https://linkedin.com/in/john-smith-cre',
      experience: [
        {
          company: 'CBRE',
          title: 'Senior Associate',
          startDate: '2020-01',
          description: 'Commercial real estate transactions and advisory services',
          location: 'New York, NY'
        }
      ],
      education: [
        {
          school: 'NYU Stern',
          degree: 'MBA',
          fieldOfStudy: 'Real Estate',
          startDate: '2018-09',
          endDate: '2020-05'
        }
      ],
      skills: ['Commercial Real Estate', 'Investment Analysis', 'Market Research'],
      connections: 1000,
      email: 'john.smith@cbre.com'
    };
  }

  async enrichContactWithLinkedIn(email: string): Promise<LinkedInProfile | null> {
    // Search for LinkedIn profile by email
    try {
      const searchResult = await this.searchProfiles({ query: email, limit: 1 });
      return searchResult.profiles.length > 0 ? searchResult.profiles[0] : null;
    } catch (error) {
      console.error('LinkedIn enrichment error:', error);
      return null;
    }
  }
}

export const linkedInIntegration = LinkedInIntegrationService.getInstance();