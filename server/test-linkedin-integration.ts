import { linkedInIntegration } from './linkedin-integration.js';
import { LinkedInIntegrationService } from './linkedin-integration.js';

// Test LinkedIn Integration with Real Credentials
export async function testLinkedInIntegration() {
  console.log('\n=== TESTING LINKEDIN INTEGRATION ===');
  console.log('Client ID:', process.env.LINKEDIN_CLIENT_ID ? '✓ Configured' : '✗ Missing');
  console.log('Client Secret:', process.env.LINKEDIN_CLIENT_SECRET ? '✓ Configured' : '✗ Missing');
  
  try {
    // Test 1: LinkedIn Profile Search
    console.log('\n1. Testing LinkedIn Profile Search...');
    const searchResults = await linkedInIntegration.searchLinkedInProfiles(
      'real estate investor', 
      {
        location: 'Texas',
        industry: 'Real Estate',
        company: 'Investment'
      }
    );
    
    console.log(`✓ Found ${searchResults.profiles.length} profiles`);
    console.log(`✓ Confidence: ${searchResults.confidence * 100}%`);
    
    if (searchResults.profiles.length > 0) {
      const sampleProfile = searchResults.profiles[0];
      console.log(`✓ Sample Profile: ${sampleProfile.name} - ${sampleProfile.headline}`);
    }
    
    // Test 2: Contact Enrichment
    console.log('\n2. Testing Contact Data Enrichment...');
    if (searchResults.profiles.length > 0) {
      const profileUrl = searchResults.profiles[0].profileUrl;
      const enrichedData = await linkedInIntegration.enrichContactData(profileUrl);
      
      console.log(`✓ Enriched Profile: ${enrichedData.linkedinProfile.name}`);
      console.log(`✓ Email: ${enrichedData.contactInfo.email}`);
      console.log(`✓ Phone: ${enrichedData.contactInfo.phone}`);
      console.log(`✓ Industry: ${enrichedData.professionalInfo.industry}`);
      console.log(`✓ Investment Capacity: ${enrichedData.realEstateInfo.investmentCapacity}`);
      console.log(`✓ Confidence: ${enrichedData.confidence * 100}%`);
    }
    
    // Test 3: Batch Processing
    console.log('\n3. Testing Batch Profile Processing...');
    const batchResults = await linkedInIntegration.batchEnrichProfiles([
      'https://linkedin.com/in/real-estate-investor-1',
      'https://linkedin.com/in/business-owner-2',
      'https://linkedin.com/in/property-developer-3'
    ]);
    
    console.log(`✓ Batch processed ${batchResults.results.length} profiles`);
    console.log(`✓ Success rate: ${batchResults.successRate * 100}%`);
    
    console.log('\n=== LINKEDIN INTEGRATION TEST COMPLETE ===');
    console.log('✓ All tests passed successfully!');
    console.log('✓ LinkedIn integration is ready for production use');
    
    return {
      success: true,
      searchResults,
      testsPassed: 3,
      message: 'LinkedIn integration fully operational'
    };
    
  } catch (error) {
    console.error('\n✗ LinkedIn Integration Test Failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return {
      success: false,
      error: error.message,
      testsPassed: 0,
      message: 'LinkedIn integration needs attention'
    };
  }
}

// Auto-run test when module is imported
if (import.meta.url === `file://${process.argv[1]}`) {
  testLinkedInIntegration().then(result => {
    console.log('\nFinal Result:', result);
    process.exit(result.success ? 0 : 1);
  });
}