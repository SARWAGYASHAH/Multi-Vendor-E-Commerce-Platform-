const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Get seller dashboard statistics and chart data
// @route   GET /api/seller/analytics
// @access  Private/Seller
const getSellerAnalytics = async (req, res) => {
  try {
    const sellerId = req.user._id;

    // Get seller products
    const sellerProducts = await Product.find({ seller: sellerId });
    const productIds = sellerProducts.map((p) => p._id.toString());

    // Find all orders containing any of this seller's products
    const orders = await Order.find({
      paymentStatus: 'Paid',
      'items.product': { $in: productIds },
    }).populate('items.product buyer', 'name email');

    let totalRevenue = 0;
    let totalItemsSold = 0;
    const dailySalesMap = {};
    const productSalesMap = {};

    // Initialize map with products
    sellerProducts.forEach((p) => {
      productSalesMap[p.name] = 0;
    });

    const recentOrders = [];

    orders.forEach((order) => {
      let containsSellerProduct = false;
      let sellerItemsTotal = 0;

      order.items.forEach((item) => {
        if (item.product && productIds.includes(item.product._id.toString())) {
          const itemRevenue = item.price * item.qty;
          totalRevenue += itemRevenue;
          totalItemsSold += item.qty;
          sellerItemsTotal += itemRevenue;
          containsSellerProduct = true;

          // Aggregating product sales
          const pName = item.product.name;
          productSalesMap[pName] = (productSalesMap[pName] || 0) + item.qty;
        }
      });

      if (containsSellerProduct) {
        // Daily Sales aggregation
        const dateStr = order.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
        dailySalesMap[dateStr] = (dailySalesMap[dateStr] || 0) + sellerItemsTotal;

        recentOrders.push({
          _id: order._id,
          buyerName: order.buyer ? order.buyer.name : 'Guest',
          createdAt: order.createdAt,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          totalAmount: sellerItemsTotal,
        });
      }
    });

    // Formatting chart data
    const revenueOverTime = Object.keys(dailySalesMap)
      .map((date) => ({
        date,
        revenue: dailySalesMap[date],
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const topSellingProducts = Object.keys(productSalesMap).map((name) => ({
      name,
      sales: productSalesMap[name],
    }));

    res.json({
      totalRevenue,
      totalItemsSold,
      productsCount: sellerProducts.length,
      revenueOverTime,
      topSellingProducts,
      recentOrders: recentOrders.slice(0, 5), // Keep top 5 latest orders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSellerAnalytics,
};
