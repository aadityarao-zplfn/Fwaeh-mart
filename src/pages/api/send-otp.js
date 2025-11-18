import { Resend } from 'resend';

const resend = new Resend(process.env.VITE_RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    console.log('📧 Attempting to send OTP email to:', email);

    const { data, error } = await resend.emails.send({
      from: 'Fwaeh Mart <onboarding@resend.dev>',
      to: [email],
      subject: 'Your OTP Verification Code - Fwaeh Mart',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: linear-gradient(135deg, #ffe8e8 0%, #fff0f0 50%, #ffe8e8 100%);">
          <div style="padding: 40px 30px; border-radius: 20px; border: 2px solid #fca5a5;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="display: inline-flex; align-items: center; justify-content: center; width: 80px; height: 80px; border-radius: 50%; margin-bottom: 20px; background: linear-gradient(135deg, #ff5757 0%, #ff8282 100%); box-shadow: 0 4px 15px rgba(255, 87, 87, 0.3);">
                <span style="font-size: 32px; color: white;">🔐</span>
              </div>
              <h1 style="color: #b91c1c; font-size: 36px; font-weight: bold; margin: 0 0 10px 0;">Fwaeh Mart</h1>
              <p style="color: #dc2626; font-size: 16px; margin: 0;">Your Local Marketplace</p>
            </div>

            <!-- Content Card -->
            <div style="background: #fff5f5; border-radius: 16px; padding: 30px; border: 2px solid #fca5a5; margin-bottom: 30px;">
              <h2 style="color: #b91c1c; text-align: center; font-size: 28px; font-weight: bold; margin: 0 0 20px 0;">
                Verify Your Account
              </h2>
              
              <p style="color: #dc2626; text-align: center; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
                Enter this verification code in the Fwaeh Mart app to complete your registration:
              </p>
              
              <!-- OTP Code -->
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background: linear-gradient(135deg, #ff5757 0%, #ff8282 100%); color: white; padding: 20px 40px; border-radius: 16px; font-size: 42px; font-weight: bold; letter-spacing: 8px; box-shadow: 0 8px 25px rgba(255, 87, 87, 0.4);">
                  ${otp}
                </div>
              </div>
              
              <p style="color: #ff5757; text-align: center; font-size: 14px; font-weight: 600; margin: 20px 0 0 0;">
                ⏰ This code will expire in 10 minutes
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding-top: 20px; border-top: 2px solid #fca5a5;">
              <p style="color: #dc2626; font-size: 12px; margin: 0; opacity: 0.8;">
                If you didn't request this code, please ignore this email.
              </p>
              <p style="color: #dc2626; font-size: 12px; margin: 10px 0 0 0; opacity: 0.6;">
                Need help? Contact our support team.
              </p>
            </div>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('✅ Email sent successfully to:', email);
    res.status(200).json({ success: true, data });

  } catch (error) {
    console.error('❌ Server error sending email:', error);
    res.status(500).json({ error: error.message });
  }
}