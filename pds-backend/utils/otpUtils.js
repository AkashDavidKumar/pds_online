import bcrypt from 'bcryptjs';
import transporter from '../config/mailer.js';

/**
 * Generate a 6-digit numeric OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash an OTP string using bcrypt
 */
export const hashOTP = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
};

/**
 * Compare a plaintext OTP against a stored hash
 */
export const verifyOTPHash = async (otp, hash) => {
  return bcrypt.compare(otp, hash);
};

/**
 * Mask an email for display: su***@gmail.com
 */
export const maskEmail = (email) => {
  const [user, domain] = email.split('@');
  const visible = user.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(0, user.length - 2))}@${domain}`;
};

/**
 * Send OTP via Gmail using the configured Nodemailer transporter.
 */
export const sendOTPEmail = async (to, otp) => {
  const mailOptions = {
    from: `"TNPDS Verification" <${process.env.EMAIL_USER}>`,
    to,
    subject: '🔐 Your PDS Verification OTP',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: auto; background: #f9fafb; padding: 24px; border-radius: 16px;">
        <div style="background: #1e3a8a; padding: 20px 24px; border-radius: 12px; margin-bottom: 24px;">
          <h2 style="color: #ffffff; margin: 0; font-size: 18px; letter-spacing: 1px;">TNPDS DIGITAL SERVICES</h2>
          <p style="color: #93c5fd; margin: 4px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Beneficiary Verification</p>
        </div>
        
        <p style="color: #374151; font-size: 14px;">Your One-Time Password for PDS ration collection:</p>
        
        <div style="background: #ffffff; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0;">
          <p style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #1e3a8a; margin: 0; font-family: monospace;">${otp}</p>
          <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0; text-transform: uppercase; letter-spacing: 2px;">Valid for 5 minutes</p>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px 16px; margin-top: 16px;">
          <p style="color: #92400e; font-size: 12px; margin: 0;">⚠️ Do NOT share this OTP with anyone. Your dealer will NEVER ask for this verbally.</p>
        </div>
        
        <p style="color: #9ca3af; font-size: 11px; margin-top: 24px; text-align: center;">
          Tamil Nadu Public Distribution System • Digital Services<br/>
          This is an automated message — please do not reply.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP Email sent to ${to} — Message ID: ${info.messageId}`);
    return { success: true };
  } catch (err) {
    console.error('❌ OTP Email send failed:', err.message);
    // Dev fallback: log OTP to console so testing can continue
    console.log(`[⚡ PDS OTP - EMAIL FALLBACK] To: ${to} | OTP: ${otp}`);
    throw new Error('Email delivery failed. Check EMAIL_USER / EMAIL_PASS in .env');
  }
};
