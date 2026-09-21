const db = require('../config/db');

async function getHealth(req, res, next) {
  try {
    const dbStatus = await db.testConnection();

    res.status(dbStatus.connected ? 200 : 503).json({
      success: dbStatus.connected,
      service: 'blueneedle-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus.connected ? 'connected' : 'disconnected',
        details: dbStatus.connected ? { database: dbStatus.database } : { error: dbStatus.error },
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getHealth,
};
