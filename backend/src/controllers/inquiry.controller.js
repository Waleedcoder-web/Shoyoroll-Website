const db = require('../config/db');
const emailService = require('../services/email.service');

async function createInquiry(req, res, next) {
  try {
    const { name, email, phone, company, country, product_interest, quantity, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: { message: 'Name and email are required fields.' },
      });
    }

    const insertSql = `
      INSERT INTO inquiries (name, email, phone, company, country, product_interest, quantity, message)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      name,
      email,
      phone || null,
      company || null,
      country || null,
      product_interest || null,
      quantity ? parseInt(quantity, 10) : null,
      message || null,
    ];

    const result = await db.query(insertSql, values);
    const savedInquiry = result.rows[0];

    // Explicitly await the admin email notification so serverless execution is not aborted
    let emailStatus = { success: false, reason: 'Pending' };
    try {
      emailStatus = await emailService.sendInquiryNotification(savedInquiry);
    } catch (emailErr) {
      console.error('[Inquiry Controller] Email delivery error:', emailErr);
      emailStatus = { success: false, error: emailErr.message };
    }

    // Attempt customer confirmation
    try {
      await emailService.sendCustomerConfirmation(savedInquiry);
    } catch (confErr) {
      console.warn('[Inquiry Controller] Customer confirmation email skipped/failed:', confErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Inquiry received successfully. Our team will get back to you shortly.',
      data: savedInquiry,
      email_status: emailStatus,
    });
  } catch (error) {
    next(error);
  }
}

async function checkEmailStatus(req, res, next) {
  try {
    const diagnostic = await emailService.verifyConnection();
    res.json({
      success: true,
      diagnostic,
    });
  } catch (error) {
    next(error);
  }
}

async function testSendEmail(req, res, next) {
  try {
    const targetEmail = req.body.email || process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'blueneedle3@gmail.com';
    const mockInquiry = {
      id: 9999,
      name: 'Diagnostic Test User',
      email: targetEmail,
      phone: '+92 306 9235005',
      company: 'Test Gym / Brand',
      country: 'Diagnostic Server',
      product_interest: 'BJJ Gi Sample (Test)',
      quantity: 50,
      message: 'This is a test notification confirming email delivery is working correctly from the BLUENEEDLE server.',
      created_at: new Date().toISOString(),
    };

    const result = await emailService.sendInquiryNotification(mockInquiry);
    res.json({
      success: result.success,
      result,
    });
  } catch (error) {
    next(error);
  }
}

async function getAllInquiries(req, res, next) {
  try {
    const result = await db.query('SELECT * FROM inquiries ORDER BY created_at DESC');
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

async function updateInquiryStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await db.query(
      'UPDATE inquiries SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: `Inquiry with id ${id} not found` },
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createInquiry,
  checkEmailStatus,
  testSendEmail,
  getAllInquiries,
  updateInquiryStatus,
};
