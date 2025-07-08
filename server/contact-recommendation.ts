import { db } from './db';
import { contacts, loanApplications, callLogs, borrowers, properties } from '@shared/schema';
import { eq, sql, desc, asc, and, or, count, avg, sum } from 'drizzle-orm';
import type { Contact } from '@shared/schema';

export interface ContactRecommendation {
  contact: Contact;
  score: number;
  reasons: string[];
  category: 'hot_lead' | 'warm_lead' | 'referral_source' | 'past_client' | 'network_connection';
  suggestedActions: Array<{
    type: 'call' | 'email' | 'text' | 'meeting' | 'follow_up';
    description: string;
    priority: 'high' | 'medium' | 'low';
    timeframe: string;
  }>;
  metadata: {
    lastInteraction?: Date;
    loanHistory?: Array<{
      loanType: string;
      amount: number;
      status: string;
      date: Date;
    }>;
    relationshipStrength: number;
    responseRate: number;
    averageCallDuration: number;
    preferredContactMethod: string;
    timezone: string;
    bestContactTime: string;
  };
}

export interface RecommendationFilters {
  category?: string[];
  minScore?: number;
  maxResults?: number;
  loanTypes?: string[];
  geography?: string[];
  timeframe?: {
    start: Date;
    end: Date;
  };
  priorityLevel?: 'high' | 'medium' | 'low';
}

export interface ContactInsight {
  contactId: number;
  totalLoans: number;
  totalLoanValue: number;
  averageLoanSize: number;
  conversionRate: number;
  referralCount: number;
  lastActivityDate: Date;
  activityScore: number;
  communicationPattern: {
    preferredMethod: string;
    bestDays: string[];
    bestTimeOfDay: string;
    averageResponseTime: number;
  };
  riskProfile: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    creditScore?: number;
  };
  opportunityScore: number;
}

export class ContactRecommendationService {
  private static instance: ContactRecommendationService;
  
  private constructor() {}
  
  public static getInstance(): ContactRecommendationService {
    if (!ContactRecommendationService.instance) {
      ContactRecommendationService.instance = new ContactRecommendationService();
    }
    return ContactRecommendationService.instance;
  }

  // Get intelligent contact recommendations
  async getContactRecommendations(filters: RecommendationFilters = {}): Promise<ContactRecommendation[]> {
    try {
      // Get all contacts with their interaction data
      const contactsWithData = await this.getContactsWithInteractionData();
      
      // Generate recommendations for each contact
      const recommendations: ContactRecommendation[] = [];
      
      for (const contact of contactsWithData) {
        const recommendation = await this.generateContactRecommendation(contact);
        
        // Apply filters
        if (this.passesFilters(recommendation, filters)) {
          recommendations.push(recommendation);
        }
      }
      
      // Sort by score and limit results
      recommendations.sort((a, b) => b.score - a.score);
      
      const maxResults = filters.maxResults || 50;
      return recommendations.slice(0, maxResults);
      
    } catch (error) {
      console.error('Error generating contact recommendations:', error);
      throw error;
    }
  }

  // Get detailed insights for a specific contact
  async getContactInsights(contactId: number): Promise<ContactInsight> {
    try {
      const contact = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, contactId))
        .limit(1);
      
      if (!contact.length) {
        throw new Error('Contact not found');
      }

      // Get loan history
      const loanHistory = await db
        .select({
          id: loanApplications.id,
          loanType: loanApplications.loanType,
          requestedAmount: loanApplications.requestedAmount,
          status: loanApplications.status,
          createdAt: loanApplications.createdAt,
          borrowerId: loanApplications.borrowerId
        })
        .from(loanApplications)
        .leftJoin(borrowers, eq(loanApplications.borrowerId, borrowers.id))
        .where(eq(borrowers.contactId, contactId))
        .orderBy(desc(loanApplications.createdAt));

      // Get communication history
      const communicationHistory = await db
        .select({
          id: callLogs.id,
          type: callLogs.type,
          duration: callLogs.duration,
          outcome: callLogs.outcome,
          createdAt: callLogs.createdAt
        })
        .from(callLogs)
        .where(eq(callLogs.contactId, contactId))
        .orderBy(desc(callLogs.createdAt));

      // Calculate metrics
      const totalLoans = loanHistory.length;
      const totalLoanValue = loanHistory.reduce((sum, loan) => sum + (loan.requestedAmount || 0), 0);
      const averageLoanSize = totalLoans > 0 ? totalLoanValue / totalLoans : 0;
      const approvedLoans = loanHistory.filter(loan => loan.status === 'approved').length;
      const conversionRate = totalLoans > 0 ? approvedLoans / totalLoans : 0;

      // Calculate communication patterns
      const communicationPattern = this.analyzeCommunicationPattern(communicationHistory);
      
      // Calculate activity score
      const activityScore = this.calculateActivityScore(contact[0], loanHistory, communicationHistory);
      
      // Calculate risk profile
      const riskProfile = this.calculateRiskProfile(contact[0], loanHistory);
      
      // Calculate opportunity score
      const opportunityScore = this.calculateOpportunityScore(contact[0], loanHistory, communicationHistory);

      return {
        contactId,
        totalLoans,
        totalLoanValue,
        averageLoanSize,
        conversionRate,
        referralCount: 0, // Would need referral tracking
        lastActivityDate: communicationHistory[0]?.createdAt || contact[0].createdAt,
        activityScore,
        communicationPattern,
        riskProfile,
        opportunityScore
      };
      
    } catch (error) {
      console.error('Error getting contact insights:', error);
      throw error;
    }
  }

  // Get smart follow-up suggestions
  async getFollowUpSuggestions(contactId: number): Promise<ContactRecommendation['suggestedActions']> {
    try {
      const insights = await this.getContactInsights(contactId);
      const contact = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, contactId))
        .limit(1);

      if (!contact.length) {
        throw new Error('Contact not found');
      }

      const suggestions: ContactRecommendation['suggestedActions'] = [];
      
      // Recent interaction suggestions
      if (insights.lastActivityDate) {
        const daysSinceLastContact = Math.floor(
          (Date.now() - insights.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceLastContact > 30) {
          suggestions.push({
            type: 'call',
            description: 'Reconnect call - it\'s been over 30 days since last contact',
            priority: 'medium',
            timeframe: 'this_week'
          });
        }
      }
      
      // Loan-specific suggestions
      if (insights.totalLoans > 0) {
        if (insights.conversionRate > 0.7) {
          suggestions.push({
            type: 'email',
            description: 'Send portfolio expansion opportunities - high conversion rate',
            priority: 'high',
            timeframe: 'this_week'
          });
        }
        
        if (insights.averageLoanSize > 500000) {
          suggestions.push({
            type: 'meeting',
            description: 'Schedule investment strategy meeting - high-value client',
            priority: 'high',
            timeframe: 'next_week'
          });
        }
      }
      
      // Communication pattern suggestions
      if (insights.communicationPattern.preferredMethod === 'email') {
        suggestions.push({
          type: 'email',
          description: `Send market update - prefers email contact`,
          priority: 'low',
          timeframe: 'this_month'
        });
      }
      
      // Opportunity-based suggestions
      if (insights.opportunityScore > 80) {
        suggestions.push({
          type: 'call',
          description: 'High opportunity score - schedule consultation call',
          priority: 'high',
          timeframe: 'this_week'
        });
      }
      
      return suggestions;
      
    } catch (error) {
      console.error('Error getting follow-up suggestions:', error);
      throw error;
    }
  }

  // Private helper methods
  private async getContactsWithInteractionData() {
    return await db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        phone: contacts.phone,
        company: contacts.company,
        jobTitle: contacts.jobTitle,
        source: contacts.source,
        tags: contacts.tags,
        notes: contacts.notes,
        lastContactDate: contacts.lastContactDate,
        nextFollowUpDate: contacts.nextFollowUpDate,
        createdAt: contacts.createdAt,
        updatedAt: contacts.updatedAt
      })
      .from(contacts)
      .orderBy(desc(contacts.updatedAt));
  }

  private async generateContactRecommendation(contact: any): Promise<ContactRecommendation> {
    const insights = await this.getContactInsights(contact.id);
    
    // Calculate recommendation score
    const score = this.calculateRecommendationScore(contact, insights);
    
    // Determine category
    const category = this.determineContactCategory(contact, insights);
    
    // Generate reasons
    const reasons = this.generateRecommendationReasons(contact, insights);
    
    // Get suggested actions
    const suggestedActions = await this.getFollowUpSuggestions(contact.id);
    
    // Build metadata
    const metadata = {
      lastInteraction: insights.lastActivityDate,
      loanHistory: [], // Would populate from insights
      relationshipStrength: this.calculateRelationshipStrength(contact, insights),
      responseRate: insights.communicationPattern.averageResponseTime > 0 ? 0.8 : 0.5,
      averageCallDuration: insights.communicationPattern.averageResponseTime,
      preferredContactMethod: insights.communicationPattern.preferredMethod,
      timezone: 'EST', // Would determine from location
      bestContactTime: insights.communicationPattern.bestTimeOfDay
    };
    
    return {
      contact,
      score,
      reasons,
      category,
      suggestedActions,
      metadata
    };
  }

  private calculateRecommendationScore(contact: any, insights: ContactInsight): number {
    let score = 0;
    
    // Activity score (30% weight)
    score += insights.activityScore * 0.3;
    
    // Opportunity score (25% weight)
    score += insights.opportunityScore * 0.25;
    
    // Conversion rate (20% weight)
    score += insights.conversionRate * 100 * 0.2;
    
    // Loan value (15% weight)
    const loanValueScore = Math.min(insights.totalLoanValue / 1000000, 1) * 100;
    score += loanValueScore * 0.15;
    
    // Recency (10% weight)
    const daysSinceLastActivity = Math.floor(
      (Date.now() - insights.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const recencyScore = Math.max(0, 100 - daysSinceLastActivity);
    score += recencyScore * 0.1;
    
    return Math.min(100, Math.max(0, score));
  }

  private determineContactCategory(contact: any, insights: ContactInsight): ContactRecommendation['category'] {
    if (insights.opportunityScore > 80 && insights.activityScore > 70) {
      return 'hot_lead';
    } else if (insights.opportunityScore > 60) {
      return 'warm_lead';
    } else if (insights.totalLoans > 0) {
      return 'past_client';
    } else if (insights.referralCount > 0) {
      return 'referral_source';
    } else {
      return 'network_connection';
    }
  }

  private generateRecommendationReasons(contact: any, insights: ContactInsight): string[] {
    const reasons: string[] = [];
    
    if (insights.conversionRate > 0.7) {
      reasons.push('High conversion rate - successfully closed multiple loans');
    }
    
    if (insights.averageLoanSize > 500000) {
      reasons.push('High-value client - average loan size over $500K');
    }
    
    if (insights.opportunityScore > 80) {
      reasons.push('High opportunity score - strong potential for new business');
    }
    
    if (insights.totalLoans > 3) {
      reasons.push('Repeat client - multiple successful transactions');
    }
    
    const daysSinceLastContact = Math.floor(
      (Date.now() - insights.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastContact > 30) {
      reasons.push('Follow-up needed - no recent contact');
    }
    
    if (contact.source === 'referral') {
      reasons.push('Referral source - potential for network expansion');
    }
    
    return reasons;
  }

  private analyzeCommunicationPattern(communicationHistory: any[]): ContactInsight['communicationPattern'] {
    const totalCalls = communicationHistory.filter(c => c.type === 'call').length;
    const totalEmails = communicationHistory.filter(c => c.type === 'email').length;
    const totalTexts = communicationHistory.filter(c => c.type === 'text').length;
    
    let preferredMethod = 'call';
    if (totalEmails > totalCalls && totalEmails > totalTexts) {
      preferredMethod = 'email';
    } else if (totalTexts > totalCalls && totalTexts > totalEmails) {
      preferredMethod = 'text';
    }
    
    // Analyze best days and times (simplified)
    const bestDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const bestTimeOfDay = 'morning';
    
    const averageResponseTime = communicationHistory.length > 0 ? 
      communicationHistory.reduce((sum, c) => sum + (c.duration || 0), 0) / communicationHistory.length : 0;
    
    return {
      preferredMethod,
      bestDays,
      bestTimeOfDay,
      averageResponseTime
    };
  }

  private calculateActivityScore(contact: any, loanHistory: any[], communicationHistory: any[]): number {
    let score = 0;
    
    // Recent activity (50% weight)
    const recentActivity = communicationHistory.filter(c => 
      c.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;
    score += Math.min(recentActivity * 10, 50);
    
    // Loan activity (30% weight)
    const recentLoans = loanHistory.filter(l => 
      l.createdAt > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    ).length;
    score += Math.min(recentLoans * 15, 30);
    
    // Communication frequency (20% weight)
    const communicationFrequency = communicationHistory.length > 0 ? 
      communicationHistory.length / Math.max(1, Math.floor((Date.now() - contact.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30))) : 0;
    score += Math.min(communicationFrequency * 10, 20);
    
    return Math.min(100, score);
  }

  private calculateRiskProfile(contact: any, loanHistory: any[]): ContactInsight['riskProfile'] {
    const factors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    
    // Analyze loan history for risk factors
    const declinedLoans = loanHistory.filter(l => l.status === 'declined').length;
    const totalLoans = loanHistory.length;
    
    if (totalLoans > 0) {
      const declineRate = declinedLoans / totalLoans;
      
      if (declineRate > 0.3) {
        factors.push('High loan decline rate');
        riskLevel = 'high';
      } else if (declineRate > 0.1) {
        factors.push('Moderate loan decline rate');
        riskLevel = 'medium';
      }
    }
    
    // Check for large loan amounts
    const largeLoans = loanHistory.filter(l => (l.requestedAmount || 0) > 1000000).length;
    if (largeLoans > 0) {
      factors.push('Large loan amounts');
      if (riskLevel === 'low') riskLevel = 'medium';
    }
    
    return {
      level: riskLevel,
      factors
    };
  }

  private calculateOpportunityScore(contact: any, loanHistory: any[], communicationHistory: any[]): number {
    let score = 0;
    
    // Historical performance (40% weight)
    const approvedLoans = loanHistory.filter(l => l.status === 'approved').length;
    const totalLoans = loanHistory.length;
    if (totalLoans > 0) {
      score += (approvedLoans / totalLoans) * 40;
    }
    
    // Communication responsiveness (30% weight)
    const recentCommunication = communicationHistory.filter(c => 
      c.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;
    score += Math.min(recentCommunication * 10, 30);
    
    // Contact quality (20% weight)
    let contactQuality = 0;
    if (contact.company) contactQuality += 5;
    if (contact.jobTitle) contactQuality += 5;
    if (contact.email) contactQuality += 5;
    if (contact.phone) contactQuality += 5;
    score += contactQuality;
    
    // Loan value potential (10% weight)
    const averageLoanSize = loanHistory.length > 0 ? 
      loanHistory.reduce((sum, l) => sum + (l.requestedAmount || 0), 0) / loanHistory.length : 0;
    score += Math.min(averageLoanSize / 100000, 10);
    
    return Math.min(100, score);
  }

  private calculateRelationshipStrength(contact: any, insights: ContactInsight): number {
    let strength = 0;
    
    // Loan history strength
    strength += Math.min(insights.totalLoans * 15, 40);
    
    // Communication frequency
    strength += Math.min(insights.activityScore * 0.3, 30);
    
    // Conversion rate
    strength += insights.conversionRate * 20;
    
    // Recency
    const daysSinceLastContact = Math.floor(
      (Date.now() - insights.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    strength += Math.max(0, 10 - daysSinceLastContact / 3);
    
    return Math.min(100, strength);
  }

  private passesFilters(recommendation: ContactRecommendation, filters: RecommendationFilters): boolean {
    // Category filter
    if (filters.category && !filters.category.includes(recommendation.category)) {
      return false;
    }
    
    // Minimum score filter
    if (filters.minScore && recommendation.score < filters.minScore) {
      return false;
    }
    
    // Priority level filter
    if (filters.priorityLevel) {
      const highPriorityActions = recommendation.suggestedActions.filter(a => a.priority === 'high').length;
      const mediumPriorityActions = recommendation.suggestedActions.filter(a => a.priority === 'medium').length;
      
      if (filters.priorityLevel === 'high' && highPriorityActions === 0) {
        return false;
      }
      if (filters.priorityLevel === 'medium' && highPriorityActions === 0 && mediumPriorityActions === 0) {
        return false;
      }
    }
    
    return true;
  }
}

export const contactRecommendationService = ContactRecommendationService.getInstance();