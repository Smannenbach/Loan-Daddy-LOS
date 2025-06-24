// Intelligent document pre-filling mechanism
// Extracts and maps data across different loan application forms

export interface DocumentData {
  // Personal Information
  firstName?: string;
  lastName?: string;
  middleName?: string;
  ssn?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  
  // Address Information
  currentAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  
  // Employment Information
  employer?: {
    name?: string;
    position?: string;
    phone?: string;
    address?: string;
    startDate?: string;
    yearsInField?: string;
  };
  
  // Income Information
  income?: {
    base?: string;
    overtime?: string;
    bonus?: string;
    commission?: string;
    other?: string;
  };
  
  // Property Information
  property?: {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    propertyType?: string;
    propertyValue?: string;
    purchasePrice?: string;
  };
  
  // Loan Information
  loan?: {
    type?: string;
    requestedAmount?: string;
    purpose?: string;
    exitStrategy?: string;
  };
  
  // Financial Information
  assets?: {
    checking?: Array<{
      institution?: string;
      accountNumber?: string;
      balance?: string;
    }>;
    savings?: Array<{
      institution?: string;
      accountNumber?: string;
      balance?: string;
    }>;
    retirement?: Array<{
      institution?: string;
      accountNumber?: string;
      balance?: string;
    }>;
  };
}

export class DocumentPreFillService {
  private static instance: DocumentPreFillService;
  private formData: Map<string, DocumentData> = new Map();
  
  public static getInstance(): DocumentPreFillService {
    if (!DocumentPreFillService.instance) {
      DocumentPreFillService.instance = new DocumentPreFillService();
    }
    return DocumentPreFillService.instance;
  }
  
  // Store form data with intelligent field mapping
  public storeFormData(formType: string, data: any): void {
    const mappedData = this.mapFormData(formType, data);
    const existingData = this.formData.get('consolidated') || {};
    const mergedData = this.mergeData(existingData, mappedData);
    this.formData.set('consolidated', mergedData);
    this.formData.set(formType, mappedData);
  }
  
  // Retrieve pre-filled data for a specific form type
  public getPreFilledData(targetFormType: string): any {
    const consolidatedData = this.formData.get('consolidated') || {};
    return this.mapToTargetForm(targetFormType, consolidatedData);
  }
  
  // Map incoming form data to standardized structure
  private mapFormData(formType: string, data: any): DocumentData {
    switch (formType) {
      case 'shortApplication':
        return this.mapShortApplicationData(data);
      case 'urla':
        return this.mapUrlaData(data);
      case 'customerPortal':
        return this.mapCustomerPortalData(data);
      default:
        return {};
    }
  }
  
  private mapShortApplicationData(data: any): DocumentData {
    const nameParts = (data.borrowerName || '').split(' ');
    return {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: data.email,
      phone: data.phone,
      property: this.parseAddress(data.propertyAddress, {
        propertyType: data.propertyType,
        propertyValue: data.estimatedValue,
        purchasePrice: data.purchasePrice,
      }),
      loan: {
        type: data.loanType,
        requestedAmount: data.loanAmount,
        exitStrategy: data.exitStrategy,
      },
    };
  }
  
  private mapUrlaData(data: any): DocumentData {
    return {
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName,
      ssn: data.ssn,
      dateOfBirth: data.dateOfBirth,
      email: data.email,
      phone: data.cellPhone,
      currentAddress: {
        street: data.currentStreet,
        city: data.currentCity,
        state: data.currentState,
        zipCode: data.currentZip,
        country: data.currentCountry,
      },
      employer: {
        name: data.employerName,
        position: data.position,
        phone: data.employerPhone,
        startDate: data.startDate,
        yearsInField: data.workYears,
      },
      income: {
        base: data.baseIncome,
        overtime: data.overtimeIncome,
        bonus: data.bonusIncome,
        commission: data.commissionIncome,
        other: data.otherIncome,
      },
      assets: {
        checking: [{
          institution: data.checkingInstitution1,
          accountNumber: data.checkingAccountNumber1,
          balance: data.checkingValue1,
        }],
        savings: [{
          institution: data.savingsInstitution1,
          accountNumber: data.savingsAccountNumber1,
          balance: data.savingsValue1,
        }],
        retirement: [{
          institution: data.retirementInstitution1,
          accountNumber: data.retirementAccountNumber1,
          balance: data.retirementValue1,
        }],
      },
    };
  }
  
  private mapCustomerPortalData(data: any): DocumentData {
    return {
      // Map customer portal specific data
      ...data,
    };
  }
  
  // Parse address string into components
  private parseAddress(addressString: string, additionalProps: any = {}): any {
    if (!addressString) return additionalProps;
    
    const parts = addressString.split(',');
    return {
      address: parts[0]?.trim() || addressString,
      city: parts[1]?.trim() || '',
      state: parts[2]?.trim().split(' ')[0] || '',
      zipCode: parts[2]?.trim().split(' ')[1] || '',
      ...additionalProps,
    };
  }
  
  // Merge data intelligently, preserving most complete information
  private mergeData(existing: DocumentData, incoming: DocumentData): DocumentData {
    const merged: DocumentData = { ...existing };
    
    // Merge simple fields (prefer non-empty values)
    Object.keys(incoming).forEach(key => {
      if (key === 'currentAddress' || key === 'property' || key === 'employer' || key === 'income' || key === 'assets' || key === 'loan') {
        return; // Handle complex objects separately
      }
      
      const value = (incoming as any)[key];
      if (value && value !== '' && value !== '0') {
        (merged as any)[key] = value;
      }
    });
    
    // Merge complex objects
    if (incoming.currentAddress) {
      merged.currentAddress = { ...existing.currentAddress, ...incoming.currentAddress };
    }
    
    if (incoming.property) {
      merged.property = { ...existing.property, ...incoming.property };
    }
    
    if (incoming.employer) {
      merged.employer = { ...existing.employer, ...incoming.employer };
    }
    
    if (incoming.income) {
      merged.income = { ...existing.income, ...incoming.income };
    }
    
    if (incoming.loan) {
      merged.loan = { ...existing.loan, ...incoming.loan };
    }
    
    if (incoming.assets) {
      merged.assets = {
        checking: this.mergeAccountArrays(existing.assets?.checking, incoming.assets.checking),
        savings: this.mergeAccountArrays(existing.assets?.savings, incoming.assets.savings),
        retirement: this.mergeAccountArrays(existing.assets?.retirement, incoming.assets.retirement),
      };
    }
    
    return merged;
  }
  
  private mergeAccountArrays(existing: any[] = [], incoming: any[] = []): any[] {
    const merged = [...existing];
    
    incoming.forEach(incomingAccount => {
      if (incomingAccount && Object.values(incomingAccount).some(v => v && v !== '')) {
        const existingIndex = merged.findIndex(existing => 
          existing.institution === incomingAccount.institution ||
          existing.accountNumber === incomingAccount.accountNumber
        );
        
        if (existingIndex >= 0) {
          merged[existingIndex] = { ...merged[existingIndex], ...incomingAccount };
        } else {
          merged.push(incomingAccount);
        }
      }
    });
    
    return merged;
  }
  
  // Map consolidated data to specific target form format
  private mapToTargetForm(targetFormType: string, data: DocumentData): any {
    switch (targetFormType) {
      case 'shortApplication':
        return this.mapToShortApplication(data);
      case 'urla':
        return this.mapToUrla(data);
      case 'customerPortal':
        return this.mapToCustomerPortal(data);
      default:
        return {};
    }
  }
  
  private mapToShortApplication(data: DocumentData): any {
    return {
      borrowerName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      email: data.email || '',
      phone: data.phone || '',
      propertyAddress: this.formatAddress(data.property),
      loanType: data.loan?.type || 'purchase',
      loanAmount: data.loan?.requestedAmount || '',
      estimatedValue: data.property?.propertyValue || '',
      purchasePrice: data.property?.purchasePrice || '',
      exitStrategy: data.loan?.exitStrategy || '',
      propertyType: data.property?.propertyType || 'sfr',
      // Add defaults for other fields
      creditScore: '',
      flipsCompleted: '0',
      rentalsOwned: '0',
      isExperienced: 'no',
    };
  }
  
  private mapToUrla(data: DocumentData): any {
    return {
      firstName: data.firstName || '',
      middleName: data.middleName || '',
      lastName: data.lastName || '',
      ssn: data.ssn || '',
      dateOfBirth: data.dateOfBirth || '',
      email: data.email || '',
      cellPhone: data.phone || '',
      
      // Address
      currentStreet: data.currentAddress?.street || data.property?.address || '',
      currentCity: data.currentAddress?.city || data.property?.city || '',
      currentState: data.currentAddress?.state || data.property?.state || '',
      currentZip: data.currentAddress?.zipCode || data.property?.zipCode || '',
      currentCountry: data.currentAddress?.country || 'US',
      
      // Employment
      employerName: data.employer?.name || '',
      position: data.employer?.position || '',
      employerPhone: data.employer?.phone || '',
      startDate: data.employer?.startDate || '',
      workYears: data.employer?.yearsInField || '0',
      
      // Income
      baseIncome: data.income?.base || '0',
      overtimeIncome: data.income?.overtime || '0',
      bonusIncome: data.income?.bonus || '0',
      commissionIncome: data.income?.commission || '0',
      otherIncome: data.income?.other || '0',
      
      // Assets
      checkingInstitution1: data.assets?.checking?.[0]?.institution || '',
      checkingAccountNumber1: data.assets?.checking?.[0]?.accountNumber || '',
      checkingValue1: data.assets?.checking?.[0]?.balance || '',
      
      savingsInstitution1: data.assets?.savings?.[0]?.institution || '',
      savingsAccountNumber1: data.assets?.savings?.[0]?.accountNumber || '',
      savingsValue1: data.assets?.savings?.[0]?.balance || '',
      
      retirementInstitution1: data.assets?.retirement?.[0]?.institution || '',
      retirementAccountNumber1: data.assets?.retirement?.[0]?.accountNumber || '',
      retirementValue1: data.assets?.retirement?.[0]?.balance || '',
      
      // Defaults
      citizenship: 'us_citizen',
      creditType: 'individual',
      maritalStatus: 'unmarried',
      currentHousing: 'own',
      selfEmployed: false,
      familyEmployed: false,
    };
  }
  
  private mapToCustomerPortal(data: DocumentData): any {
    return {
      personalInfo: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
      },
      propertyInfo: data.property,
      loanInfo: data.loan,
      // Add other relevant mappings
    };
  }
  
  private formatAddress(property: any): string {
    if (!property) return '';
    
    const parts = [
      property.address,
      property.city,
      `${property.state || ''} ${property.zipCode || ''}`.trim()
    ].filter(part => part && part.trim() !== '');
    
    return parts.join(', ');
  }
  
  // Clear stored data (useful for testing or data privacy)
  public clearData(): void {
    this.formData.clear();
  }
  
  // Get data confidence score (how complete the data is)
  public getDataCompleteness(): number {
    const data = this.formData.get('consolidated') || {};
    const totalFields = 20; // Approximate number of important fields
    let completedFields = 0;
    
    if (data.firstName) completedFields++;
    if (data.lastName) completedFields++;
    if (data.email) completedFields++;
    if (data.phone) completedFields++;
    if (data.ssn) completedFields++;
    if (data.dateOfBirth) completedFields++;
    if (data.currentAddress?.street) completedFields++;
    if (data.currentAddress?.city) completedFields++;
    if (data.currentAddress?.state) completedFields++;
    if (data.currentAddress?.zipCode) completedFields++;
    if (data.employer?.name) completedFields++;
    if (data.employer?.position) completedFields++;
    if (data.income?.base) completedFields++;
    if (data.property?.address) completedFields++;
    if (data.property?.propertyValue) completedFields++;
    if (data.loan?.type) completedFields++;
    if (data.loan?.requestedAmount) completedFields++;
    if (data.assets?.checking?.[0]?.institution) completedFields++;
    if (data.assets?.savings?.[0]?.institution) completedFields++;
    if (data.assets?.retirement?.[0]?.institution) completedFields++;
    
    return Math.round((completedFields / totalFields) * 100);
  }
}

// Export singleton instance
export const documentPreFill = DocumentPreFillService.getInstance();