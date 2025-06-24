// Document Templates and E-Signature Integration

export interface DocumentTemplate {
  id: string;
  name: string;
  category: 'authorization' | 'agreement' | 'guide' | 'form' | 'disclosure';
  type: 'pdf' | 'html' | 'docx';
  content: string;
  variables: string[];
  requiresSignature: boolean;
  signatureFields: Array<{
    id: string;
    name: string;
    type: 'signature' | 'initial' | 'date' | 'text';
    required: boolean;
    page: number;
    x: number;
    y: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SignedDocument {
  id: string;
  templateId: string;
  borrowerId: number;
  loanApplicationId?: number;
  signedBy: string;
  signedAt: Date;
  ipAddress: string;
  signatureData: Array<{
    fieldId: string;
    value: string;
    signatureImage?: string;
  }>;
  documentUrl: string;
  status: 'pending' | 'signed' | 'expired';
}

export class DocumentTemplateService {
  private static instance: DocumentTemplateService;
  private templates: Map<string, DocumentTemplate> = new Map();

  private constructor() {
    this.initializeTemplates();
  }

  public static getInstance(): DocumentTemplateService {
    if (!DocumentTemplateService.instance) {
      DocumentTemplateService.instance = new DocumentTemplateService();
    }
    return DocumentTemplateService.instance;
  }

  private initializeTemplates(): void {
    const templates: DocumentTemplate[] = [
      {
        id: 'credit_auth_form',
        name: 'Credit Report Authorization Form',
        category: 'authorization',
        type: 'html',
        content: this.getCreditAuthFormHTML(),
        variables: ['borrowerName', 'ssn', 'dateOfBirth', 'address', 'phone', 'email', 'currentDate'],
        requiresSignature: true,
        signatureFields: [
          {
            id: 'borrower_signature',
            name: 'Borrower Signature',
            type: 'signature',
            required: true,
            page: 1,
            x: 100,
            y: 500
          },
          {
            id: 'signature_date',
            name: 'Date',
            type: 'date',
            required: true,
            page: 1,
            x: 300,
            y: 500
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'broker_fee_agreement',
        name: 'Broker Fee Agreement',
        category: 'agreement',
        type: 'html',
        content: this.getBrokerFeeAgreementHTML(),
        variables: ['borrowerName', 'loanAmount', 'feePercentage', 'feeAmount', 'propertyAddress', 'currentDate'],
        requiresSignature: true,
        signatureFields: [
          {
            id: 'borrower_signature',
            name: 'Borrower Signature',
            type: 'signature',
            required: true,
            page: 1,
            x: 100,
            y: 600
          },
          {
            id: 'broker_signature',
            name: 'Broker Signature',
            type: 'signature',
            required: true,
            page: 1,
            x: 100,
            y: 650
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'dscr_loan_guide',
        name: 'DSCR Loan Guide',
        category: 'guide',
        type: 'html',
        content: this.getDSCRLoanGuideHTML(),
        variables: ['borrowerName'],
        requiresSignature: false,
        signatureFields: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'personal_financial_statement',
        name: 'Personal Financial Statement',
        category: 'form',
        type: 'html',
        content: this.getPersonalFinancialStatementHTML(),
        variables: ['borrowerName', 'spouseName', 'currentDate'],
        requiresSignature: true,
        signatureFields: [
          {
            id: 'borrower_signature',
            name: 'Borrower Signature',
            type: 'signature',
            required: true,
            page: 1,
            x: 100,
            y: 800
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'rent_roll',
        name: 'Rent Roll Form',
        category: 'form',
        type: 'html',
        content: this.getRentRollHTML(),
        variables: ['propertyAddress', 'borrowerName', 'currentDate'],
        requiresSignature: true,
        signatureFields: [
          {
            id: 'owner_signature',
            name: 'Property Owner Signature',
            type: 'signature',
            required: true,
            page: 1,
            x: 100,
            y: 600
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'vom_form',
        name: 'Verification of Mortgage (VOM)',
        category: 'form',
        type: 'html',
        content: this.getVOMFormHTML(),
        variables: ['borrowerName', 'propertyAddress', 'lenderName', 'currentDate'],
        requiresSignature: false,
        signatureFields: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  getTemplate(id: string): DocumentTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): DocumentTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: string): DocumentTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  generateDocument(templateId: string, variables: Record<string, string>): string {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    let content = template.content;
    
    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), value);
    });

    return content;
  }

  // HTML Templates
  private getCreditAuthFormHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Credit Report Authorization Form</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .form-section { margin: 20px 0; }
        .signature-line { border-bottom: 1px solid #000; width: 300px; display: inline-block; margin: 10px; }
        .checkbox { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>CONSUMER CREDIT REPORT AUTHORIZATION FORM</h1>
        <h3>LoanFlow Pro Commercial Lending</h3>
    </div>

    <div class="form-section">
        <h3>BORROWER INFORMATION</h3>
        <p><strong>Full Name:</strong> {{borrowerName}}</p>
        <p><strong>Social Security Number:</strong> {{ssn}}</p>
        <p><strong>Date of Birth:</strong> {{dateOfBirth}}</p>
        <p><strong>Current Address:</strong> {{address}}</p>
        <p><strong>Phone Number:</strong> {{phone}}</p>
        <p><strong>Email Address:</strong> {{email}}</p>
    </div>

    <div class="form-section">
        <h3>AUTHORIZATION</h3>
        <p>I hereby authorize LoanFlow Pro and its designated agents to obtain my consumer credit report from one or more consumer credit reporting agencies. I understand that this authorization will result in a "hard" credit inquiry that may affect my credit score.</p>
        
        <div class="checkbox">
            <input type="checkbox" required> I authorize the use of my credit report for loan underwriting purposes
        </div>
        <div class="checkbox">
            <input type="checkbox" required> I understand this will result in a hard credit inquiry
        </div>
        <div class="checkbox">
            <input type="checkbox" required> I certify that the information provided is accurate and complete
        </div>
    </div>

    <div class="form-section">
        <h3>PERMISSIBLE PURPOSE</h3>
        <p>This credit report is being obtained for the purpose of evaluating my application for commercial real estate financing in accordance with the Fair Credit Reporting Act.</p>
    </div>

    <div class="form-section" style="margin-top: 50px;">
        <p><strong>Borrower Signature:</strong> <span class="signature-line"></span> <strong>Date:</strong> <span class="signature-line"></span></p>
        <p style="font-size: 12px; margin-top: 20px;">
            By signing this form, you acknowledge that you have read and understand this authorization and consent to the credit check described above.
        </p>
    </div>

    <div class="form-section" style="margin-top: 30px; font-size: 10px; color: #666;">
        <p><strong>Date Generated:</strong> {{currentDate}}</p>
        <p><strong>LoanFlow Pro</strong> | Commercial Lending Division | NMLS #XXXXXX</p>
    </div>
</body>
</html>`;
  }

  private getBrokerFeeAgreementHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Broker Fee Agreement</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin: 20px 0; }
        .signature-section { margin-top: 50px; }
        .signature-line { border-bottom: 1px solid #000; width: 300px; display: inline-block; margin: 10px; }
        .terms { background: #f9f9f9; padding: 15px; border-left: 4px solid #007cba; }
    </style>
</head>
<body>
    <div class="header">
        <h1>BROKER FEE AGREEMENT</h1>
        <h3>LoanFlow Pro Commercial Lending</h3>
    </div>

    <div class="section">
        <h3>BORROWER INFORMATION</h3>
        <p><strong>Borrower Name:</strong> {{borrowerName}}</p>
        <p><strong>Property Address:</strong> {{propertyAddress}}</p>
        <p><strong>Loan Amount:</strong> ${{loanAmount}}</p>
        <p><strong>Agreement Date:</strong> {{currentDate}}</p>
    </div>

    <div class="section">
        <h3>BROKER SERVICES</h3>
        <p>LoanFlow Pro agrees to provide the following services:</p>
        <ul>
            <li>Source and present suitable loan programs</li>
            <li>Assist with loan application preparation</li>
            <li>Coordinate with lenders throughout the process</li>
            <li>Provide rate and term negotiations</li>
            <li>Facilitate loan closing</li>
        </ul>
    </div>

    <div class="section">
        <h3>COMPENSATION</h3>
        <div class="terms">
            <p><strong>Broker Fee:</strong> {{feePercentage}}% of loan amount = ${{feeAmount}}</p>
            <p><strong>Payment Terms:</strong> Fee due at closing from loan proceeds</p>
            <p><strong>Exclusive Period:</strong> 120 days from signing</p>
        </div>
    </div>

    <div class="section">
        <h3>BORROWER COMMITMENT</h3>
        <p>By signing this agreement, the borrower agrees to:</p>
        <ul>
            <li>Work exclusively with LoanFlow Pro for the specified loan</li>
            <li>Not seek financing for this property through other brokers during the exclusive period</li>
            <li>Pay the agreed-upon broker fee at closing</li>
            <li>Provide all requested documentation in a timely manner</li>
        </ul>
    </div>

    <div class="section">
        <h3>CANCELLATION</h3>
        <p>This agreement may be cancelled by either party with 7 days written notice. If borrower cancels after lender approval, full broker fee remains due.</p>
    </div>

    <div class="signature-section">
        <p><strong>Borrower Signature:</strong> <span class="signature-line"></span> <strong>Date:</strong> <span class="signature-line"></span></p>
        <p style="margin-top: 30px;"><strong>Broker Signature:</strong> <span class="signature-line"></span> <strong>Date:</strong> <span class="signature-line"></span></p>
        
        <p style="margin-top: 20px; font-size: 12px;">
            <strong>LoanFlow Pro Representative</strong><br>
            NMLS #XXXXXX | Phone: (555) 123-4567 | Email: info@loanflowpro.com
        </p>
    </div>
</body>
</html>`;
  }

  private getDSCRLoanGuideHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>DSCR Loan Guide</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; background: #007cba; color: white; padding: 20px; }
        .section { margin: 25px 0; }
        .highlight { background: #e8f4fd; padding: 15px; border-left: 4px solid #007cba; }
        .requirements { background: #f0f8f0; padding: 15px; border: 1px solid #28a745; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>DEBT SERVICE COVERAGE RATIO (DSCR) LOAN GUIDE</h1>
        <p>Your Complete Guide to DSCR Investment Property Financing</p>
    </div>

    <div class="section">
        <h2>What is a DSCR Loan?</h2>
        <p>A DSCR (Debt Service Coverage Ratio) loan is a type of investment property financing where qualification is based on the property's rental income rather than the borrower's personal income. This makes it ideal for real estate investors who want to expand their portfolios without traditional income verification.</p>
        
        <div class="highlight">
            <h3>DSCR Formula</h3>
            <p><strong>DSCR = Net Operating Income (NOI) ÷ Total Debt Service</strong></p>
            <p>A DSCR of 1.25 means the property generates 25% more income than needed to cover the mortgage payment.</p>
        </div>
    </div>

    <div class="section">
        <h2>DSCR Loan Requirements</h2>
        <div class="requirements">
            <ul>
                <li><strong>Minimum DSCR:</strong> 1.00 (some lenders require 1.25)</li>
                <li><strong>Credit Score:</strong> 680+ (720+ for best rates)</li>
                <li><strong>Down Payment:</strong> 20-25% minimum</li>
                <li><strong>Cash Reserves:</strong> 2-6 months PITIA</li>
                <li><strong>Property Type:</strong> 1-4 unit residential, some commercial</li>
                <li><strong>Loan Limits:</strong> Up to $5M (varies by lender)</li>
            </ul>
        </div>
    </div>

    <div class="section">
        <h2>Current DSCR Rates & Terms</h2>
        <table>
            <tr>
                <th>DSCR Ratio</th>
                <th>Rate Range</th>
                <th>Max LTV</th>
                <th>Term Options</th>
            </tr>
            <tr>
                <td>1.25+</td>
                <td>7.25% - 8.50%</td>
                <td>80%</td>
                <td>30 Year Fixed, 5/1 ARM</td>
            </tr>
            <tr>
                <td>1.10 - 1.24</td>
                <td>7.50% - 8.75%</td>
                <td>75%</td>
                <td>30 Year Fixed, 7/1 ARM</td>
            </tr>
            <tr>
                <td>1.00 - 1.09</td>
                <td>7.75% - 9.00%</td>
                <td>70%</td>
                <td>30 Year Fixed</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>Required Documents</h2>
        <ul>
            <li>Signed Purchase Agreement or Property Deed</li>
            <li>Current Rent Roll (if occupied)</li>
            <li>Lease Agreements (if applicable)</li>
            <li>Property Insurance Quote</li>
            <li>Property Tax Bill</li>
            <li>Bank Statements (2 months)</li>
            <li>Asset Verification</li>
            <li>Property Management Agreement (if applicable)</li>
        </ul>
    </div>

    <div class="section">
        <h2>DSCR Calculation Example</h2>
        <div class="highlight">
            <h3>Sample Property Analysis</h3>
            <p><strong>Monthly Rental Income:</strong> $3,500</p>
            <p><strong>Annual Rental Income:</strong> $42,000</p>
            <p><strong>Operating Expenses (25%):</strong> -$10,500</p>
            <p><strong>Net Operating Income:</strong> $31,500</p>
            <p><strong>Annual Debt Service:</strong> $24,000</p>
            <p><strong>DSCR:</strong> $31,500 ÷ $24,000 = 1.31</p>
            <p style="color: #28a745;"><strong>Result: QUALIFIES for DSCR financing!</strong></p>
        </div>
    </div>

    <div class="section">
        <h2>Next Steps</h2>
        <ol>
            <li>Complete our DSCR pre-qualification form</li>
            <li>Provide property details and rent roll</li>
            <li>Submit required documentation</li>
            <li>Receive rate quote and terms</li>
            <li>Lock rate and begin underwriting</li>
            <li>Close in 21-30 days</li>
        </ol>
    </div>

    <div style="margin-top: 40px; text-align: center; border-top: 2px solid #007cba; padding-top: 20px;">
        <h3>Ready to Get Started?</h3>
        <p><strong>LoanFlow Pro DSCR Lending</strong></p>
        <p>Phone: (555) 123-4567 | Email: dscr@loanflowpro.com</p>
        <p>NMLS #XXXXXX | Equal Housing Lender</p>
    </div>
</body>
</html>`;
  }

  private getPersonalFinancialStatementHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Personal Financial Statement</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 30px; line-height: 1.4; }
        .header { text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        th { background: #f0f0f0; font-weight: bold; }
        .section-header { background: #e0e0e0; font-weight: bold; }
        .total-row { background: #f9f9f9; font-weight: bold; }
        .signature-area { margin-top: 40px; }
        .signature-line { border-bottom: 1px solid #000; width: 250px; display: inline-block; }
    </style>
</head>
<body>
    <div class="header">
        <h1>PERSONAL FINANCIAL STATEMENT</h1>
        <p><strong>As of:</strong> {{currentDate}}</p>
    </div>

    <table>
        <tr>
            <td><strong>Name:</strong> {{borrowerName}}</td>
            <td><strong>Spouse/Co-Borrower:</strong> {{spouseName}}</td>
        </tr>
        <tr>
            <td><strong>Address:</strong> _______________________</td>
            <td><strong>Phone:</strong> _______________________</td>
        </tr>
        <tr>
            <td><strong>Email:</strong> _______________________</td>
            <td><strong>SSN:</strong> _______________________</td>
        </tr>
    </table>

    <h2>ASSETS</h2>
    <table>
        <tr class="section-header">
            <td>LIQUID ASSETS</td>
            <td>AMOUNT</td>
        </tr>
        <tr><td>Cash on Hand</td><td>$_________</td></tr>
        <tr><td>Checking Accounts</td><td>$_________</td></tr>
        <tr><td>Savings Accounts</td><td>$_________</td></tr>
        <tr><td>Money Market Accounts</td><td>$_________</td></tr>
        <tr><td>CDs</td><td>$_________</td></tr>
        <tr class="total-row"><td>TOTAL LIQUID ASSETS</td><td>$_________</td></tr>
        
        <tr class="section-header">
            <td>INVESTMENT ASSETS</td>
            <td>AMOUNT</td>
        </tr>
        <tr><td>Stocks/Bonds</td><td>$_________</td></tr>
        <tr><td>Mutual Funds</td><td>$_________</td></tr>
        <tr><td>401(k)/IRA</td><td>$_________</td></tr>
        <tr><td>Life Insurance Cash Value</td><td>$_________</td></tr>
        <tr><td>Other Investments</td><td>$_________</td></tr>
        <tr class="total-row"><td>TOTAL INVESTMENT ASSETS</td><td>$_________</td></tr>
        
        <tr class="section-header">
            <td>REAL ESTATE</td>
            <td>MARKET VALUE</td>
        </tr>
        <tr><td>Primary Residence</td><td>$_________</td></tr>
        <tr><td>Investment Property #1</td><td>$_________</td></tr>
        <tr><td>Investment Property #2</td><td>$_________</td></tr>
        <tr><td>Investment Property #3</td><td>$_________</td></tr>
        <tr><td>Other Real Estate</td><td>$_________</td></tr>
        <tr class="total-row"><td>TOTAL REAL ESTATE</td><td>$_________</td></tr>
        
        <tr class="section-header">
            <td>OTHER ASSETS</td>
            <td>AMOUNT</td>
        </tr>
        <tr><td>Vehicles</td><td>$_________</td></tr>
        <tr><td>Business Interests</td><td>$_________</td></tr>
        <tr><td>Personal Property</td><td>$_________</td></tr>
        <tr><td>Other Assets</td><td>$_________</td></tr>
        <tr class="total-row"><td>TOTAL OTHER ASSETS</td><td>$_________</td></tr>
        
        <tr style="background: #d4edda; font-weight: bold; font-size: 16px;">
            <td>TOTAL ASSETS</td>
            <td>$_________</td>
        </tr>
    </table>

    <h2>LIABILITIES</h2>
    <table>
        <tr class="section-header">
            <td>CREDITOR NAME</td>
            <td>BALANCE</td>
            <td>MONTHLY PAYMENT</td>
        </tr>
        <tr><td>Primary Mortgage</td><td>$_________</td><td>$_________</td></tr>
        <tr><td>Investment Property Loan #1</td><td>$_________</td><td>$_________</td></tr>
        <tr><td>Investment Property Loan #2</td><td>$_________</td><td>$_________</td></tr>
        <tr><td>Credit Cards</td><td>$_________</td><td>$_________</td></tr>
        <tr><td>Auto Loans</td><td>$_________</td><td>$_________</td></tr>
        <tr><td>Student Loans</td><td>$_________</td><td>$_________</td></tr>
        <tr><td>Business Loans</td><td>$_________</td><td>$_________</td></tr>
        <tr><td>Other Debts</td><td>$_________</td><td>$_________</td></tr>
        <tr style="background: #f8d7da; font-weight: bold; font-size: 16px;">
            <td>TOTAL LIABILITIES</td>
            <td>$_________</td>
            <td>$_________</td>
        </tr>
    </table>

    <h2>NET WORTH CALCULATION</h2>
    <table>
        <tr><td style="font-weight: bold;">Total Assets</td><td>$_________</td></tr>
        <tr><td style="font-weight: bold;">Less: Total Liabilities</td><td>($_________)</td></tr>
        <tr style="background: #d1ecf1; font-weight: bold; font-size: 18px;">
            <td>NET WORTH</td>
            <td>$_________</td>
        </tr>
    </table>

    <h2>MONTHLY INCOME & EXPENSES</h2>
    <table>
        <tr class="section-header">
            <td>INCOME SOURCE</td>
            <td>MONTHLY AMOUNT</td>
        </tr>
        <tr><td>Employment Income</td><td>$_________</td></tr>
        <tr><td>Rental Income</td><td>$_________</td></tr>
        <tr><td>Business Income</td><td>$_________</td></tr>
        <tr><td>Investment Income</td><td>$_________</td></tr>
        <tr><td>Other Income</td><td>$_________</td></tr>
        <tr class="total-row"><td>TOTAL MONTHLY INCOME</td><td>$_________</td></tr>
        
        <tr class="section-header">
            <td>MONTHLY EXPENSES</td>
            <td>AMOUNT</td>
        </tr>
        <tr><td>Total Debt Payments (from above)</td><td>$_________</td></tr>
        <tr><td>Living Expenses</td><td>$_________</td></tr>
        <tr><td>Insurance</td><td>$_________</td></tr>
        <tr><td>Taxes</td><td>$_________</td></tr>
        <tr><td>Other Expenses</td><td>$_________</td></tr>
        <tr class="total-row"><td>TOTAL MONTHLY EXPENSES</td><td>$_________</td></tr>
        
        <tr style="background: #d4edda; font-weight: bold;">
            <td>NET MONTHLY CASH FLOW</td>
            <td>$_________</td>
        </tr>
    </table>

    <div class="signature-area">
        <p>I certify that the information contained in this statement is true and complete to the best of my knowledge.</p>
        
        <p style="margin-top: 30px;">
            <strong>Borrower Signature:</strong> <span class="signature-line"></span> 
            <strong>Date:</strong> <span class="signature-line" style="width: 150px;"></span>
        </p>
        
        <p style="margin-top: 20px;">
            <strong>Co-Borrower Signature:</strong> <span class="signature-line"></span> 
            <strong>Date:</strong> <span class="signature-line" style="width: 150px;"></span>
        </p>
    </div>
</body>
</html>`;
  }

  private getRentRollHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Rent Roll</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 30px; line-height: 1.4; }
        .header { text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #000; padding: 8px; text-align: center; font-size: 12px; }
        th { background: #f0f0f0; font-weight: bold; }
        .property-info { margin: 20px 0; }
        .total-row { background: #e8f5e8; font-weight: bold; }
        .signature-area { margin-top: 40px; }
        .signature-line { border-bottom: 1px solid #000; width: 250px; display: inline-block; }
    </style>
</head>
<body>
    <div class="header">
        <h1>RENT ROLL</h1>
        <p><strong>Property Address:</strong> {{propertyAddress}}</p>
        <p><strong>Owner:</strong> {{borrowerName}}</p>
        <p><strong>Date:</strong> {{currentDate}}</p>
    </div>

    <div class="property-info">
        <p><strong>Property Type:</strong> _______________</p>
        <p><strong>Total Units:</strong> _______________</p>
        <p><strong>Occupied Units:</strong> _______________</p>
        <p><strong>Vacant Units:</strong> _______________</p>
        <p><strong>Occupancy Rate:</strong> _______________%</p>
    </div>

    <table>
        <tr>
            <th>Unit #</th>
            <th>Tenant Name</th>
            <th>Lease Start</th>
            <th>Lease End</th>
            <th>Monthly Rent</th>
            <th>Security Deposit</th>
            <th>Status</th>
            <th>Notes</th>
        </tr>
        <tr><td>101</td><td>_____________</td><td>_________</td><td>_________</td><td>$_______</td><td>$_______</td><td>________</td><td>_____________</td></tr>
        <tr><td>102</td><td>_____________</td><td>_________</td><td>_________</td><td>$_______</td><td>$_______</td><td>________</td><td>_____________</td></tr>
        <tr><td>103</td><td>_____________</td><td>_________</td><td>_________</td><td>$_______</td><td>$_______</td><td>________</td><td>_____________</td></tr>
        <tr><td>104</td><td>_____________</td><td>_________</td><td>_________</td><td>$_______</td><td>$_______</td><td>________</td><td>_____________</td></tr>
        <tr><td>201</td><td>_____________</td><td>_________</td><td>_________</td><td>$_______</td><td>$_______</td><td>________</td><td>_____________</td></tr>
        <tr><td>202</td><td>_____________</td><td>_________</td><td>_________</td><td>$_______</td><td>$_______</td><td>________</td><td>_____________</td></tr>
        <tr><td>203</td><td>_____________</td><td>_________</td><td>_________</td><td>$_______</td><td>$_______</td><td>________</td><td>_____________</td></tr>
        <tr><td>204</td><td>_____________</td><td>_________</td><td>_________</td><td>$_______</td><td>$_______</td><td>________</td><td>_____________</td></tr>
        <tr><td>301</td><td>_____________</td><td>_________</td><td>_________</td><td>$_______</td><td>$_______</td><td>________</td><td>_____________</td></tr>
        <tr><td>302</td><td>_____________</td><td>_________</td><td>_________</td><td>$_______</td><td>$_______</td><td>________</td><td>_____________</td></tr>
        <tr class="total-row">
            <td colspan="4"><strong>TOTAL MONTHLY RENT</strong></td>
            <td><strong>$_______</strong></td>
            <td><strong>$_______</strong></td>
            <td colspan="2"></td>
        </tr>
    </table>

    <h3>OPERATING EXPENSES (Annual)</h3>
    <table>
        <tr><th>Expense Category</th><th>Annual Amount</th></tr>
        <tr><td>Property Taxes</td><td>$_________</td></tr>
        <tr><td>Insurance</td><td>$_________</td></tr>
        <tr><td>Utilities</td><td>$_________</td></tr>
        <tr><td>Maintenance & Repairs</td><td>$_________</td></tr>
        <tr><td>Management Fees</td><td>$_________</td></tr>
        <tr><td>Marketing/Advertising</td><td>$_________</td></tr>
        <tr><td>Legal/Professional</td><td>$_________</td></tr>
        <tr><td>Other Expenses</td><td>$_________</td></tr>
        <tr class="total-row"><td><strong>TOTAL OPERATING EXPENSES</strong></td><td><strong>$_________</strong></td></tr>
    </table>

    <h3>NET OPERATING INCOME</h3>
    <table>
        <tr><td>Total Annual Rental Income</td><td>$_________</td></tr>
        <tr><td>Less: Vacancy Allowance (_____%)</td><td>($_________)</td></tr>
        <tr><td>Effective Gross Income</td><td>$_________</td></tr>
        <tr><td>Less: Operating Expenses</td><td>($_________)</td></tr>
        <tr class="total-row"><td><strong>NET OPERATING INCOME</strong></td><td><strong>$_________</strong></td></tr>
    </table>

    <div class="signature-area">
        <p>I certify that the information contained in this rent roll is true and accurate to the best of my knowledge.</p>
        
        <p style="margin-top: 30px;">
            <strong>Property Owner Signature:</strong> <span class="signature-line"></span> 
            <strong>Date:</strong> <span class="signature-line" style="width: 150px;"></span>
        </p>
        
        <p style="margin-top: 20px;">
            <strong>Property Manager Signature:</strong> <span class="signature-line"></span> 
            <strong>Date:</strong> <span class="signature-line" style="width: 150px;"></span>
        </p>
    </div>
</body>
</html>`;
  }

  private getVOMFormHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Verification of Mortgage</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 30px; line-height: 1.5; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #000; padding: 10px; text-align: left; }
        th { background: #f0f0f0; font-weight: bold; }
        .form-field { border-bottom: 1px solid #000; min-width: 200px; display: inline-block; margin: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>VERIFICATION OF MORTGAGE (VOM)</h1>
        <p><strong>CONFIDENTIAL INFORMATION</strong></p>
    </div>

    <div class="section">
        <h3>TO BE COMPLETED BY BORROWER</h3>
        <p><strong>Borrower Name:</strong> {{borrowerName}}</p>
        <p><strong>Property Address:</strong> {{propertyAddress}}</p>
        <p><strong>Loan Number:</strong> <span class="form-field"></span></p>
        <p><strong>Date:</strong> {{currentDate}}</p>
        
        <p style="margin-top: 20px;">
            I hereby authorize and request that you provide the mortgage information requested below to LoanFlow Pro for the purpose of verifying my mortgage account information in connection with my loan application.
        </p>
        
        <p style="margin-top: 20px;">
            <strong>Borrower Signature:</strong> <span class="form-field"></span> 
            <strong>Date:</strong> <span class="form-field"></span>
        </p>
    </div>

    <div class="section">
        <h3>TO BE COMPLETED BY LENDER/SERVICER</h3>
        <p><strong>Lender/Servicer Name:</strong> {{lenderName}}</p>
        <p><strong>Contact Person:</strong> <span class="form-field"></span></p>
        <p><strong>Phone Number:</strong> <span class="form-field"></span></p>
        <p><strong>Date:</strong> <span class="form-field"></span></p>
    </div>

    <table>
        <tr><th colspan="2">MORTGAGE INFORMATION</th></tr>
        <tr><td>Original Loan Amount</td><td>$<span class="form-field"></span></td></tr>
        <tr><td>Current Principal Balance</td><td>$<span class="form-field"></span></td></tr>
        <tr><td>Interest Rate</td><td><span class="form-field"></span>%</td></tr>
        <tr><td>Monthly Principal & Interest Payment</td><td>$<span class="form-field"></span></td></tr>
        <tr><td>Monthly Escrow Payment</td><td>$<span class="form-field"></span></td></tr>
        <tr><td>Total Monthly Payment</td><td>$<span class="form-field"></span></td></tr>
        <tr><td>Loan Term</td><td><span class="form-field"></span> years</td></tr>
        <tr><td>Remaining Term</td><td><span class="form-field"></span> years</td></tr>
        <tr><td>Original Loan Date</td><td><span class="form-field"></span></td></tr>
        <tr><td>Maturity Date</td><td><span class="form-field"></span></td></tr>
        <tr><td>Loan Type</td><td><span class="form-field"></span></td></tr>
    </table>

    <table>
        <tr><th colspan="2">PAYMENT HISTORY (Last 12 Months)</th></tr>
        <tr><td>Current Status</td><td>□ Current □ 30 Days Late □ 60 Days Late □ 90+ Days Late</td></tr>
        <tr><td>Number of Late Payments (30+ days)</td><td><span class="form-field"></span></td></tr>
        <tr><td>Date of Last Late Payment</td><td><span class="form-field"></span></td></tr>
        <tr><td>Highest Number of Days Late</td><td><span class="form-field"></span></td></tr>
        <tr><td>Current Escrow Balance</td><td>$<span class="form-field"></span></td></tr>
        <tr><td>Escrow Shortage</td><td>$<span class="form-field"></span></td></tr>
    </table>

    <div class="section">
        <h3>ADDITIONAL INFORMATION</h3>
        <p><strong>Is this loan assumable?</strong> □ Yes □ No</p>
        <p><strong>Is there a prepayment penalty?</strong> □ Yes □ No</p>
        <p><strong>If yes, penalty amount:</strong> $<span class="form-field"></span></p>
        <p><strong>Is the loan in foreclosure?</strong> □ Yes □ No</p>
        <p><strong>Is there a second mortgage?</strong> □ Yes □ No</p>
        
        <p style="margin-top: 20px;"><strong>Comments:</strong></p>
        <p><span class="form-field" style="width: 90%; min-height: 60px; display: block;"></span></p>
    </div>

    <div class="section">
        <p><strong>Completed By:</strong> <span class="form-field"></span></p>
        <p><strong>Title:</strong> <span class="form-field"></span></p>
        <p><strong>Signature:</strong> <span class="form-field"></span></p>
        <p><strong>Date:</strong> <span class="form-field"></span></p>
        <p><strong>Company Seal/Stamp:</strong></p>
    </div>

    <div style="margin-top: 30px; font-size: 12px; text-align: center; border-top: 1px solid #000; padding-top: 15px;">
        <p><strong>RETURN TO:</strong> LoanFlow Pro, Commercial Lending Department</p>
        <p>Phone: (555) 123-4567 | Fax: (555) 123-4568 | Email: docs@loanflowpro.com</p>
    </div>
</body>
</html>`;
  }
}

export const documentTemplateService = DocumentTemplateService.getInstance();