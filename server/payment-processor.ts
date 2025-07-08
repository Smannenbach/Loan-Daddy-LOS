import { nanoid } from 'nanoid';

export interface PaymentIntentRequest {
  amount: number;
  currency: string;
  loanApplicationId?: number;
  borrowerId?: number;
  description: string;
  feeTypes: string[];
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'processing' | 'succeeded' | 'failed';
  clientSecret: string;
  loanApplicationId?: number;
  borrowerId?: number;
  description: string;
  feeTypes: string[];
  createdAt: Date;
  metadata: Record<string, any>;
}

export interface LoanCalculationRequest {
  principal: number;
  interestRate: number;
  termYears: number;
  paymentFrequency: 'monthly' | 'quarterly' | 'annually';
}

export interface LoanCalculationResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  paymentSchedule: Array<{
    paymentNumber: number;
    paymentDate: Date;
    principalPayment: number;
    interestPayment: number;
    totalPayment: number;
    remainingBalance: number;
  }>;
  summary: {
    effectiveRate: number;
    payoffDate: Date;
    totalPayments: number;
  };
}

export interface FeeCalculation {
  feeType: string;
  description: string;
  amount: number;
  percentage?: number;
  isRequired: boolean;
  category: 'origination' | 'processing' | 'underwriting' | 'closing' | 'service';
}

export interface PaymentTransaction {
  id: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  processorId: string;
  processorResponse: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
  failureReason?: string;
  refundAmount?: number;
  refundedAt?: Date;
}

export class PaymentProcessor {
  private static instance: PaymentProcessor;
  private paymentIntents: Map<string, PaymentIntent> = new Map();
  private transactions: Map<string, PaymentTransaction> = new Map();

  private constructor() {}

  public static getInstance(): PaymentProcessor {
    if (!PaymentProcessor.instance) {
      PaymentProcessor.instance = new PaymentProcessor();
    }
    return PaymentProcessor.instance;
  }

  async createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntent> {
    try {
      const intentId = `pi_${nanoid(24)}`;
      const clientSecret = `${intentId}_secret_${nanoid(16)}`;

      const paymentIntent: PaymentIntent = {
        id: intentId,
        amount: request.amount,
        currency: request.currency.toLowerCase(),
        status: 'requires_payment_method',
        clientSecret,
        loanApplicationId: request.loanApplicationId,
        borrowerId: request.borrowerId,
        description: request.description,
        feeTypes: request.feeTypes,
        createdAt: new Date(),
        metadata: {
          source: 'loan_origination_system',
          version: '1.0.0'
        }
      };

      this.paymentIntents.set(intentId, paymentIntent);
      
      console.log(`Payment intent created: ${intentId} for amount: ${request.amount} ${request.currency}`);
      
      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error(`Payment intent creation failed: ${error.message}`);
    }
  }

  async calculateLoanPayment(request: LoanCalculationRequest): Promise<LoanCalculationResult> {
    try {
      const { principal, interestRate, termYears, paymentFrequency } = request;
      
      // Convert annual rate to decimal and adjust for payment frequency
      const annualRate = interestRate / 100;
      let paymentsPerYear: number;
      
      switch (paymentFrequency) {
        case 'monthly':
          paymentsPerYear = 12;
          break;
        case 'quarterly':
          paymentsPerYear = 4;
          break;
        case 'annually':
          paymentsPerYear = 1;
          break;
        default:
          throw new Error('Invalid payment frequency');
      }
      
      const periodicRate = annualRate / paymentsPerYear;
      const totalPayments = termYears * paymentsPerYear;
      
      // Calculate payment using standard loan formula
      let paymentAmount: number;
      if (periodicRate === 0) {
        // No interest case
        paymentAmount = principal / totalPayments;
      } else {
        paymentAmount = principal * (periodicRate * Math.pow(1 + periodicRate, totalPayments)) / 
                      (Math.pow(1 + periodicRate, totalPayments) - 1);
      }
      
      // Generate payment schedule
      const paymentSchedule = [];
      let remainingBalance = principal;
      const startDate = new Date();
      
      for (let i = 1; i <= totalPayments; i++) {
        const interestPayment = remainingBalance * periodicRate;
        const principalPayment = paymentAmount - interestPayment;
        remainingBalance = Math.max(0, remainingBalance - principalPayment);
        
        // Calculate payment date
        const paymentDate = new Date(startDate);
        switch (paymentFrequency) {
          case 'monthly':
            paymentDate.setMonth(paymentDate.getMonth() + i);
            break;
          case 'quarterly':
            paymentDate.setMonth(paymentDate.getMonth() + (i * 3));
            break;
          case 'annually':
            paymentDate.setFullYear(paymentDate.getFullYear() + i);
            break;
        }
        
        paymentSchedule.push({
          paymentNumber: i,
          paymentDate,
          principalPayment: Math.round(principalPayment * 100) / 100,
          interestPayment: Math.round(interestPayment * 100) / 100,
          totalPayment: Math.round(paymentAmount * 100) / 100,
          remainingBalance: Math.round(remainingBalance * 100) / 100
        });
      }
      
      const totalPayment = paymentAmount * totalPayments;
      const totalInterest = totalPayment - principal;
      
      // Calculate payoff date
      const payoffDate = new Date(startDate);
      switch (paymentFrequency) {
        case 'monthly':
          payoffDate.setMonth(payoffDate.getMonth() + totalPayments);
          break;
        case 'quarterly':
          payoffDate.setMonth(payoffDate.getMonth() + (totalPayments * 3));
          break;
        case 'annually':
          payoffDate.setFullYear(payoffDate.getFullYear() + totalPayments);
          break;
      }
      
      return {
        monthlyPayment: Math.round(paymentAmount * 100) / 100,
        totalPayment: Math.round(totalPayment * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        paymentSchedule,
        summary: {
          effectiveRate: annualRate,
          payoffDate,
          totalPayments
        }
      };
    } catch (error) {
      console.error('Error calculating loan payment:', error);
      throw new Error(`Loan calculation failed: ${error.message}`);
    }
  }

  async calculateLoanFees(loanAmount: number, loanType: string, lenderRequirements?: string[]): Promise<FeeCalculation[]> {
    const fees: FeeCalculation[] = [];
    
    // Origination fees (typically 1-3% of loan amount)
    const originationRate = this.getOriginationRate(loanType);
    fees.push({
      feeType: 'origination',
      description: 'Loan origination fee',
      amount: Math.round(loanAmount * originationRate * 100) / 100,
      percentage: originationRate * 100,
      isRequired: true,
      category: 'origination'
    });
    
    // Processing fees
    fees.push({
      feeType: 'processing',
      description: 'Application processing fee',
      amount: 495,
      isRequired: true,
      category: 'processing'
    });
    
    // Underwriting fees
    fees.push({
      feeType: 'underwriting',
      description: 'Underwriting and credit analysis',
      amount: 750,
      isRequired: true,
      category: 'underwriting'
    });
    
    // Appraisal fee (varies by property type)
    const appraisalFee = this.getAppraisalFee(loanType);
    fees.push({
      feeType: 'appraisal',
      description: 'Property appraisal',
      amount: appraisalFee,
      isRequired: true,
      category: 'underwriting'
    });
    
    // Environmental assessment (for commercial properties)
    if (loanType === 'commercial' || loanType === 'bridge') {
      fees.push({
        feeType: 'environmental',
        description: 'Environmental assessment',
        amount: 1250,
        isRequired: true,
        category: 'underwriting'
      });
    }
    
    // Document preparation
    fees.push({
      feeType: 'document_prep',
      description: 'Document preparation and review',
      amount: 350,
      isRequired: true,
      category: 'closing'
    });
    
    // Wire transfer fee
    fees.push({
      feeType: 'wire_transfer',
      description: 'Wire transfer fee',
      amount: 35,
      isRequired: false,
      category: 'closing'
    });
    
    // Tax service fee
    fees.push({
      feeType: 'tax_service',
      description: 'Tax monitoring service',
      amount: 89,
      isRequired: false,
      category: 'service'
    });
    
    // Flood certification
    fees.push({
      feeType: 'flood_cert',
      description: 'Flood zone certification',
      amount: 25,
      isRequired: true,
      category: 'underwriting'
    });
    
    return fees;
  }

  private getOriginationRate(loanType: string): number {
    switch (loanType.toLowerCase()) {
      case 'dscr':
        return 0.015; // 1.5%
      case 'fix_and_flip':
      case 'fix-and-flip':
        return 0.025; // 2.5%
      case 'bridge':
        return 0.02; // 2%
      case 'commercial':
        return 0.01; // 1%
      default:
        return 0.02; // 2% default
    }
  }

  private getAppraisalFee(loanType: string): number {
    switch (loanType.toLowerCase()) {
      case 'dscr':
        return 650;
      case 'fix_and_flip':
      case 'fix-and-flip':
        return 750; // May need multiple appraisals
      case 'bridge':
        return 700;
      case 'commercial':
        return 2500; // Commercial appraisals are more expensive
      default:
        return 650;
    }
  }

  async processPayment(paymentIntentId: string, paymentMethodData: Record<string, any>): Promise<PaymentTransaction> {
    try {
      const paymentIntent = this.paymentIntents.get(paymentIntentId);
      
      if (!paymentIntent) {
        throw new Error('Payment intent not found');
      }
      
      if (paymentIntent.status !== 'requires_payment_method' && paymentIntent.status !== 'requires_confirmation') {
        throw new Error(`Payment intent status ${paymentIntent.status} does not allow processing`);
      }
      
      const transactionId = `txn_${nanoid(24)}`;
      
      // Simulate payment processing
      const isSuccessful = Math.random() > 0.05; // 95% success rate
      
      const transaction: PaymentTransaction = {
        id: transactionId,
        paymentIntentId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: isSuccessful ? 'completed' : 'failed',
        paymentMethod: paymentMethodData.type || 'card',
        processorId: `processor_${nanoid(16)}`,
        processorResponse: {
          success: isSuccessful,
          transactionId: `ext_${nanoid(20)}`,
          processorMessage: isSuccessful ? 'Payment processed successfully' : 'Card declined',
          timestamp: new Date().toISOString()
        },
        createdAt: new Date(),
        completedAt: isSuccessful ? new Date() : undefined,
        failureReason: isSuccessful ? undefined : 'Card declined by issuer'
      };
      
      this.transactions.set(transactionId, transaction);
      
      // Update payment intent status
      paymentIntent.status = isSuccessful ? 'succeeded' : 'failed';
      this.paymentIntents.set(paymentIntentId, paymentIntent);
      
      console.log(`Payment ${isSuccessful ? 'succeeded' : 'failed'}: ${transactionId}`);
      
      return transaction;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  async refundPayment(transactionId: string, amount?: number): Promise<PaymentTransaction> {
    try {
      const transaction = this.transactions.get(transactionId);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      if (transaction.status !== 'completed') {
        throw new Error('Cannot refund transaction that is not completed');
      }
      
      const refundAmount = amount || transaction.amount;
      
      if (refundAmount > transaction.amount) {
        throw new Error('Refund amount cannot exceed original transaction amount');
      }
      
      // Update transaction with refund information
      transaction.status = 'refunded';
      transaction.refundAmount = refundAmount;
      transaction.refundedAt = new Date();
      
      this.transactions.set(transactionId, transaction);
      
      console.log(`Refund processed: ${refundAmount} ${transaction.currency} for transaction ${transactionId}`);
      
      return transaction;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw new Error(`Refund processing failed: ${error.message}`);
    }
  }

  async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent | null> {
    return this.paymentIntents.get(paymentIntentId) || null;
  }

  async getTransaction(transactionId: string): Promise<PaymentTransaction | null> {
    return this.transactions.get(transactionId) || null;
  }

  async getTransactionsByPaymentIntent(paymentIntentId: string): Promise<PaymentTransaction[]> {
    const transactions = Array.from(this.transactions.values());
    return transactions.filter(tx => tx.paymentIntentId === paymentIntentId);
  }

  async getPaymentHistory(borrowerId: number): Promise<Array<{
    paymentIntent: PaymentIntent;
    transactions: PaymentTransaction[];
  }>> {
    const borrowerPaymentIntents = Array.from(this.paymentIntents.values())
      .filter(pi => pi.borrowerId === borrowerId);
    
    const history = borrowerPaymentIntents.map(paymentIntent => ({
      paymentIntent,
      transactions: this.getTransactionsByPaymentIntent(paymentIntent.id)
    }));
    
    return Promise.all(history);
  }

  async generatePaymentReport(startDate: Date, endDate: Date): Promise<{
    totalVolume: number;
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    refundedTransactions: number;
    averageTransactionAmount: number;
    successRate: number;
    totalFees: number;
    feeBreakdown: Record<string, number>;
  }> {
    const transactions = Array.from(this.transactions.values())
      .filter(tx => tx.createdAt >= startDate && tx.createdAt <= endDate);
    
    const totalTransactions = transactions.length;
    const successfulTransactions = transactions.filter(tx => tx.status === 'completed').length;
    const failedTransactions = transactions.filter(tx => tx.status === 'failed').length;
    const refundedTransactions = transactions.filter(tx => tx.status === 'refunded').length;
    
    const totalVolume = transactions
      .filter(tx => tx.status === 'completed')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const averageTransactionAmount = totalTransactions > 0 ? totalVolume / successfulTransactions : 0;
    const successRate = totalTransactions > 0 ? successfulTransactions / totalTransactions : 0;
    
    // Calculate fee breakdown (simplified)
    const feeBreakdown = {
      'origination': totalVolume * 0.02,
      'processing': successfulTransactions * 495,
      'underwriting': successfulTransactions * 750,
      'other': successfulTransactions * 200
    };
    
    const totalFees = Object.values(feeBreakdown).reduce((sum, fee) => sum + fee, 0);
    
    return {
      totalVolume,
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      refundedTransactions,
      averageTransactionAmount,
      successRate,
      totalFees,
      feeBreakdown
    };
  }
}

export const paymentProcessor = PaymentProcessor.getInstance();