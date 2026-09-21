const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiry.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// Public route: Customer quote submissions
router.post('/', inquiryController.createInquiry);

// Protected routes: Admin inquiry management
router.get('/', requireAuth, inquiryController.getAllInquiries);
router.patch('/:id', requireAuth, inquiryController.updateInquiryStatus);

module.exports = router;
