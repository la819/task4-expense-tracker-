const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Fix
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000,
  family: 4
})
.then(() => console.log('MongoDB connected!'))
.catch(err => console.log('DB Error:', err.message));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Expense Schema
const expenseSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:    { type: String, required: true },
  amount:   { type: Number, required: true },
  category: { type: String, required: true },
  date:     { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const User    = mongoose.model('User', userSchema);
const Expense = mongoose.model('Expense', expenseSchema);

// Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'No token!' });
  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token!' });
  }
};

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: 'All fields required!' });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ error: 'Email already registered!' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashed });
    await user.save();
    res.status(201).json({ message: 'Registered successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'All fields required!' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ error: 'User not found!' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: 'Invalid password!' });

    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ message: 'Login successful!', token, user: { username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET expenses
app.get('/api/expenses', verifyToken, async (req, res) => {
  const expenses = await Expense.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(expenses);
});

// POST expense
app.post('/api/expenses', verifyToken, async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;
    if (!title || !amount || !category)
      return res.status(400).json({ error: 'All fields required!' });

    const expense = new Expense({ userId: req.user.id, title, amount, category, date });
    await expense.save();
    res.status(201).json({ message: 'Expense added!', data: expense });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT expense
app.put('/api/expenses/:id', verifyToken, async (req, res) => {
  const { title, amount, category, date } = req.body;
  const expense = await Expense.findByIdAndUpdate(
    req.params.id,
    { title, amount, category, date },
    { new: true }
  );
  res.json({ message: 'Expense updated!', data: expense });
});

// DELETE expense
app.delete('/api/expenses/:id', verifyToken, async (req, res) => {
  await Expense.findByIdAndDelete(req.params.id);
  res.json({ message: 'Expense deleted!' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});