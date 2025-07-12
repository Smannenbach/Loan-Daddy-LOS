import { z } from "zod";

// LinkedIn profile schema
export const linkedInProfileSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  headline: z.string().optional(),
  profilePicture: z.string().optional(),
  location: z.string().optional(),
  industry: z.string().optional(),
  summary: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  connections: z.number().optional(),
  publicUrl: z.string(),
  isRealEstateInvestor: z.boolean().default(false),
  investorKeywords: z.array(z.string()).default([])
});

export type LinkedInProfile = z.infer<typeof linkedInProfileSchema>;

// LinkedIn service class
export class LinkedInService {
  private accessToken: string | null = null;
  private clientId: string;
  private clientSecret: string;
  
  constructor() {
    this.clientId = process.env.LINKEDIN_CLIENT_ID || '';
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET || '';
  }
  
  // Check if LinkedIn is configured
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }
  
  // Search for real estate investors
  async searchRealEstateInvestors(query: string): Promise<LinkedInProfile[]> {
    if (!this.isConfigured()) {
      throw new Error("LinkedIn API is not configured. Please provide LinkedIn API credentials.");
    }
    
    // Keywords that indicate real estate investment
    const investorKeywords = [
      'real estate investor',
      'property investor',
      'real estate investment',
      'REI',
      'fix and flip',
      'buy and hold',
      'rental properties',
      'commercial real estate',
      'multifamily',
      'real estate portfolio',
      'property management',
      'real estate developer',
      'house flipper',
      'BRRRR investor'
    ];
    
    // Mock implementation for now - will be replaced with actual LinkedIn API
    // This shows the structure of what the real implementation will return
    const mockProfiles: LinkedInProfile[] = [
      {
        id: "1",
        firstName: "John",
        lastName: "Smith",
        headline: "Real Estate Investor | Fix & Flip Specialist | 50+ Properties",
        profilePicture: "https://via.placeholder.com/150",
        location: "Dallas, TX",
        industry: "Real Estate",
        company: "Smith Real Estate Investments",
        jobTitle: "CEO & Founder",
        connections: 500,
        publicUrl: "https://linkedin.com/in/johnsmith",
        isRealEstateInvestor: true,
        investorKeywords: ["fix and flip", "real estate investor"]
      },
      {
        id: "2",
        firstName: "Sarah",
        lastName: "Johnson",
        headline: "Commercial Real Estate Developer | Multifamily Specialist",
        profilePicture: "https://via.placeholder.com/150",
        location: "Miami, FL",
        industry: "Real Estate",
        company: "Johnson Development Group",
        jobTitle: "Principal",
        connections: 1200,
        publicUrl: "https://linkedin.com/in/sarahjohnson",
        isRealEstateInvestor: true,
        investorKeywords: ["commercial real estate", "multifamily"]
      }
    ];
    
    return mockProfiles;
  }
  
  // Import a single LinkedIn profile
  async importProfile(profileUrl: string): Promise<LinkedInProfile> {
    if (!this.isConfigured()) {
      throw new Error("LinkedIn API is not configured. Please provide LinkedIn API credentials.");
    }
    
    // Extract profile ID from URL
    const profileId = this.extractProfileId(profileUrl);
    
    // Mock implementation
    const mockProfile: LinkedInProfile = {
      id: profileId,
      firstName: "Demo",
      lastName: "User",
      headline: "Real Estate Professional",
      profilePicture: "https://via.placeholder.com/150",
      location: "New York, NY",
      industry: "Real Estate",
      publicUrl: profileUrl,
      isRealEstateInvestor: false,
      investorKeywords: []
    };
    
    return mockProfile;
  }
  
  // Extract profile ID from LinkedIn URL
  private extractProfileId(url: string): string {
    const match = url.match(/linkedin\.com\/in\/([^/]+)/);
    return match ? match[1] : '';
  }
  
  // Analyze if profile is likely a real estate investor
  analyzeInvestorProfile(profile: LinkedInProfile): {
    isInvestor: boolean;
    confidence: number;
    matchedKeywords: string[];
  } {
    const keywords = [
      'investor', 'investment', 'properties', 'portfolio',
      'real estate', 'REI', 'flip', 'rental', 'multifamily',
      'commercial', 'residential', 'developer', 'landlord'
    ];
    
    const matchedKeywords: string[] = [];
    const textToAnalyze = [
      profile.headline || '',
      profile.summary || '',
      profile.jobTitle || '',
      profile.company || ''
    ].join(' ').toLowerCase();
    
    keywords.forEach(keyword => {
      if (textToAnalyze.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      }
    });
    
    const confidence = Math.min(matchedKeywords.length * 20, 100);
    
    return {
      isInvestor: confidence >= 40,
      confidence,
      matchedKeywords
    };
  }
}

export const linkedInService = new LinkedInService();