import { nanoid } from 'nanoid';

export interface SocialProfile {
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'company_website';
  profileUrl: string;
  verified: boolean;
  followers: number;
  connectionScore: number;
  lastUpdated: Date;
  profileData: Record<string, any>;
}

export interface ContactEnrichment {
  contactId: number;
  enrichmentId: string;
  enrichedAt: Date;
  confidence: number;
  socialProfiles: SocialProfile[];
  businessData: {
    companyName?: string;
    jobTitle?: string;
    industry?: string;
    companySize?: string;
    yearsInBusiness?: number;
    websiteUrl?: string;
    businessAddress?: string;
    revenue?: string;
  };
  realEstateData: {
    portfolioSize?: number;
    propertyTypes?: string[];
    marketFocus?: string[];
    investmentExperience?: string;
    totalDeals?: number;
    averageDealSize?: number;
  };
  financialData: {
    estimatedNetWorth?: string;
    creditScore?: number;
    bankingRelationships?: string[];
    previousLoans?: number;
    defaultHistory?: boolean;
  };
  contactData: {
    alternateEmails?: string[];
    phoneNumbers?: string[];
    addresses?: string[];
    preferredContactMethod?: string;
    timeZone?: string;
  };
  enrichmentSources: string[];
}

export interface EnrichmentRequest {
  contactId: number;
  email?: string;
  name?: string;
  phone?: string;
  company?: string;
  sources: ('linkedin' | 'public_records' | 'social_media' | 'business_databases')[];
}

export interface MarketingInsights {
  contactId: number;
  personalityProfile: {
    type: 'analytical' | 'driver' | 'expressive' | 'amiable';
    confidence: number;
    traits: string[];
  };
  communicationPreferences: {
    preferredChannels: string[];
    bestContactTimes: string[];
    responsePatterns: string[];
  };
  loanPropensity: {
    score: number;
    factors: string[];
    recommendedProducts: string[];
    urgency: 'low' | 'medium' | 'high';
  };
  competitorAnalysis: {
    likelyCompetitors: string[];
    differentiators: string[];
    competitiveAdvantages: string[];
  };
}

export class SocialEnrichmentService {
  private static instance: SocialEnrichmentService;
  private enrichmentCache: Map<string, ContactEnrichment> = new Map();

  private constructor() {}

  public static getInstance(): SocialEnrichmentService {
    if (!SocialEnrichmentService.instance) {
      SocialEnrichmentService.instance = new SocialEnrichmentService();
    }
    return SocialEnrichmentService.instance;
  }

  async enrichContact(request: EnrichmentRequest): Promise<ContactEnrichment> {
    try {
      const enrichmentId = `enrich_${nanoid(24)}`;
      const cacheKey = `${request.contactId}_${request.email || request.phone}`;
      
      // Check cache first
      const cached = this.enrichmentCache.get(cacheKey);
      if (cached && this.isCacheValid(cached.enrichedAt)) {
        return cached;
      }

      console.log(`Enriching contact ${request.contactId} with sources: ${request.sources.join(', ')}`);

      // Simulate enrichment from multiple sources
      const enrichment: ContactEnrichment = {
        contactId: request.contactId,
        enrichmentId,
        enrichedAt: new Date(),
        confidence: 0.75 + Math.random() * 0.2, // 75-95% confidence
        socialProfiles: await this.findSocialProfiles(request),
        businessData: await this.enrichBusinessData(request),
        realEstateData: await this.enrichRealEstateData(request),
        financialData: await this.enrichFinancialData(request),
        contactData: await this.enrichContactData(request),
        enrichmentSources: request.sources
      };

      // Cache the result
      this.enrichmentCache.set(cacheKey, enrichment);

      console.log(`Contact enrichment completed: ${enrichmentId} with ${enrichment.confidence.toFixed(2)} confidence`);
      return enrichment;
    } catch (error) {
      console.error('Contact enrichment error:', error);
      throw new Error(`Enrichment failed: ${error.message}`);
    }
  }

  private async findSocialProfiles(request: EnrichmentRequest): Promise<SocialProfile[]> {
    const profiles: SocialProfile[] = [];

    // Simulate LinkedIn profile discovery
    if (request.sources.includes('linkedin')) {
      profiles.push({
        platform: 'linkedin',
        profileUrl: `https://linkedin.com/in/${request.name?.toLowerCase().replace(/\s+/g, '-')}-${Math.floor(Math.random() * 1000)}`,
        verified: Math.random() > 0.3,
        followers: Math.floor(Math.random() * 5000) + 500,
        connectionScore: Math.random() * 50 + 50, // 50-100
        lastUpdated: new Date(),
        profileData: {
          headline: this.generateLinkedInHeadline(request.company),
          location: this.generateLocation(),
          industry: 'Real Estate',
          connections: Math.floor(Math.random() * 500) + 100
        }
      });
    }

    // Simulate Twitter profile
    if (request.sources.includes('social_media') && Math.random() > 0.4) {
      profiles.push({
        platform: 'twitter',
        profileUrl: `https://twitter.com/${request.name?.toLowerCase().replace(/\s+/g, '_')}_${Math.floor(Math.random() * 1000)}`,
        verified: Math.random() > 0.8,
        followers: Math.floor(Math.random() * 10000) + 100,
        connectionScore: Math.random() * 30 + 20, // 20-50
        lastUpdated: new Date(),
        profileData: {
          bio: 'Real Estate Investor | Commercial Properties | Building Wealth',
          tweetCount: Math.floor(Math.random() * 5000) + 100,
          following: Math.floor(Math.random() * 1000) + 50
        }
      });
    }

    // Simulate company website
    if (request.company && Math.random() > 0.3) {
      profiles.push({
        platform: 'company_website',
        profileUrl: `https://${request.company.toLowerCase().replace(/\s+/g, '')}.com`,
        verified: true,
        followers: 0,
        connectionScore: Math.random() * 40 + 60, // 60-100
        lastUpdated: new Date(),
        profileData: {
          companyInfo: `${request.company} - Commercial Real Estate Investment`,
          established: Math.floor(Math.random() * 20) + 2000,
          employees: Math.floor(Math.random() * 50) + 5
        }
      });
    }

    return profiles;
  }

  private async enrichBusinessData(request: EnrichmentRequest): Promise<ContactEnrichment['businessData']> {
    return {
      companyName: request.company || this.generateCompanyName(),
      jobTitle: this.generateJobTitle(),
      industry: 'Commercial Real Estate',
      companySize: this.generateCompanySize(),
      yearsInBusiness: Math.floor(Math.random() * 15) + 2,
      websiteUrl: request.company ? `https://${request.company.toLowerCase().replace(/\s+/g, '')}.com` : undefined,
      businessAddress: this.generateBusinessAddress(),
      revenue: this.generateRevenueRange()
    };
  }

  private async enrichRealEstateData(request: EnrichmentRequest): Promise<ContactEnrichment['realEstateData']> {
    const portfolioSize = Math.floor(Math.random() * 50) + 1;
    const propertyTypes = this.selectRandomItems(['Multi-Family', 'Single Family', 'Commercial', 'Mixed Use', 'Retail'], 2);
    const marketFocus = this.selectRandomItems(['California', 'Texas', 'Florida', 'Arizona', 'Georgia'], 2);

    return {
      portfolioSize,
      propertyTypes,
      marketFocus,
      investmentExperience: this.generateExperienceLevel(),
      totalDeals: Math.floor(Math.random() * 100) + portfolioSize,
      averageDealSize: Math.floor(Math.random() * 500000) + 250000
    };
  }

  private async enrichFinancialData(request: EnrichmentRequest): Promise<ContactEnrichment['financialData']> {
    return {
      estimatedNetWorth: this.generateNetWorthRange(),
      creditScore: Math.floor(Math.random() * 200) + 650, // 650-850
      bankingRelationships: this.selectRandomItems(['Chase', 'Bank of America', 'Wells Fargo', 'CitiBank', 'Local Credit Union'], 2),
      previousLoans: Math.floor(Math.random() * 20) + 1,
      defaultHistory: Math.random() < 0.1 // 10% chance of default history
    };
  }

  private async enrichContactData(request: EnrichmentRequest): Promise<ContactEnrichment['contactData']> {
    const alternateEmails = [];
    if (request.email) {
      const domain = request.email.split('@')[1];
      const userName = request.email.split('@')[0];
      alternateEmails.push(`${userName}@gmail.com`, `info@${domain}`);
    }

    return {
      alternateEmails,
      phoneNumbers: [this.generatePhoneNumber(), this.generatePhoneNumber()],
      addresses: [this.generateBusinessAddress(), this.generateResidentialAddress()],
      preferredContactMethod: this.selectRandomItems(['email', 'phone', 'text', 'linkedin'], 1)[0],
      timeZone: this.generateTimeZone()
    };
  }

  async generateMarketingInsights(contactId: number): Promise<MarketingInsights> {
    try {
      const enrichment = Array.from(this.enrichmentCache.values())
        .find(e => e.contactId === contactId);

      if (!enrichment) {
        throw new Error('Contact enrichment data not found. Please enrich contact first.');
      }

      // Analyze personality based on social profiles and business data
      const personalityProfile = this.analyzePersonalityProfile(enrichment);
      
      // Determine communication preferences
      const communicationPreferences = this.analyzeCommunicationPreferences(enrichment);
      
      // Calculate loan propensity
      const loanPropensity = this.calculateLoanPropensity(enrichment);
      
      // Analyze competitive landscape
      const competitorAnalysis = this.analyzeCompetitorLandscape(enrichment);

      const insights: MarketingInsights = {
        contactId,
        personalityProfile,
        communicationPreferences,
        loanPropensity,
        competitorAnalysis
      };

      console.log(`Marketing insights generated for contact ${contactId}`);
      return insights;
    } catch (error) {
      console.error('Marketing insights generation error:', error);
      throw new Error(`Failed to generate marketing insights: ${error.message}`);
    }
  }

  private analyzePersonalityProfile(enrichment: ContactEnrichment): MarketingInsights['personalityProfile'] {
    const types = ['analytical', 'driver', 'expressive', 'amiable'] as const;
    const type = types[Math.floor(Math.random() * types.length)];
    
    const traitsByType = {
      analytical: ['Detail-oriented', 'Risk-averse', 'Data-driven', 'Methodical'],
      driver: ['Results-focused', 'Decisive', 'Competitive', 'Time-conscious'],
      expressive: ['Relationship-oriented', 'Enthusiastic', 'Collaborative', 'Optimistic'],
      amiable: ['Supportive', 'Patient', 'Loyal', 'Team-oriented']
    };

    return {
      type,
      confidence: 0.7 + Math.random() * 0.2,
      traits: traitsByType[type]
    };
  }

  private analyzeCommunicationPreferences(enrichment: ContactEnrichment): MarketingInsights['communicationPreferences'] {
    const hasLinkedIn = enrichment.socialProfiles.some(p => p.platform === 'linkedin');
    const hasTwitter = enrichment.socialProfiles.some(p => p.platform === 'twitter');
    
    const channels = ['email'];
    if (hasLinkedIn) channels.push('linkedin');
    if (hasTwitter) channels.push('social_media');
    if (enrichment.contactData.phoneNumbers?.length) channels.push('phone');

    return {
      preferredChannels: channels,
      bestContactTimes: ['9:00 AM - 11:00 AM', '2:00 PM - 4:00 PM'],
      responsePatterns: ['Responds within 24 hours', 'Prefers detailed information', 'Values personal touch']
    };
  }

  private calculateLoanPropensity(enrichment: ContactEnrichment): MarketingInsights['loanPropensity'] {
    let score = 50; // Base score

    // Increase score based on portfolio size
    if (enrichment.realEstateData.portfolioSize) {
      score += Math.min(enrichment.realEstateData.portfolioSize * 2, 30);
    }

    // Increase score based on experience
    if (enrichment.realEstateData.investmentExperience === 'Experienced') score += 20;
    if (enrichment.realEstateData.investmentExperience === 'Expert') score += 30;

    // Adjust based on financial data
    if (enrichment.financialData.creditScore && enrichment.financialData.creditScore > 750) score += 15;
    if (enrichment.financialData.previousLoans && enrichment.financialData.previousLoans > 10) score += 10;

    // Cap score at 100
    score = Math.min(score, 100);

    const urgency = score > 80 ? 'high' : score > 60 ? 'medium' : 'low';

    return {
      score,
      factors: [
        'Strong real estate portfolio',
        'Excellent credit profile',
        'Active investor profile',
        'Previous loan experience'
      ],
      recommendedProducts: this.getRecommendedProducts(enrichment),
      urgency
    };
  }

  private analyzeCompetitorLandscape(enrichment: ContactEnrichment): MarketingInsights['competitorAnalysis'] {
    return {
      likelyCompetitors: [
        'Traditional Banks',
        'Hard Money Lenders',
        'Private Lenders',
        'DSCR Specialists',
        'Fix-and-Flip Lenders'
      ],
      differentiators: [
        'AI-powered loan processing',
        'Fast approval times',
        'Competitive rates',
        'No personal income verification',
        'Flexible terms'
      ],
      competitiveAdvantages: [
        'Technology-first approach',
        'Specialized commercial focus',
        'Streamlined application process',
        'Expert market knowledge'
      ]
    };
  }

  private getRecommendedProducts(enrichment: ContactEnrichment): string[] {
    const products = [];
    
    if (enrichment.realEstateData.propertyTypes?.includes('Multi-Family')) {
      products.push('DSCR Loans');
    }
    
    if (enrichment.realEstateData.investmentExperience === 'Experienced' || 
        enrichment.realEstateData.investmentExperience === 'Expert') {
      products.push('Fix-and-Flip Loans');
    }
    
    if (enrichment.realEstateData.averageDealSize && enrichment.realEstateData.averageDealSize > 500000) {
      products.push('Commercial Loans');
    }
    
    products.push('Bridge Loans');
    
    return products;
  }

  private isCacheValid(enrichedAt: Date): boolean {
    const cacheAge = Date.now() - enrichedAt.getTime();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    return cacheAge < maxAge;
  }

  // Helper methods for generating realistic data
  private generateLinkedInHeadline(company?: string): string {
    const headlines = [
      `CEO at ${company || 'Real Estate Ventures'}`,
      'Commercial Real Estate Investor | Portfolio Builder',
      'Real Estate Developer | Multi-Family Specialist',
      'Investment Property Manager | Wealth Builder',
      'Commercial Property Investor | DSCR Expert'
    ];
    return headlines[Math.floor(Math.random() * headlines.length)];
  }

  private generateLocation(): string {
    const locations = [
      'Los Angeles, CA', 'Dallas, TX', 'Miami, FL', 'Phoenix, AZ', 
      'Atlanta, GA', 'Denver, CO', 'Seattle, WA', 'Austin, TX'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  private generateCompanyName(): string {
    const prefixes = ['Capital', 'Prime', 'Elite', 'Summit', 'Crown'];
    const suffixes = ['Properties', 'Investments', 'Real Estate', 'Ventures', 'Holdings'];
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
  }

  private generateJobTitle(): string {
    const titles = [
      'CEO', 'President', 'Principal', 'Managing Partner', 'Founder',
      'Real Estate Investor', 'Property Developer', 'Investment Manager'
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  private generateCompanySize(): string {
    const sizes = ['1-10 employees', '11-50 employees', '51-200 employees', '201-500 employees'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  }

  private generateBusinessAddress(): string {
    const streets = ['Main St', 'Oak Ave', 'Pine Rd', 'First St', 'Commerce Blvd'];
    const cities = ['Los Angeles', 'Dallas', 'Miami', 'Phoenix', 'Atlanta'];
    const street = streets[Math.floor(Math.random() * streets.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const number = Math.floor(Math.random() * 9999) + 1;
    return `${number} ${street}, ${city}`;
  }

  private generateResidentialAddress(): string {
    return this.generateBusinessAddress(); // Simplified for demo
  }

  private generateRevenueRange(): string {
    const ranges = ['$100K - $500K', '$500K - $1M', '$1M - $5M', '$5M - $10M', '$10M+'];
    return ranges[Math.floor(Math.random() * ranges.length)];
  }

  private generateExperienceLevel(): string {
    const levels = ['Beginner', 'Intermediate', 'Experienced', 'Expert'];
    return levels[Math.floor(Math.random() * levels.length)];
  }

  private generateNetWorthRange(): string {
    const ranges = ['$500K - $1M', '$1M - $5M', '$5M - $10M', '$10M+'];
    return ranges[Math.floor(Math.random() * ranges.length)];
  }

  private generatePhoneNumber(): string {
    const areaCode = Math.floor(Math.random() * 800) + 200;
    const exchange = Math.floor(Math.random() * 800) + 200;
    const number = Math.floor(Math.random() * 10000);
    return `${areaCode}-${exchange}-${number.toString().padStart(4, '0')}`;
  }

  private generateTimeZone(): string {
    const zones = ['PST', 'MST', 'CST', 'EST'];
    return zones[Math.floor(Math.random() * zones.length)];
  }

  private selectRandomItems<T>(items: T[], count: number): T[] {
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}

export const socialEnrichment = SocialEnrichmentService.getInstance();