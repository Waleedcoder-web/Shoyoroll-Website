const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// Public routes: Storefront catalog
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Protected routes: Admin product management
router.post('/', requireAuth, productController.createProduct);
router.put('/:id', requireAuth, productController.updateProduct);
router.delete('/:id', requireAuth, productController.deleteProduct);

module.exports = router;
