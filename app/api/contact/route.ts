import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Create a transporter using SendGrid
// You'll need to set SENDGRID_API_KEY in your Vercel environment variables
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: 'apikey', // This is literally the string 'apikey'
    pass: process.env.SENDGRID_API_KEY
  }
})

export async function POST(req: Request) {
  try {
    // Log environment check
    console.log('Environment check - SENDGRID_API_KEY exists:', !!process.env.SENDGRID_API_KEY);
    
    // Safely parse the JSON request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('Error parsing request JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { name, email, message } = body;

    // Log request data (excluding sensitive information)
    console.log('Received contact request from:', name);

    // Validate the input
    if (!name || !email || !message) {
      console.log('Validation error: Missing required fields');
      return NextResponse.json(
        { error: 'Please fill in all fields' },
        { status: 400 }
      )
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('Validation error: Invalid email format');
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Configure email with proper headers for better deliverability
    const mailOptions = {
      from: {
        name: 'Crafted By Daniel',
        address: 'contact@craftedbydaniel.com' // Using your verified domain email
      },
      replyTo: email,
      to: 'danny.romitelli@gmail.com',
      subject: `New Contact Form Message from ${name}`,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'Precedence': 'bulk'
      },
      text: `
Name: ${name}
Email: ${email}
Message:
${message}

--
This email was sent from your portfolio website contact form.
      `,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
  <h2 style="color: #333; border-bottom: 1px solid #eaeaea; padding-bottom: 10px;">New Contact Form Message</h2>
  <p><strong>Name:</strong> ${name}</p>
  <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
  <p><strong>Message:</strong></p>
  <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
    ${message.replace(/\n/g, '<br>')}
  </div>
  <p style="color: #666; font-size: 12px; margin-top: 30px; padding-top: 10px; border-top: 1px solid #eaeaea;">
    This email was sent from your portfolio website contact form. 
    <br>To respond, simply reply to this email.
  </p>
</div>
      `
    }

    // Send email
    try {
      console.log('Attempting to send email...');
      const info = await transporter.sendMail(mailOptions)
      console.log('Email sent successfully:', info.messageId);
      return NextResponse.json({ message: 'Email sent successfully' })
    } catch (emailErr: unknown) {
      const message = emailErr instanceof Error ? emailErr.message : 'Unknown error'
      console.error('Email sending error:', message)
      return NextResponse.json(
        { error: `Email service error: ${message}` },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    console.error('Server error in contact API:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    )
  }
}
