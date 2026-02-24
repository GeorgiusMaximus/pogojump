const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'pogojump_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json());

// Database file path
const DB_FILE = path.join(__dirname, 'database.json');

// Initialize database
function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      products: [
        { id: 1, name: 'PogoJump Neon', description: 'Beginner-friendly with vibrant LED lights', price: 89, image: 'neon', featured: true },
        { id: 2, name: 'PogoJump Pro', description: 'Professional grade with higher bounce', price: 149, image: 'pro', featured: true },
        { id: 3, name: 'PogoJump Junior', description: 'For kids with extra safety features', price: 69, image: 'junior', featured: true },
        { id: 4, name: 'PogoJump Carbon', description: 'Ultra-light carbon fiber design', price: 199, image: 'carbon', featured: false },
        { id: 5, name: 'PogoJump Extreme', description: 'Maximum height with advanced springs', price: 179, image: 'extreme', featured: true }
      ],
      users: [],
      orders: [],
      reviews: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  }
}

// Read database
function readDB() {
  const data = fs.readFileSync(DB_FILE, 'utf8');
  const db = JSON.parse(data);
  if (!db.reviews) db.reviews = [];
  return db;
}

// Write database
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Auth Middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Admin Middleware
function adminMiddleware(req, res, next) {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const db = readDB();
    
    // Check if user exists
    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: Date.now(),
      email,
      name,
      password: hashedPassword,
      isAdmin: db.users.length === 0, // First user is admin
      createdAt: new Date().toISOString()
    };

    db.users.push(user);
    writeDB(db);

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin, avatar: user.avatar || null, flag: user.flag || null }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const db = readDB();
    const user = db.users.find(u => u.email === email);

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin, avatar: user.avatar || null, flag: user.flag || null }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
    avatar: user.avatar || null,
    flag: user.flag || null
  });
});

// ==================== PRODUCTS ROUTES ====================

// Get all products
app.get('/api/products', (req, res) => {
  const db = readDB();
  res.json(db.products);
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const db = readDB();
  const product = db.products.find(p => p.id === parseInt(req.params.id));
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  res.json(product);
});

// Create product (admin only)
app.post('/api/products', authMiddleware, adminMiddleware, (req, res) => {
  const { name, description, price, image, featured } = req.body;
  
  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price required' });
  }

  const db = readDB();
  const product = {
    id: Date.now(),
    name,
    description: description || '',
    price: parseFloat(price),
    image: image || 'default',
    featured: featured || false
  };

  db.products.push(product);
  writeDB(db);

  res.json(product);
});

// Update product (admin only)
app.put('/api/products/:id', authMiddleware, adminMiddleware, (req, res) => {
  const db = readDB();
  const index = db.products.findIndex(p => p.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const { name, description, price, image, featured } = req.body;
  
  db.products[index] = {
    ...db.products[index],
    name: name || db.products[index].name,
    description: description !== undefined ? description : db.products[index].description,
    price: price ? parseFloat(price) : db.products[index].price,
    image: image || db.products[index].image,
    featured: featured !== undefined ? featured : db.products[index].featured
  };

  writeDB(db);
  res.json(db.products[index]);
});

// Delete product (admin only)
app.delete('/api/products/:id', authMiddleware, adminMiddleware, (req, res) => {
  const db = readDB();
  const index = db.products.findIndex(p => p.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  db.products.splice(index, 1);
  writeDB(db);

  res.json({ message: 'Product deleted' });
});

// ==================== REVIEWS ROUTES ====================

// Get reviews for a product
app.get('/api/products/:id/reviews', (req, res) => {
  const db = readDB();
  const productId = parseInt(req.params.id);
  const reviews = (db.reviews || []).filter(r => r.productId === productId);
  res.json(reviews);
});

// Add review to product (requires auth)
app.post('/api/products/:id/reviews', authMiddleware, (req, res) => {
  const db = readDB();
  const productId = parseInt(req.params.id);
  const { rating, review } = req.body;

  if (!rating || !review) {
    return res.status(400).json({ error: 'Rating and review are required' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  const product = db.products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const user = db.users.find(u => u.id === req.user.id);

  const newReview = {
    id: Date.now(),
    productId,
    userId: req.user.id,
    userName: user?.name || 'Anonymous',
    rating: parseInt(rating),
    review,
    createdAt: new Date().toISOString()
  };

  if (!db.reviews) db.reviews = [];
  db.reviews.push(newReview);
  writeDB(db);

  res.json(newReview);
});

// Delete review (admin or review owner)
app.delete('/api/reviews/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const reviewId = parseInt(req.params.id);
  const index = db.reviews.findIndex(r => r.id === reviewId);

  if (index === -1) {
    return res.status(404).json({ error: 'Review not found' });
  }

  const review = db.reviews[index];

  if (review.userId !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'You can only delete your own reviews' });
  }

  db.reviews.splice(index, 1);
  writeDB(db);

  res.json({ message: 'Review deleted' });
});

// Update review (owner or admin)
app.put('/api/reviews/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const reviewId = parseInt(req.params.id);
  const index = db.reviews.findIndex(r => r.id === reviewId);

  if (index === -1) {
    return res.status(404).json({ error: 'Review not found' });
  }

  const review = db.reviews[index];

  if (review.userId !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'You can only edit your own reviews' });
  }

  const { rating, review: reviewText } = req.body;

  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  db.reviews[index] = {
    ...review,
    rating: rating ? parseInt(rating) : review.rating,
    review: reviewText !== undefined ? reviewText : review.review,
    updatedAt: new Date().toISOString()
  };

  writeDB(db);

  res.json(db.reviews[index]);
});

// Get product with reviews
app.get('/api/products/:id/with-reviews', (req, res) => {
  const db = readDB();
  const productId = parseInt(req.params.id);
  const product = db.products.find(p => p.id === productId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const reviews = (db.reviews || []).filter(r => r.productId === productId);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  res.json({
    ...product,
    reviews,
    avgRating: parseFloat(avgRating),
    reviewCount: reviews.length
  });
});

// ==================== ORDERS ROUTES ====================

// Get all orders (admin only)
app.get('/api/orders', authMiddleware, adminMiddleware, (req, res) => {
  const db = readDB();
  res.json(db.orders);
});

// Get user's orders
app.get('/api/orders/my', authMiddleware, (req, res) => {
  const db = readDB();
  const orders = db.orders.filter(o => o.userId === req.user.id);
  res.json(orders);
});

// Create order
app.post('/api/orders', authMiddleware, (req, res) => {
  const { items, total } = req.body;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'No items in order' });
  }

  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);
  
  const order = {
    id: Date.now(),
    userId: req.user.id,
    userName: user?.name || 'Unknown',
    userEmail: user?.email || 'Unknown',
    items,
    total: parseFloat(total),
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  db.orders.push(order);
  writeDB(db);

  res.json(order);
});

// Update order status (admin only)
app.put('/api/orders/:id', authMiddleware, adminMiddleware, (req, res) => {
  const db = readDB();
  const index = db.orders.findIndex(o => o.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const { status } = req.body;
  db.orders[index].status = status || db.orders[index].status;
  writeDB(db);

  res.json(db.orders[index]);
});

// Delete order (admin only)
app.delete('/api/orders/:id', authMiddleware, adminMiddleware, (req, res) => {
  const db = readDB();
  const index = db.orders.findIndex(o => o.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  db.orders.splice(index, 1);
  writeDB(db);

  res.json({ message: 'Order deleted' });
});

// ==================== USERS ROUTES (Admin) ====================

// Get all users (admin only)
app.get('/api/users', authMiddleware, adminMiddleware, (req, res) => {
  const db = readDB();
  const users = db.users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    isAdmin: u.isAdmin,
    createdAt: u.createdAt,
    avatar: u.avatar || null,
    flag: u.flag || null
  }));
  res.json(users);
});

// Update user profile (owner)
app.put('/api/users/profile', authMiddleware, (req, res) => {
  const db = readDB();
  const index = db.users.findIndex(u => u.id === req.user.id);

  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { name, avatar, flag } = req.body;

  if (name !== undefined) {
    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }
    db.users[index].name = name.trim();
  }

  if (avatar !== undefined) {
    db.users[index].avatar = avatar;
  }

  if (flag !== undefined) {
    db.users[index].flag = flag;
  }

  writeDB(db);

  res.json({
    id: db.users[index].id,
    email: db.users[index].email,
    name: db.users[index].name,
    isAdmin: db.users[index].isAdmin,
    avatar: db.users[index].avatar,
    flag: db.users[index].flag
  });
});

// Initialize database and start server
initDB();

app.listen(PORT, () => {
  console.log(`PogoJump API running on http://localhost:${PORT}`);
});
