// Loan Pricing Engine
// Integrates with LoanSifter, LenderPrice, and maintains internal pricing database

export interface LenderRate {
  lenderId: string;
  lenderName: string;
  loanProgram: string;
  rate: number;
  points: number;
  fees: number;
  maxLTV: number;
  minDSCR?: number;
  minCreditScore: number;
  maxLoanAmount: number;
  minLoanAmount: number;
  terms: string;
  prepaymentPenalty: boolean;
  isActive: boolean;
  lastUpdated: Date;
  conditions: string[];
}

export interface PricingRequest {
  loanType: string;
  loanAmount: number;
  propertyValue: number;
  creditScore: number;
  dscrRatio?: number;
  loanPurpose: string;
  propertyType: string;
  borrowerExperience: string;
  timeline: string;
  state: string;
}

export interface PricingResult {
  recommendedOption: LenderRate;
  allOptions: LenderRate[];
  pricingDate: Date;
  expiresAt: Date;
  marketConditions: {
    trend: string;
    volatility: string;
    lastUpdate: Date;
  };
}

export class LoanPricingEngine {
  private static instance: LoanPricingEngine;
  private lenderRates: Map<string, LenderRate[]> = new Map();
  
  public static getInstance(): LoanPricingEngine {
    if (!LoanPricingEngine.instance) {
      LoanPricingEngine.instance = new LoanPricingEngine();
    }
    return LoanPricingEngine.instance;
  }

  constructor() {
    this.initializeLenderDatabase();
  }

  async getPricing(request: PricingRequest): Promise<PricingResult> {
    try {
      // In production, this would integrate with LoanSifter/LenderPrice APIs
      // For now, we'll use our comprehensive internal database
      
      const matchingRates = await this.findMatchingRates(request);
      const filteredRates = this.filterByBorrowerProfile(matchingRates, request);
      const sortedRates = this.sortByBestOptions(filteredRates, request);
      
      return {
        recommendedOption: sortedRates[0],
        allOptions: sortedRates.slice(0, 10), // Top 10 options
        pricingDate: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        marketConditions: await this.getMarketConditions()
      };
    } catch (error) {
      console.error('Pricing engine error:', error);
      throw new Error('Unable to retrieve current pricing');
    }
  }

  private async findMatchingRates(request: PricingRequest): Promise<LenderRate[]> {
    const loanTypeRates = this.lenderRates.get(request.loanType) || [];
    
    return loanTypeRates.filter(rate => {
      // Basic qualification filters
      if (!rate.isActive) return false;
      if (request.loanAmount > rate.maxLoanAmount) return false;
      if (request.loanAmount < rate.minLoanAmount) return false;
      if (request.creditScore < rate.minCreditScore) return false;
      
      // LTV check
      const ltv = request.loanAmount / request.propertyValue;
      if (ltv > rate.maxLTV) return false;
      
      // DSCR check for rental properties
      if (request.dscrRatio && rate.minDSCR && request.dscrRatio < rate.minDSCR) {
        return false;
      }
      
      return true;
    });
  }

  private filterByBorrowerProfile(rates: LenderRate[], request: PricingRequest): LenderRate[] {
    return rates.filter(rate => {
      // Experience requirements
      if (request.borrowerExperience === 'first_time' && 
          rate.conditions.includes('experienced_only')) {
        return false;
      }
      
      // Timeline requirements
      if (request.timeline === 'urgent' && 
          rate.conditions.includes('slow_processing')) {
        return false;
      }
      
      // Property type restrictions
      if (rate.conditions.includes(`no_${request.propertyType}`)) {
        return false;
      }
      
      return true;
    });
  }

  private sortByBestOptions(rates: LenderRate[], request: PricingRequest): LenderRate[] {
    return rates.sort((a, b) => {
      // Calculate effective rate (rate + points amortized over expected hold period)
      const holdPeriod = this.getExpectedHoldPeriod(request.loanType);
      const effectiveRateA = a.rate + (a.points / holdPeriod);
      const effectiveRateB = b.rate + (b.points / holdPeriod);
      
      // Primary sort by effective rate
      if (effectiveRateA !== effectiveRateB) {
        return effectiveRateA - effectiveRateB;
      }
      
      // Secondary sort by total fees
      return a.fees - b.fees;
    });
  }

  private getExpectedHoldPeriod(loanType: string): number {
    const holdPeriods: Record<string, number> = {
      'fix_flip': 1, // 1 year
      'bridge': 1.5, // 18 months
      'dscr': 5, // 5 years
      'construction': 2, // 2 years
      'commercial': 7 // 7 years
    };
    return holdPeriods[loanType] || 3;
  }

  private async getMarketConditions(): Promise<any> {
    // Would pull from market data APIs in production
    return {
      trend: 'stable',
      volatility: 'low',
      lastUpdate: new Date()
    };
  }

  private initializeLenderDatabase(): void {
    // Initialize comprehensive lender database
    // In production, this would be populated from APIs and database
    
    // DSCR Lenders
    this.lenderRates.set('dscr', [
      {
        lenderId: 'lima_one',
        lenderName: 'Lima One Capital',
        loanProgram: 'DSCR Investment',
        rate: 0.075,
        points: 2.0,
        fees: 3500,
        maxLTV: 0.80,
        minDSCR: 1.0,
        minCreditScore: 640,
        maxLoanAmount: 3000000,
        minLoanAmount: 75000,
        terms: '30 years',
        prepaymentPenalty: false,
        isActive: true,
        lastUpdated: new Date(),
        conditions: []
      },
      {
        lenderId: 'anchor_loans',
        lenderName: 'Anchor Loans',
        loanProgram: 'DSCR Rental',
        rate: 0.085,
        points: 1.5,
        fees: 4000,
        maxLTV: 0.75,
        minDSCR: 1.1,
        minCreditScore: 620,
        maxLoanAmount: 2500000,
        minLoanAmount: 100000,
        terms: '30 years',
        prepaymentPenalty: false,
        isActive: true,
        lastUpdated: new Date(),
        conditions: []
      },
      {
        lenderId: 'groundfloor',
        lenderName: 'Groundfloor',
        loanProgram: 'DSCR Plus',
        rate: 0.079,
        points: 2.5,
        fees: 2995,
        maxLTV: 0.80,
        minDSCR: 0.9,
        minCreditScore: 660,
        maxLoanAmount: 5000000,
        minLoanAmount: 125000,
        terms: '30 years',
        prepaymentPenalty: false,
        isActive: true,
        lastUpdated: new Date(),
        conditions: []
      }
    ]);

    // Fix & Flip Lenders
    this.lenderRates.set('fix_flip', [
      {
        lenderId: 'rehab_financial',
        lenderName: 'Rehab Financial Group',
        loanProgram: 'Fix & Flip',
        rate: 0.105,
        points: 2.0,
        fees: 5000,
        maxLTV: 0.90,
        minCreditScore: 640,
        maxLoanAmount: 2000000,
        minLoanAmount: 50000,
        terms: '12 months',
        prepaymentPenalty: true,
        isActive: true,
        lastUpdated: new Date(),
        conditions: ['experienced_preferred']
      },
      {
        lenderId: 'flip_funding',
        lenderName: 'Flip Funding',
        loanProgram: 'Quick Flip',
        rate: 0.115,
        points: 1.0,
        fees: 3500,
        maxLTV: 0.85,
        minCreditScore: 620,
        maxLoanAmount: 1500000,
        minLoanAmount: 75000,
        terms: '18 months',
        prepaymentPenalty: true,
        isActive: true,
        lastUpdated: new Date(),
        conditions: []
      },
      {
        lenderId: 'hard_money_bankers',
        lenderName: 'Hard Money Bankers',
        loanProgram: 'Renovation Loan',
        rate: 0.125,
        points: 3.0,
        fees: 6000,
        maxLTV: 0.95,
        minCreditScore: 600,
        maxLoanAmount: 3000000,
        minLoanAmount: 100000,
        terms: '24 months',
        prepaymentPenalty: true,
        isActive: true,
        lastUpdated: new Date(),
        conditions: ['experienced_only']
      }
    ]);

    // Bridge Lenders
    this.lenderRates.set('bridge', [
      {
        lenderId: 'bridge_investment',
        lenderName: 'Bridge Investment Group',
        loanProgram: 'Bridge Plus',
        rate: 0.095,
        points: 2.0,
        fees: 4500,
        maxLTV: 0.75,
        minCreditScore: 660,
        maxLoanAmount: 5000000,
        minLoanAmount: 100000,
        terms: '24 months',
        prepaymentPenalty: false,
        isActive: true,
        lastUpdated: new Date(),
        conditions: []
      },
      {
        lenderId: 'capital_bridge',
        lenderName: 'Capital Bridge Lending',
        loanProgram: 'Fast Close Bridge',
        rate: 0.089,
        points: 1.5,
        fees: 3995,
        maxLTV: 0.70,
        minCreditScore: 680,
        maxLoanAmount: 2500000,
        minLoanAmount: 150000,
        terms: '18 months',
        prepaymentPenalty: false,
        isActive: true,
        lastUpdated: new Date(),
        conditions: ['fast_processing']
      }
    ]);

    // Construction Lenders
    this.lenderRates.set('construction', [
      {
        lenderId: 'construction_capital',
        lenderName: 'Construction Capital',
        loanProgram: 'Ground Up Construction',
        rate: 0.095,
        points: 2.5,
        fees: 7500,
        maxLTV: 0.80,
        minCreditScore: 680,
        maxLoanAmount: 10000000,
        minLoanAmount: 200000,
        terms: '24 months construction + 30 year perm',
        prepaymentPenalty: false,
        isActive: true,
        lastUpdated: new Date(),
        conditions: ['experienced_only', 'detailed_plans_required']
      },
      {
        lenderId: 'builders_capital',
        lenderName: 'Builders Capital',
        loanProgram: 'Custom Construction',
        rate: 0.105,
        points: 3.0,
        fees: 8500,
        maxLTV: 0.85,
        minCreditScore: 700,
        maxLoanAmount: 5000000,
        minLoanAmount: 250000,
        terms: '18 months interest only',
        prepaymentPenalty: true,
        isActive: true,
        lastUpdated: new Date(),
        conditions: ['licensed_builder_required']
      }
    ]);

    // Commercial Lenders
    this.lenderRates.set('commercial', [
      {
        lenderId: 'commercial_funding',
        lenderName: 'Commercial Funding Inc',
        loanProgram: 'Commercial Real Estate',
        rate: 0.065,
        points: 1.0,
        fees: 5000,
        maxLTV: 0.75,
        minDSCR: 1.25,
        minCreditScore: 680,
        maxLoanAmount: 50000000,
        minLoanAmount: 500000,
        terms: '25 years',
        prepaymentPenalty: false,
        isActive: true,
        lastUpdated: new Date(),
        conditions: ['commercial_experience_required']
      }
    ]);
  }

  // Integration methods for external pricing services
  async syncLoanSifterRates(): Promise<boolean> {
    try {
      // Would integrate with LoanSifter API
      // const response = await fetch('https://api.loansifter.com/rates', {
      //   headers: { 'Authorization': `Bearer ${process.env.LOANSIFTER_API_KEY}` }
      // });
      // const rates = await response.json();
      // this.updateRatesFromLoanSifter(rates);
      
      console.log('Would sync rates from LoanSifter');
      return true;
    } catch (error) {
      console.error('LoanSifter sync error:', error);
      return false;
    }
  }

  async syncLenderPriceRates(): Promise<boolean> {
    try {
      // Would integrate with LenderPrice API
      console.log('Would sync rates from LenderPrice');
      return true;
    } catch (error) {
      console.error('LenderPrice sync error:', error);
      return false;
    }
  }

  // Rate comparison utilities
  compareRates(rates: LenderRate[]): any {
    if (rates.length === 0) return null;

    const bestRate = Math.min(...rates.map(r => r.rate));
    const avgRate = rates.reduce((sum, r) => sum + r.rate, 0) / rates.length;
    const lowestFees = Math.min(...rates.map(r => r.fees));
    
    return {
      bestRate,
      averageRate: avgRate,
      lowestFees,
      totalOptions: rates.length,
      rateSpread: Math.max(...rates.map(r => r.rate)) - bestRate
    };
  }

  // Get rates by lender for comparison
  async getRatesByLender(loanType: string): Promise<Record<string, LenderRate[]>> {
    const rates = this.lenderRates.get(loanType) || [];
    const grouped: Record<string, LenderRate[]> = {};
    
    rates.forEach(rate => {
      if (!grouped[rate.lenderName]) {
        grouped[rate.lenderName] = [];
      }
      grouped[rate.lenderName].push(rate);
    });
    
    return grouped;
  }
}

export const pricingEngine = LoanPricingEngine.getInstance();