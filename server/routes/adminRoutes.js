const express = require('express');
const {
  getPendingSellers,
  approveSeller,
  getUsers,
  banUser,
  getPlatformAnalytics,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

router.get('/sellers/pending', protect, authorize('admin'), getPendingSellers);
router.put('/sellers/:id/approve', protect, authorize('admin'), approveSeller);
router.get('/users', protect, authorize('admin'), getUsers);
router.put('/users/:id/ban', protect, authorize('admin'), banUser);
router.get('/analytics', protect, authorize('admin'), getPlatformAnalytics);

module.exports = router;
