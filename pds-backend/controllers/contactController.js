import Contact from '../models/Contact.js';
import transporter from '../config/mailer.js';

// @desc    Submit a contact message
// @route   POST /api/contact
// @access  Public
export const sendContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // 🔐 Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and message.'
      });
    }

    // 📦 1. Save to MongoDB
    const newMessage = await Contact.create({
      name,
      email,
      subject: subject || 'No Subject',
      message,
      userId: req.user?._id || null, // Optional for public, but we'll use it for logged in users
      dealerId: req.user?.shopId || null // Ensure we save the user's assigned dealer
    });

    // 📧 2. Email to ADMIN (Notification)
    const adminMailOptions = {
      from: `"PDS Shop Support Team" <${process.env.EMAIL_USER}>`, // ✅ Sender name fixed
      to: process.env.EMAIL_USER, // Admin email
      replyTo: email, // ✅ Reply goes to user
      subject: `📩 New Support Request - ${subject || 'General Inquiry'}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background-color: #f9fafb;">
          
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb;">
            
            <h2 style="color: #1d4ed8; margin-bottom: 10px;">
              🏛️ PDS Support Notification
            </h2>

            <p style="color: #6b7280; font-size: 14px;">
              You have received a new support request from the Digital PDS system.
            </p>

            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />

            <p><strong>👤 Name:</strong> ${name}</p>
            <p><strong>📧 Email:</strong> ${email}</p>
            <p><strong>📝 Subject:</strong> ${subject || 'N/A'}</p>

            <div style="margin-top: 15px;">
              <p><strong>💬 Message:</strong></p>
              <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; color: #374151;">
                ${message}
              </div>
            </div>

            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />

            <p style="font-size: 12px; color: #9ca3af;">
              This is an automated message from <strong>PDS Digital Ration System</strong>.
            </p>

          </div>
        </div>
      `,
    };

    // 📧 3. Email to USER (Confirmation)
    const userMailOptions = {
      from: `"PDS Shop Support Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ Your request has been received",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color:#2563eb;">Hello ${name},</h2>
          <p>We have successfully received your request.</p>
          <p>Our support team will contact you shortly.</p>
          <br/>
          <p><strong>📌 Your Message:</strong></p>
          <p style="background:#f3f4f6; padding:10px; border-radius:8px;">${message}</p>
          <br/>
          <p>Regards,</p>
          <p><strong>PDS Shop Support Team</strong></p>
        </div>
      `
    };

    // 🚀 4. Send Emails
    const adminInfo = await transporter.sendMail(adminMailOptions);
    const userInfo = await transporter.sendMail(userMailOptions);

    console.log("✅ Admin Email sent:", adminInfo.response);
    console.log("✅ User Confirmation Email sent:", userInfo.response);

    // ✅ Response
    res.status(200).json({
      success: true,
      message: "Message sent successfully & email delivered",
      dbId: newMessage._id
    });

  } catch (error) {
    console.error("❌ Contact System Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong in the contact system",
      error: error.message
    });
  }
};

// @desc    Get all contact messages (Admin Ready)
// @route   GET /api/contact
// @access  Private/Admin
export const getAllMessages = async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update message status
// @route   PUT /api/contact/:id
// @access  Private/Admin
export const updateMessageStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const message = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a message
// @route   DELETE /api/contact/:id
// @access  Private/Admin
export const deleteMessage = async (req, res) => {
  try {
    const message = await Contact.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get messages for a specific dealer
// @route   GET /api/contact/dealer
// @access  Private/Dealer
export const getDealerMessages = async (req, res) => {
  try {
    const messages = await Contact.find({ dealerId: req.user._id })
      .populate('userId', 'name rationCardNumber mobileNumber')
      .sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reply to a message (Dealer)
// @route   POST /api/contact/reply/:id
// @access  Private/Dealer
export const replyToMessage = async (req, res) => {
  try {
    const { replyText } = req.body;
    const message = await Contact.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.replyText = replyText;
    message.status = 'replied';
    message.repliedAt = new Date();
    await message.save();

    // 📧 Send email reply to user
    const mailOptions = {
      from: `"PDS Dealer Support" <${process.env.EMAIL_USER}>`,
      to: message.email,
      subject: `Re: ${message.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color:#2563eb;">Response to your Support Request</h2>
          <p>Hello ${message.name},</p>
          <p>Your PDS dealer has replied to your message:</p>
          <br/>
          <div style="background:#f3f4f6; padding:15px; border-left: 4px solid #2563eb; border-radius:4px;">
            <strong>💬 Dealer Reply:</strong><br/>
            ${replyText}
          </div>
          <br/>
          <p><strong>📌 Original Message:</strong></p>
          <p style="color:#6b7280; font-style: italic;">"${message.message}"</p>
          <br/>
          <p>Regards,</p>
          <p><strong>PDS Shop Support Team</strong></p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: 'Reply sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};