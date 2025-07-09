import { Request, Response } from 'express';
import { linkedInIntegration } from './linkedin-integration.js';

export async function searchLinkedInProfiles(req: Request, res: Response) {
  try {
    const { query, filters } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query parameter is required and must be a string'
      });
    }

    console.log(`LinkedIn search request: ${query}`);

    const searchResults = await linkedInIntegration.searchLinkedInProfiles(query, filters);

    res.json({
      success: true,
      data: searchResults,
      message: `Found ${searchResults.profiles.length} LinkedIn profiles`
    });
  } catch (error) {
    console.error('LinkedIn search error:', error);
    res.status(500).json({
      error: 'Failed to search LinkedIn profiles',
      details: error.message
    });
  }
}

export async function enrichContactData(req: Request, res: Response) {
  try {
    const { linkedinUrl } = req.body;

    if (!linkedinUrl || typeof linkedinUrl !== 'string') {
      return res.status(400).json({
        error: 'LinkedIn URL is required and must be a string'
      });
    }

    console.log(`Contact enrichment request: ${linkedinUrl}`);

    const enrichedData = await linkedInIntegration.enrichContactData(linkedinUrl);

    res.json({
      success: true,
      data: enrichedData,
      message: `Successfully enriched contact data with ${enrichedData.confidence}% confidence`
    });
  } catch (error) {
    console.error('Contact enrichment error:', error);
    res.status(500).json({
      error: 'Failed to enrich contact data',
      details: error.message
    });
  }
}

export async function importContact(req: Request, res: Response) {
  try {
    const { enrichedData } = req.body;

    if (!enrichedData || !enrichedData.linkedinProfile) {
      return res.status(400).json({
        error: 'Enriched contact data is required'
      });
    }

    console.log(`Contact import request: ${enrichedData.linkedinProfile.name}`);

    const importResult = await linkedInIntegration.importContactToSystem(enrichedData);

    if (importResult.success) {
      res.json({
        success: true,
        data: importResult,
        message: importResult.message
      });
    } else {
      res.status(500).json({
        error: 'Failed to import contact',
        details: importResult.message
      });
    }
  } catch (error) {
    console.error('Contact import error:', error);
    res.status(500).json({
      error: 'Failed to import contact',
      details: error.message
    });
  }
}

export async function batchEnrichContacts(req: Request, res: Response) {
  try {
    const { linkedinUrls } = req.body;

    if (!Array.isArray(linkedinUrls) || linkedinUrls.length === 0) {
      return res.status(400).json({
        error: 'LinkedIn URLs array is required and must not be empty'
      });
    }

    console.log(`Batch enrichment request: ${linkedinUrls.length} URLs`);

    const batchResults = await linkedInIntegration.batchEnrichContacts(linkedinUrls);

    const successCount = batchResults.filter(r => r.success).length;
    const failCount = batchResults.filter(r => !r.success).length;

    res.json({
      success: true,
      data: {
        results: batchResults,
        summary: {
          total: batchResults.length,
          successful: successCount,
          failed: failCount,
          successRate: (successCount / batchResults.length) * 100
        }
      },
      message: `Batch enrichment completed: ${successCount} successful, ${failCount} failed`
    });
  } catch (error) {
    console.error('Batch enrichment error:', error);
    res.status(500).json({
      error: 'Failed to perform batch enrichment',
      details: error.message
    });
  }
}

export async function getEnrichmentStatus(req: Request, res: Response) {
  try {
    const status = await linkedInIntegration.getEnrichmentStatus();

    res.json({
      success: true,
      data: status,
      message: 'Enrichment status retrieved successfully'
    });
  } catch (error) {
    console.error('Status retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve enrichment status',
      details: error.message
    });
  }
}

export async function quickEnrichAndImport(req: Request, res: Response) {
  try {
    const { linkedinUrl, autoImport = true } = req.body;

    if (!linkedinUrl || typeof linkedinUrl !== 'string') {
      return res.status(400).json({
        error: 'LinkedIn URL is required and must be a string'
      });
    }

    console.log(`Quick enrich and import request: ${linkedinUrl}`);

    // First enrich the contact
    const enrichedData = await linkedInIntegration.enrichContactData(linkedinUrl);

    let importResult = null;
    if (autoImport) {
      // Then import to system
      importResult = await linkedInIntegration.importContactToSystem(enrichedData);
    }

    res.json({
      success: true,
      data: {
        enrichedData,
        importResult,
        processed: true
      },
      message: autoImport 
        ? `Successfully enriched and imported ${enrichedData.linkedinProfile.name}`
        : `Successfully enriched ${enrichedData.linkedinProfile.name}`
    });
  } catch (error) {
    console.error('Quick enrich and import error:', error);
    res.status(500).json({
      error: 'Failed to enrich and import contact',
      details: error.message
    });
  }
}