const Order = require('../models/Order');
const Product = require('../models/Product');
const sendEmail = require('../utils/sendEmail');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');

const isStripeConfigured =
  process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('your_stripe');

// @desc    Process checkout and create order
// @route   POST /api/orders/checkout
// @access  Private/Buyer
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // Verify prices and stock from Database
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const dbProduct = await Product.findById(item.product);
      if (!dbProduct) {
        return res.status(404).json({ message: `Product ${item.product} not found` });
      }

      if (dbProduct.stock < item.qty) {
        return res.status(400).json({
          message: `Insufficient stock for product ${dbProduct.name}. Available: ${dbProduct.stock}`,
        });
      }

      // Calculate totals
      totalAmount += dbProduct.price * item.qty;
      orderItems.push({
        product: dbProduct._id,
        qty: item.qty,
        price: dbProduct.price,
      });
    }

    // Direct simulation or Stripe payment session
    if (paymentMethod === 'stripe' && isStripeConfigured) {
      // Create Stripe checkout session
      const lineItems = await Promise.all(
        items.map(async (item) => {
          const product = await Product.findById(item.product);
          return {
            price_data: {
              currency: 'usd',
              product_data: {
                name: product.name,
                description: product.description,
              },
              unit_amount: Math.round(product.price * 100), // Stripe expects cents
            },
            quantity: item.qty,
          };
        })
      );

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${
          process.env.CLIENT_URL || 'http://localhost:5173'
        }/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/cart`,
        metadata: {
          buyerId: req.user._id.toString(),
          shippingAddress: JSON.stringify(shippingAddress),
          items: JSON.stringify(
            items.map((i) => ({ product: i.product, qty: i.qty, price: i.price }))
          ),
        },
      });

      return res.status(200).json({ url: session.url, session_id: session.id });
    } else {
      // Payment simulation (Local Sandbox Mode)
      // Deduct product stock
      for (const item of orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.qty },
        });
      }

      const order = new Order({
        buyer: req.user._id,
        items: orderItems,
        totalAmount,
        paymentStatus: 'Paid',
        stripePaymentId: 'simulated_payment_' + Date.now(),
        orderStatus: 'Pending',
        shippingAddress,
      });

      const createdOrder = await order.save();

      // Send confirmation email
      const emailText = `Thank you for your order! Your purchase of $${totalAmount.toFixed(
        2
      )} was successful. Order ID: ${createdOrder._id}`;
      const emailHtml = `<h1>Order Confirmation</h1>
                         <p>Thank you for shopping with us!</p>
                         <p>Order ID: <strong>${createdOrder._id}</strong></p>
                         <p>Total amount paid: <strong>$${totalAmount.toFixed(2)}</strong></p>
                         <p>We will notify you when your items are shipped.</p>`;

      await sendEmail({
        to: req.user.email,
        subject: 'Order Confirmation',
        text: emailText,
        html: emailHtml,
      });

      return res.status(201).json({
        message: 'Order created successfully (Simulated Payment)',
        order: createdOrder,
      });
    }
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Handle Stripe Webhook or Stripe success redirect locally
// @route   POST /api/orders/confirm-stripe
// @access  Private/Buyer
const confirmStripePayment = async (req, res) => {
  const { sessionId } = req.body;

  try {
    if (!isStripeConfigured) {
      return res.status(400).json({ message: 'Stripe is not configured.' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      // Check if order already exists
      const existingOrder = await Order.findOne({ stripePaymentId: session.id });
      if (existingOrder) {
        return res.json({ order: existingOrder });
      }

      const metadata = session.metadata;
      const buyerId = metadata.buyerId;
      const shippingAddress = JSON.parse(metadata.shippingAddress);
      const items = JSON.parse(metadata.items);

      const orderItems = [];
      let totalAmount = 0;

      for (const item of items) {
        const dbProduct = await Product.findById(item.product);
        if (dbProduct) {
          // Deduct stock
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.qty },
          });
          orderItems.push({
            product: dbProduct._id,
            qty: item.qty,
            price: dbProduct.price,
          });
          totalAmount += dbProduct.price * item.qty;
        }
      }

      const order = new Order({
        buyer: buyerId,
        items: orderItems,
        totalAmount,
        paymentStatus: 'Paid',
        stripePaymentId: session.id,
        orderStatus: 'Pending',
        shippingAddress,
      });

      const createdOrder = await order.save();

      // Send email
      await sendEmail({
        to: req.user.email,
        subject: 'Order Confirmation',
        text: `Thank you for your order! Total amount: $${totalAmount}. Order ID: ${createdOrder._id}`,
      });

      res.status(201).json({ order: createdOrder });
    } else {
      res.status(400).json({ message: 'Payment not completed' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get buyer orders
// @route   GET /api/orders/my-orders
// @access  Private/Buyer
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status (Seller/Admin update)
// @route   PUT /api/orders/:id/status
// @access  Private/Seller/Admin
const updateOrderStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const order = await Order.findById(req.params.id).populate('items.product');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify authorization: seller can only update if they own a product in this order
    if (req.user.role === 'seller') {
      const isSellerProduct = order.items.some(
        (item) => item.product.seller.toString() === req.user._id.toString()
      );
      if (!isSellerProduct) {
        return res.status(403).json({ message: 'Not authorized to update this order' });
      }
    }

    order.orderStatus = status;
    const updatedOrder = await order.save();

    // Trigger Real-time socket event if configured
    const io = req.app.get('io');
    if (io) {
      io.to(`order_${order._id}`).emit('orderStatusUpdated', {
        orderId: order._id,
        status: order.orderStatus,
      });
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  confirmStripePayment,
  getMyOrders,
  updateOrderStatus,
};
