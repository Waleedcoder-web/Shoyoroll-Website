const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const healthRoutes = require('./routes/health.routes');
const productRoutes = require('./routes/product.routes');
const inquiryRoutes = require('./routes/inquiry.routes');
const authRoutes = require('./routes/auth.routes');
const uploadRoutes = require('./routes/upload.routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const frontendPath = path.resolve(__dirname, '../../frontend');
const uploadsPath = path.resolve(__dirname, '../uploads');

// Security headers (allowing static assets and fonts)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS for external consumers
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve static frontend files (user-side and admin-side)
app.use(express.static(frontendPath));

// Serve uploaded media files statically
app.use('/uploads', express.static(uploadsPath));

// Admin route aliases
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin', 'login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin', 'index.html'));
});

// API Info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to BLUENEEDLE API',
    status: 'running',
    endpoints: {
      auth: {
        login: '/api/auth/login',
        verify: '/api/auth/verify',
      },
      upload: {
        multiple: '/api/upload/multiple',
        list: '/api/upload',
      },
      health: '/api/health',
      products: '/api/products',
      inquiries: '/api/inquiries',
    },
    clientUrls: {
      userHome: '/',
      userProducts: '/products.html',
      adminLogin: '/admin/login.html',
      adminOverview: '/admin/',
      adminInquiries: '/admin/inquiries.html',
      adminProducts: '/admin/products.html',
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inquiries', inquiryRoutes);

// Catch 404 and forward to error handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
