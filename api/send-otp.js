import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Handle CORS for browser requests
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    console.log('📧 Preparing to send OTP via Gmail to:', email);

    // 1. Create the Transporter (The Connection to Gmail)
    // REPLACING RESEND WITH GMAIL SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'fwaehmart@gmail.com', // 👈 PUT YOUR GMAIL ADDRESS HERE
        pass: 'oemlzmavkqlebqxl' // 👈 PUT YOUR GOOGLE APP PASSWORD HERE (Remove spaces)
      }
    });

    // 2. Define the Email
    const mailOptions = {
      from: '"Fwaeh Mart" <fwaehmart@gmail.com>', // Must match the user above
      to: email,
      subject: 'Your OTP Verification Code - Fwaeh Mart',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff0f0; border-radius: 10px;">
          <h2 style="color: #b91c1c; text-align: center;">Fwaeh Mart Verification</h2>
          <div style="background-color: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333;">Your verification code is:</p>
            <h1 style="color: #ff5757; font-size: 40px; letter-spacing: 5px; margin: 20px 0;">${otp}</h1>
            <p style="font-size: 14px; color: #666;">This code expires in 10 minutes.</p>
          </div>
        </div>
      `
    };

    // 3. Send the Email
    await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully via Gmail');
    return res.status(200).json({ success: true, message: 'OTP sent' });

  } catch (error) {
    console.error('❌ Gmail Send Error:', error);
    return res.status(500).json({ error: error.message });
  }
}