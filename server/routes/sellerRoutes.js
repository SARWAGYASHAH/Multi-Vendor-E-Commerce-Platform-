const express = require('express');
const { getSellerAnalytics } = require('../controllers/sellerController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

router.get('/analytics', protect, authorize('seller'), getSellerAnalytics);

module.exports = router;
