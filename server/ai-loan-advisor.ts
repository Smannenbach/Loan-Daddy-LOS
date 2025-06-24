import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface BorrowerProfile {
  creditScore?: number;
  experience?: string;
  loanAmount?: number;
  loanPurpose?: string;
  propertyType?: string;
  propertyValue?: number;
  timelineToFunding?: string;
  ltv?: number;
  dscrRatio?: number;
  liquidityPosition?: string;
  flipsCompleted?: number;
  rentalsOwned?: number;
  yearBuilt?: number;
  squareFootage?: number;
  propertyTaxes?: number;
  insurance?: number;
  grossIncome?: number;
  netIncome?: number;
}

export interface LoanRecommendation {
  loanType: string;
  loanProgram: string;
  estimatedRate: number;
  maxLoanAmount: number;
  ltv: number;
  termLength: string;
  prepaymentPenalty: boolean;
  reasoning: string;
  confidence: number;
  alternativeOptions: Array<{
    loanType: string;
    rate: number;
    pros: string[];
    cons: string[];
  }>;
}

export class AILoanAdvisor {
  private static instance: AILoanAdvisor;
  
  public static getInstance(): AILoanAdvisor {
    if (!AILoanAdvisor.instance) {
      AILoanAdvisor.instance = new AILoanAdvisor();
    }
    return AILoanAdvisor.instance;
  }

  async analyzeBorrowerAndRecommendLoan(profile: BorrowerProfile): Promise<LoanRecommendation> {
    const prompt = this.buildAnalysisPrompt(profile);
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert commercial loan advisor with 20+ years of experience in DSCR loans, fix-and-flip financing, bridge loans, and commercial real estate lending. 

Your expertise includes:
- DSCR (Debt Service Coverage Ratio) loans for investment properties
- Fix-and-flip hard money loans
- Bridge/transition loans
- Construction loans
- Rate & term refinancing
- Cash-out refinancing
- HELOC products
- Commercial loans

You must analyze borrower profiles and recommend the most appropriate loan product based on their specific circumstances. Consider all factors including credit score, experience, loan purpose, property type, timeline, and financial position.

Respond with JSON in this exact format:
{
  "loanType": "string (dscr|fix_flip|bridge|construction|rate_term_refi|cash_out_refi|heloc|commercial)",
  "loanProgram": "string (specific program name)",
  "estimatedRate": number (decimal, e.g., 0.085 for 8.5%),
  "maxLoanAmount": number,
  "ltv": number (decimal, e.g., 0.75 for 75%),
  "termLength": "string (e.g., '30 years', '12 months')",
  "prepaymentPenalty": boolean,
  "reasoning": "string (detailed explanation)",
  "confidence": number (0-100),
  "alternativeOptions": [
    {
      "loanType": "string",
      "rate": number,
      "pros": ["string"],
      "cons": ["string"]
    }
  ]
}`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result as LoanRecommendation;
    } catch (error) {
      console.error('AI Loan Advisor error:', error);
      return this.getFallbackRecommendation(profile);
    }
  }

  async generateConversationalResponse(
    borrowerMessage: string, 
    profile: BorrowerProfile,
    context: string = ''
  ): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a friendly, knowledgeable loan advisor helping potential borrowers understand their financing options. You specialize in commercial real estate loans including DSCR, fix-and-flip, bridge loans, and more.

Key guidelines:
- Be conversational and helpful, not sales-y
- Ask clarifying questions to better understand their needs
- Explain loan products in simple terms
- Be honest about requirements and limitations
- Guide them toward the application process when appropriate
- Always prioritize their best interests

Current borrower context: ${JSON.stringify(profile)}
Previous conversation context: ${context}`
          },
          {
            role: "user",
            content: borrowerMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0].message.content || "I'd be happy to help you with your loan needs. Could you tell me more about your specific situation?";
    } catch (error) {
      console.error('Conversational AI error:', error);
      return "I'd be happy to help you with your loan needs. Could you tell me more about your specific situation?";
    }
  }

  private buildAnalysisPrompt(profile: BorrowerProfile): string {
    return `Analyze this borrower profile and recommend the best loan product:

BORROWER PROFILE:
- Credit Score: ${profile.creditScore || 'Not provided'}
- Real Estate Experience: ${profile.experience || 'Not provided'}
- Loan Amount Requested: $${profile.loanAmount?.toLocaleString() || 'Not provided'}
- Loan Purpose: ${profile.loanPurpose || 'Not provided'}
- Property Type: ${profile.propertyType || 'Not provided'}
- Property Value: $${profile.propertyValue?.toLocaleString() || 'Not provided'}
- Timeline to Funding: ${profile.timelineToFunding || 'Not provided'}
- Desired LTV: ${profile.ltv ? (profile.ltv * 100) + '%' : 'Not provided'}
- DSCR Ratio: ${profile.dscrRatio || 'Not provided'}
- Liquidity Position: ${profile.liquidityPosition || 'Not provided'}
- Flips Completed: ${profile.flipsCompleted || 0}
- Rentals Owned: ${profile.rentalsOwned || 0}
- Property Year Built: ${profile.yearBuilt || 'Not provided'}
- Square Footage: ${profile.squareFootage || 'Not provided'}
- Annual Property Taxes: $${profile.propertyTaxes || 'Not provided'}
- Annual Insurance: $${profile.insurance || 'Not provided'}
- Gross Income: $${profile.grossIncome?.toLocaleString() || 'Not provided'}
- Net Income: $${profile.netIncome?.toLocaleString() || 'Not provided'}

LOAN PRODUCTS TO CONSIDER:
1. DSCR Loans - For rental properties with positive cash flow, rates 7.5-10.5%, up to 80% LTV
2. Fix & Flip - For renovation projects, rates 9-14%, 12-18 month terms, up to 90% of purchase + rehab
3. Bridge Loans - For quick closings/transitions, rates 8.5-12%, 6-24 month terms
4. Construction Loans - For ground-up construction, rates 8-12%, interest-only during construction
5. Rate & Term Refi - For better rates/terms, rates 6.5-9.5%, conventional underwriting
6. Cash-Out Refi - For accessing equity, rates 7-10%, up to 80% LTV
7. HELOC - For flexible access to equity, variable rates 7-11%

Consider factors like experience level, timeline urgency, cash flow requirements, and exit strategy.`;
  }

  private getFallbackRecommendation(profile: BorrowerProfile): LoanRecommendation {
    // Basic rule-based fallback if AI fails
    let loanType = 'dscr';
    let estimatedRate = 0.095;
    
    if (profile.loanPurpose === 'flip' || profile.loanPurpose === 'renovation') {
      loanType = 'fix_flip';
      estimatedRate = 0.115;
    } else if (profile.timelineToFunding === 'urgent' || profile.timelineToFunding === 'fast') {
      loanType = 'bridge';
      estimatedRate = 0.105;
    }

    return {
      loanType,
      loanProgram: `${loanType.toUpperCase()} Standard`,
      estimatedRate,
      maxLoanAmount: (profile.propertyValue || 500000) * 0.75,
      ltv: 0.75,
      termLength: loanType === 'fix_flip' ? '12 months' : '30 years',
      prepaymentPenalty: loanType === 'fix_flip',
      reasoning: 'Basic recommendation based on loan purpose and property value.',
      confidence: 60,
      alternativeOptions: []
    };
  }
}

export const aiLoanAdvisor = AILoanAdvisor.getInstance();