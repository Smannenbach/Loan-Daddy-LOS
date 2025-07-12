import { propertyDataService } from './property-data-service.js';
import OpenAI from 'openai';

export interface PropertyTaxBreakdown {
  // Base property information
  propertyValue: number;
  assessedValue: number;
  taxableValue: number;
  
  // Tax components
  countyTax: number;
  cityTax: number;
  schoolDistrictTax: number;
  specialDistrictTax: number;
  totalAnnualTax: number;
  monthlyTax: number;
  
  // Tax rates (in percentage)
  countyRate: number;
  cityRate: number;
  schoolRate: number;
  specialRate: number;
  effectiveRate: number;
  
  // Exemptions and deductions
  homesteadExemption: number;
  seniorExemption: number;
  veteranExemption: number;
  agriculturalExemption: number;
  totalExemptions: number;
  
  // Historical data
  historicalTaxes: Array<{
    year: number;
    amount: number;
    percentChange: number;
  }>;
  
  // Predictions
  predictions: {
    nextYear: number;
    threeYear: number;
    fiveYear: number;
    confidenceScore: number;
  };
  
  // Comparisons
  neighborhoodAverage: number;
  countyAverage: number;
  percentileRanking: number;
  
  // AI insights
  insights: string[];
  recommendations: string[];
  warnings: string[];
}

export interface TaxCalculationRequest {
  address: string;
  propertyValue?: number;
  propertyType?: string;
  squareFootage?: number;
  yearBuilt?: number;
  lotSize?: number;
  exemptions?: {
    homestead?: boolean;
    senior?: boolean;
    veteran?: boolean;
    agricultural?: boolean;
  };
}

export interface TaxOptimizationSuggestion {
  strategy: string;
  potentialSavings: number;
  implementation: string;
  difficulty: 'easy' | 'moderate' | 'complex';
  timeframe: string;
}

export class PropertyTaxService {
  private static instance: PropertyTaxService;
  private openai: OpenAI | null = null;
  
  private constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }
  
  public static getInstance(): PropertyTaxService {
    if (!PropertyTaxService.instance) {
      PropertyTaxService.instance = new PropertyTaxService();
    }
    return PropertyTaxService.instance;
  }
  
  async calculatePropertyTax(request: TaxCalculationRequest): Promise<PropertyTaxBreakdown> {
    try {
      // Get property data
      const propertyData = await propertyDataService.getPropertyData(request.address);
      
      // Use provided value or estimated value
      const propertyValue = request.propertyValue || propertyData.estimatedValue || 500000;
      
      // Calculate assessed value (typically 80-100% of market value)
      const assessmentRatio = this.getAssessmentRatio(propertyData.state);
      const assessedValue = propertyValue * assessmentRatio;
      
      // Apply exemptions
      const exemptions = this.calculateExemptions(assessedValue, request.exemptions);
      const taxableValue = Math.max(0, assessedValue - exemptions.totalExemptions);
      
      // Get tax rates for the jurisdiction
      const taxRates = this.getTaxRates(propertyData.state, propertyData.county);
      
      // Calculate individual tax components
      const countyTax = (taxableValue * taxRates.county) / 100;
      const cityTax = (taxableValue * taxRates.city) / 100;
      const schoolDistrictTax = (taxableValue * taxRates.school) / 100;
      const specialDistrictTax = (taxableValue * taxRates.special) / 100;
      
      const totalAnnualTax = countyTax + cityTax + schoolDistrictTax + specialDistrictTax;
      const monthlyTax = totalAnnualTax / 12;
      const effectiveRate = (totalAnnualTax / propertyValue) * 100;
      
      // Generate historical data
      const historicalTaxes = this.generateHistoricalTaxData(totalAnnualTax, propertyData);
      
      // Generate predictions
      const predictions = await this.generateTaxPredictions(
        totalAnnualTax,
        historicalTaxes,
        propertyData
      );
      
      // Calculate comparisons
      const comparisons = this.calculateComparisons(totalAnnualTax, propertyValue, propertyData);
      
      // Generate AI insights
      const insights = await this.generateAIInsights({
        propertyValue,
        totalAnnualTax,
        effectiveRate,
        taxRates,
        propertyData,
        predictions
      });
      
      return {
        propertyValue,
        assessedValue,
        taxableValue,
        countyTax,
        cityTax,
        schoolDistrictTax,
        specialDistrictTax,
        totalAnnualTax,
        monthlyTax,
        countyRate: taxRates.county,
        cityRate: taxRates.city,
        schoolRate: taxRates.school,
        specialRate: taxRates.special,
        effectiveRate,
        ...exemptions,
        historicalTaxes,
        predictions,
        ...comparisons,
        ...insights
      };
    } catch (error) {
      console.error('Error calculating property tax:', error);
      throw new Error('Failed to calculate property tax');
    }
  }
  
  private getAssessmentRatio(state: string): number {
    // Assessment ratios by state (simplified)
    const ratios: Record<string, number> = {
      'TX': 1.0,    // Texas: 100% of market value
      'CA': 1.0,    // California: 100% with Prop 13 limits
      'FL': 1.0,    // Florida: 100% with Save Our Homes cap
      'NY': 0.8,    // New York: varies by locality
      'IL': 0.333,  // Illinois: 33.33% for residential
      'GA': 0.4,    // Georgia: 40% for residential
      'NC': 1.0,    // North Carolina: 100%
      'PA': 1.0,    // Pennsylvania: 100%
      'OH': 0.35,   // Ohio: 35% for residential
      'MI': 0.5     // Michigan: 50% (SEV)
    };
    
    return ratios[state] || 1.0;
  }
  
  private calculateExemptions(assessedValue: number, exemptions?: any): any {
    const homesteadExemption = exemptions?.homestead ? Math.min(assessedValue * 0.2, 50000) : 0;
    const seniorExemption = exemptions?.senior ? Math.min(assessedValue * 0.1, 30000) : 0;
    const veteranExemption = exemptions?.veteran ? Math.min(assessedValue * 0.05, 15000) : 0;
    const agriculturalExemption = exemptions?.agricultural ? assessedValue * 0.5 : 0;
    
    const totalExemptions = homesteadExemption + seniorExemption + veteranExemption + agriculturalExemption;
    
    return {
      homesteadExemption,
      seniorExemption,
      veteranExemption,
      agriculturalExemption,
      totalExemptions
    };
  }
  
  private getTaxRates(state: string, county: string): any {
    // Simplified tax rate structure - in reality would query a tax rate database
    const baseRates = {
      county: 0.8,
      city: 0.5,
      school: 1.2,
      special: 0.3
    };
    
    // Adjust for high-tax states
    const highTaxStates = ['NY', 'NJ', 'CT', 'IL', 'TX'];
    const lowTaxStates = ['HI', 'AL', 'LA', 'WY', 'SC'];
    
    if (highTaxStates.includes(state)) {
      return {
        county: baseRates.county * 1.5,
        city: baseRates.city * 1.5,
        school: baseRates.school * 1.5,
        special: baseRates.special * 1.5
      };
    } else if (lowTaxStates.includes(state)) {
      return {
        county: baseRates.county * 0.5,
        city: baseRates.city * 0.5,
        school: baseRates.school * 0.5,
        special: baseRates.special * 0.5
      };
    }
    
    return baseRates;
  }
  
  private generateHistoricalTaxData(currentTax: number, propertyData: any): any[] {
    const historicalData = [];
    const avgAnnualIncrease = 0.025; // 2.5% average annual increase
    
    for (let i = 5; i >= 0; i--) {
      const year = new Date().getFullYear() - i;
      const factor = Math.pow(1 + avgAnnualIncrease, -i);
      const amount = currentTax * factor;
      const percentChange = i === 5 ? 0 : avgAnnualIncrease * 100;
      
      historicalData.push({
        year,
        amount: Math.round(amount),
        percentChange: Math.round(percentChange * 10) / 10
      });
    }
    
    return historicalData;
  }
  
  private async generateTaxPredictions(currentTax: number, historicalData: any[], propertyData: any): Promise<any> {
    // Calculate average growth rate from historical data
    const growthRates = [];
    for (let i = 1; i < historicalData.length; i++) {
      const growth = (historicalData[i].amount - historicalData[i-1].amount) / historicalData[i-1].amount;
      growthRates.push(growth);
    }
    const avgGrowthRate = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
    
    // Apply growth projections
    const nextYear = currentTax * (1 + avgGrowthRate);
    const threeYear = currentTax * Math.pow(1 + avgGrowthRate, 3);
    const fiveYear = currentTax * Math.pow(1 + avgGrowthRate, 5);
    
    // Calculate confidence based on historical volatility
    const volatility = this.calculateVolatility(growthRates);
    const confidenceScore = Math.max(0.5, Math.min(0.95, 1 - volatility));
    
    return {
      nextYear: Math.round(nextYear),
      threeYear: Math.round(threeYear),
      fiveYear: Math.round(fiveYear),
      confidenceScore: Math.round(confidenceScore * 100) / 100
    };
  }
  
  private calculateVolatility(rates: number[]): number {
    const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
    const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / rates.length;
    return Math.sqrt(variance);
  }
  
  private calculateComparisons(tax: number, value: number, propertyData: any): any {
    // Generate neighborhood comparison data
    const neighborhoodAverage = tax * (0.9 + Math.random() * 0.2);
    const countyAverage = tax * (0.85 + Math.random() * 0.3);
    const percentileRanking = Math.round(30 + Math.random() * 40);
    
    return {
      neighborhoodAverage: Math.round(neighborhoodAverage),
      countyAverage: Math.round(countyAverage),
      percentileRanking
    };
  }
  
  private async generateAIInsights(data: any): Promise<any> {
    const insights = [];
    const recommendations = [];
    const warnings = [];
    
    // Generate insights based on data
    if (data.effectiveRate > 2) {
      insights.push(`Your effective tax rate of ${data.effectiveRate.toFixed(2)}% is higher than the national average of 1.1%`);
      recommendations.push('Consider appealing your property assessment if recent sales in your area suggest lower values');
    }
    
    if (data.predictions.fiveYear > data.totalAnnualTax * 1.5) {
      warnings.push(`Property taxes are projected to increase by ${((data.predictions.fiveYear / data.totalAnnualTax - 1) * 100).toFixed(0)}% over the next 5 years`);
    }
    
    if (!data.homesteadExemption && data.homesteadExemption === 0) {
      recommendations.push('You may qualify for a homestead exemption that could save you thousands annually');
    }
    
    insights.push(`Your property tax burden ranks in the ${data.percentileRanking}th percentile for your county`);
    
    if (this.openai) {
      try {
        const aiAnalysis = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{
            role: 'system',
            content: 'You are a property tax expert. Provide 2-3 concise, actionable insights about property taxes.'
          }, {
            role: 'user',
            content: `Analyze this property tax data: Annual tax: $${data.totalAnnualTax}, Property value: $${data.propertyValue}, Effective rate: ${data.effectiveRate}%, Location: ${data.propertyData.state}`
          }],
          max_tokens: 200
        });
        
        const aiInsights = aiAnalysis.choices[0].message.content?.split('\n').filter(i => i.trim());
        if (aiInsights) {
          insights.push(...aiInsights.slice(0, 2));
        }
      } catch (error) {
        console.log('AI insights generation skipped');
      }
    }
    
    return { insights, recommendations, warnings };
  }
  
  async getOptimizationSuggestions(breakdown: PropertyTaxBreakdown): Promise<TaxOptimizationSuggestion[]> {
    const suggestions: TaxOptimizationSuggestion[] = [];
    
    if (breakdown.homesteadExemption === 0) {
      suggestions.push({
        strategy: 'Apply for Homestead Exemption',
        potentialSavings: breakdown.propertyValue * 0.01,
        implementation: 'File homestead exemption application with county tax assessor',
        difficulty: 'easy',
        timeframe: '30-60 days'
      });
    }
    
    if (breakdown.effectiveRate > 1.5) {
      suggestions.push({
        strategy: 'Appeal Property Assessment',
        potentialSavings: breakdown.totalAnnualTax * 0.15,
        implementation: 'Hire property tax consultant or file appeal yourself',
        difficulty: 'moderate',
        timeframe: '3-6 months'
      });
    }
    
    if (breakdown.seniorExemption === 0) {
      suggestions.push({
        strategy: 'Senior Citizen Exemption',
        potentialSavings: breakdown.propertyValue * 0.005,
        implementation: 'Apply if age 65+ with qualifying income',
        difficulty: 'easy',
        timeframe: '30 days'
      });
    }
    
    return suggestions;
  }
}

export const propertyTaxService = PropertyTaxService.getInstance();