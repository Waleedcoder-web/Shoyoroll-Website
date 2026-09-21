const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'blueneedle_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[Database Pool Error]:', err.message);
});

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT current_database(), NOW() AS server_time, version()');
    client.release();
    console.log(`[Database]: Connected successfully to PostgreSQL database "${res.rows[0].current_database}"`);
    return {
      connected: true,
      database: res.rows[0].current_database,
      serverTime: res.rows[0].server_time,
    };
  } catch (error) {
    console.error(`[Database Connection Failed]: ${error.message}`);
    console.warn(`Tip: Verify database credentials in 'backend/.env' (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME).`);
    return {
      connected: false,
      error: error.message,
    };
  }
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  testConnection,
};
