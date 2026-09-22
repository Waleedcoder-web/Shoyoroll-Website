const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiry.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// Public route: Customer quote submissions
router.post('/', inquiryController.createInquiry);

// Email connection status check & test route (for testing SMTP configuration)
router.get('/email-status', inquiryController.checkEmailStatus);
router.post('/send-test-email', inquiryController.testSendEmail);

// Protected routes: Admin inquiry management
router.get('/', requireAuth, inquiryController.getAllInquiries);
router.patch('/:id', requireAuth, inquiryController.updateInquiryStatus);

module.exports = router;

