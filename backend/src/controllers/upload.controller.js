const path = require('path');
const fs = require('fs');
const os = require('os');
const db = require('../config/db');

// In local environment, write to uploads/ directory. In serverless/Vercel, write to /tmp or use Data URL.
const isVercel = Boolean(process.env.VERCEL);
const localUploadsDir = path.resolve(__dirname, '../../uploads');
const tmpUploadsDir = path.join(os.tmpdir(), 'blueneedle_uploads');
const activeUploadDir = isVercel ? tmpUploadsDir : localUploadsDir;

try {
  if (!fs.existsSync(activeUploadDir)) {
    fs.mkdirSync(activeUploadDir, { recursive: true });
  }
} catch (e) {
  // Ignore
}

/**
 * Handle multiple image uploads and save records to PostgreSQL
 */
async function uploadMultipleImages(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No image files uploaded. Please provide files under field "images".' },
      });
    }

    const productId = req.body.product_id ? parseInt(req.body.product_id, 10) : null;
    const uploadedRecords = [];

    for (const file of req.files) {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${cleanBase}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      
      // Store on disk (/tmp on Vercel, or uploads/ locally)
      try {
        const diskPath = path.join(activeUploadDir, filename);
        fs.writeFileSync(diskPath, file.buffer);
      } catch (err) {
        console.warn('Could not write image to disk:', err.message);
      }

      // In serverless cloud (Vercel), convert to Data URL so it persists permanently in PostgreSQL
      // and displays reliably across all serverless instances
      let fileUrl;
      if (isVercel || !fs.existsSync(localUploadsDir)) {
        const base64Data = file.buffer.toString('base64');
        fileUrl = `data:${file.mimetype};base64,${base64Data}`;
      } else {
        fileUrl = `/uploads/${filename}`;
      }

      const insertSql = `
        INSERT INTO uploads (filename, original_name, mimetype, size, url, product_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [
        filename,
        file.originalname,
        file.mimetype,
        file.size,
        fileUrl,
        productId || null,
      ];

      const result = await db.query(insertSql, values);
      uploadedRecords.push(result.rows[0]);
    }

    // If product_id was specified, update products.images array in PostgreSQL
    if (productId) {
      const newUrls = uploadedRecords.map((r) => r.url);
      await db.query(
        `UPDATE products 
         SET images = COALESCE(images, '[]'::jsonb) || $1::jsonb,
             image_url = COALESCE(image_url, $2)
         WHERE id = $3`,
        [JSON.stringify(newUrls), newUrls[0], productId]
      );
    }

    res.status(201).json({
      success: true,
      message: `${uploadedRecords.length} image(s) uploaded and saved to database successfully.`,
      count: uploadedRecords.length,
      data: uploadedRecords,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all upload records from PostgreSQL
 */
async function getAllUploads(req, res, next) {
  try {
    const { product_id } = req.query;
    let query = 'SELECT * FROM uploads';
    const params = [];

    if (product_id) {
      params.push(parseInt(product_id, 10));
      query += ` WHERE product_id = $1`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete an upload record from PostgreSQL
 */
async function deleteUpload(req, res, next) {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM uploads WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: `Upload with id ${id} not found.` },
      });
    }

    const deletedRecord = result.rows[0];

    // Attempt removing file from disk if local
    try {
      const filePath = path.join(activeUploadDir, deletedRecord.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {}

    res.json({
      success: true,
      message: `File ${deletedRecord.filename} deleted successfully.`,
      data: deletedRecord,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadMultipleImages,
  getAllUploads,
  deleteUpload,
};