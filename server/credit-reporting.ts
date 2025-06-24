// Credit Reporting Integrations (Experian, Equifax, TransUnion)

export interface CreditReport {
  reportId: string;
  borrowerId: number;
  reportDate: Date;
  creditScore: number;
  creditBureau: 'experian' | 'equifax' | 'transunion' | 'tri_merge';
  reportType: 'individual' | 'business' | 'merged';
  personalInfo: {
    firstName: string;
    lastName: string;
    ssn: string;
    dateOfBirth: string;
    addresses: Array<{
      street: string;
      city: string;
      state: string;
      zipCode: string;
      type: 'current' | 'previous';
    }>;
  };
  accounts: Array<{
    creditorName: string;
    accountType: string;
    accountStatus: string;
    creditLimit: number;
    currentBalance: number;
    monthlyPayment: number;
    openDate: string;
    lastActivityDate: string;
    paymentHistory: string;
  }>;
  inquiries: Array<{
    creditorName: string;
    inquiryDate: string;
    inquiryType: 'hard' | 'soft';
  }>;
  publicRecords: Array<{
    type: string;
    date: string;
    amount: number;
    status: string;
  }>;
  summary: {
    totalAccounts: number;
    openAccounts: number;
    closedAccounts: number;
    totalDebt: number;
    availableCredit: number;
    creditUtilization: number;
    oldestAccount: string;
    newestAccount: string;
    averageAccountAge: number;
  };
}

export interface CreditAuthForm {
  borrowerId: number;
  firstName: string;
  lastName: string;
  ssn: string;
  dateOfBirth: string;
  currentAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  previousAddresses: Array<{
    street: string;
    city: string;
    state: string;
    zipCode: string;
    fromDate: string;
    toDate: string;
  }>;
  phoneNumber: string;
  email: string;
  employer: string;
  income: number;
  permissiblePurpose: string;
  signature: string;
  signatureDate: Date;
  ipAddress: string;
  consentGiven: boolean;
}

// Experian Integration
export class ExperianCreditService {
  private clientId: string | null = null;
  private clientSecret: string | null = null;
  private accessToken: string | null = null;
  private baseUrl = 'https://sandbox.experian.com/consumerservices'; // Use production URL in prod

  constructor() {
    this.clientId = process.env.EXPERIAN_CLIENT_ID || null;
    this.clientSecret = process.env.EXPERIAN_CLIENT_SECRET || null;
  }

  async authenticate(): Promise<boolean> {
    if (!this.clientId || !this.clientSecret) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/oauth2/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'credit_profile'
        })
      });

      const data = await response.json();
      if (data.access_token) {
        this.accessToken = data.access_token;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Experian authentication error:', error);
      return false;
    }
  }

  async pullCreditReport(authForm: CreditAuthForm): Promise<CreditReport | null> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    if (!this.accessToken) {
      throw new Error('Experian authentication failed');
    }

    try {
      const requestBody = {
        consumerPii: {
          primaryApplicant: {
            name: {
              firstName: authForm.firstName,
              lastName: authForm.lastName
            },
            ssn: authForm.ssn,
            dob: {
              dob: authForm.dateOfBirth
            },
            phone: {
              number: authForm.phoneNumber
            },
            email: {
              emailAddress: authForm.email
            },
            address: {
              line1: authForm.currentAddress.street,
              city: authForm.currentAddress.city,
              state: authForm.currentAddress.state,
              zipCode: authForm.currentAddress.zipCode
            },
            employment: {
              employer: authForm.employer,
              income: authForm.income
            }
          }
        },
        requestor: {
          subscriberCode: process.env.EXPERIAN_SUBSCRIBER_CODE,
          permissiblePurpose: authForm.permissiblePurpose
        },
        addOns: {
          scoreModel: 'v2',
          fraudShield: true,
          mla: true
        }
      };

      const response = await fetch(`${this.baseUrl}/credit-profile/v1/consumer-credit-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      return this.parseExperianReport(data, authForm.borrowerId);
    } catch (error) {
      console.error('Experian credit pull error:', error);
      return null;
    }
  }

  private parseExperianReport(data: any, borrowerId: number): CreditReport {
    const profile = data.consumerCreditProfile;
    const riskModel = data.riskModel?.[0];

    return {
      reportId: data.requestId,
      borrowerId,
      reportDate: new Date(),
      creditScore: riskModel?.score || 0,
      creditBureau: 'experian',
      reportType: 'individual',
      personalInfo: {
        firstName: profile.name?.firstName || '',
        lastName: profile.name?.lastName || '',
        ssn: profile.ssn || '',
        dateOfBirth: profile.dob?.dob || '',
        addresses: profile.address?.map((addr: any) => ({
          street: addr.line1,
          city: addr.city,
          state: addr.state,
          zipCode: addr.zipCode,
          type: addr.addressType === 'current' ? 'current' : 'previous'
        })) || []
      },
      accounts: profile.tradeline?.map((account: any) => ({
        creditorName: account.creditorName,
        accountType: account.accountType,
        accountStatus: account.accountStatus,
        creditLimit: account.creditLimit || 0,
        currentBalance: account.currentBalance || 0,
        monthlyPayment: account.monthlyPayment || 0,
        openDate: account.openDate,
        lastActivityDate: account.lastActivityDate,
        paymentHistory: account.paymentHistory
      })) || [],
      inquiries: profile.inquiry?.map((inq: any) => ({
        creditorName: inq.subscriberName,
        inquiryDate: inq.inquiryDate,
        inquiryType: inq.inquiryType
      })) || [],
      publicRecords: profile.publicRecord?.map((record: any) => ({
        type: record.type,
        date: record.date,
        amount: record.amount || 0,
        status: record.status
      })) || [],
      summary: {
        totalAccounts: profile.tradeline?.length || 0,
        openAccounts: profile.tradeline?.filter((t: any) => t.accountStatus === 'open').length || 0,
        closedAccounts: profile.tradeline?.filter((t: any) => t.accountStatus === 'closed').length || 0,
        totalDebt: profile.tradeline?.reduce((sum: number, t: any) => sum + (t.currentBalance || 0), 0) || 0,
        availableCredit: profile.tradeline?.reduce((sum: number, t: any) => sum + (t.creditLimit || 0), 0) || 0,
        creditUtilization: 0, // Calculate this
        oldestAccount: '',
        newestAccount: '',
        averageAccountAge: 0
      }
    };
  }
}

// Equifax Integration
export class EquifaxCreditService {
  private username: string | null = null;
  private password: string | null = null;
  private memberCode: string | null = null;
  private baseUrl = 'https://api.sandbox.equifax.com'; // Use production URL in prod

  constructor() {
    this.username = process.env.EQUIFAX_USERNAME || null;
    this.password = process.env.EQUIFAX_PASSWORD || null;
    this.memberCode = process.env.EQUIFAX_MEMBER_CODE || null;
  }

  async pullCreditReport(authForm: CreditAuthForm): Promise<CreditReport | null> {
    if (!this.username || !this.password || !this.memberCode) {
      throw new Error('Equifax credentials not configured');
    }

    try {
      const requestBody = {
        memberNumber: this.memberCode,
        securityCode: 'TEST',
        customerReferenceNumber: `REF_${Date.now()}`,
        subject: {
          firstName: authForm.firstName,
          lastName: authForm.lastName,
          ssn: authForm.ssn,
          dateOfBirth: authForm.dateOfBirth,
          address: {
            streetAddress: authForm.currentAddress.street,
            city: authForm.currentAddress.city,
            state: authForm.currentAddress.state,
            zipCode: authForm.currentAddress.zipCode
          }
        },
        permissiblePurpose: authForm.permissiblePurpose
      };

      const response = await fetch(`${this.baseUrl}/v1/credit-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      return this.parseEquifaxReport(data, authForm.borrowerId);
    } catch (error) {
      console.error('Equifax credit pull error:', error);
      return null;
    }
  }

  private parseEquifaxReport(data: any, borrowerId: number): CreditReport {
    // Parse Equifax response format
    return {
      reportId: data.reportId || `EFX_${Date.now()}`,
      borrowerId,
      reportDate: new Date(),
      creditScore: data.score || 0,
      creditBureau: 'equifax',
      reportType: 'individual',
      personalInfo: {
        firstName: data.subject?.firstName || '',
        lastName: data.subject?.lastName || '',
        ssn: data.subject?.ssn || '',
        dateOfBirth: data.subject?.dateOfBirth || '',
        addresses: []
      },
      accounts: [],
      inquiries: [],
      publicRecords: [],
      summary: {
        totalAccounts: 0,
        openAccounts: 0,
        closedAccounts: 0,
        totalDebt: 0,
        availableCredit: 0,
        creditUtilization: 0,
        oldestAccount: '',
        newestAccount: '',
        averageAccountAge: 0
      }
    };
  }
}

// Credit Reporting Service Orchestrator
export class CreditReportingService {
  private static instance: CreditReportingService;
  private experian: ExperianCreditService;
  private equifax: EquifaxCreditService;

  private constructor() {
    this.experian = new ExperianCreditService();
    this.equifax = new EquifaxCreditService();
  }

  public static getInstance(): CreditReportingService {
    if (!CreditReportingService.instance) {
      CreditReportingService.instance = new CreditReportingService();
    }
    return CreditReportingService.instance;
  }

  async pullTriMergeReport(authForm: CreditAuthForm): Promise<CreditReport[]> {
    const reports = await Promise.allSettled([
      this.experian.pullCreditReport(authForm),
      this.equifax.pullCreditReport(authForm),
      // TransUnion would go here
    ]);

    const validReports: CreditReport[] = [];
    reports.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        validReports.push(result.value);
      }
    });

    return validReports;
  }

  async pullSingleBureauReport(bureau: 'experian' | 'equifax' | 'transunion', authForm: CreditAuthForm): Promise<CreditReport | null> {
    switch (bureau) {
      case 'experian':
        return await this.experian.pullCreditReport(authForm);
      case 'equifax':
        return await this.equifax.pullCreditReport(authForm);
      case 'transunion':
        // TransUnion integration would go here
        return null;
      default:
        return null;
    }
  }

  generateCreditAuthForm(borrowerData: any): CreditAuthForm {
    return {
      borrowerId: borrowerData.id,
      firstName: borrowerData.firstName,
      lastName: borrowerData.lastName,
      ssn: borrowerData.ssn,
      dateOfBirth: borrowerData.dateOfBirth,
      currentAddress: {
        street: borrowerData.streetAddress,
        city: borrowerData.city,
        state: borrowerData.state,
        zipCode: borrowerData.zipCode
      },
      previousAddresses: borrowerData.previousAddresses || [],
      phoneNumber: borrowerData.phone,
      email: borrowerData.email,
      employer: borrowerData.employer || '',
      income: borrowerData.income || 0,
      permissiblePurpose: 'Credit evaluation for loan application',
      signature: '', // Will be filled by e-signature
      signatureDate: new Date(),
      ipAddress: '', // Will be captured from request
      consentGiven: false
    };
  }

  validateCreditScore(score: number, loanType: string): {
    isApproved: boolean;
    minimumRequired: number;
    recommendation: string;
  } {
    const requirements = {
      'dscr': { minimum: 680, preferred: 720 },
      'fix_and_flip': { minimum: 660, preferred: 700 },
      'commercial': { minimum: 700, preferred: 740 },
      'conventional': { minimum: 620, preferred: 740 }
    };

    const requirement = requirements[loanType as keyof typeof requirements] || requirements.dscr;

    return {
      isApproved: score >= requirement.minimum,
      minimumRequired: requirement.minimum,
      recommendation: score >= requirement.preferred ? 
        'Excellent credit score - qualify for best rates' :
        score >= requirement.minimum ?
        'Good credit score - approved with standard rates' :
        'Credit score below minimum - consider credit improvement'
    };
  }
}

export const creditReportingService = CreditReportingService.getInstance();