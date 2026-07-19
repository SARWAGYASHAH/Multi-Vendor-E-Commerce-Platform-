const Product = require('../models/Product');
const Review = require('../models/Review');
const { uploadImage, deleteImage } = require('../config/cloudinary');

// @desc    Get all products with filters, sorting, and pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 12;
    const page = Number(req.query.page) || 1;

    // Filters
    const query = {};

    // Search query (case-insensitive regex match on name or description)
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Category filter
    if (req.query.category && req.query.category !== 'All') {
      query.category = req.query.category;
    }

    // Price range
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    // Rating filter
    if (req.query.rating) {
      query.ratings = { $gte: Number(req.query.rating) };
    }

    // Sorting
    let sort = {};
    if (req.query.sortBy === 'price-low') {
      sort = { price: 1 };
    } else if (req.query.sortBy === 'price-high') {
      sort = { price: -1 };
    } else if (req.query.sortBy === 'rating') {
      sort = { ratings: -1 };
    } else {
      sort = { createdAt: -1 }; // Default new arrivals
    }

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('seller', 'name')
      .sort(sort)
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      totalProducts: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name email');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const reviews = await Review.find({ product: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json({ product, reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product (Seller only)
// @route   POST /api/products
// @access  Private/Seller
const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Please upload at least one image' });
    }

    const images = [];
    for (const file of req.files) {
      const result = await uploadImage(file.path);
      images.push({
        url: result.url,
        publicId: result.publicId,
      });
    }

    const product = new Product({
      seller: req.user._id,
      name,
      description,
      price: Number(price),
      stock: Number(stock),
      category,
      images,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product (Seller only, owner checks)
// @route   PUT /api/products/:id
// @access  Private/Seller
const updateProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category, existingImages } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Verify ownership
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to modify this product' });
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price !== undefined ? Number(price) : product.price;
    product.stock = stock !== undefined ? Number(stock) : product.stock;
    product.category = category || product.category;

    // Handle image updates
    let updatedImages = [];

    // Retain existing images that weren't deleted
    if (existingImages) {
      const keepImages = JSON.parse(existingImages);
      // Delete from Cloudinary/local any images removed from frontend
      const deletedImages = product.images.filter(
        (img) => !keepImages.some((keep) => keep.publicId === img.publicId)
      );

      for (const img of deletedImages) {
        await deleteImage(img.publicId);
      }

      updatedImages = keepImages;
    } else {
      // If existingImages is not passed, it means we don't keep any old ones, delete all
      for (const img of product.images) {
        await deleteImage(img.publicId);
      }
    }

    // Add new uploaded images
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadImage(file.path);
        updatedImages.push({
          url: result.url,
          publicId: result.publicId,
        });
      }
    }

    if (updatedImages.length > 0) {
      product.images = updatedImages;
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product (Seller only, owner checks)
// @route   DELETE /api/products/:id
// @access  Private/Seller
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Verify ownership
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    // Delete associated images
    for (const img of product.images) {
      await deleteImage(img.publicId);
    }

    // Delete associated reviews
    await Review.deleteMany({ product: req.params.id });

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product and associated reviews deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product review (Buyer only)
// @route   POST /api/products/:id/reviews
// @access  Private/Buyer
const createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user already reviewed
    const alreadyReviewed = await Review.findOne({
      product: req.params.id,
      user: req.user._id,
    });

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Product already reviewed' });
    }

    const review = new Review({
      product: req.params.id,
      user: req.user._id,
      rating: Number(rating),
      comment,
    });

    await review.save();

    // Recalculate average ratings
    const reviews = await Review.find({ product: req.params.id });
    product.numReviews = reviews.length;
    product.ratings =
      reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    await product.save();
    res.status(201).json({ message: 'Review added' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
};
