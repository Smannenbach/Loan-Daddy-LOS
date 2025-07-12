import { db } from './db';
import { organizations, users, borrowerAuth, realtorAuth } from '../shared/schema';
import bcrypt from 'bcrypt';

export async function initializeDatabase() {
  try {
    console.log('Initializing database with test data...');
    
    // Create test organization
    const [org] = await db.insert(organizations).values({
      name: 'LoanGenius Demo',
      subdomain: 'demo',
      plan: 'enterprise',
      status: 'active',
      nmls: '123456',
      website: 'https://loangenius.ai'
    }).returning();
    
    // Create test loan officer
    const hashedPassword = await bcrypt.hash('demo123', 10);
    const [loanOfficer] = await db.insert(users).values({
      organizationId: org.id,
      username: 'demo',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Smith',
      email: 'john@loangenius.ai',
      role: 'loan_officer',
      phone: '(555) 123-4567',
      nmlsId: '789012',
      isActive: true
    }).returning();
    
    // Create test borrower
    const [borrower] = await db.insert(borrowerAuth).values({
      email: 'borrower@demo.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '(555) 987-6543',
      isEmailVerified: true,
      isActive: true
    }).returning();
    
    // Create test realtor
    const [realtor] = await db.insert(realtorAuth).values({
      email: 'realtor@demo.com',
      password: hashedPassword,
      firstName: 'Mike',
      lastName: 'Johnson',
      phone: '(555) 456-7890',
      brokerageName: 'Premier Realty',
      licenseNumber: 'RE123456',
      licenseState: 'TX',
      referralCode: 'MIKE123',
      isEmailVerified: true,
      isActive: true,
      isApproved: true
    }).returning();
    
    console.log('Test data created successfully!');
    console.log('\n=== TEST LOGINS ===');
    console.log('\nLoan Officer Portal (app.loangenius.ai):');
    console.log('Username: demo');
    console.log('Password: demo123');
    console.log('\nBorrower Portal (apply.loangenius.ai):');
    console.log('Email: borrower@demo.com');
    console.log('Password: demo123');
    console.log('\nRealtor Portal (realtor.loangenius.ai):');
    console.log('Email: realtor@demo.com');
    console.log('Password: demo123');
    console.log('\n==================\n');
    
    return {
      organization: org,
      loanOfficer,
      borrower,
      realtor
    };
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}