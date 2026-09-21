const db = require('../config/db');

async function getAllProducts(req, res, next) {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM products WHERE is_active = true';
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }

    query += ' ORDER BY id ASC';

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

async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: `Product with id ${id} not found` },
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

async function createProduct(req, res, next) {
  try {
    const {
      name,
      category,
      sku,
      description,
      intro,
      materials,
      gsm,
      weave,
      colors,
      sizes,
      moq,
      image_url,
      images,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: { message: 'Product name is required' },
      });
    }

    const imageArray = Array.isArray(images) ? images : [];
    const primaryImage = image_url || (imageArray.length > 0 ? imageArray[0] : null);

    const insertSql = `
      INSERT INTO products (name, category, sku, description, intro, materials, gsm, weave, colors, sizes, moq, image_url, images)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      name,
      category || 'BJJ Gear',
      sku || null,
      description || null,
      intro || null,
      materials || null,
      gsm || null,
      weave || null,
      JSON.stringify(colors || []),
      JSON.stringify(sizes || []),
      moq || 50,
      primaryImage,
      JSON.stringify(imageArray),
    ];

    const result = await db.query(insertSql, values);

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      sku,
      description,
      intro,
      materials,
      gsm,
      weave,
      moq,
      image_url,
      images,
      is_active,
    } = req.body;

    const result = await db.query(
      `UPDATE products 
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           sku = COALESCE($3, sku),
           description = COALESCE($4, description),
           intro = COALESCE($5, intro),
           materials = COALESCE($6, materials),
           gsm = COALESCE($7, gsm),
           weave = COALESCE($8, weave),
           moq = COALESCE($9, moq),
           image_url = COALESCE($10, image_url),
           images = COALESCE($11::jsonb, images),
           is_active = COALESCE($12, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $13
       RETURNING *`,
      [
        name,
        category,
        sku,
        description,
        intro,
        materials,
        gsm,
        weave,
        moq,
        image_url,
        images ? JSON.stringify(images) : null,
        is_active,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: `Product with id ${id} not found` },
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

async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM products WHERE id = $1 RETURNING id, name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: `Product with id ${id} not found` },
      });
    }

    res.json({
      success: true,
      message: `Product "${result.rows[0].name}" (ID: ${id}) deleted successfully`,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
