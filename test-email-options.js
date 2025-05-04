// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const nodemailer = require('nodemailer');

// Create a test transporter using the SendGrid configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: 'apikey', // This is literally the string 'apikey'
    pass: process.env.SENDGRID_API_KEY
  }
});

// Test function to try different sender configurations
async function testEmailConfigurations() {
  console.log('Starting email configuration tests...');
  const testConfigs = [
    {
      name: "Gmail to Gmail",
      mailOptions: {
        from: {
          name: 'Daniel Romitelli',
          address: 'danny.romitelli@gmail.com' // Using Gmail as sender
        },
        to: 'danny.romitelli@gmail.com',
        subject: 'Test 1: Gmail to Gmail',
        text: 'This is a test email using Gmail as sender and recipient.',
        html: '<h3>Gmail to Gmail Test</h3><p>Testing Gmail as sender</p>'
      }
    },
    {
      name: "Domain to Gmail", 
      mailOptions: {
        from: {
          name: 'Crafted By Daniel',
          address: 'contact@craftedbydaniel.com' // Using your domain email
        },
        to: 'danny.romitelli@gmail.com',
        subject: 'Test 2: Domain to Gmail',
        text: 'This is a test email using domain email as sender.',
        html: '<h3>Domain to Gmail Test</h3><p>Testing domain email as sender</p>'
      }
    },
    {
      name: "No-Reply Domain to Gmail",
      mailOptions: {
        from: {
          name: 'Crafted By Daniel',
          address: 'no-reply@craftedbydaniel.com' // Using a no-reply domain email
        },
        to: 'danny.romitelli@gmail.com',
        subject: 'Test 3: No-Reply Domain to Gmail',
        text: 'This is a test email using no-reply domain email as sender.',
        html: '<h3>No-Reply Domain to Gmail Test</h3><p>Testing no-reply domain email as sender</p>'
      }
    }
  ];

  for (const config of testConfigs) {
    try {
      console.log(`\n== Testing configuration: ${config.name} ==`);
      console.log(`From: ${config.mailOptions.from.address}`);
      console.log(`To: ${config.mailOptions.to}`);
      
      const info = await transporter.sendMail(config.mailOptions);
      console.log('SUCCESS! Email sent');
      console.log('Message ID:', info.messageId);
      console.log('SendGrid response:', info.response);
    } catch (error) {
      console.error(`FAILED: ${config.name} test failed`);
      console.error(`Error: ${error.message}`);
    }
  }
  
  console.log('\nTesting completed. Check which configurations worked.');
}

// Execute the tests
testEmailConfigurations()
  .then(() => {
    console.log('All tests attempted');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test runner error:', error.message);
    process.exit(1);
  }); 