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
    
    const body = await req.json()
    const { name, email, message } = body

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
      text: `
Name: ${name}
Email: ${email}
Message:
${message}
      `,
      html: `
<h3>New Contact Form Message</h3>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, '<br>')}</p>
      `
    }

    // Send email
    try {
      console.log('Attempting to send email...');
      const info = await transporter.sendMail(mailOptions)
      console.log('Email sent successfully:', info.messageId);
      return NextResponse.json({ message: 'Email sent successfully' })
    } catch (emailErr: any) {
      console.error('Email sending error:', emailErr.message);
      return NextResponse.json(
        { error: `Email service error: ${emailErr.message}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Server error in contact API:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    )
  }
}