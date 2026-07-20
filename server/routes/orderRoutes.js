const express = require('express');
const {
  createOrder,
  confirmStripePayment,
  getMyOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

router.post('/checkout', protect, authorize('buyer'), createOrder);
router.post('/confirm-stripe', protect, authorize('buyer'), confirmStripePayment);
router.get('/my-orders', protect, authorize('buyer'), getMyOrders);
router.put('/:id/status', protect, authorize('seller', 'admin'), updateOrderStatus);

module.exports = router;
