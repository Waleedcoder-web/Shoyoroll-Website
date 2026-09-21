require('dotenv').config();
const app = require('./app');
const { testConnection, pool } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  // Test database connection on startup
  console.log('-------------------------------------------');
  console.log('🚀 Starting BLUENEEDLE Backend Server...');
  console.log('-------------------------------------------');

  const dbStatus = await testConnection();
  if (dbStatus.connected) {
    console.log('✅ Database: PostgreSQL is connected');
  } else {
    console.warn('⚠️  Database: PostgreSQL connection pending or failed. The API will run, but database endpoints will return 503/errors until connected.');
  }

  const server = app.listen(PORT, () => {
    console.log(`🌐 Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
    console.log(`📡 Health check available at: http://localhost:${PORT}/api/health`);
    console.log('-------------------------------------------');
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n[${signal}] Shutting down server gracefully...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await pool.end();
        console.log('PostgreSQL pool closed.');
      } catch (err) {
        console.error('Error closing PostgreSQL pool:', err);
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
