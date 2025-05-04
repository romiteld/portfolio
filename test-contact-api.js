// Testing the contact form API endpoint
const fetch = require('node-fetch');

async function testContactApi() {
  console.log('Testing the contact form API endpoint...');
  
  try {
    const response = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        message: 'This is a test message from the API testing script.',
      }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('SUCCESS! API endpoint responded successfully:');
      console.log(data);
    } else {
      console.error('API call failed with status:', response.status);
      console.error('Error details:', data);
    }
  } catch (error) {
    console.error('Error testing API endpoint:', error.message);
  }
}

// Execute the test
console.log('Make sure your development server is running on http://localhost:3000');
console.log('If not running, start it with: npm run dev');
console.log('');

testContactApi()
  .then(() => {
    console.log('\nTest completed');
  })
  .catch((error) => {
    console.error('Unexpected error during test:', error);
  }); 