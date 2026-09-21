const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { uploadMultiple } = require('../middleware/upload.middleware');
const { requireAuth } = require('../middleware/auth.middleware');

// Upload multiple images at once and store in PostgreSQL
router.post('/multiple', requireAuth, uploadMultiple, uploadController.uploadMultipleImages);

// Alias: Single/Multiple upload endpoint
router.post('/', requireAuth, uploadMultiple, uploadController.uploadMultipleImages);

// Get list of uploaded images from PostgreSQL
router.get('/', requireAuth, uploadController.getAllUploads);

// Delete an upload
router.delete('/:id', requireAuth, uploadController.deleteUpload);

module.exports = router;
