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

// Test email configuration
const mailOptions = {
  from: {
    name: 'Daniel Romitelli',
    address: 'danny.romitelli@gmail.com' // Using your email as sender for testing
  },
  to: 'danny.romitelli@gmail.com',
  subject: 'Test Email from Portfolio Contact Form',
  text: 'This is a test email to verify that SendGrid is configured correctly.',
  html: `
    <h3>SendGrid Test Email</h3>
    <p>This is a test email to verify that your SendGrid configuration is working correctly.</p>
    <p>If you received this email, your contact form should be functioning properly!</p>
    <p><strong>Note:</strong> For production, you'll need to verify 'contact@craftedbydaniel.com' as a sender in SendGrid.</p>
  `
};

async function sendTestEmail() {
  console.log('Attempting to send test email...');
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('SendGrid response:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Execute the test
sendTestEmail()
  .then(() => {
    console.log('Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error.message);
    process.exit(1);
  }); 