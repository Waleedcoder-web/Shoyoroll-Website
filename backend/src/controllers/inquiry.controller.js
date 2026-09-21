const db = require('../config/db');

async function createInquiry(req, res, next) {
  try {
    const { name, email, phone, company, product_interest, quantity, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: { message: 'Name and email are required fields.' },
      });
    }

    const insertSql = `
      INSERT INTO inquiries (name, email, phone, company, product_interest, quantity, message)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      name,
      email,
      phone || null,
      company || null,
      product_interest || null,
      quantity ? parseInt(quantity, 10) : null,
      message || null,
    ];

    const result = await db.query(insertSql, values);

    res.status(201).json({
      success: true,
      message: 'Inquiry received successfully. Our team will get back to you shortly.',
      data: result.rows[0],
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
  getAllInquiries,
  updateInquiryStatus,
};
