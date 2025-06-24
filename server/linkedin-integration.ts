import { z } from 'zod';

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

export class LinkedInIntegrationService {
  private static instance: LinkedInIntegrationService;
  private accessToken: string | null = null;
  private apiBaseUrl = 'https://api.linkedin.com/v2';

  private constructor() {}

  public static getInstance(): LinkedInIntegrationService {
    if (!LinkedInIntegrationService.instance) {
      LinkedInIntegrationService.instance = new LinkedInIntegrationService();
    }
    return LinkedInIntegrationService.instance;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
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