import { Router, Request, Response, NextFunction } from 'express';
import { linkedInEnhanced } from './linkedin-enhanced-integration.js';
import { z } from 'zod';

// Simple authentication middleware
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Implement proper authentication
  // For now, we'll extract userId from the session or a default
  (req as any).userId = 1;
  (req as any).organizationId = 1;
  next();
};

const router = Router();

// LinkedIn OAuth login
router.get('/api/linkedin/connect', isAuthenticated, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const authUrl = await linkedInEnhanced.authenticateLinkedIn(userId);
    res.json({ authUrl });
  } catch (error) {
    console.error('LinkedIn auth error:', error);
    res.status(500).json({ error: 'Failed to generate LinkedIn auth URL' });
  }
});

// LinkedIn OAuth callback
router.get('/api/linkedin/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.redirect('/contacts?error=linkedin_auth_failed');
    }

    const result = await linkedInEnhanced.handleCallback(code as string, state as string);
    
    // Redirect to contacts page with success message
    res.redirect('/contacts?linkedin=connected');
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    res.redirect('/contacts?error=linkedin_auth_failed');
  }
});

// Import contacts from LinkedIn
router.post('/api/linkedin/import-contacts', isAuthenticated, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const organizationId = (req as any).organizationId;
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    // Set up SSE for progress updates
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const sendProgress = (progress: number, message: string) => {
      res.write(`data: ${JSON.stringify({ progress, message })}\n\n`);
    };

    const results = await linkedInEnhanced.batchImportContacts(
      userId,
      organizationId,
      accessToken,
      sendProgress
    );

    res.write(`data: ${JSON.stringify({ complete: true, results })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Import contacts error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Import failed' })}\n\n`);
    res.end();
  }
});

// Extract contacts with email/phone guessing
router.post('/api/linkedin/extract-contacts', isAuthenticated, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const organizationId = (req as any).organizationId;
    const { accessToken, connectionIds } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    const extractedContacts = await linkedInEnhanced.extractLinkedInContacts(userId, accessToken);
    
    // Filter by specific connection IDs if provided
    let contactsToSave = extractedContacts;
    if (connectionIds && connectionIds.length > 0) {
      contactsToSave = extractedContacts.filter(c => connectionIds.includes(c.profile.id));
    }

    const savedCount = await linkedInEnhanced.saveExtractedContacts(
      userId,
      organizationId,
      contactsToSave
    );

    res.json({
      success: true,
      extracted: contactsToSave.length,
      saved: savedCount,
      contacts: contactsToSave.map(c => ({
        name: `${c.profile.firstName} ${c.profile.lastName}`,
        email: c.extractedEmail,
        emailConfidence: c.emailConfidence,
        phones: c.extractedPhones,
        phoneConfidence: c.phoneConfidence,
        company: c.profile.currentPosition?.companyName,
        title: c.profile.currentPosition?.title
      }))
    });
  } catch (error) {
    console.error('Extract contacts error:', error);
    res.status(500).json({ error: 'Failed to extract contacts' });
  }
});

// Search for contact email/phone
router.post('/api/linkedin/enrich-contact', isAuthenticated, async (req, res) => {
  try {
    const enrichSchema = z.object({
      firstName: z.string(),
      lastName: z.string(),
      company: z.string().optional(),
      linkedinUrl: z.string().optional()
    });

    const data = enrichSchema.parse(req.body);
    
    // Create a profile object for enrichment
    const profile = {
      id: '',
      firstName: data.firstName,
      lastName: data.lastName,
      currentPosition: data.company ? { 
        title: '', 
        companyName: data.company,
        startDate: ''
      } : undefined,
      publicProfileUrl: data.linkedinUrl
    };

    // Use the enhanced integration to guess email and extract phone
    const guessedEmail = await (linkedInEnhanced as any).guessEmail(profile);
    const extractedPhones = await (linkedInEnhanced as any).extractPhoneNumbers(profile);
    const enrichedData = await (linkedInEnhanced as any).enrichContactData(profile);

    res.json({
      success: true,
      email: guessedEmail.email,
      emailConfidence: guessedEmail.confidence,
      phones: extractedPhones,
      phoneConfidence: extractedPhones.length > 0 ? 0.8 : 0,
      enrichedData
    });
  } catch (error) {
    console.error('Enrich contact error:', error);
    res.status(500).json({ error: 'Failed to enrich contact' });
  }
});

export default router;