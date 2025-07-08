import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface BorrowerProfile {
  // Personal Information
  firstName?: string;
  lastName?: string;
  mobilePhone?: string;
  email?: string;
  dateOfBirth?: string;
  ssn?: string;
  ficoScore?: number;
  
  // Property Information
  propertyStreetAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  propertyZip?: string;
  propertyType?: string;
  estimatedValue?: number;
  appraisedValue?: number;
  monthlyPropertyTaxes?: number;
  monthlyPropertyInsurance?: number;
  monthlyHOA?: number;
  
  // Entity Information
  entityName?: string;
  entityType?: string;
  
  // Loan Details
  loanPurpose?: string;
  loanType?: string;
  cashOutAmount?: number;
  loanAmount?: number;
  currentBalance?: number;
  currentRate?: number;
  monthsRemaining?: number;
  currentMonthlyPI?: number;
  currentMonthlyTIA?: number;
  currentTotalMonthlyPayment?: number;
  downPaymentPercent?: number;
  downPaymentAmount?: number;
  reserves?: string;
  prepaymentPenalty?: string;
  
  // Additional fields for calculations
  ltv?: number;
  dscrRatio?: number;
  experience?: string;
  timelineToFunding?: string;
  liquidityPosition?: string;
  flipsCompleted?: number;
  rentalsOwned?: number;
  yearBuilt?: number;
  squareFootage?: number;
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

CURRENT MARKET RATES (Use these as guidance):
- DSCR Loans: 6.5% - 7.5% (currently trending in this range)
- Fix & Flip: 8.5% - 12.0%
- Bridge Loans: 7.0% - 10.0%
- Construction: 7.5% - 11.0%
- Commercial: 6.0% - 8.5%
- HELOC: 7.0% - 9.5%
- Cash-Out Refi: 6.5% - 8.0%

PREPAYMENT PENALTY RATE ADJUSTMENTS:
- None: Add 0.25% to 0.50% to base rate (worst pricing)
- 1 Year: Add 0.125% to 0.25% to base rate
- 2 Year: Base rate (standard pricing)
- 3 Year: Subtract 0.125% from base rate
- 4 Year: Subtract 0.25% from base rate
- 5 Year: Subtract 0.375% to 0.50% from base rate (best pricing)

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
    const loanPurposeDescriptions = {
      'purchase': 'Property Purchase',
      'cash_out_refinance': 'Cash-Out Refinance',
      'refinance': 'Rate & Term Refinance',
      'bridge': 'Bridge Loan',
      'construction': 'Construction Loan',
      'fix_flip': 'Fix & Flip',
      'heloc': 'Home Equity Line of Credit',
      'second_mortgage': 'Second Mortgage',
      'renovation': 'Renovation Loan',
      'rental_investment': 'Rental Investment Property',
      'commercial_purchase': 'Commercial Property Purchase',
      'land_acquisition': 'Land Acquisition',
      'ground_up_construction': 'Ground-Up Construction',
      'business_purpose': 'Business Purpose Loan',
      'debt_consolidation': 'Debt Consolidation',
      'equipment_financing': 'Equipment Financing',
      'working_capital': 'Working Capital Loan',
      'investment_property': 'Investment Property',
      'portfolio_refinance': 'Portfolio Refinance',
      'multifamily_acquisition': 'Multifamily Acquisition',
      'mixed_use': 'Mixed-Use Property',
      'owner_occupied': 'Owner-Occupied Property',
      'non_owner_occupied': 'Non-Owner Occupied Property',
      'blanket_loan': 'Blanket Loan',
      'cross_collateral': 'Cross-Collateral Loan'
    };

    const loanPurposeDisplay = profile.loanPurpose ? loanPurposeDescriptions[profile.loanPurpose] || profile.loanPurpose : 'Not provided';

    return `Analyze this borrower profile and recommend the best loan product:

BORROWER PROFILE:
Personal Information:
- Name: ${profile.firstName || 'Not provided'} ${profile.lastName || 'Not provided'}
- Mobile: ${profile.mobilePhone || 'Not provided'}
- Email: ${profile.email || 'Not provided'}
- Date of Birth: ${profile.dateOfBirth || 'Not provided'}
- SSN: ${profile.ssn ? 'Provided' : 'Not provided'}
- FICO Score: ${profile.ficoScore || 'Not provided'}

Property Information:
- Address: ${profile.propertyStreetAddress || 'Not provided'} ${profile.propertyCity || ''} ${profile.propertyState || ''} ${profile.propertyZip || ''}
- Property Type: ${profile.propertyType || 'Not provided'}
- Estimated Value: $${profile.estimatedValue?.toLocaleString() || 'Not provided'}
- Appraised Value: $${profile.appraisedValue?.toLocaleString() || 'Not provided'}
- Monthly Property Taxes: $${profile.monthlyPropertyTaxes || 'Not provided'}
- Monthly Insurance: $${profile.monthlyPropertyInsurance || 'Not provided'}
- Monthly HOA: $${profile.monthlyHOA || 'Not provided'}

Entity Information:
- Entity Name: ${profile.entityName || 'Not provided'}
- Entity Type: ${profile.entityType || 'Not provided'}

Loan Details:
- Loan Purpose: ${loanPurposeDisplay}
- Loan Type: ${profile.loanType || 'Not provided'}
- Loan Amount Requested: $${profile.loanAmount?.toLocaleString() || 'Not provided'}
- Cash Out Amount: $${profile.cashOutAmount?.toLocaleString() || 'Not provided'}
- Current Balance: $${profile.currentBalance?.toLocaleString() || 'Not provided'}
- Current Rate: ${profile.currentRate ? profile.currentRate + '%' : 'Not provided'}
- Months Remaining: ${profile.monthsRemaining || 'Not provided'}
- Current Monthly P&I: $${profile.currentMonthlyPI || 'Not provided'}
- Current Monthly TIA: $${profile.currentMonthlyTIA || 'Not provided'}
- Current Total Monthly Payment: $${profile.currentTotalMonthlyPayment || 'Not provided'}
- Down Payment: ${profile.downPaymentPercent ? profile.downPaymentPercent + '%' : 'Not provided'} ($${profile.downPaymentAmount?.toLocaleString() || 'Not provided'})
- Reserves: ${profile.reserves || 'Not provided'} months
- Prepayment Penalty Preference: ${profile.prepaymentPenalty || 'Not specified'}

Additional Information:
- Desired LTV: ${profile.ltv ? profile.ltv + '%' : 'Not provided'}
- DSCR Ratio: ${profile.dscrRatio || 'Not provided'}
- Real Estate Experience: ${profile.experience || 'Not provided'}
- Timeline to Funding: ${profile.timelineToFunding || 'Not provided'}
- Gross Income: $${profile.grossIncome?.toLocaleString() || 'Not provided'}
- Net Income: $${profile.netIncome?.toLocaleString() || 'Not provided'}
- Flips Completed: ${profile.flipsCompleted || 0}
- Rentals Owned: ${profile.rentalsOwned || 0}
- Property Year Built: ${profile.yearBuilt || 'Not provided'}
- Square Footage: ${profile.squareFootage || 'Not provided'}
- Liquidity Position: ${profile.liquidityPosition || 'Not provided'}

LOAN PRODUCTS TO CONSIDER (Use current market rates):
1. DSCR Loans - For rental properties with positive cash flow, rates 6.5-7.5% (CURRENT RANGE), up to 80% LTV, 30-year terms
2. Fix & Flip - For renovation projects, rates 8.5-12%, 12-18 month terms, up to 90% of purchase + rehab
3. Bridge Loans - For quick closings/transitions, rates 7.0-10.0%, 6-24 month terms
4. Construction Loans - For ground-up construction, rates 7.5-11.0%, interest-only during construction
5. Rate & Term Refi - For better rates/terms, rates 6.0-8.5%, conventional underwriting
6. Cash-Out Refi - For accessing equity, rates 6.5-8.0%, up to 80% LTV
7. HELOC - For flexible access to equity, variable rates 7.0-9.5%
8. Second Mortgages - Fixed rate second liens, rates 7.5-10.0%
9. Commercial Loans - For business properties, rates 6.0-8.5%, based on DSCR and NOI
10. Equipment Financing - For business equipment, rates 5.0-12.0% depending on equipment type
11. Working Capital - For business cash flow, rates 8.0-15.0%, short-term
12. Blanket Loans - For multiple properties, rates 6.5-9.0%, portfolio approach

PREPAYMENT PENALTY PRICING (Apply to all applicable loan types):
- None: Worst pricing - add 0.25% to 0.50% to base rate
- 1 Year: Add 0.125% to 0.25% to base rate
- 2 Year: Standard pricing (use base rate)
- 3 Year: Subtract 0.125% from base rate
- 4 Year: Subtract 0.25% from base rate
- 5 Year: Best pricing - subtract 0.375% to 0.50% from base rate

IMPORTANT: When calculating rates, ALWAYS adjust for prepayment penalty preference. Show the impact in your reasoning.

LOAN PURPOSE SPECIFIC GUIDANCE:
- Purchase: Focus on down payment, DTI, creditworthiness
- Cash-Out Refinance: Emphasize LTV limits, cash-out restrictions, seasoning requirements
- Refinance: Look for rate improvement, better terms, cash flow optimization
- Fix & Flip: Short-term focus, exit strategy, experience level crucial
- HELOC: Existing equity, credit score, variable rate considerations
- Construction: Detailed project plans, contractor requirements, draw schedule
- Bridge: Quick closing capability, higher rates, clear exit strategy
- Commercial: DSCR analysis, NOI, cap rates, property cash flow
- Multifamily: Rent roll analysis, occupancy rates, market rents
- Mixed-Use: Commercial and residential income analysis

Consider factors like experience level, timeline urgency, cash flow requirements, exit strategy, and current market conditions.`;
  }

  private getFallbackRecommendation(profile: BorrowerProfile): LoanRecommendation {
    // Basic rule-based fallback if AI fails
    let loanType = 'dscr';
    let baseRate = 0.07; // Updated to current DSCR rate range
    
    if (profile.loanPurpose === 'fix_flip' || profile.loanPurpose === 'renovation') {
      loanType = 'fix_flip';
      baseRate = 0.10;
    } else if (profile.loanPurpose === 'bridge' || profile.timelineToFunding === 'urgent') {
      loanType = 'bridge';
      baseRate = 0.085;
    } else if (profile.loanPurpose === 'cash_out_refinance') {
      loanType = 'cash_out_refi';
      baseRate = 0.075;
    } else if (profile.loanPurpose === 'refinance') {
      loanType = 'rate_term_refi';
      baseRate = 0.07;
    } else if (profile.loanPurpose === 'heloc') {
      loanType = 'heloc';
      baseRate = 0.08;
    } else if (profile.loanPurpose === 'construction' || profile.loanPurpose === 'ground_up_construction') {
      loanType = 'construction';
      baseRate = 0.09;
    } else if (profile.loanPurpose?.includes('commercial')) {
      loanType = 'commercial';
      baseRate = 0.075;
    }

    // Apply prepayment penalty adjustments
    let adjustedRate = baseRate;
    let ppDescription = '';
    
    switch(profile.prepaymentPenalty) {
      case 'none':
        adjustedRate += 0.00375; // Add 0.375% (0.25% to 0.50% range)
        ppDescription = ' (No PPP - higher rate)';
        break;
      case '1_year':
        adjustedRate += 0.00188; // Add 0.188% (0.125% to 0.25% range)
        ppDescription = ' (1 Year PPP)';
        break;
      case '2_year':
        // Base rate - no adjustment
        ppDescription = ' (2 Year PPP - standard)';
        break;
      case '3_year':
        adjustedRate -= 0.00125; // Subtract 0.125%
        ppDescription = ' (3 Year PPP)';
        break;
      case '4_year':
        adjustedRate -= 0.0025; // Subtract 0.25%
        ppDescription = ' (4 Year PPP)';
        break;
      case '5_year':
        adjustedRate -= 0.004375; // Subtract 0.4375% (0.375% to 0.50% range)
        ppDescription = ' (5 Year PPP - best rate)';
        break;
      default:
        ppDescription = ' (Standard pricing)';
    }

    return {
      loanType,
      loanProgram: `${loanType.toUpperCase()} Standard`,
      estimatedRate: adjustedRate,
      maxLoanAmount: (profile.estimatedValue || profile.appraisedValue || 500000) * 0.75,
      ltv: 0.75,
      termLength: loanType === 'fix_flip' ? '12 months' : '30 years',
      prepaymentPenalty: loanType === 'fix_flip',
      reasoning: `Basic recommendation for ${profile.loanPurpose || 'investment property'} based on current market rates and property value${ppDescription}.`,
      confidence: 60,
      alternativeOptions: []
    };
  }
}

export const aiLoanAdvisor = AILoanAdvisor.getInstance();