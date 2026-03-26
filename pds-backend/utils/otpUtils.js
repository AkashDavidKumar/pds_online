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
    return { success: true };
  } catch (err) {
    // console.error('❌ OTP Email send failed:', err.message);
    // Dev fallback: log OTP to console so testing can continue
    throw new Error('Email delivery failed. Check EMAIL_USER / EMAIL_PASS in .env');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 📧 Send distribution receipt email to beneficiary
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @param {string} to  - beneficiary email
 * @param {object} data - { user, shop, items, remaining, transactionNumber, date }
 */
export const sendReceiptEmail = async (to, data) => {
  const { user, shop, items, remaining, transactionNumber, date } = data;

  const itemRow = (label, qty) =>
    qty > 0
      ? `<tr>
           <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:14px;">${label}</td>
           <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;color:#1e3a8a;font-weight:700;font-size:14px;text-align:right;">${qty} kg</td>
         </tr>`
      : '';

  const remainRow = (label, qty) =>
    `<tr>
       <td style="padding:8px 16px;color:#6b7280;font-size:13px;">${label}</td>
       <td style="padding:8px 16px;color:${qty > 0 ? '#059669' : '#9ca3af'};font-weight:700;font-size:13px;text-align:right;">${qty} kg</td>
     </tr>`;

  const formattedDate = new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
  });

  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:580px;margin:auto;background:#f9fafb;padding:24px;border-radius:16px;">

      <!-- HEADER -->
      <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:28px 24px;border-radius:14px;margin-bottom:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;letter-spacing:1px;">🌾 TNPDS Distribution Receipt</h1>
        <p style="color:#bfdbfe;margin:6px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:2px;">Tamil Nadu Public Distribution System</p>
      </div>

      <!-- TXN BADGE -->
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 20px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <p style="margin:0;font-size:10px;color:#93c5fd;text-transform:uppercase;letter-spacing:1.5px;">Transaction ID</p>
          <p style="margin:4px 0 0;font-weight:900;color:#1e40af;font-size:14px;font-family:monospace;">${transactionNumber}</p>
        </div>
        <div style="text-align:right;">
          <p style="margin:0;font-size:10px;color:#93c5fd;text-transform:uppercase;letter-spacing:1.5px;">Date & Time</p>
          <p style="margin:4px 0 0;font-weight:700;color:#1e40af;font-size:12px;">${formattedDate}</p>
        </div>
      </div>

      <!-- BENEFICIARY -->
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:16px;">
        <p style="margin:0 0 12px;font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;font-weight:700;">👤 Beneficiary Details</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#6b7280;font-size:13px;padding:4px 0;">Name</td><td style="font-weight:700;color:#111827;font-size:13px;text-align:right;">${user.name}</td></tr>
          <tr><td style="color:#6b7280;font-size:13px;padding:4px 0;">Ration Card</td><td style="font-weight:700;color:#111827;font-size:13px;text-align:right;">${user.rationCardNumber}</td></tr>
          <tr><td style="color:#6b7280;font-size:13px;padding:4px 0;">Card Type</td><td style="font-weight:700;color:#2563eb;font-size:13px;text-align:right;">${user.cardType}</td></tr>
          ${shop ? `<tr><td style="color:#6b7280;font-size:13px;padding:4px 0;">FPS Shop</td><td style="font-weight:700;color:#111827;font-size:13px;text-align:right;">${shop.name || 'N/A'}</td></tr>` : ''}
        </table>
      </div>

      <!-- ITEMS RECEIVED -->
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:16px;overflow:hidden;">
        <div style="padding:14px 16px;background:#f8fafc;border-bottom:1px solid #e5e7eb;">
          <p style="margin:0;font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;font-weight:700;">📦 Items Distributed</p>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          ${itemRow('🌾 Rice', items.rice)}
          ${itemRow('🌿 Wheat', items.wheat)}
          ${itemRow('🍬 Sugar', items.sugar)}
          ${itemRow('🥣 Dal', items.dal)}
        </table>
      </div>

      <!-- REMAINING BALANCE -->
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:20px;overflow:hidden;">
        <div style="padding:14px 16px;background:#f0fdf4;border-bottom:1px solid #dcfce7;">
          <p style="margin:0;font-size:10px;color:#16a34a;text-transform:uppercase;letter-spacing:2px;font-weight:700;">📊 Remaining Balance This Month</p>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          ${remainRow('🌾 Rice', remaining.rice)}
          ${remainRow('🌿 Wheat', remaining.wheat)}
          ${remainRow('🍬 Sugar', remaining.sugar)}
          ${remainRow('🥣 Dal', remaining.dal)}
        </table>
      </div>

      <!-- FOOTER -->
      <div style="background:#1e3a8a;border-radius:12px;padding:18px 20px;text-align:center;">
        <p style="color:#fff;font-weight:700;font-size:14px;margin:0 0 6px;">✅ Ration Successfully Collected</p>
        <p style="color:#93c5fd;font-size:11px;margin:0;">Thank you for using Tamil Nadu PDS Digital System</p>
        <p style="color:#4b72b8;font-size:10px;margin:8px 0 0;">This is an automated receipt — please do not reply to this email.</p>
      </div>

    </div>
  `;

  const mailOptions = {
    from: `"TNPDS Distribution System" <${process.env.EMAIL_USER}>`,
    to,
    subject: `✅ PDS Receipt — ${transactionNumber} | ${user.name}`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (err) {
    // ⚠️  IMPORTANT: Do NOT re-throw — email failure must not break the transaction
    // console.error(`❌ Receipt email failed for ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};
