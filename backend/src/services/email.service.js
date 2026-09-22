const nodemailer = require('nodemailer');

/**
 * Creates and returns a Nodemailer transporter based on environment configuration.
 * Supports Gmail, custom SMTP servers (Hostinger, cPanel, SendGrid, Brevo, AWS SES, etc.)
 */
function getTransporter() {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const service = process.env.EMAIL_SERVICE;

  if (!user || !pass) {
    return null;
  }

  // Gmail direct service configuration
  if (service?.toLowerCase() === 'gmail' || host?.includes('gmail')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass, // Gmail 16-character App Password
      },
    });
  }

  // Standard SMTP configuration
  return nodemailer.createTransport({
    host: host || 'smtp.gmail.com',
    port: port,
    secure: port === 465, // true for 465, false for 587 / other ports
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Sends an email notification to the store administrator/owner when an inquiry is received.
 * @param {Object} inquiry - The inquiry database record
 */
async function sendInquiryNotification(inquiry) {
  const transporter = getTransporter();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER || 'blueneedle3@gmail.com';
  const senderEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.SMTP_USER || adminEmail;

  if (!transporter) {
    console.warn(
      `[Email Service] SMTP credentials not fully configured (EMAIL_USER/EMAIL_PASS). Email for inquiry #${inquiry.id} was not sent.`
    );
    return { success: false, reason: 'SMTP credentials not configured' };
  }

  const inqRef = `INQ-${String(inquiry.id).padStart(4, '0')}`;
  const subject = `🔔 New Quote Inquiry #${inqRef}: ${inquiry.name} (${inquiry.product_interest || 'B2B Gear'})`;

  // WhatsApp quick link if phone is provided
  const cleanPhone = inquiry.phone ? inquiry.phone.replace(/[^0-9+]/g, '') : '';
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone.replace('+', '')}` : null;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f1f5f9; color: #1e293b; }
        .wrapper { max-width: 620px; margin: 24px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: #0f172a; padding: 28px 32px; color: #ffffff; border-bottom: 3px solid #0077b6; }
        .brand { font-size: 20px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #ffffff; margin: 0; }
        .badge { display: inline-block; background: #0077b6; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 9999px; margin-top: 8px; }
        .body { padding: 32px; }
        .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 8px; }
        .subtitle { font-size: 14px; color: #64748b; margin-top: 0; margin-bottom: 24px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin-bottom: 20px; }
        .table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .table td { padding: 8px 0; vertical-align: top; }
        .label { width: 130px; font-weight: 600; color: #64748b; }
        .value { color: #0f172a; font-weight: 500; }
        .msg-box { background: #ffffff; border-left: 4px solid #0077b6; padding: 14px 18px; margin-top: 10px; border-radius: 4px; font-size: 14px; line-height: 1.6; color: #334155; font-style: italic; }
        .actions { margin-top: 28px; text-align: center; }
        .btn { display: inline-block; padding: 12px 24px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-decoration: none; border-radius: 6px; margin: 6px; }
        .btn-reply { background: #0077b6; color: #ffffff !important; }
        .btn-wa { background: #25D366; color: #ffffff !important; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 32px; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1 class="brand">BLUENEEDLE</h1>
          <span class="badge">Inquiry #${inqRef}</span>
        </div>
        <div class="body">
          <h2 class="title">New Customer Inquiry Received</h2>
          <p class="subtitle">A customer has submitted a quote request via the website. Details are below:</p>

          <div class="card">
            <table class="table">
              <tr>
                <td class="label">Customer Name:</td>
                <td class="value"><strong>${escapeHtml(inquiry.name)}</strong></td>
              </tr>
              <tr>
                <td class="label">Email Address:</td>
                <td class="value"><a href="mailto:${inquiry.email}" style="color: #0077b6; text-decoration: none;">${escapeHtml(inquiry.email)}</a></td>
              </tr>
              ${inquiry.phone ? `
              <tr>
                <td class="label">Phone / WhatsApp:</td>
                <td class="value">${escapeHtml(inquiry.phone)}</td>
              </tr>` : ''}
              ${inquiry.company ? `
              <tr>
                <td class="label">Company / Brand:</td>
                <td class="value">${escapeHtml(inquiry.company)}</td>
              </tr>` : ''}
              ${inquiry.country ? `
              <tr>
                <td class="label">Country:</td>
                <td class="value">${escapeHtml(inquiry.country)}</td>
              </tr>` : ''}
              <tr>
                <td class="label">Product Interest:</td>
                <td class="value"><strong>${escapeHtml(inquiry.product_interest || 'General / Unspecified')}</strong></td>
              </tr>
              ${inquiry.quantity ? `
              <tr>
                <td class="label">Estimated Quantity:</td>
                <td class="value"><strong>${inquiry.quantity} units</strong></td>
              </tr>` : ''}
              <tr>
                <td class="label">Received At:</td>
                <td class="value">${new Date(inquiry.created_at || Date.now()).toUTCString()}</td>
              </tr>
            </table>

            <div style="margin-top: 16px;">
              <strong style="font-size: 13px; color: #475569; text-transform: uppercase; letter-spacing: 0.04em;">Customer Message & Specifications:</strong>
              <div class="msg-box">
                ${escapeHtml(inquiry.message || 'No additional message provided.').replace(/\n/g, '<br/>')}
              </div>
            </div>
          </div>

          <div class="actions">
            <a href="mailto:${inquiry.email}?subject=Re:%20Quote%20Inquiry%20%23${inqRef}%20-%20BLUENEEDLE" class="btn btn-reply">
              ✉️ Reply to Customer
            </a>
            ${waLink ? `
            <a href="${waLink}" target="_blank" class="btn btn-wa">
              💬 WhatsApp Customer
            </a>` : ''}
          </div>
        </div>
        <div class="footer">
          This is an automated notification from BLUENEEDLE Quote & Manufacturing System.<br/>
          Direct reply to this email will respond directly to <strong>${escapeHtml(inquiry.email)}</strong>.
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
BLUENEEDLE - New Quote Inquiry #${inqRef}
--------------------------------------------------
Customer Name:    ${inquiry.name}
Customer Email:   ${inquiry.email}
Phone / WhatsApp: ${inquiry.phone || 'N/A'}
Company / Brand:  ${inquiry.company || 'N/A'}
Country:          ${inquiry.country || 'N/A'}
Product Interest: ${inquiry.product_interest || 'General'}
Quantity:         ${inquiry.quantity || 'N/A'} units
Received At:      ${new Date(inquiry.created_at || Date.now()).toUTCString()}

Message:
${inquiry.message || 'No additional message provided.'}
--------------------------------------------------
Reply directly to this email to contact ${inquiry.email}.
  `.trim();

  try {
    const info = await transporter.sendMail({
      from: `"BLUENEEDLE Inquiries" <${senderEmail}>`,
      to: adminEmail,
      replyTo: inquiry.email, // Allows hitting reply directly in email client
      subject: subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[Email Service] Admin notification sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email Service] Error sending inquiry notification email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends an automated confirmation receipt to the customer who submitted the inquiry.
 * @param {Object} inquiry
 */
async function sendCustomerConfirmation(inquiry) {
  const transporter = getTransporter();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER || 'blueneedle3@gmail.com';
  const senderEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.SMTP_USER || adminEmail;

  if (!transporter || !inquiry.email) {
    return { success: false, reason: 'Transporter not ready or missing customer email' };
  }

  const inqRef = `INQ-${String(inquiry.id).padStart(4, '0')}`;
  const subject = `We received your quote request - BLUENEEDLE (#${inqRef})`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
        .wrapper { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        .header { background: #0f172a; padding: 24px 30px; text-align: center; }
        .brand { font-size: 22px; font-weight: 800; letter-spacing: 0.1em; color: #ffffff; margin: 0; }
        .body { padding: 32px 30px; }
        .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0; font-size: 14px; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1 class="brand">BLUENEEDLE</h1>
        </div>
        <div class="body">
          <h2 class="title">Thank you, ${escapeHtml(inquiry.name)}!</h2>
          <p>We have successfully received your quote request. Our export and manufacturing specialists will review your requirements and provide pricing and timeline details within 24 business hours.</p>

          <div class="card">
            <strong>Your Reference:</strong> #${inqRef}<br/>
            <strong>Product of Interest:</strong> ${escapeHtml(inquiry.product_interest || 'Custom Gear')}<br/>
            ${inquiry.quantity ? `<strong>Quantity:</strong> ${inquiry.quantity} units<br/>` : ''}
          </div>

          <p>If you have urgent questions or sample requests, feel free to contact our export team directly on WhatsApp at <strong>+92 306 9235005</strong> or reply to this email.</p>
          <p style="margin-top: 24px;">Best regards,<br/><strong>BLUENEEDLE Export Team</strong></p>
        </div>
        <div class="footer">
          BLUENEEDLE &bull; Premium BJJ & Combat Sports Apparel Manufacturing
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"BLUENEEDLE Export Team" <${senderEmail}>`,
      to: inquiry.email,
      replyTo: adminEmail,
      subject: subject,
      html: htmlContent,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Email Service] Error sending customer confirmation email:', err);
    return { success: false, error: err.message };
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  sendInquiryNotification,
  sendCustomerConfirmation,
};
