const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Get pending seller approval registrations
// @route   GET /api/admin/sellers/pending
// @access  Private/Admin
const getPendingSellers = async (req, res) => {
  try {
    const sellers = await User.find({ role: 'seller', isApproved: false })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(sellers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve a seller registration
// @route   PUT /api/admin/sellers/:id/approve
// @access  Private/Admin
const approveSeller = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);

    if (!seller || seller.role !== 'seller') {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.isApproved = true;
    await seller.save();

    res.json({ message: `Seller ${seller.name} approved successfully`, seller });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users (buyers + sellers)
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Ban or unban user
// @route   PUT /api/admin/users/:id/ban
// @access  Private/Admin
const banUser = async (req, res) => {
  const { isBanned } = req.body;

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot ban/unban admins' });
    }

    user.isBanned = isBanned;
    await user.save();

    res.json({
      message: `User account has been ${isBanned ? 'banned' : 'unbanned'}`,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get global dashboard stats (Admin)
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getPlatformAnalytics = async (req, res) => {
  try {
    const totalSellers = await User.countDocuments({ role: 'seller', isApproved: true });
    const pendingSellersCount = await User.countDocuments({ role: 'seller', isApproved: false });
    const totalBuyers = await User.countDocuments({ role: 'buyer' });

    const orders = await Order.find({ paymentStatus: 'Paid' });
    const totalOrders = orders.length;

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Sales by Category
    const products = await Product.find({});
    const categoryCount = {};
    products.forEach((p) => {
      categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
    });

    res.json({
      totalSellers,
      pendingSellersCount,
      totalBuyers,
      totalOrders,
      totalRevenue,
      categoryDistribution: Object.keys(categoryCount).map((cat) => ({
        name: cat,
        value: categoryCount[cat],
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPendingSellers,
  approveSeller,
  getUsers,
  banUser,
  getPlatformAnalytics,
};
