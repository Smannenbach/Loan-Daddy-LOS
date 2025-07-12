import { Router } from 'express';
// Plaid integration temporarily disabled - uncomment when ready to use
// import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { db } from './db';
import { borrowers } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { authenticateBorrower } from './borrower-auth';

const router = Router();

// Plaid client will be initialized when Plaid package is installed
// const plaidConfig = new Configuration({
//   basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
//   baseOptions: {
//     headers: {
//       'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || '',
//       'PLAID-SECRET': process.env.PLAID_SECRET || '',
//     },
//   },
// });

// const plaidClient = new PlaidApi(plaidConfig);

// Create link token for Plaid Link initialization
router.post('/create-link-token', authenticateBorrower, async (req, res) => {
  try {
    // Plaid integration temporarily disabled
    res.status(400).json({ 
      error: 'Plaid integration not configured',
      message: 'Please configure PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENV environment variables to enable bank account connection.'
    });
  } catch (error: any) {
    console.error('Error creating link token:', error);
    res.status(500).json({ 
      error: 'Failed to create link token',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Exchange public token for access token
router.post('/exchange-public-token', authenticateBorrower, async (req, res) => {
  try {
    // Plaid integration temporarily disabled
    res.status(400).json({ 
      error: 'Plaid integration not configured',
      message: 'Please configure Plaid credentials to enable bank account connection.'
    });
  } catch (error: any) {
    console.error('Error exchanging public token:', error);
    res.status(500).json({ 
      error: 'Failed to connect bank account',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get account information
router.get('/accounts', authenticateBorrower, async (req, res) => {
  try {
    const borrowerId = (req as any).borrower.id;
    
    // Get borrower's Plaid access token
    const [borrower] = await db.select()
      .from(borrowers)
      .where(eq(borrowers.id, borrowerId))
      .limit(1);
    
    if (!borrower?.plaidAccessToken) {
      return res.status(400).json({ error: 'No bank account connected' });
    }
    
    // Plaid integration temporarily disabled - return mock response for now
    res.status(400).json({ 
      error: 'Plaid integration not configured',
      message: 'Please configure Plaid credentials to enable bank account access.'
    });
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch account information',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get asset report for income/asset verification
router.post('/create-asset-report', authenticateBorrower, async (req, res) => {
  try {
    // Plaid integration temporarily disabled
    res.status(400).json({ 
      error: 'Plaid integration not configured',
      message: 'Please configure Plaid credentials to enable asset verification.'
    });
  } catch (error: any) {
    console.error('Error creating asset report:', error);
    res.status(500).json({ 
      error: 'Failed to create asset report',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get transactions for cash flow analysis
router.get('/transactions', authenticateBorrower, async (req, res) => {
  try {
    // Plaid integration temporarily disabled
    res.status(400).json({ 
      error: 'Plaid integration not configured',
      message: 'Please configure Plaid credentials to enable transaction history.'
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transactions',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Remove bank connection
router.delete('/disconnect', authenticateBorrower, async (req, res) => {
  try {
    const borrowerId = (req as any).borrower.id;
    
    // Clear Plaid data from borrower record
    await db.update(borrowers)
      .set({
        plaidAccessToken: null,
        plaidItemId: null,
        bankVerified: false,
        bankInstitution: null,
        updatedAt: new Date()
      })
      .where(eq(borrowers.id, borrowerId));
    
    res.json({
      success: true,
      message: 'Bank account disconnected successfully'
    });
  } catch (error: any) {
    console.error('Error disconnecting bank:', error);
    res.status(500).json({ 
      error: 'Failed to disconnect bank account',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;