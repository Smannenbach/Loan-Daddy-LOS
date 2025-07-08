import { z } from 'zod';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import crypto from 'crypto';
import type { 
  CustomerUser, 
  CustomerSession, 
  InsertCustomerUser,
  CustomerLoanApplication,
  CustomerDocument 
} from '@shared/schema';

// Validation schemas
export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export type SignupData = z.infer<typeof signupSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type PasswordResetRequestData = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetData = z.infer<typeof passwordResetSchema>;

// Session duration: 30 days
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000;

export class CustomerAuthService {
  private static instance: CustomerAuthService;
  private customers: Map<number, CustomerUser> = new Map();
  private customersByEmail: Map<string, CustomerUser> = new Map();
  private sessions: Map<string, CustomerSession> = new Map();

  private constructor() {
    this.initializeTestData();
  }

  public static getInstance(): CustomerAuthService {
    if (!CustomerAuthService.instance) {
      CustomerAuthService.instance = new CustomerAuthService();
    }
    return CustomerAuthService.instance;
  }

  private initializeTestData(): void {
    // Create some test customers for development
    const testCustomers = [
      {
        email: 'john.doe@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1-555-0123'
      },
      {
        email: 'jane.smith@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1-555-0124'
      }
    ];

    testCustomers.forEach((customerData, index) => {
      const hashedPassword = bcrypt.hashSync(customerData.password, 10);
      const customer: CustomerUser = {
        id: index + 1,
        email: customerData.email,
        password: hashedPassword,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        phone: customerData.phone,
        isEmailVerified: true,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        lastLogin: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.customers.set(customer.id, customer);
      this.customersByEmail.set(customer.email, customer);
    });

    console.log('Customer auth service initialized with test data');
  }

  async signup(data: SignupData): Promise<{ customer: Omit<CustomerUser, 'password'>; sessionId: string }> {
    try {
      // Check if customer already exists
      if (this.customersByEmail.has(data.email)) {
        throw new Error('An account with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create customer
      const customerId = this.customers.size + 1;
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');

      const customer: CustomerUser = {
        id: customerId,
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        isEmailVerified: false,
        emailVerificationToken,
        passwordResetToken: null,
        passwordResetExpires: null,
        lastLogin: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.customers.set(customerId, customer);
      this.customersByEmail.set(customer.email, customer);

      // Create session
      const sessionId = await this.createSession(customerId);

      // Remove password from response
      const { password, ...customerResponse } = customer;

      console.log(`Customer registered: ${customer.email}`);
      return { customer: customerResponse, sessionId };
    } catch (error) {
      console.error('Customer signup error:', error);
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  async login(data: LoginData): Promise<{ customer: Omit<CustomerUser, 'password'>; sessionId: string }> {
    try {
      const customer = this.customersByEmail.get(data.email);
      
      if (!customer) {
        throw new Error('Invalid email or password');
      }

      if (!customer.isActive) {
        throw new Error('Account has been deactivated');
      }

      // Check password
      const isValidPassword = await bcrypt.compare(data.password, customer.password);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      customer.lastLogin = new Date();
      this.customers.set(customer.id, customer);
      this.customersByEmail.set(customer.email, customer);

      // Create session
      const sessionId = await this.createSession(customer.id);

      // Remove password from response
      const { password, ...customerResponse } = customer;

      console.log(`Customer logged in: ${customer.email}`);
      return { customer: customerResponse, sessionId };
    } catch (error) {
      console.error('Customer login error:', error);
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async logout(sessionId: string): Promise<void> {
    try {
      this.sessions.delete(sessionId);
      console.log(`Customer logged out: ${sessionId}`);
    } catch (error) {
      console.error('Customer logout error:', error);
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  async getCustomerBySession(sessionId: string): Promise<Omit<CustomerUser, 'password'> | null> {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        return null;
      }

      // Check if session has expired
      if (new Date() > session.expiresAt) {
        this.sessions.delete(sessionId);
        return null;
      }

      const customer = this.customers.get(session.customerId);
      if (!customer || !customer.isActive) {
        return null;
      }

      // Remove password from response
      const { password, ...customerResponse } = customer;
      return customerResponse;
    } catch (error) {
      console.error('Get customer by session error:', error);
      return null;
    }
  }

  async refreshSession(sessionId: string): Promise<string | null> {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        return null;
      }

      // Check if session has expired
      if (new Date() > session.expiresAt) {
        this.sessions.delete(sessionId);
        return null;
      }

      // Create new session
      const newSessionId = await this.createSession(session.customerId);
      
      // Delete old session
      this.sessions.delete(sessionId);

      return newSessionId;
    } catch (error) {
      console.error('Refresh session error:', error);
      return null;
    }
  }

  async requestPasswordReset(data: PasswordResetRequestData): Promise<string> {
    try {
      const customer = this.customersByEmail.get(data.email);
      
      if (!customer) {
        // Don't reveal if email exists or not for security
        return 'If an account with that email exists, a password reset link has been sent.';
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      customer.passwordResetToken = resetToken;
      customer.passwordResetExpires = resetExpires;
      customer.updatedAt = new Date();

      this.customers.set(customer.id, customer);
      this.customersByEmail.set(customer.email, customer);

      console.log(`Password reset requested for: ${customer.email}, token: ${resetToken}`);
      return 'If an account with that email exists, a password reset link has been sent.';
    } catch (error) {
      console.error('Password reset request error:', error);
      throw new Error(`Password reset request failed: ${error.message}`);
    }
  }

  async resetPassword(data: PasswordResetData): Promise<void> {
    try {
      // Find customer by reset token
      const customer = Array.from(this.customers.values()).find(
        c => c.passwordResetToken === data.token && 
             c.passwordResetExpires && 
             new Date() < c.passwordResetExpires
      );

      if (!customer) {
        throw new Error('Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(data.newPassword, 10);

      // Update customer
      customer.password = hashedPassword;
      customer.passwordResetToken = null;
      customer.passwordResetExpires = null;
      customer.updatedAt = new Date();

      this.customers.set(customer.id, customer);
      this.customersByEmail.set(customer.email, customer);

      console.log(`Password reset completed for: ${customer.email}`);
    } catch (error) {
      console.error('Password reset error:', error);
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      // Find customer by verification token
      const customer = Array.from(this.customers.values()).find(
        c => c.emailVerificationToken === token
      );

      if (!customer) {
        throw new Error('Invalid verification token');
      }

      // Update customer
      customer.isEmailVerified = true;
      customer.emailVerificationToken = null;
      customer.updatedAt = new Date();

      this.customers.set(customer.id, customer);
      this.customersByEmail.set(customer.email, customer);

      console.log(`Email verified for: ${customer.email}`);
    } catch (error) {
      console.error('Email verification error:', error);
      throw new Error(`Email verification failed: ${error.message}`);
    }
  }

  async updateCustomer(customerId: number, updates: Partial<InsertCustomerUser>): Promise<Omit<CustomerUser, 'password'>> {
    try {
      const customer = this.customers.get(customerId);
      
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Update customer data
      const updatedCustomer = {
        ...customer,
        ...updates,
        updatedAt: new Date()
      };

      // If email is being updated, update the email index
      if (updates.email && updates.email !== customer.email) {
        this.customersByEmail.delete(customer.email);
        this.customersByEmail.set(updates.email, updatedCustomer);
      }

      this.customers.set(customerId, updatedCustomer);

      // Remove password from response
      const { password, ...customerResponse } = updatedCustomer;
      
      console.log(`Customer updated: ${updatedCustomer.email}`);
      return customerResponse;
    } catch (error) {
      console.error('Update customer error:', error);
      throw new Error(`Customer update failed: ${error.message}`);
    }
  }

  private async createSession(customerId: number): Promise<string> {
    const sessionId = nanoid();
    const expiresAt = new Date(Date.now() + SESSION_DURATION);

    const session: CustomerSession = {
      id: sessionId,
      customerId,
      expiresAt,
      createdAt: new Date()
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  // Cleanup expired sessions (call periodically)
  cleanupExpiredSessions(): void {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
      }
    }
  }

  // Get all customers (admin function)
  async getAllCustomers(): Promise<Omit<CustomerUser, 'password'>[]> {
    return Array.from(this.customers.values()).map(({ password, ...customer }) => customer);
  }

  // Deactivate customer (admin function)
  async deactivateCustomer(customerId: number): Promise<void> {
    const customer = this.customers.get(customerId);
    if (customer) {
      customer.isActive = false;
      customer.updatedAt = new Date();
      this.customers.set(customerId, customer);
      
      // Remove all sessions for this customer
      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.customerId === customerId) {
          this.sessions.delete(sessionId);
        }
      }
    }
  }
}

export const customerAuth = CustomerAuthService.getInstance();