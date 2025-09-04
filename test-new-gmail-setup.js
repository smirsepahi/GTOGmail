// Test script for new Gmail API setup
const BACKEND_URL = 'https://gtogmail-production.up.railway.app';

async function testNewGmailSetup() {
  console.log('🧪 Testing New Gmail API Setup...\n');
  
  const tests = [
    {
      name: 'Health Check',
      url: `${BACKEND_URL}/health`,
      expectedStatus: 200
    },
    {
      name: 'Gmail Auth URL',
      url: `${BACKEND_URL}/api/gmail/auth/url`,
      expectedStatus: 200
    },
    {
      name: 'Gmail Auth Status',
      url: `${BACKEND_URL}/api/gmail/auth/status`,
      expectedStatus: 200
    }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      console.log(`URL: ${test.url}`);
      
      const response = await fetch(test.url);
      const data = await response.json();
      
      if (response.status === test.expectedStatus) {
        console.log(`✅ ${test.name}: PASSED`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
      } else {
        console.log(`❌ ${test.name}: FAILED`);
        console.log(`   Expected: ${test.expectedStatus}, Got: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
      }
      
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR`);
      console.log(`   Error: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('🏁 Test completed!');
}

// Run if this is executed directly (Node.js)
if (typeof window === 'undefined') {
  testNewGmailSetup();
}

// Export for browser use
if (typeof window !== 'undefined') {
  window.testNewGmailSetup = testNewGmailSetup;
}
