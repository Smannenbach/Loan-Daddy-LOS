// Test LinkedIn API Integration
import http from 'http';

const testLinkedIn = async () => {
  console.log('=== TESTING LINKEDIN API INTEGRATION ===');
  
  const postData = JSON.stringify({
    query: 'real estate investor',
    filters: {
      location: 'Texas',
      industry: 'Real Estate'
    }
  });
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/linkedin/test',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const result = JSON.parse(data);
            console.log('✓ LinkedIn API Test Successful');
            console.log('✓ Client ID Configured:', result.clientIdConfigured);
            console.log('✓ Client Secret Configured:', result.clientSecretConfigured);
            console.log('✓ Search Results:', result.searchResults?.profiles?.length || 0, 'profiles found');
            console.log('✓ Message:', result.message);
            resolve(result);
          } else {
            console.error('✗ API Test Failed with status:', res.statusCode);
            console.error('Response:', data);
            reject(new Error(`API test failed with status ${res.statusCode}`));
          }
        } catch (error) {
          console.error('✗ Failed to parse JSON response:', error.message);
          console.error('Raw response:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('✗ Request failed:', error.message);
      reject(error);
    });
    
    req.end();
  });
};

// Test LinkedIn search functionality
const testLinkedInSearch = async () => {
  console.log('\n=== TESTING LINKEDIN SEARCH ===');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/linkedin/search?query=real%20estate%20investor&location=Texas&industry=Real%20Estate',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const result = JSON.parse(data);
            console.log('✓ LinkedIn Search Test Successful');
            console.log('✓ Profiles Found:', result.profiles?.length || 0);
            console.log('✓ Total Results:', result.totalResults);
            console.log('✓ Confidence:', result.confidence);
            if (result.profiles?.length > 0) {
              console.log('✓ Sample Profile:', result.profiles[0].name, '-', result.profiles[0].headline);
            }
            resolve(result);
          } else {
            console.error('✗ LinkedIn Search Failed with status:', res.statusCode);
            console.error('Response:', data);
            reject(new Error(`Search failed with status ${res.statusCode}`));
          }
        } catch (error) {
          console.error('✗ Failed to parse JSON response:', error.message);
          console.error('Raw response:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('✗ Request failed:', error.message);
      reject(error);
    });
    
    req.end();
  });
};

// Run tests
const runTests = async () => {
  try {
    await testLinkedIn();
    await testLinkedInSearch();
    console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    console.error('\n=== TESTS FAILED ===');
    console.error('Error:', error.message);
    process.exit(1);
  }
};

runTests();