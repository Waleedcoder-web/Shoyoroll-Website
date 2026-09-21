const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Username and password are required.' },
      });
    }

    // Lookup user in PostgreSQL admin_users table (case-insensitive)
    const result = await db.query(
      'SELECT id, username, email, password_hash, role FROM admin_users WHERE LOWER(username) = LOWER($1) LIMIT 1',
      [username.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid username or password.' },
      });
    }

    const user = result.rows[0];

    // Compare with bcrypt hash
    const isMatch = await bcrypt.compare(String(password), user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid username or password.' },
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET || 'blueneedle_super_secure_jwt_token_key_waleed_8956_production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function verify(req, res, next) {
  try {
    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  verify,
};
