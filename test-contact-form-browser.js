// Browser-compatible test for the contact form API
// Copy and paste this into your browser console to test

async function testContactFormAPI() {
  console.log('Testing contact form API from browser...');
  
  // Test data
  const testData = {
    name: 'Test User',
    email: 'test@example.com',
    message: 'This is a test message from the browser console.'
  };
  
  try {
    console.log('Submitting test data:', testData);
    
    // Using fetch API
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    
    // Try to parse the response
    try {
      const responseData = await response.json();
      console.log('Response data:', responseData);
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      const responseText = await response.text();
      console.log('Response as text:', responseText);
    }
    
    if (response.ok) {
      console.log('SUCCESS: API test passed!');
    } else {
      console.error('FAILED: API returned error status', response.status);
    }
  } catch (error) {
    console.error('Error during API test:', error);
  }
}

// Run the test
console.log('Starting browser-based API test...');
testContactFormAPI()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Unexpected error:', err)); 